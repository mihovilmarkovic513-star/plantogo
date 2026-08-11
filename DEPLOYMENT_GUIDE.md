# PlanToGo Phase 0 Deployment Guide

## 🔐 Prerequisites

Before deploying, ensure you have:
- GitHub account access for `mihovilmarkovic513-star`
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project access: `plantogo-1e015`
- Vercel account

---

## 1️⃣ GitHub Push

### Current Status
✅ Web project committed locally  
⏳ Requires authentication to push

### Steps

```bash
cd "E:\Websitovi Glavni\APP"

# Verify remote is correct
git remote -v
# Should show: origin  https://github.com/mihovilmarkovic513-star/plantogo.git

# Push to GitHub (will prompt for credentials)
git push -u origin main
```

**Authentication Options:**
1. **Personal Access Token (Recommended)**
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Generate new token with `repo` scope
   - Use token as password when prompted

2. **GitHub CLI**
   ```bash
   gh auth login
   git push -u origin main
   ```

### Verification
After push succeeds, verify at:
```
https://github.com/mihovilmarkovic513-star/plantogo
```

---

## 2️⃣ Firebase Security Rules Deployment

### Files to Deploy
- `firestore.rules` - Firestore Security Rules (236 lines)
- `storage.rules` - Storage Security Rules (89 lines)

### Steps

```bash
cd "E:\Websitovi Glavni\APP"

# Login to Firebase (if not already logged in)
firebase login

# Verify correct project
firebase use plantogo-1e015

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Or deploy both at once
firebase deploy --only firestore:rules,storage:rules
```

### Verification

**Firestore Rules:**
1. Go to Firebase Console → Firestore Database → Rules
2. Verify rules are deployed
3. Check "Published" timestamp

**Storage Rules:**
1. Go to Firebase Console → Storage → Rules
2. Verify rules are deployed
3. Check "Published" timestamp

### Important Notes
- Rules enforce strict tenant isolation
- Drivers can only access assigned deliveries
- Audit logs are server-side only (immutable)
- Photos/signatures restricted to assigned drivers

---

## 3️⃣ Cloud Functions (Optional - Not Required for Phase 0)

Cloud Functions foundation is created but **NOT deployed yet**.

### To Deploy Later (Phase 1+)

```bash
cd "E:\Websitovi Glavni\APP\functions"

# Install dependencies
npm install

# Build TypeScript
npm run build

# Deploy functions
firebase deploy --only functions
```

**Functions Created:**
- `onUserCreate` - Auto-set custom claims
- `createUser` - Trusted user creation
- `updateUserRole` - Role management
- `createAuditLog` - Server-side audit logging
- `onTourPublished` - Notification trigger

---

## 4️⃣ Vercel Deployment

### Prerequisites
- GitHub repository must be pushed first
- Vercel account connected to GitHub

### Steps

1. **Go to Vercel Dashboard**
   ```
   https://vercel.com/dashboard
   ```

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose: `mihovilmarkovic513-star/plantogo`

3. **Configure Project**
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

4. **Environment Variables**

   Add the following environment variables in Vercel:

   **Firebase Client SDK (Public):**
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=<from Firebase Console>
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=plantogo-1e015.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=plantogo-1e015
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=plantogo-1e015.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<from Firebase Console>
   NEXT_PUBLIC_FIREBASE_APP_ID=<from Firebase Console>
   ```

   **Firebase Admin SDK (Secret - Server-side only):**
   ```
   FIREBASE_PROJECT_ID=plantogo-1e015
   FIREBASE_CLIENT_EMAIL=<from service account JSON>
   FIREBASE_PRIVATE_KEY=<from service account JSON>
   ```

   **To get Firebase config values:**
   - Go to Firebase Console → Project Settings
   - Scroll to "Your apps" → Web app
   - Copy configuration values

   **To get Admin SDK credentials:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download JSON file
   - Copy `client_email` and `private_key` values

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Vercel will provide a production URL

6. **Configure Custom Domain (Optional)**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

### Verification

After deployment:
1. Visit Vercel production URL
2. Verify login page loads
3. Test authentication (if Firebase config is set)
4. Check Vercel deployment logs for errors

### Automatic Deployments

Once connected:
- Every push to `main` branch → triggers production deployment
- Pull requests → create preview deployments

---

## 5️⃣ Security Testing

### Required Before Phase 1

Execute all test scenarios in `SECURITY_TESTS.md`:

**Test Users to Create:**
- Company A: Super Admin, Company Admin, Supervisor, Driver A1, Driver A2
- Company B: Company Admin, Supervisor, Driver B1

**Critical Tests:**
1. ✅ Company A cannot access Company B data
2. ✅ Driver A1 cannot access Driver A2's delivery
3. ✅ Driver cannot access unassigned delivery
4. ✅ Driver cannot modify planning fields (driverId, companyId, customer)
5. ✅ Driver can only access assigned photos/signatures
6. ✅ Audit logs are immutable

**Testing Methods:**
1. **Firebase Emulator** (Recommended)
   ```bash
   firebase emulators:start
   ```

2. **Firebase Console Rules Playground**
   - Go to Firestore → Rules → Rules Playground
   - Simulate requests with different auth contexts

3. **Automated Tests**
   ```bash
   npm install --save-dev @firebase/rules-unit-testing
   ```

### Test Documentation
See `SECURITY_TESTS.md` for complete test scenarios and expected results.

---

## 📋 Deployment Checklist

### Phase 0 Completion Requirements

- [ ] **GitHub**
  - [ ] Web project pushed to `mihovilmarkovic513-star/plantogo`
  - [ ] Files visible in GitHub repository
  - [ ] Branch: `main`

- [ ] **Firebase Security Rules**
  - [ ] Firestore rules deployed
  - [ ] Storage rules deployed
  - [ ] Rules verified in Firebase Console

- [ ] **Vercel**
  - [ ] Project imported from GitHub
  - [ ] Environment variables configured
  - [ ] Production deployment successful
  - [ ] Automatic deployments enabled

- [ ] **Security Testing**
  - [ ] Test users created
  - [ ] Tenant isolation verified
  - [ ] Driver access control verified
  - [ ] Audit log security verified
  - [ ] All critical tests passed

- [ ] **Android**
  - [ ] Build succeeds: `./gradlew clean assembleDebug`
  - [ ] APK generated successfully

---

## ⚠️ Important Notes

### Do NOT Deploy Yet
- **Cloud Functions** - Foundation created, deploy in Phase 1+
- **Firebase Hosting** - Not used (using Vercel instead)

### Secrets Management
- **NEVER commit** `.env.local` to GitHub
- **NEVER commit** Firebase Admin private keys
- **NEVER commit** service account JSON files
- Use Vercel environment variables for secrets

### Firebase Project
- **Project ID:** `plantogo-1e015`
- **Android Package:** `com.plantogo.driver`
- **Web Hosting:** Vercel (NOT Firebase Hosting)

---

## 🆘 Troubleshooting

### GitHub Push Failed
```
Permission denied
```
**Solution:** Use Personal Access Token or GitHub CLI authentication

### Firebase Deploy Failed
```
Error: HTTP Error: 401, Request had invalid authentication credentials
```
**Solution:** Run `firebase login` and authenticate

### Vercel Build Failed
```
Missing environment variables
```
**Solution:** Add all required `NEXT_PUBLIC_*` and `FIREBASE_*` variables

### Security Rules Syntax Error
**Solution:** Validate rules in Firebase Console before deploying

---

## ✅ Success Criteria

Phase 0 is complete when:
1. ✅ Web project in GitHub
2. ✅ Firebase rules deployed
3. ✅ Vercel deployment live
4. ✅ Security tests passed
5. ✅ Android APK generated

**After completion, STOP and await approval before Phase 1.**
