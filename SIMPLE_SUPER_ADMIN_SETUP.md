# Simple Super Admin Setup - markovicmihovil1437

## ⚡ QUICK SETUP (5 Minutes)

Since Cloud Functions deployment requires GCP service account configuration, here's the **simplest way** to create your Super Admin account:

---

## Option 1: Firebase Console (Easiest - 2 Minutes)

### Step 1: Create User in Firebase Console

1. Go to: https://console.firebase.google.com/project/plantogo-1e015/authentication/users
2. Click **"Add user"**
3. Fill in:
   - **Email:** Your email address
   - **Password:** Your chosen password (min 8 characters)
4. Click **"Add user"**
5. **Copy the User UID** (you'll need it in Step 2)

### Step 2: Set Custom Claims (Firebase Console)

Unfortunately, Firebase Console doesn't allow setting custom claims directly. Use **Option 2** below.

---

## Option 2: Firebase CLI Script (Recommended - 3 Minutes)

### Step 1: Create the Script

Save this as `create-super-admin.js` in your project root:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function createSuperAdmin() {
  const username = 'markovicmihovil1437';
  const email = 'YOUR_EMAIL@example.com'; // CHANGE THIS
  const password = 'YOUR_PASSWORD'; // CHANGE THIS
  const firstName = 'Mihovil';
  const lastName = 'Markovic';

  try {
    // Check if Super Admin already exists
    const existingSuperAdmins = await db.collection('users')
      .where('role', '==', 'SUPER_ADMIN')
      .limit(1)
      .get();

    if (!existingSuperAdmins.empty) {
      console.log('❌ Super Admin already exists!');
      process.exit(1);
    }

    // Check username uniqueness
    const usernameDoc = await db.collection('usernames').doc(username).get();
    if (usernameDoc.exists) {
      console.log('❌ Username already taken!');
      process.exit(1);
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    console.log('✅ Firebase Auth user created:', userRecord.uid);

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'SUPER_ADMIN',
      companyId: null,
      active: true,
    });

    console.log('✅ Custom claims set');

    // Reserve username
    await db.collection('usernames').doc(username).set({
      userId: userRecord.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Username reserved');

    // Create user document
    await db.collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      companyId: null,
      role: 'SUPER_ADMIN',
      username,
      email,
      displayName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      phone: '',
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'SYSTEM_INIT',
    });

    console.log('✅ User document created');

    // Create audit log
    await db.collection('auditLogs').add({
      actorId: 'SYSTEM_INIT',
      actorCompanyId: null,
      action: 'SUPER_ADMIN_INITIALIZED',
      targetType: 'user',
      targetId: userRecord.uid,
      companyId: null,
      metadata: {
        username,
        email,
        firstName,
        lastName,
        initialSetup: true,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Audit log created');
    console.log('');
    console.log('🎉 SUCCESS! Super Admin account created:');
    console.log('   Username:', username);
    console.log('   Email:', email);
    console.log('   UID:', userRecord.uid);
    console.log('');
    console.log('You can now log in at your Vercel URL with your email and password.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createSuperAdmin();
```

### Step 2: Get Service Account Key

1. Go to: https://console.firebase.google.com/project/plantogo-1e015/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Save the file as `serviceAccountKey.json` in your project root
4. **IMPORTANT:** Add `serviceAccountKey.json` to `.gitignore` (already done)

### Step 3: Install Dependencies

```bash
npm install firebase-admin
```

### Step 4: Edit the Script

Open `create-super-admin.js` and change:
- `YOUR_EMAIL@example.com` → Your actual email
- `YOUR_PASSWORD` → Your chosen password

### Step 5: Run the Script

```bash
node create-super-admin.js
```

You should see:
```
✅ Firebase Auth user created: abc123...
✅ Custom claims set
✅ Username reserved
✅ User document created
✅ Audit log created

🎉 SUCCESS! Super Admin account created:
   Username: markovicmihovil1437
   Email: your.email@example.com
   UID: abc123...

You can now log in at your Vercel URL with your email and password.
```

### Step 6: Delete the Script and Service Account Key

```bash
del create-super-admin.js
del serviceAccountKey.json
```

---

## Login to Web Application

1. Go to: `https://your-vercel-url.vercel.app/login`
2. Enter:
   - **Email:** Your email
   - **Password:** Your password
3. You'll be redirected to `/admin` (Super Admin dashboard)

---

## Your Super Admin Account

- **Username:** `markovicmihovil1437`
- **Email:** (the email you provided)
- **Password:** (the password you chose)
- **Role:** `SUPER_ADMIN`
- **Company:** `null` (platform-level)

---

## Security Notes

✅ **Password:** Only stored in Firebase Auth (hashed)  
✅ **Service Account Key:** Deleted after use  
✅ **Script:** Deleted after use  
✅ **Username:** Reserved and unique  
✅ **Audit Logged:** All actions recorded  

---

## What You Can Do Now

✅ Create companies  
✅ Create Company Admins  
✅ View all users across all companies  
✅ Create additional Super Admins  
✅ Activate/deactivate companies  
✅ Activate/deactivate users  

---

## Troubleshooting

**Error: "Super Admin already exists"**
- A Super Admin has already been created
- Check Firestore `users` collection for role = SUPER_ADMIN

**Error: "Username already taken"**
- The username is already reserved
- Check Firestore `usernames` collection

**Cannot log in**
- Verify user exists in Firebase Authentication
- Verify custom claims are set (check user in Firebase Console)
- Try password reset if needed

---

**That's it! Your Super Admin account will be ready in 3 minutes.**
