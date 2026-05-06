# DT-Fusion360 Demo Mode Configuration

## Overview
Demo mode allows you to bypass the authentication system for demonstration and testing purposes. All authentication files remain intact and functional.

## Current Status
✅ **DEMO MODE IS ENABLED**

Demo mode is currently active. The application will automatically log in with a predefined demo user.

## Configuration

### Location
File: `/App.tsx`

### Demo Mode Toggle
```typescript
const DEMO_MODE = true;  // Set to false to enable full authentication
```

### Demo User Configuration
```typescript
const DEMO_USER: User = {
  id: 'demo-user-001',
  name: 'Rahul Sharma',
  email: 'rahul.sharma@dhoot.com',
  role: 'SuperAdmin', // Change to test different roles
  department: ['R&D', 'NPD'],
  plant: 'Aurangabad Plant 1',
  plants: ['Aurangabad Plant 1', 'Aurangabad Plant 2'],
  isActive: true
};
```

## Testing Different User Roles

To test different permission levels, change the `role` property in `DEMO_USER`:

### Executive & Leadership Roles
- `'VP'` - Vice President (Full access)
- `'COO'` - Chief Operating Officer (Full access)
- `'GM'` - General Manager (Multi-plant access)
- `'DGM'` - Deputy General Manager
- `'AGM'` - Assistant General Manager

### Management Roles
- `'Manager'` - Department Manager
- `'Deputy Manager'` - Deputy Manager
- `'Assistant Manager'` - Assistant Manager

### Engineering & Staff Roles
- `'Senior Engineer'` - Senior Engineering role
- `'Senior Executive'` - Senior Executive role
- `'Junior Engineer'` - Junior Engineering role
- `'Junior Executive'` - Junior Executive role

### System Roles
- `'SuperAdmin'` - Full system access, all plants, all features
- `'PlantAdmin'` - Plant-level admin access, own plant only
- `'QA'` - Quality Assurance specialist

## Dashboard Routing

Based on the role, the app automatically routes to:

| Role | Dashboard |
|------|-----------|
| `SuperAdmin` | Super Admin Dashboard |
| `PlantAdmin` | Plant Admin Dashboard |
| All other roles | User Dashboard |

## Switching to Production Mode

### Step 1: Disable Demo Mode
In `/App.tsx`, change:
```typescript
const DEMO_MODE = false;  // Authentication enabled
```

### Step 2: Application Behavior
When `DEMO_MODE = false`:
- Users must log in with valid credentials
- Session persistence is enabled
- Full Supabase authentication is active
- Password setup flow for new users is enabled

## Preserved Authentication Features

All authentication components and features are preserved:

### Components
- ✅ `/components/Login.tsx` - Login interface
- ✅ `/components/UserRegistration.tsx` - User registration
- ✅ `/components/PasswordSetup.tsx` - Password setup for new users
- ✅ `/components/UserManagement.tsx` - User CRUD with password setup links

### Backend Routes
- ✅ `/auth/signup` - User registration
- ✅ `/auth/signin` - User login
- ✅ `/auth/signout` - User logout
- ✅ `/auth/user` - Get current user
- ✅ `/auth/generate-setup-token` - Generate password setup token
- ✅ `/auth/verify-setup-token/:token` - Verify setup token
- ✅ `/auth/complete-setup` - Complete password setup

### API Functions
- ✅ `authAPI.signUp()` - Create new user
- ✅ `authAPI.signIn()` - Sign in user
- ✅ `authAPI.signOut()` - Sign out user
- ✅ `authAPI.getUser()` - Get current user
- ✅ `passwordSetupAPI.generateToken()` - Generate setup token
- ✅ `passwordSetupAPI.verifyToken()` - Verify token
- ✅ `passwordSetupAPI.completeSetup()` - Complete setup

## Testing Password Setup Flow

Even in demo mode, you can test the password setup flow:

1. Navigate to User Management
2. Create a new user
3. Copy the generated password setup link
4. Open the link in a new tab
5. The password setup flow will work independently

## Message Hub Testing

The Message Hub is fully functional in demo mode:

### Testing Channel Creation
1. Navigate to Messages
2. Click the `+` icon (available for Manager+ roles)
3. Create channels with different types:
   - **General** - Open to all
   - **Department** - Restricted by department
   - **Project** - Project-specific communication

### Testing Messages
1. Select a channel
2. Send messages
3. Add reactions to messages
4. Test real-time updates (requires multiple browser tabs)

### Testing Different Departments
Change the `department` in `DEMO_USER` to test access:
```typescript
department: ['Quality Assurance (QA)']  // Will only see QA channels
department: ['R&D', 'Production']       // Will see both R&D and Production channels
```

## Multi-Plant Testing

To test plant isolation:

### SuperAdmin (All Plants)
```typescript
role: 'SuperAdmin',
plants: ['Aurangabad Plant 1', 'Aurangabad Plant 2', 'Pune Plant', 'Nashik Plant']
```

### Plant Admin (Single Plant)
```typescript
role: 'PlantAdmin',
plant: 'Aurangabad Plant 1',
plants: ['Aurangabad Plant 1']
```

### Manager (Multiple Plants)
```typescript
role: 'Manager',
plants: ['Aurangabad Plant 1', 'Pune Plant']
```

## Security Notes

⚠️ **Important**: Demo mode is for development and demonstration only.

- Never deploy to production with `DEMO_MODE = true`
- All security features (RBAC, plant isolation, audit logging) remain active
- Backend API calls still validate permissions
- Demo mode only bypasses the login UI, not the security architecture

## Quick Start Guide

### For Demos
1. Keep `DEMO_MODE = true`
2. Adjust `DEMO_USER.role` to show different permission levels
3. Present the application without login friction

### For Development
1. Keep `DEMO_MODE = true` for rapid testing
2. Switch to `false` when testing authentication flows
3. Use actual Supabase credentials when testing integrations

### For Production
1. Set `DEMO_MODE = false`
2. Configure Supabase environment variables
3. Test full authentication flow
4. Deploy with production credentials

## Troubleshooting

### Issue: Demo user sees wrong dashboard
**Solution**: Verify the `role` in `DEMO_USER` matches expected dashboard routing

### Issue: Cannot access certain features
**Solution**: Check if the demo user's role has sufficient permissions. Try `'SuperAdmin'` for full access.

### Issue: Password setup link doesn't work
**Solution**: Password setup works independently. Ensure you're using the full URL with token parameter.

### Issue: Messages not loading
**Solution**: 
1. Check browser console for errors
2. Verify backend server is running
3. Check Supabase connection

## Additional Resources

- **Authentication Documentation**: `/README_PRODUCTION.md`
- **Deployment Guide**: `/DEPLOYMENT_COMPLETE.md`
- **Production Setup**: `/PRODUCTION_SETUP.md`
- **Backend API**: `/supabase/functions/server/index.tsx`

---

**Last Updated**: December 21, 2024
**Version**: 1.0.0
**Status**: Demo Mode Active
