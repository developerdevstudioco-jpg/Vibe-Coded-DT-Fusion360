/**
 * Demo User Seeding Script for DT-Fusion360
 * 
 * This script creates demo accounts for testing and demonstration purposes.
 * Run this through the InitializationGuide or manually via API calls.
 */

import { authAPI } from './supabase/client';

export interface DemoAccount {
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  plant: string;
  plants: string[];
  description: string;
}

export const demoAccounts: DemoAccount[] = [
  {
    name: 'Rajesh Kumar',
    email: 'admin@dhoot.com',
    password: 'Admin@123',
    role: 'SuperAdmin',
    department: 'Admin / Management Office',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1', 'Aurangabad Plant 2', 'Pune Plant', 'Nashik Plant'],
    description: 'Super Admin - Full system access across all plants'
  },
  {
    name: 'Priya Desai',
    email: 'plantadmin@dhoot.com',
    password: 'Plant@123',
    role: 'PlantAdmin',
    department: 'Production',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1'],
    description: 'Plant Admin - Plant-level administrative access'
  },
  {
    name: 'Vikram Singh',
    email: 'manager@dhoot.com',
    password: 'Manager@123',
    role: 'Manager',
    department: 'R&D',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1', 'Pune Plant'],
    description: 'R&D Manager - Department management and multi-plant access'
  },
  {
    name: 'Amit Patel',
    email: 'engineer@dhoot.com',
    password: 'Engineer@123',
    role: 'Senior Engineer',
    department: 'R&D',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1'],
    description: 'Senior Engineer - Engineering staff with project access'
  },
  {
    name: 'Anjali Mehta',
    email: 'qa@dhoot.com',
    password: 'QA@123',
    role: 'QA',
    department: 'Quality Assurance (QA)',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1'],
    description: 'QA Specialist - Quality assurance and compliance'
  }
];

/**
 * Seed demo users into the system
 * @returns Promise with results of user creation
 */
export async function seedDemoUsers() {
  const results = {
    success: [] as string[],
    failed: [] as string[],
    errors: [] as string[]
  };

  console.log('🌱 Starting demo user seeding...');

  for (const account of demoAccounts) {
    try {
      console.log(`Creating user: ${account.email}...`);
      
      const result = await authAPI.signUp({
        email: account.email,
        password: account.password,
        name: account.name,
        role: account.role,
        department: account.department,
        plant: account.plant,
        plants: account.plants
      });

      if (result.success) {
        results.success.push(account.email);
        console.log(`✅ Created: ${account.email}`);
      } else {
        results.failed.push(account.email);
        results.errors.push(`${account.email}: ${result.error || 'Unknown error'}`);
        console.log(`❌ Failed: ${account.email}`);
      }
    } catch (error: any) {
      results.failed.push(account.email);
      results.errors.push(`${account.email}: ${error.message}`);
      console.log(`❌ Error creating ${account.email}: ${error.message}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 Seeding Results:');
  console.log(`✅ Success: ${results.success.length}/${demoAccounts.length}`);
  console.log(`❌ Failed: ${results.failed.length}/${demoAccounts.length}`);
  
  if (results.errors.length > 0) {
    console.log('\n⚠️ Errors:');
    results.errors.forEach(err => console.log(`  - ${err}`));
  }

  return results;
}

/**
 * Get demo account information for display
 */
export function getDemoAccountsInfo() {
  return demoAccounts.map(account => ({
    name: account.name,
    email: account.email,
    password: account.password,
    role: account.role,
    description: account.description
  }));
}

/**
 * Validate if a demo account exists
 */
export function isDemoAccount(email: string): boolean {
  return demoAccounts.some(account => account.email === email);
}

/**
 * Get demo account by email
 */
export function getDemoAccount(email: string): DemoAccount | undefined {
  return demoAccounts.find(account => account.email === email);
}
