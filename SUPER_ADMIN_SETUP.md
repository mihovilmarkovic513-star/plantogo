# Super Admin Initial Setup Guide

## Overview

This guide explains how to securely create the first Super Admin account for PlanToGo.

**Important Security Features:**
- ✅ One-time initialization only
- ✅ Requires secret initialization key
- ✅ Password is NOT hardcoded anywhere
- ✅ Username-based login for Super Admin
- ✅ Cannot be created by normal users
- ✅ Audit logged

---

## Prerequisites

1. **Cloud Functions Deployed:**
   ```bash
   cd "E:\Websitovi Glavni\APP\functions"
   firebase deploy --only functions
   ```

2. **Initialization Secret Configured:**
   ```bash
   firebase functions:config:set init.secret="YOUR_SECURE_SECRET_HERE"
   ```
   
   **Generate a strong secret:**
   ```bash
   # PowerShell
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
   
   # Or use any strong random string (32+ characters)
   ```

3. **Redeploy after setting config:**
   ```bash
   firebase deploy --only functions
   ```

---

## Step 1: Set Initialization Secret

**Generate a secure random secret:**

```powershell
# PowerShell - Generate 32-character random string
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Set the secret in Firebase:**

```bash
firebase functions:config:set init.secret="YOUR_GENERATED_SECRET"
```

**Example:**
```bash
firebase functions:config:set init.secret="aB3dE5fG7hJ9kL2mN4pQ6rS8tU0vW1xY"
```

**Redeploy functions to apply config:**

```bash
firebase deploy --only functions
```

**Save your secret securely** - you'll need it in Step 2.

---

## Step 2: Run Initialization Page

### Option A: Local Web Server (Recommended)

1. **Start a local web server:**

   ```bash
   cd "E:\Websitovi Glavni\APP\scripts"
   python -m http.server 8000
   ```

   Or use Node.js:
   ```bash
   npx http-server -p 8000
   ```

2. **Open in browser:**
   ```
   http://localhost:8000/init-super-admin.html
   ```

3. **Fill in the form:**
   - **Initialization Secret:** The secret you set in Step 1
   - **Username:** `markovicmihovil1437`
   - **Email:** Your email address (for Firebase Auth)
   - **Password:** Choose a strong password (min 8 characters)
   - **Confirm Password:** Re-enter your password
   - **First Name:** `Mihovil`
   - **Last Name:** `Markovic`

4. **Click "Initialize Super Admin"**

5. **Wait for success message**

### Option B: Direct Firebase Function Call

If you prefer, you can call the Cloud Function directly using Firebase SDK or REST API:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const initializeSuperAdmin = httpsCallable(functions, 'initializeSuperAdmin');

const result = await initializeSuperAdmin({
  initSecret: 'YOUR_SECRET_HERE',
  username: 'markovicmihovil1437',
  email: 'your.email@example.com',
  password: 'YOUR_CHOSEN_PASSWORD',
  firstName: 'Mihovil',
  lastName: 'Markovic'
});
```

---

## Step 3: Verify Super Admin Created

**Check Firestore:**

1. Go to Firebase Console → Firestore Database
2. Check `users` collection
3. Find document with:
   - `username: "markovicmihovil1437"`
   - `role: "SUPER_ADMIN"`
   - `companyId: null`
   - `active: true`

**Check Authentication:**

1. Go to Firebase Console → Authentication
2. Find user with your email
3. Verify user exists

**Check Audit Log:**

1. Go to Firestore → `auditLogs` collection
2. Find log with:
   - `action: "SUPER_ADMIN_INITIALIZED"`
   - `metadata.username: "markovicmihovil1437"`

---

## Step 4: Log In to Web Application

### Update Web Login (If Needed)

The web login currently uses email. To support username login for Super Admin:

1. **Navigate to:** `https://your-vercel-url.vercel.app/login`

2. **Login with:**
   - **Email:** Your email address (the one you used during initialization)
   - **Password:** Your chosen password

**OR** (if username login is implemented):

   - **Username:** `markovicmihovil1437`
   - **Password:** Your chosen password

3. **You should be redirected to:** `/admin` (Super Admin dashboard)

---

## Security Notes

### ✅ What is Secure

- **Password:** Never stored in code, GitHub, or Firestore (only in Firebase Auth)
- **Initialization Secret:** Stored in Firebase Functions config (not in code)
- **One-time only:** Cannot create Super Admin if one already exists
- **Audit logged:** All Super Admin creation is logged
- **Username uniqueness:** Enforced via transaction

### ⚠️ Important

- **Save your password securely** - you cannot retrieve it later
- **Save your initialization secret** - you may need it for troubleshooting
- **Delete the initialization secret** after first Super Admin is created:
  ```bash
  firebase functions:config:unset init.secret
  firebase deploy --only functions
  ```

### 🔒 Additional Super Admins

After the first Super Admin is created, only existing Super Admins can create additional Super Admins using the `createSuperAdmin` Cloud Function (not the initialization function).

---

## Troubleshooting

### Error: "Initialization secret not configured"

**Solution:**
```bash
firebase functions:config:set init.secret="YOUR_SECRET"
firebase deploy --only functions
```

### Error: "Invalid initialization secret"

**Solution:** Double-check the secret you entered matches the one you set in Firebase Functions config.

### Error: "Super Admin already exists"

**Solution:** A Super Admin has already been created. Use the existing Super Admin account to create additional Super Admins if needed.

### Error: "Username already taken"

**Solution:** The username is already reserved. Choose a different username or check if the user already exists in Firestore.

### Cannot log in after creation

**Solution:**
1. Verify user exists in Firebase Authentication
2. Verify user document exists in Firestore `users` collection
3. Verify custom claims are set (check with Firebase Admin SDK or Auth emulator)
4. Try password reset if needed

---

## Summary

**Your Super Admin Account:**
- **Username:** `markovicmihovil1437`
- **Email:** (the email you provided during setup)
- **Password:** (the password you chose during setup)
- **Role:** `SUPER_ADMIN`
- **Company:** `null` (platform-level)

**Login URL:**
```
https://your-vercel-deployment.vercel.app/login
```

**After Login:**
- You will be redirected to `/admin`
- You can create companies
- You can create Company Admins
- You can view all users across all companies
- You can create additional Super Admins if needed

---

## Next Steps

1. ✅ Create your first company
2. ✅ Create a Company Admin for that company
3. ✅ Test the complete flow: Company Admin → Create Driver → Driver logs into Android
4. ✅ Verify security isolation between companies
5. ✅ Delete initialization secret (optional but recommended):
   ```bash
   firebase functions:config:unset init.secret
   firebase deploy --only functions
   ```

---

**Your Super Admin account is now ready to use!**
