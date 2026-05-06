import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, AlertCircle, Check, X, Globe, RefreshCw, Download, Power } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ipRestrictionAPI } from '../utils/supabase/client';
import { toast } from 'sonner';

interface IPRule {
  id: string;
  ip: string;
  type: 'whitelist' | 'blacklist';
  description: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  isActive: boolean;
}

interface IPSettings {
  enabled: boolean;
  mode: 'whitelist' | 'blacklist' | 'disabled';
  blockMessage: string;
  logAttempts: boolean;
  updatedAt: string;
  updatedBy: string;
}

interface BlockedAttempt {
  id: string;
  ip: string;
  endpoint: string;
  reason: string;
  timestamp: string;
}

export default function IPRestrictionManagement() {
  const [settings, setSettings] = useState<IPSettings | null>(null);
  const [rules, setRules] = useState<IPRule[]>([]);
  const [blockedAttempts, setBlockedAttempts] = useState<BlockedAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [myIP, setMyIP] = useState<string>('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');

  // Form state for adding rules
  const [newIP, setNewIP] = useState('');
  const [newType, setNewType] = useState<'whitelist' | 'blacklist'>('whitelist');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, rulesRes, ipRes, attemptsRes] = await Promise.all([
        ipRestrictionAPI.getSettings(),
        ipRestrictionAPI.getRules(),
        ipRestrictionAPI.getMyIP(),
        ipRestrictionAPI.getBlockedAttempts(50)
      ]);

      if (settingsRes.success) setSettings(settingsRes.settings);
      if (rulesRes.success) setRules(rulesRes.rules);
      if (ipRes.success) setMyIP(ipRes.ip);
      if (attemptsRes.success) setBlockedAttempts(attemptsRes.attempts);
    } catch (error: any) {
      console.error('Error loading IP data:', error);
      toast.error('Failed to load IP restriction data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<IPSettings>) => {
    try {
      const result = await ipRestrictionAPI.updateSettings(updates);
      if (result.success) {
        setSettings(result.settings);
        toast.success('Settings updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast.error(error.message || 'Failed to update settings');
    }
  };

  const handleAddRule = async () => {
    if (!newIP.trim()) {
      toast.error('IP address is required');
      return;
    }

    try {
      const result = await ipRestrictionAPI.addRule(newIP.trim(), newType, newDescription);
      if (result.success) {
        setRules([...rules, result.rule]);
        setShowAddDialog(false);
        setNewIP('');
        setNewDescription('');
        toast.success('IP rule added successfully');
      }
    } catch (error: any) {
      console.error('Error adding rule:', error);
      toast.error(error.message || 'Failed to add IP rule');
    }
  };

  const handleRemoveRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to remove this IP rule?')) return;

    try {
      const result = await ipRestrictionAPI.removeRule(ruleId);
      if (result.success) {
        setRules(rules.filter(r => r.id !== ruleId));
        toast.success('IP rule removed successfully');
      }
    } catch (error: any) {
      console.error('Error removing rule:', error);
      toast.error('Failed to remove IP rule');
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      const result = await ipRestrictionAPI.toggleRule(ruleId);
      if (result.success) {
        setRules(rules.map(r =>
          r.id === ruleId ? { ...r, isActive: !r.isActive } : r
        ));
        toast.success('Rule status updated');
      }
    } catch (error: any) {
      console.error('Error toggling rule:', error);
      toast.error('Failed to toggle rule');
    }
  };

  const handleClearOldLogs = async () => {
    if (!confirm('Clear blocked attempts older than 30 days?')) return;

    try {
      const result = await ipRestrictionAPI.clearOldLogs(30);
      if (result.success) {
        toast.success(`Cleared ${result.deletedCount} old log entries`);
        loadData();
      }
    } catch (error: any) {
      console.error('Error clearing logs:', error);
      toast.error('Failed to clear logs');
    }
  };

  const whitelistRules = rules.filter(r => r.type === 'whitelist');
  const blacklistRules = rules.filter(r => r.type === 'blacklist');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-6 h-6 animate-spin" style={{ color: '#ed1c24' }} />
        <span className="ml-3">Loading IP restrictions...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3">
            <Shield className="w-8 h-8" style={{ color: '#ed1c24' }} />
            IP Restriction Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Control access to the system based on IP addresses
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button style={{ backgroundColor: '#ed1c24' }}>
              <Plus className="w-4 h-4 mr-2" />
              Add IP Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add IP Restriction Rule</DialogTitle>
              <DialogDescription>
                Add a new IP address or range to the whitelist or blacklist
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="ip">IP Address</Label>
                <Input
                  id="ip"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  placeholder="192.168.1.1 or 192.168.1.* or 192.168.1.0/24"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supports: Exact IP, Wildcards (*), CIDR notation (/24)
                </p>
              </div>

              <div>
                <Label htmlFor="type">Rule Type</Label>
                <Select value={newType} onValueChange={(v: string) => setNewType(v as 'whitelist' | 'blacklist')}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whitelist">Whitelist (Allow)</SelectItem>
                    <SelectItem value="blacklist">Blacklist (Block)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g., Office network, VPN IPs, etc."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRule} style={{ backgroundColor: '#ed1c24' }}>
                  Add Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Your IP Info */}
      <Alert>
        <Globe className="w-4 h-4" />
        <AlertDescription>
          Your current IP address: <strong className="font-mono">{myIP || 'Unknown'}</strong>
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="whitelist">Whitelist ({whitelistRules.length})</TabsTrigger>
          <TabsTrigger value="blacklist">Blacklist ({blacklistRules.length})</TabsTrigger>
          <TabsTrigger value="logs">Blocked Attempts ({blockedAttempts.length})</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Settings</CardTitle>
              <CardDescription>
                Configure how IP restrictions are enforced system-wide
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Power className="w-5 h-5" style={{ color: settings?.enabled ? '#ed1c24' : '#9ca3af' }} />
                    <h3 className="font-semibold">IP Restrictions</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enable or disable IP-based access control
                  </p>
                </div>
                <Switch
                  checked={settings?.enabled || false}
                  onCheckedChange={(checked: boolean) => handleUpdateSettings({ enabled: checked })}
                />
              </div>

              {/* Mode Selection */}
              <div>
                <Label>Restriction Mode</Label>
                <Select
                  value={settings?.mode || 'disabled'}
                  onValueChange={(v: string) => handleUpdateSettings({ mode: v as 'whitelist' | 'blacklist' | 'disabled' })}
                  disabled={!settings?.enabled}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disabled">Disabled - Allow All</SelectItem>
                    <SelectItem value="whitelist">Whitelist Mode - Block All Except Listed</SelectItem>
                    <SelectItem value="blacklist">Blacklist Mode - Allow All Except Listed</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {settings?.mode === 'whitelist' && 'Only IPs in whitelist can access the system'}
                  {settings?.mode === 'blacklist' && 'All IPs except those in blacklist can access'}
                  {settings?.mode === 'disabled' && 'IP restrictions are not enforced'}
                </p>
              </div>

              {/* Block Message */}
              <div>
                <Label htmlFor="blockMessage">Block Message</Label>
                <Textarea
                  id="blockMessage"
                  value={settings?.blockMessage || ''}
                  onChange={(e) => handleUpdateSettings({ blockMessage: e.target.value })}
                  placeholder="Message shown to blocked users"
                  className="mt-1"
                  rows={3}
                  disabled={!settings?.enabled}
                />
              </div>

              {/* Log Attempts */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">Log Blocked Attempts</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Keep a record of all blocked access attempts
                  </p>
                </div>
                <Switch
                  checked={settings?.logAttempts || false}
                  onCheckedChange={(checked: boolean) => handleUpdateSettings({ logAttempts: checked, })}
                  disabled={!settings?.enabled}
                />
              </div>

              {/* Status Info */}
              {settings && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Current Status</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Enabled:</span>
                      <span className="ml-2">{settings.enabled ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mode:</span>
                      <span className="ml-2 capitalize">{settings.mode}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Whitelist Rules:</span>
                      <span className="ml-2">{whitelistRules.filter(r => r.isActive).length} active</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Blacklist Rules:</span>
                      <span className="ml-2">{blacklistRules.filter(r => r.isActive).length} active</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Whitelist Tab */}
        <TabsContent value="whitelist" className="space-y-4">
          {whitelistRules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No whitelist rules configured</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Whitelist Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {whitelistRules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono px-2 py-1 bg-muted rounded">
                          {rule.ip}
                        </code>
                        {rule.isActive ? (
                          <Badge variant="default" className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Added by {rule.createdByName} on {new Date(rule.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleRule(rule.id)}
                      >
                        {rule.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveRule(rule.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Blacklist Tab */}
        <TabsContent value="blacklist" className="space-y-4">
          {blacklistRules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No blacklist rules configured</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setNewType('blacklist');
                    setShowAddDialog(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Blacklist Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {blacklistRules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono px-2 py-1 bg-muted rounded">
                          {rule.ip}
                        </code>
                        {rule.isActive ? (
                          <Badge variant="destructive">Blocked</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Added by {rule.createdByName} on {new Date(rule.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleRule(rule.id)}
                      >
                        {rule.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveRule(rule.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Blocked Attempts Tab */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing last 50 blocked attempts
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearOldLogs}>
                <Download className="w-4 h-4 mr-2" />
                Clear Old Logs
              </Button>
            </div>
          </div>

          {blockedAttempts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Check className="w-12 h-12 text-green-500 mb-4" />
                <p className="text-muted-foreground">No blocked attempts recorded</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {blockedAttempts.map((attempt) => (
                <Card key={attempt.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono px-2 py-1 bg-red-100 text-red-700 rounded">
                            {attempt.ip}
                          </code>
                          <span className="text-sm text-muted-foreground">→ {attempt.endpoint}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {attempt.reason}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(attempt.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
