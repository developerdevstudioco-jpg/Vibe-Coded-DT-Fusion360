# DT-Fusion360 - Troubleshooting Guide

## 🔐 Authentication Issues

### ❌ Error: "Invalid credentials"

**Symptom:** Login fails with "Invalid credentials" error when using demo accounts

**Root Cause:** Demo users haven't been created in the Supabase database

**Solution:**
1. **On the Login Page**, scroll down to the "Demo Accounts" section
2. **Click the "Create Demo Users"** button (red outlined button)
3. **In the popup**, click "Create Demo Users"
4. **Wait 5-10 seconds** for all accounts to be created
5. **Click "Done"** and try logging in again

**Alternative Solution (Manual):**
1. Click "Create Account" on login page
2. Register manually with these credentials:
   - Email: admin@dhoot.com
   - Password: Admin@123
   - Name: Rajesh Kumar
   - Role: SuperAdmin
   - Department: Admin / Management Office
   - Plants: Select ALL plants
3. Login with these credentials

---

### ❌ Error: "Demo account not found"

**Symptom:** Specific demo account cannot be found

**Solution:**
- This account wasn't created. Use "Create Demo Users" button to initialize all demo accounts
- Or create the account manually via "Create Account" form

---

### ❌ Error: "Email already exists" during demo user creation

**Symptom:** Some or all demo accounts fail with "already exists" error

**Root Cause:** Demo accounts were already created previously

**Solution:**
- **This is actually good!** It means the accounts exist
- Just close the dialog and login with the demo credentials
- No further action needed

**Demo Credentials:**
- admin@dhoot.com / Admin@123
- plantadmin@dhoot.com / Plant@123
- manager@dhoot.com / Manager@123
- engineer@dhoot.com / Engineer@123
- qa@dhoot.com / QA@123

---

### ❌ Error: "Failed to sign in. Please check your credentials."

**Possible Causes:**
1. Incorrect email or password
2. Account doesn't exist
3. Backend server issue
4. Supabase configuration issue

**Solutions:**
1. **Double-check credentials** - Make sure email and password are correct
2. **Use "Use" button** - Click the "Use" button next to demo accounts to auto-fill
3. **Check browser console** (F12) for detailed error messages
4. **Verify Supabase setup** - Check `/utils/supabase/info.tsx` for correct credentials
5. **Test backend** - Visit `https://YOUR_PROJECT.supabase.co/functions/v1/make-server-767ffd61/health`

---

## 🌐 Backend/API Issues

### ❌ Error: "Internal server error during sign in"

**Symptom:** Login fails with 500 error

**Possible Causes:**
1. Backend server not deployed
2. Supabase environment variables not set
3. KV store not accessible

**Solutions:**
1. **Check Supabase Functions**:
   - Log into Supabase dashboard
   - Go to Edge Functions
   - Verify `make-server-767ffd61` is deployed

2. **Check Environment Variables**:
   - In Supabase dashboard → Edge Functions → Settings
   - Ensure these are set:
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `SUPABASE_ANON_KEY`

3. **Check Browser Console**:
   - Press F12
   - Look for detailed error messages
   - Check Network tab for failed requests

---

### ❌ Error: "Failed to fetch" or Network Error

**Symptom:** Cannot connect to backend

**Possible Causes:**
1. Network connectivity issue
2. CORS configuration problem
3. Wrong API endpoint
4. Backend not running

**Solutions:**
1. **Check network connection** - Ensure you're connected to internet
2. **Verify API endpoint** - In `/utils/supabase/client.ts`, check `API_BASE` URL
3. **Test backend health**:
   ```javascript
   fetch('https://YOUR_PROJECT.supabase.co/functions/v1/make-server-767ffd61/health')
     .then(r => r.json())
     .then(console.log)
   ```
4. **Check Supabase status** - Visit status.supabase.com

---

## 👤 User Management Issues

### ❌ Can't access User Management

**Symptom:** User Management option not visible in sidebar

**Root Cause:** Insufficient permissions

**Solution:**
- Only **SuperAdmin** and **PlantAdmin** roles can access User Management
- Login with: admin@dhoot.com or plantadmin@dhoot.com
- Check your current role in the top-right corner

---

### ❌ Can't create new users

**Symptom:** User creation fails

**Possible Causes:**
1. Insufficient permissions
2. Missing required fields
3. Email already exists
4. Backend error

**Solutions:**
1. **Check role** - Must be SuperAdmin or PlantAdmin
2. **Fill all fields** - Name, email, role, department, plant are required
3. **Use unique email** - Each user must have unique email address
4. **Check browser console** for detailed errors

---

## 🏭 Multi-Plant Issues

### ❌ Can't see projects from other plants

**Symptom:** Some projects are not visible

**Root Cause:** This is expected behavior due to plant isolation

**Explanation:**
- **SuperAdmin**: Sees ALL plants
- **PlantAdmin**: Sees only their assigned plant(s)
- **Manager**: Sees only assigned plants
- **Engineer/QA**: Sees only their own plant

**Solution:**
- This is security by design, not a bug
- To see projects from other plants:
  - Login as SuperAdmin (admin@dhoot.com)
  - Or get assigned to multiple plants
  - Or create projects in your assigned plant

---

### ❌ Error: "No access to this plant"

**Symptom:** Cannot access certain data

**Root Cause:** User not assigned to that plant

**Solution:**
1. **Login as SuperAdmin** (admin@dhoot.com)
2. **Go to User Management**
3. **Edit the user**
4. **Add the plant** to their "Assigned Plants" list
5. **Save changes**
6. **User logs out and back in**

---

## 💬 Message Hub Issues

### ❌ Can't create channels

**Symptom:** No "+" button or create option

**Root Cause:** Insufficient permissions

**Solution:**
- Only **Manager**, **PlantAdmin**, and **SuperAdmin** can create channels
- Login with appropriate role:
  - admin@dhoot.com (SuperAdmin)
  - plantadmin@dhoot.com (PlantAdmin)
  - manager@dhoot.com (Manager)

---

### ❌ Can't see certain channels

**Symptom:** Some channels are not visible

**Possible Causes:**
1. Department restriction
2. Plant restriction
3. Not a channel member

**Solution:**
- Check channel settings - it might be restricted to certain departments
- Login as SuperAdmin to see all channels
- Ask channel creator to modify access permissions

---

### ❌ Messages not appearing

**Symptom:** Sent messages don't show up

**Possible Causes:**
1. Backend error
2. KV store issue
3. Need to refresh

**Solutions:**
1. **Click the refresh button** (↻ icon) in Message Hub
2. **Reload the page**
3. **Check browser console** for errors
4. **Try sending again**

---

## 🔧 General Issues

### ❌ "Page not found" or blank page

**Possible Causes:**
1. React routing issue
2. Component error
3. Missing dependencies

**Solutions:**
1. **Hard reload**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear cache**: Browser settings → Clear cache
3. **Check browser console** (F12) for errors

---

### ❌ Slow performance

**Possible Causes:**
1. Large dataset
2. Network latency
3. Browser performance

**Solutions:**
1. **Clear browser cache**
2. **Close unnecessary tabs**
3. **Check network speed**
4. **Use Chrome/Edge** for best performance

---

### ❌ Session expires frequently

**Symptom:** Getting logged out unexpectedly

**Possible Causes:**
1. Token expired
2. Session storage issue

**Solutions:**
1. **Check localStorage** - Browser settings → Storage
2. **Allow cookies** - Ensure cookies are enabled
3. **Login again** - Session will refresh

---

## 🔍 Debugging Tips

### Check Browser Console
1. Press **F12** or right-click → Inspect
2. Go to **Console** tab
3. Look for red error messages
4. Copy error text for investigation

### Check Network Requests
1. Press **F12**
2. Go to **Network** tab
3. Look for failed requests (red color)
4. Click on failed request to see details
5. Check "Response" tab for error message

### Check Application Storage
1. Press **F12**
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Check **Local Storage** for session data
4. Check **Cookies** for authentication

### Test Backend Directly
Open browser console and run:
```javascript
// Test health endpoint
fetch('https://YOUR_PROJECT.supabase.co/functions/v1/make-server-767ffd61/health')
  .then(r => r.json())
  .then(data => console.log('Backend health:', data))
  .catch(err => console.error('Backend error:', err));

// Test authentication
fetch('https://YOUR_PROJECT.supabase.co/functions/v1/make-server-767ffd61/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@dhoot.com',
    password: 'Admin@123'
  })
})
  .then(r => r.json())
  .then(data => console.log('Auth result:', data))
  .catch(err => console.error('Auth error:', err));
```

---

## 📞 Getting Help

### Self-Help Resources
1. **QUICK_START_DEMO.md** - Quick start guide
2. **DEMO_CREDENTIALS.md** - Demo account information
3. **AUTHENTICATION_COMPLETE.md** - Authentication system details
4. **PRODUCTION_SETUP.md** - Deployment and setup guide

### Error Investigation Checklist
- [ ] Checked browser console for errors
- [ ] Tested backend health endpoint
- [ ] Verified Supabase configuration
- [ ] Tried with different browser
- [ ] Cleared cache and cookies
- [ ] Tested with demo account
- [ ] Checked network connectivity
- [ ] Reviewed relevant documentation

### Common Error Codes
- **400**: Bad Request - Check request data
- **401**: Unauthorized - Check authentication
- **403**: Forbidden - Check permissions
- **404**: Not Found - Check endpoint URL
- **500**: Internal Server Error - Check backend logs

---

## ✅ Quick Fixes Summary

| Error | Quick Fix |
|-------|-----------|
| Invalid credentials | Click "Create Demo Users" button |
| Email already exists | Account exists, just login |
| Can't access feature | Check user role (need admin) |
| Projects not visible | Check plant assignment |
| Can't create channel | Need Manager+ role |
| Messages not showing | Click refresh button |
| Page blank | Hard reload (Ctrl+Shift+R) |
| Session expired | Login again |

---

**Last Updated**: December 21, 2024  
**Version**: 1.0.0  
**For More Help**: Check browser console (F12) for detailed errors
