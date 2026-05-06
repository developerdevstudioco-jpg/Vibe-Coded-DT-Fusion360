# DT-Fusion360 Demo Credentials

## 🔐 Test Accounts

The following demo accounts are displayed on the login page for easy testing. Use the **"Use"** button to auto-fill credentials.

### Super Admin Account
- **Email:** `admin@dhoot.com`
- **Password:** `Admin@123`
- **Role:** SuperAdmin
- **Access:** All plants, full system access
- **Description:** Complete administrative control, user management, system configuration

### Plant Admin Account
- **Email:** `plantadmin@dhoot.com`
- **Password:** `Plant@123`
- **Role:** PlantAdmin
- **Access:** Aurangabad Plant 1
- **Description:** Plant-level administration, user management within plant

### R&D Manager Account
- **Email:** `manager@dhoot.com`
- **Password:** `Manager@123`
- **Role:** Manager
- **Access:** Aurangabad Plant 1, Pune Plant
- **Description:** Department management, multi-plant access

### Senior Engineer Account
- **Email:** `engineer@dhoot.com`
- **Password:** `Engineer@123`
- **Role:** Senior Engineer
- **Access:** Aurangabad Plant 1
- **Description:** Engineering staff, project and form access

## 📋 Quick Setup Instructions

### First Time Setup

1. **Open the application** - The login page will display with demo credentials

2. **Choose a demo account** - Click "Use" button next to any account to auto-fill credentials

3. **Sign in** - Click "Sign In" button to access the system

4. **Create demo users** (One-time):
   - These accounts need to be created in Supabase first
   - You can either:
     - Use the registration form to create them manually
     - Or use the seeding script (see below)

### Creating Demo Accounts

#### Option 1: Manual Registration
1. Click "Create Account" on login page
2. Fill in the details matching the credentials above
3. Repeat for each demo account

#### Option 2: Automatic Seeding (Recommended)
Open browser console (F12) and run:
```javascript
import { seedDemoUsers } from './utils/seedDemoUsers';
await seedDemoUsers();
```

This will create all 5 demo accounts automatically.

## 🎯 Testing Different Roles

### SuperAdmin Testing
- Login with: `admin@dhoot.com`
- Test: User management, system settings, multi-plant operations
- Access: Super Admin Dashboard with full system overview

### PlantAdmin Testing
- Login with: `plantadmin@dhoot.com`
- Test: Plant-level user management, single plant operations
- Access: Plant Admin Dashboard with plant-specific metrics

### Manager Testing
- Login with: `manager@dhoot.com`
- Test: Multi-plant project access, team management
- Access: User Dashboard with expanded permissions

### Engineer Testing
- Login with: `engineer@dhoot.com`
- Test: Single plant access, project work, form submissions
- Access: User Dashboard with standard permissions

## 🔄 Password Setup Flow Testing

To test the password setup flow for new users:

1. **Login as SuperAdmin or PlantAdmin**
2. **Navigate to User Management**
3. **Create a new user** (Click "+ Add User")
4. **Fill in user details**:
   - Name: Test User
   - Email: testuser@dhoot.com
   - Role: Junior Engineer
   - Department: R&D
   - Plant: Select a plant
5. **Click "Create User"**
6. **Copy the password setup link** from the dialog
7. **Open the link** in a new tab/window
8. **Set password** following the requirements
9. **Login with the new account**

## 💬 Message Hub Testing

The Message Hub is fully functional with backend integration:

### Testing Channels
1. **Login as Manager or higher** (they can create channels)
2. **Navigate to Messages** (Communication Hub)
3. **Create a new channel**:
   - Click the "+" icon
   - Enter channel name
   - Select channel type (Project/Department/General)
   - Optionally restrict by department
4. **Send messages** in the channel
5. **Add reactions** to messages (hover over message)

### Testing Multi-User Messaging
1. **Open two browser windows** (or use incognito mode)
2. **Login with different accounts** in each window
3. **Both navigate to Messages**
4. **Send messages** from one account
5. **Click refresh** in the other window to see messages
6. **Test reactions** from both accounts

### Testing Department Restrictions
1. **Create a channel** with specific department access (e.g., "R&D only")
2. **Login as different users** with different departments
3. **Verify** only users from allowed departments can see the channel

## 🏭 Multi-Plant Testing

### Testing Plant Isolation
1. **Login as Engineer** (single plant access)
2. **Create a project** in Aurangabad Plant 1
3. **Logout and login as different Engineer** in Pune Plant
4. **Verify** you cannot see the Aurangabad project

### Testing Multi-Plant Access
1. **Login as Manager** (multi-plant access)
2. **Create projects** in both Aurangabad Plant 1 and Pune Plant
3. **Verify** you can see projects from both plants

### Testing SuperAdmin Access
1. **Login as SuperAdmin**
2. **Navigate to Projects**
3. **Verify** you can see ALL projects from ALL plants
4. **Use plant filter** to filter by specific plant

## 🔒 Security Features to Test

### 1. Session Persistence
- Login with any account
- Refresh the page
- Verify you remain logged in

### 2. Role-Based Access Control
- Login as Engineer
- Try to access User Management
- Verify you cannot see the menu option

### 3. Plant-Based Data Isolation
- Login as users from different plants
- Verify each user only sees their plant's data

### 4. Audit Logging
- Login as SuperAdmin
- Navigate to Log Monitoring
- Perform various actions (create project, user, etc.)
- Check logs to verify all actions are recorded

## 🚀 Production Deployment

When deploying to production:

1. **Disable demo credentials display** in `/components/Login.tsx`
2. **Remove or secure demo accounts** 
3. **Set strong passwords** for all admin accounts
4. **Enable email notifications** for password setup
5. **Configure proper Supabase environment** variables

## 📞 Support

For issues or questions:
- Check browser console for error messages
- Verify Supabase connection is configured
- Ensure all environment variables are set
- Review `/PRODUCTION_SETUP.md` for deployment guide

---

**Last Updated**: December 21, 2024
**Version**: 1.0.0
**Status**: Demo Credentials Active
