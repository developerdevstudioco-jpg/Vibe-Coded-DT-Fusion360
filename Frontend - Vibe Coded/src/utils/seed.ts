import { authAPI, projectsAPI, formsAPI, tasksAPI } from '../utils/supabase/client';

/**
 * Seed Script for DT-Fusion360
 * 
 * This script creates demo data for testing the application.
 * Run this after creating your first SuperAdmin account.
 */

export const SEED_USERS = [
  {
    email: 'superadmin@dt.com',
    password: 'test123',
    name: 'Rajesh Kumar',
    role: 'SuperAdmin',
    department: 'Administration',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1', 'Aurangabad Plant 2', 'Pune Plant', 'Nashik Plant']
  },
  {
    email: 'plantadmin@dt.com',
    password: 'test123',
    name: 'Priya Sharma',
    role: 'PlantAdmin',
    department: 'Administration',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1', 'Aurangabad Plant 2']
  },
  {
    email: 'manager@dt.com',
    password: 'test123',
    name: 'Amit Patel',
    role: 'Manager',
    department: 'R&D',
    plant: 'Pune Plant',
    plants: ['Pune Plant', 'Nashik Plant']
  },
  {
    email: 'engineer@dt.com',
    password: 'test123',
    name: 'Sneha Desai',
    role: 'Senior Engineer',
    department: 'R&D',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1']
  },
  {
    email: 'qa@dt.com',
    password: 'test123',
    name: 'Vikram Singh',
    role: 'QA',
    department: 'Quality Assurance (QA)',
    plant: 'Pune Plant',
    plants: ['Pune Plant']
  }
];

export const SEED_PROJECTS = [
  {
    name: 'Gear Assembly GA-2024-001',
    customer: 'Tata Motors',
    sopDate: '2025-12-15',
    lead: 'Rahul Sharma',
    phase: 'Phase 3',
    progress: 65,
    status: 'On Track',
    plant: 'Aurangabad Plant 1',
    partCode: 'GA-2024-001',
    description: 'High-precision gear assembly for heavy commercial vehicles'
  },
  {
    name: 'Transmission Shaft TS-2024-042',
    customer: 'Mahindra & Mahindra',
    sopDate: '2025-11-30',
    lead: 'Priya Desai',
    phase: 'Phase 4',
    progress: 85,
    status: 'On Track',
    plant: 'Pune Plant',
    partCode: 'TS-2024-042',
    description: 'Transmission shaft for passenger vehicles'
  },
  {
    name: 'Clutch Hub CH-2024-018',
    customer: 'Maruti Suzuki',
    sopDate: '2026-01-20',
    lead: 'Amit Patel',
    phase: 'Phase 2',
    progress: 45,
    status: 'At Risk',
    plant: 'Aurangabad Plant 2',
    partCode: 'CH-2024-018',
    description: 'Clutch hub assembly for compact cars'
  },
  {
    name: 'Differential Housing DH-2024-025',
    customer: 'Ashok Leyland',
    sopDate: '2025-10-15',
    lead: 'Sneha Kulkarni',
    phase: 'Phase 5',
    progress: 95,
    status: 'On Track',
    plant: 'Aurangabad Plant 1',
    partCode: 'DH-2024-025',
    description: 'Differential housing for commercial vehicles'
  },
  {
    name: 'Pinion Gear PG-2024-033',
    customer: 'Eicher Motors',
    sopDate: '2025-12-01',
    lead: 'Vikram Singh',
    phase: 'Phase 3',
    progress: 70,
    status: 'On Track',
    plant: 'Nashik Plant',
    partCode: 'PG-2024-033',
    description: 'Pinion gear for light commercial vehicles'
  }
];

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Step 1: Create Users
    console.log('\n📋 Creating users...');
    for (const userData of SEED_USERS) {
      try {
        await authAPI.signUp(userData);
        console.log(`✅ Created user: ${userData.email}`);
      } catch (error: any) {
        console.log(`⚠️ User ${userData.email} may already exist: ${error.message}`);
      }
    }

    // Step 2: Sign in as SuperAdmin to create projects
    console.log('\n🔐 Signing in as SuperAdmin...');
    const loginResult = await authAPI.signIn('superadmin@dt.com', 'test123');
    
    if (!loginResult.success) {
      throw new Error('Failed to sign in as SuperAdmin');
    }
    console.log('✅ Signed in successfully');

    // Step 3: Create Projects
    console.log('\n📦 Creating projects...');
    const createdProjects = [];
    for (const projectData of SEED_PROJECTS) {
      try {
        const result = await projectsAPI.create(projectData);
        createdProjects.push(result.project);
        console.log(`✅ Created project: ${projectData.name}`);
      } catch (error: any) {
        console.log(`❌ Failed to create project ${projectData.name}: ${error.message}`);
      }
    }

    // Step 4: Create Sample Forms
    console.log('\n📝 Creating sample forms...');
    const sampleForms = [
      {
        project: 'GA-2024-001',
        customer: 'Tata Motors',
        partNo: 'TM-GA-001',
        supplier: 'ABC Suppliers',
        qty: '500',
        sopDate: '2025-12-15',
        rfqNo: 'RFQ-2024-045',
        eta: '2025-11-15',
        remarks: 'Approved by Purchase',
        senderDept: 'R&D',
        receiverDept: 'Purchase',
        type: 'ucl' as const,
        status: 'Approved'
      },
      {
        project: 'TS-2024-042',
        customer: 'Mahindra & Mahindra',
        partNo: 'MM-TS-015',
        supplier: 'XYZ Corp',
        qty: '300',
        sopDate: '2025-11-30',
        rfqNo: 'RFQ-2024-047',
        eta: '2025-11-20',
        remarks: 'Under review',
        senderDept: 'NPD',
        receiverDept: 'Quality Assurance (QA)',
        type: 'ucl' as const,
        status: 'Pending'
      },
      {
        project: 'CH-2024-018',
        customer: 'Maruti Suzuki',
        partNo: 'MS-CH-008',
        supplier: 'DEF Tools',
        qty: '150',
        sopDate: '2026-01-20',
        rfqNo: 'RFQ-2024-042',
        eta: '2025-12-01',
        remarks: 'Tooling approved',
        senderDept: 'R&D',
        receiverDept: 'Manufacturing Engineering',
        type: 'ft' as const,
        status: 'Approved'
      }
    ];

    for (const formData of sampleForms) {
      try {
        await formsAPI.create(formData);
        console.log(`✅ Created form for project: ${formData.project}`);
      } catch (error: any) {
        console.log(`❌ Failed to create form: ${error.message}`);
      }
    }

    // Step 5: Create Sample Tasks
    console.log('\n✅ Creating sample tasks...');
    const sampleTasks = [
      {
        projectId: 'GA-2024-001',
        title: 'Design Review',
        description: 'Complete design review with customer',
        assignedTo: 'engineer@dt.com',
        dueDate: '2025-02-15',
        status: 'In Progress',
        priority: 'High'
      },
      {
        projectId: 'GA-2024-001',
        title: 'PPAP Documentation',
        description: 'Prepare PPAP Level 3 documentation',
        assignedTo: 'qa@dt.com',
        dueDate: '2025-03-01',
        status: 'Not Started',
        priority: 'Medium'
      },
      {
        projectId: 'TS-2024-042',
        title: 'Prototype Testing',
        description: 'Complete prototype testing and validation',
        assignedTo: 'engineer@dt.com',
        dueDate: '2025-02-20',
        status: 'In Progress',
        priority: 'High'
      }
    ];

    for (const taskData of sampleTasks) {
      try {
        await tasksAPI.create(taskData);
        console.log(`✅ Created task: ${taskData.title}`);
      } catch (error: any) {
        console.log(`❌ Failed to create task: ${error.message}`);
      }
    }

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${SEED_USERS.length}`);
    console.log(`   Projects: ${createdProjects.length}`);
    console.log(`   Forms: ${sampleForms.length}`);
    console.log(`   Tasks: ${sampleTasks.length}`);
    console.log('\n🔐 Demo Credentials:');
    console.log('   SuperAdmin: superadmin@dt.com / test123');
    console.log('   PlantAdmin: plantadmin@dt.com / test123');
    console.log('   Manager: manager@dt.com / test123');
    console.log('   Engineer: engineer@dt.com / test123');
    console.log('   QA: qa@dt.com / test123');
    
    return { success: true };
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  }
}

// Usage instructions
export const SEED_INSTRUCTIONS = `
To seed the database with demo data:

1. Open browser console (F12)
2. Import the seed script:
   import { seedDatabase } from './utils/seed';

3. Run the seeder:
   await seedDatabase();

4. Wait for completion
5. Refresh the page and sign in with demo credentials

Note: This will create demo users, projects, forms, and tasks.
Existing data will not be affected.
`;
