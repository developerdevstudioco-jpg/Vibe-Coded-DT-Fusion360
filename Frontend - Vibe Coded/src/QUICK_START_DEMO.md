# DT-Fusion360 - Quick Start with Demo Users

## ⚠️ Demo Credentials Invalid Error?

If you're seeing **"Invalid credentials"** when trying to log in with the demo accounts, it's because the demo users haven't been created in your database yet.

## 🚀 Quick Solution (1 Click)

### On the Login Page:

1. **Look for the "Demo Accounts" section** at the bottom of the login card
2. **Click the "Create Demo Users" button** (red outlined button with user icon)
3. **Click "Create Demo Users"** in the popup dialog
4. **Wait for creation** (takes about 5 seconds)
5. **Done!** Now you can use any of the demo credentials

![Demo User Creation](https://via.placeholder.com/600x300/ed1c24/ffffff?text=Click+Create+Demo+Users+Button)

## 📋 Demo Credentials

After creating demo users, you can use these credentials:

| Account | Email | Password | Role | Access |
|---------|-------|----------|------|--------|
| **Super Admin** | admin@dhoot.com | Admin@123 | SuperAdmin | All plants, full system |
| **Plant Admin** | plantadmin@dhoot.com | Plant@123 | PlantAdmin | Single plant admin |
| **R&D Manager** | manager@dhoot.com | Manager@123 | Manager | Multi-plant access |
| **Engineer** | engineer@dhoot.com | Engineer@123 | Senior Engineer | Single plant |
| **QA Specialist** | qa@dhoot.com | QA@123 | QA | Quality assurance |

## 🎯 Login Steps

### Option 1: One-Click Login (Recommended)
1. On the login page, find the demo account you want to use
2. Click the **"Use"** button next to it
3. Credentials will auto-fill
4. Click **"Sign In"**

### Option 2: Manual Entry
1. Copy the email and password from the table above
2. Paste into the login form
3. Click **"Sign In"**

## 🔧 Alternative: Manual User Creation

If you prefer to create users manually:

### Method 1: Using Registration Form
1. Click **"Create Account"** on the login page
2. Fill in the form:
   - **Name:** Rajesh Kumar
   - **Email:** admin@dhoot.com
   - **Password:** Admin@123
   - **Role:** Super Admin
   - **Department:** Admin / Management Office
   - **Plants:** Select ALL plants
3. Click **"Register"**
4. Now login with these credentials

### Method 2: Using Browser Console (Advanced)
1. Open browser developer tools (F12)
2. Go to Console tab
3. Run this command:
```javascript
// Import and run seed function
const response = await fetch('https://YOUR_PROJECT.supabase.co/functions/v1/make-server-767ffd61/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@dhoot.com',
    password: 'Admin@123',
    name: 'Rajesh Kumar',
    role: 'SuperAdmin',
    department: 'Admin / Management Office',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1', 'Aurangabad Plant 2', 'Pune Plant', 'Nashik Plant']
  })
});
const result = await response.json();
console.log(result);
```

## ✅ What Gets Created

When you click "Create Demo Users", the system creates 5 accounts:

1. **Rajesh Kumar** - Super Admin
   - Full system access
   - All plants (Aurangabad 1 & 2, Pune, Nashik)
   - Can manage all users
   - Access to all features

2. **Priya Desai** - Plant Admin
   - Plant-level administration
   - Aurangabad Plant 1 only
   - Can manage users in their plant
   - Plant-specific features

3. **Vikram Singh** - R&D Manager
   - Department management
   - Aurangabad Plant 1 & Pune Plant
   - Multi-plant project access
   - Team management features

4. **Amit Patel** - Senior Engineer
   - Engineering staff level
   - Aurangabad Plant 1 only
   - Project and form access
   - Standard permissions

5. **Anjali Mehta** - QA Specialist
   - Quality assurance role
   - Aurangabad Plant 1 only
   - QA-specific features
   - Compliance tracking

## 🎨 Testing Different Roles

### Test SuperAdmin Features
```
Login: admin@dhoot.com / Admin@123
```
- User Management (create/edit/delete users)
- System Settings
- All Plants visibility
- Super Admin Dashboard
- IP Restriction Management
- Complete audit log access

### Test PlantAdmin Features
```
Login: plantadmin@dhoot.com / Plant@123
```
- Plant-level user management
- Plant Admin Dashboard
- Single plant data only
- Department-specific features
- Plant metrics and analytics

### Test Manager Features
```
Login: manager@dhoot.com / Manager@123
```
- Multi-plant project access
- Team collaboration features
- Message Hub (create channels)
- Task management
- Cross-plant coordination

### Test Engineer Features
```
Login: engineer@dhoot.com / Engineer@123
```
- Single plant access
- Project work
- Form submissions
- Task updates
- Message Hub participation

### Test QA Features
```
Login: qa@dhoot.com / QA@123
```
- Quality assurance workflows
- Compliance tracking
- QA forms and checklists
- Single plant data
- QA-specific reporting

## 🔐 Security Notes

### Demo Mode vs Production

**Current Status:** Demo accounts are for testing only

**For Production:**
1. Delete or disable demo accounts
2. Create real user accounts with strong passwords
3. Use email verification
4. Enable multi-factor authentication (if needed)
5. Set up proper IP restrictions
6. Review and adjust role permissions

### Password Requirements

Demo passwords meet the minimum requirements:
- ✅ At least 8 characters
- ✅ Contains uppercase letters
- ✅ Contains lowercase letters
- ✅ Contains numbers

**Production passwords should be:**
- At least 12 characters
- Include special characters
- Unique per user
- Never shared or reused

## 🐛 Troubleshooting

### Issue: "Invalid credentials" error
**Solution:** Click "Create Demo Users" button on login page

### Issue: "Email already exists" when creating demo users
**Solution:** Demo users are already created! Just use the credentials to login

### Issue: Demo user creation fails
**Possible causes:**
1. Backend server not running
2. Supabase not configured
3. Network connectivity issues

**Solutions:**
1. Check browser console (F12) for errors
2. Verify Supabase credentials in `/utils/supabase/info.tsx`
3. Ensure backend server is deployed and accessible

### Issue: Can't see all features after login
**Solution:** Check the role of the account you're using
- SuperAdmin: All features
- PlantAdmin: Plant-level features only
- Manager: Department and multi-plant features
- Engineer/QA: Standard user features

### Issue: Can't access User Management
**Solution:** Only SuperAdmin and PlantAdmin roles can access User Management
- Login with admin@dhoot.com or plantadmin@dhoot.com

### Issue: Can't see projects from other plants
**Solution:** This is expected behavior due to plant isolation
- SuperAdmin: Sees all plants
- PlantAdmin: Sees only their plant
- Manager: Sees assigned plants
- Engineer/QA: Sees only their plant

## 📚 Next Steps

After logging in with a demo account:

1. **Explore the Dashboard**
   - SuperAdmin: Super Admin Dashboard
   - PlantAdmin: Plant Admin Dashboard
   - Others: User Dashboard

2. **Create Test Data**
   - Create a project
   - Add forms (UCL, FT, Machine)
   - Create tasks
   - Test workflows

3. **Try Message Hub**
   - Send messages
   - Create channels (Manager+ only)
   - Add reactions
   - Test notifications

4. **Test User Management** (Admin only)
   - Create a new user
   - Generate password setup link
   - Test password setup flow
   - Manage user permissions

5. **Review Audit Logs** (SuperAdmin)
   - Check system activity
   - Review user actions
   - Monitor security events

6. **Test Multi-Plant Features**
   - Login as different users
   - Verify plant isolation
   - Test cross-plant access (Manager)
   - Check data visibility

## 🔗 Related Documentation

- **Main Documentation:** `/README.md`
- **Demo Mode Guide:** `/DEMO_MODE.md`
- **Demo Credentials:** `/DEMO_CREDENTIALS.md`
- **Authentication Guide:** `/AUTHENTICATION_COMPLETE.md`
- **Production Setup:** `/PRODUCTION_SETUP.md`
- **Deployment Guide:** `/DEPLOYMENT_COMPLETE.md`

## 💡 Tips

### Quick Testing Workflow
1. **Login as SuperAdmin** first to see all features
2. **Create some projects** and forms
3. **Login as different roles** to see different perspectives
4. **Test Message Hub** with multiple browser windows
5. **Review audit logs** to see all actions

### Feature Testing Checklist
- [ ] Login with all 5 demo accounts
- [ ] Create projects in different plants
- [ ] Add forms (UCL, FT, Machine)
- [ ] Create and assign tasks
- [ ] Send messages in Message Hub
- [ ] Test password setup flow
- [ ] Review audit logs
- [ ] Test plant isolation
- [ ] Try user management features
- [ ] Explore analytics and dashboards

### Common Testing Scenarios

**Scenario 1: New Project Workflow**
1. Login as Manager
2. Create new project in Aurangabad Plant 1
3. Add UCL forms for the project
4. Create tasks for team members
5. Assign tasks to engineers
6. Logout and login as Engineer
7. Verify project visibility and task assignment

**Scenario 2: Multi-User Collaboration**
1. Open two browser windows
2. Login as Manager in window 1
3. Login as Engineer in window 2
4. Navigate to Message Hub in both
5. Manager creates a channel
6. Both users send messages
7. Test reactions and notifications

**Scenario 3: Admin Workflows**
1. Login as SuperAdmin
2. Navigate to User Management
3. Create a new user
4. Copy password setup link
5. Open link in incognito window
6. Complete password setup
7. Login with new account

---

**Need Help?**
- Check browser console (F12) for detailed error messages
- Review `/AUTHENTICATION_COMPLETE.md` for system architecture
- Check `/PRODUCTION_SETUP.md` for Supabase configuration

**Last Updated:** December 21, 2024  
**Version:** 1.0.0  
**Status:** Production Ready ✅
