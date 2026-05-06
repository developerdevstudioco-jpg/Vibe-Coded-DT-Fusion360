/**
 * IP Restriction Module for DT-Fusion360
 * Handles IP whitelist/blacklist management and validation
 */

import * as kv from "./kv_store.tsx";

export interface IPRule {
  id: string;
  ip: string;
  type: 'whitelist' | 'blacklist';
  description: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  isActive: boolean;
}

export interface IPRestrictionSettings {
  enabled: boolean;
  mode: 'whitelist' | 'blacklist' | 'disabled';
  blockMessage: string;
  logAttempts: boolean;
  updatedAt: string;
  updatedBy: string;
}

/**
 * Extract IP address from request
 */
export function getClientIP(request: Request): string {
  // Check various headers for client IP
  const headers = request.headers;
  
  // Cloudflare
  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;
  
  // Standard headers
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // x-forwarded-for can be a comma-separated list
    return xForwardedFor.split(',')[0].trim();
  }
  
  const xRealIP = headers.get('x-real-ip');
  if (xRealIP) return xRealIP;
  
  // Fallback to connection info (may not work in all environments)
  return 'unknown';
}

/**
 * Check if an IP matches a pattern (supports CIDR and wildcards)
 */
export function ipMatches(clientIP: string, pattern: string): boolean {
  // Exact match
  if (clientIP === pattern) return true;
  
  // Wildcard matching (e.g., 192.168.1.*)
  if (pattern.includes('*')) {
    const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '\\d+');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(clientIP);
  }
  
  // CIDR notation (e.g., 192.168.1.0/24)
  if (pattern.includes('/')) {
    return isIPInCIDR(clientIP, pattern);
  }
  
  return false;
}

/**
 * Check if IP is in CIDR range
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  try {
    const [range, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);
    
    const ipNum = ipToNumber(ip);
    const rangeNum = ipToNumber(range);
    
    return (ipNum & mask) === (rangeNum & mask);
  } catch (e) {
    console.error('Error checking CIDR:', e);
    return false;
  }
}

/**
 * Convert IP address to number
 */
function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

/**
 * Validate IP address format
 */
export function isValidIP(ip: string): boolean {
  // Check for CIDR notation
  if (ip.includes('/')) {
    const [address, bits] = ip.split('/');
    const bitsNum = parseInt(bits);
    if (isNaN(bitsNum) || bitsNum < 0 || bitsNum > 32) return false;
    return isValidIP(address);
  }
  
  // Check for wildcard
  if (ip.includes('*')) {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every(part => part === '*' || (parseInt(part) >= 0 && parseInt(part) <= 255));
  }
  
  // Standard IPv4 validation
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
}

/**
 * Get IP restriction settings
 */
export async function getSettings(): Promise<IPRestrictionSettings> {
  const settings = await kv.get('ip:settings');
  
  if (!settings) {
    // Default settings
    return {
      enabled: false,
      mode: 'disabled',
      blockMessage: 'Access denied. Your IP address is not authorized to access this system.',
      logAttempts: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    };
  }
  
  return settings as IPRestrictionSettings;
}

/**
 * Update IP restriction settings
 */
export async function updateSettings(settings: Partial<IPRestrictionSettings>, userId: string): Promise<void> {
  const current = await getSettings();
  const updated = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString(),
    updatedBy: userId
  };
  
  await kv.set('ip:settings', updated);
  
  // Log the change
  await logIPEvent('settings_updated', 'system', 'System', {
    settings: updated,
    changedBy: userId
  });
}

/**
 * Get all IP rules
 */
export async function getAllRules(): Promise<IPRule[]> {
  const rules = await kv.getByPrefix('ip:rule:');
  return rules as IPRule[];
}

/**
 * Get active rules by type
 */
export async function getRulesByType(type: 'whitelist' | 'blacklist'): Promise<IPRule[]> {
  const allRules = await getAllRules();
  return allRules.filter(rule => rule.type === type && rule.isActive);
}

/**
 * Add new IP rule
 */
export async function addRule(
  ip: string,
  type: 'whitelist' | 'blacklist',
  description: string,
  createdBy: string,
  createdByName: string
): Promise<IPRule> {
  if (!isValidIP(ip)) {
    throw new Error('Invalid IP address format');
  }
  
  const rule: IPRule = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ip,
    type,
    description,
    createdBy,
    createdByName,
    createdAt: new Date().toISOString(),
    isActive: true
  };
  
  await kv.set(`ip:rule:${rule.id}`, rule);
  
  // Log the addition
  await logIPEvent('rule_added', createdBy, createdByName, { rule });
  
  return rule;
}

/**
 * Remove IP rule
 */
export async function removeRule(ruleId: string): Promise<void> {
  await kv.del(`ip:rule:${ruleId}`);
  
  // Log the removal
  await logIPEvent('rule_removed', 'system', 'System', { ruleId });
}

/**
 * Toggle rule active status
 */
export async function toggleRule(ruleId: string): Promise<void> {
  const rule = await kv.get(`ip:rule:${ruleId}`) as IPRule;
  if (!rule) {
    throw new Error('Rule not found');
  }
  
  rule.isActive = !rule.isActive;
  await kv.set(`ip:rule:${ruleId}`, rule);
  
  // Log the toggle
  await logIPEvent('rule_toggled', 'system', 'System', { ruleId, isActive: rule.isActive });
}

/**
 * Check if IP is allowed based on current rules
 */
export async function isIPAllowed(ip: string): Promise<{ allowed: boolean; reason?: string }> {
  const settings = await getSettings();
  
  // If IP restrictions are disabled, allow all
  if (!settings.enabled || settings.mode === 'disabled') {
    return { allowed: true };
  }
  
  // Get active rules
  const whitelistRules = await getRulesByType('whitelist');
  const blacklistRules = await getRulesByType('blacklist');
  
  // Check blacklist first (takes precedence)
  for (const rule of blacklistRules) {
    if (ipMatches(ip, rule.ip)) {
      return { 
        allowed: false, 
        reason: `IP blocked: ${rule.description || 'Blacklisted IP address'}` 
      };
    }
  }
  
  // Whitelist mode: must match a whitelist rule
  if (settings.mode === 'whitelist') {
    const isWhitelisted = whitelistRules.some(rule => ipMatches(ip, rule.ip));
    if (!isWhitelisted) {
      return { 
        allowed: false, 
        reason: 'IP not in whitelist' 
      };
    }
  }
  
  return { allowed: true };
}

/**
 * Log IP-related events
 */
async function logIPEvent(
  action: string,
  userId: string,
  userName: string,
  details: any
): Promise<void> {
  const logEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    action,
    userId,
    userName,
    module: 'IP Restriction',
    details,
    timestamp: new Date().toISOString()
  };
  
  await kv.set(`audit:${logEntry.id}`, logEntry);
}

/**
 * Log blocked IP attempt
 */
export async function logBlockedAttempt(
  ip: string,
  endpoint: string,
  reason: string
): Promise<void> {
  const settings = await getSettings();
  
  if (!settings.logAttempts) return;
  
  const logEntry = {
    id: `blocked-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ip,
    endpoint,
    reason,
    timestamp: new Date().toISOString()
  };
  
  await kv.set(`ip:blocked:${logEntry.id}`, logEntry);
  
  // Also log to audit trail
  await logIPEvent('access_blocked', 'system', 'System', logEntry);
}

/**
 * Get blocked attempt logs
 */
export async function getBlockedAttempts(limit: number = 100): Promise<any[]> {
  const logs = await kv.getByPrefix('ip:blocked:');
  return logs.slice(0, limit);
}

/**
 * Clear old blocked attempt logs (older than specified days)
 */
export async function clearOldBlockedLogs(daysOld: number = 30): Promise<number> {
  const logs = await kv.getByPrefix('ip:blocked:');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  let deletedCount = 0;
  
  for (const log of logs) {
    const logDate = new Date(log.timestamp);
    if (logDate < cutoffDate) {
      await kv.del(`ip:blocked:${log.id}`);
      deletedCount++;
    }
  }
  
  return deletedCount;
}
