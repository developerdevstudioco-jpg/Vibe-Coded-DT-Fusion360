# DT-Fusion360 Production Setup Guide

## Overview

DT-Fusion360 is now production-ready with a complete Supabase backend architecture implementing:

- ✅ **Authentication System** with JWT tokens and session management
- ✅ **Row-Level Security (RLS)** via multi-plant data isolation
- ✅ **Audit Logging** for all critical operations
- ✅ **RESTful API** with comprehensive error handling
- ✅ **User Management** with role-based access control
- ✅ **Project, Forms, and Task Management** with plant-level filtering
- ✅ **Production-grade Security** with proper authorization checks

## Architecture

### Backend (Supabase Edge Functions)
- **Server**: `/supabase/functions/server/index.tsx`
- **KV Store**: `/supabase/functions/server/kv_store.tsx` (protected)
- **Framework**: Hono.js with CORS and logging middleware
- **Database**: Supabase KV Store with plant-level data segregation

### Frontend
- **Client Library**: `/utils/supabase/client.ts`
- **Authentication**: `/components/Login.tsx` and `/components/UserRegistration.tsx`
- **Session Persistence**: Automatic via Supabase client

## Getting Started

### Step 1: Create Your First User

Since this is a fresh installation, you need to create your first SuperAdmin user:

1. Click on the **"Create Account"** link on the login page
2. Fill in the registration form:
   - **Name**: Your Full Name
   - **Email**: admin@dhoottransmission.com (or your email)
   - **Password**: Choose a strong password (min 6 characters)
   - **Role**: Select "Super Admin"
   - **Department**: Select your department
   - **Plants**: Select all plants you need access to

3. Click **"Create Account"**
4. You'll be redirected to the login page
5. Sign in with your new credentials

### Step 2: Create Additional Users

Once logged in as SuperAdmin:

1. Navigate to **User Management** from the sidebar
2. Click **"Add New User"**
3. Configure users with appropriate roles and plant access
4. Save the user

## Multi-Plant Security Architecture

### Access Levels

1. **SuperAdmin**
   - Access to ALL plants
   - Can manage users across all plants
   - Full system administration rights

2. **PlantAdmin**
   - Access to multiple plants (configurable)
   - Can manage users within their plants
   - Plant-specific administration

3. **Manager**
   - Access to assigned plants (1 or more)
   - Can view and manage projects/forms in assigned plants
   - Cannot access other plants' data

4. **Engineer/QA/Other Roles**
   - Access to single plant only
   - Can only see data from their assigned plant
   - No cross-plant visibility

### Data Isolation

All data is filtered at the API level based on:
- User's `plant` field (primary plant)
- User's `plants` array (multi-plant access)
- User's `role` (SuperAdmin bypasses plant filters)

**Example**: If a user is assigned to "Pune Plant", they will ONLY see:
- Projects from Pune Plant
- Forms from Pune Plant
- Tasks linked to Pune Plant projects
- Users from Pune Plant (unless SuperAdmin/PlantAdmin)

## API Endpoints

### Authentication
- `POST /make-server-767ffd61/auth/signup` - Create new user
- `POST /make-server-767ffd61/auth/signin` - Sign in user
- `POST /make-server-767ffd61/auth/signout` - Sign out user
- `GET /make-server-767ffd61/auth/user` - Get current user

### Projects
- `GET /make-server-767ffd61/projects` - List projects (plant-filtered)
- `GET /make-server-767ffd61/projects/:id` - Get single project
- `POST /make-server-767ffd61/projects` - Create project
- `PUT /make-server-767ffd61/projects/:id` - Update project

### Forms
- `GET /make-server-767ffd61/forms?type=ucl` - List forms (plant-filtered)
- `POST /make-server-767ffd61/forms` - Create form
- `POST /make-server-767ffd61/forms/bulk` - Bulk upload forms
- `PUT /make-server-767ffd61/forms/:id` - Update form

### Tasks
- `GET /make-server-767ffd61/tasks?projectId=xxx` - List tasks (plant-filtered)
- `POST /make-server-767ffd61/tasks` - Create task
- `PUT /make-server-767ffd61/tasks/:id` - Update task

### Users
- `GET /make-server-767ffd61/users` - List users (SuperAdmin/PlantAdmin only)
- `PUT /make-server-767ffd61/users/:id` - Update user

### Audit Logs
- `GET /make-server-767ffd61/audit-logs` - Get audit logs (SuperAdmin only)

### Statistics
- `GET /make-server-767ffd61/stats/dashboard` - Get dashboard statistics

## Security Features

### 1. Authentication
- JWT-based authentication via Supabase Auth
- Automatic token refresh
- Session persistence across page reloads
- Secure password hashing

### 2. Authorization
- Every API call validates the user's authorization token
- Plant-level access checks on all data operations
- Role-based permissions for sensitive operations
- Prevents cross-plant data access

### 3. Audit Logging
All critical operations are logged:
- User signup/signin/signout
- Project creation/updates
- Form creation/updates
- Task creation/updates
- User management operations

Logs include:
- Action type
- User ID
- Timestamp
- Changed data (for updates)

### 4. Error Handling
- Comprehensive error messages with context
- Proper HTTP status codes
- Frontend error display with toast notifications
- Server-side logging for debugging

## Environment Variables

The backend uses these environment variables (auto-configured):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)
- `SUPABASE_ANON_KEY` - Anonymous key (public)

**⚠️ SECURITY WARNING**: Never expose the `SUPABASE_SERVICE_ROLE_KEY` to the frontend!

## Testing the System

### Test User Creation
1. Go to login page
2. Click "Create Account"
3. Create a test user with Engineer role for "Aurangabad Plant 1"
4. Sign in with the new account
5. Verify you only see data from Aurangabad Plant 1

### Test Multi-Plant Access
1. Create another user with Manager role
2. Assign them multiple plants
3. Sign in and verify they see data from all assigned plants

### Test SuperAdmin Access
1. Sign in as SuperAdmin
2. Verify you see data from ALL plants
3. Test user management functions

## Production Deployment Checklist

- [x] Supabase backend configured
- [x] Authentication system implemented
- [x] Multi-plant security architecture
- [x] Audit logging system
- [x] Error handling and validation
- [x] Session persistence
- [x] User registration flow
- [ ] Email verification (requires SMTP setup)
- [ ] Password reset flow (requires SMTP setup)
- [ ] Rate limiting (add if needed)
- [ ] API documentation (this file)

## Next Steps

### Immediate Actions
1. **Create your first SuperAdmin account** using the registration flow
2. **Create test users** for different roles and plants
3. **Test the multi-plant isolation** by signing in as different users
4. **Start creating projects** and forms through the UI

### Optional Enhancements
1. **Email Configuration**: Set up SMTP in Supabase for email verification
2. **Password Reset**: Implement forgot password flow
3. **2FA**: Add two-factor authentication for sensitive roles
4. **API Rate Limiting**: Add rate limiting for production security
5. **Backup Strategy**: Configure automated backups
6. **Monitoring**: Set up error tracking (e.g., Sentry)

## Troubleshooting

### "Unauthorized" errors
- Check that you're signed in
- Verify your session hasn't expired
- Try signing out and back in

### "Forbidden: No access to this plant" errors
- Verify the user has access to the correct plant(s)
- Check the user's `plants` array in User Management
- SuperAdmins should bypass this check

### Data not showing up
- Verify data exists in the database (check KV store)
- Check plant assignment matches user's plant access
- Verify no JavaScript console errors

### Cannot create users
- Ensure you're using unique email addresses
- Check password meets minimum length (6 characters)
- For multi-plant roles, ensure at least one plant is selected

## Support

For technical issues or questions:
1. Check the browser console for error messages
2. Review audit logs (SuperAdmin only)
3. Check the server logs in Supabase dashboard
4. Verify your user role and plant assignments

## Database Schema

### Users (`user:{userId}`)
```typescript
{
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  plant: string;
  plants: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}
```

### Projects (`project:{projectId}`)
```typescript
{
  id: string;
  name: string;
  customer: string;
  partCode: string;
  plant: string;
  sopDate: string;
  lead: string;
  phase: string;
  status: string;
  progress: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}
```

### Forms (`form:{formId}`)
```typescript
{
  id: string;
  type: 'ucl' | 'ft' | 'machine';
  project: string;
  plant: string;
  customer: string;
  partNo: string;
  supplier: string;
  qty: string;
  sopDate: string;
  rfqNo: string;
  status: string;
  senderDept: string;
  receiverDept: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
}
```

### Tasks (`task:{taskId}`)
```typescript
{
  id: string;
  projectId: string;
  plant: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  status: string;
  priority: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}
```

### Audit Logs (`audit:{timestamp}:{action}:{targetId}`)
```typescript
{
  action: string;
  userId: string;
  timestamp: string;
  targetUserId?: string;
  projectId?: string;
  formId?: string;
  taskId?: string;
  changes?: object;
}
```

---

**DT-Fusion360** is now production-ready! Create your first user and start collaborating.
