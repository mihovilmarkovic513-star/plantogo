# Vercel Environment Variables Setup

## ✅ Deployment Status
**Vercel deployment succeeded** but requires Firebase environment variables to function.

## 🔧 Required Environment Variables

### Public Variables (Client-Side)

These variables are safe to expose in the browser:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=plantogo-1e015.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=plantogo-1e015
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=plantogo-1e015.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### How to Get These Values

1. Go to [Firebase Console](https://console.firebase.google.com/project/plantogo-1e015/settings/general)
2. Scroll to "Your apps" section
3. Click on the Web app (or create one if it doesn't exist)
4. Copy the configuration values:
   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `storageBucket` → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`

### Secret Variables (Server-Side Only)

These variables are for server-side Firebase Admin SDK:

```
FIREBASE_PROJECT_ID=plantogo-1e015
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### How to Get Admin SDK Credentials

1. Go to [Firebase Console → Service Accounts](https://console.firebase.google.com/project/plantogo-1e015/settings/serviceaccounts/adminsdk)
2. Click "Generate new private key"
3. Download the JSON file
4. Copy values from the JSON:
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters)

## 📝 Adding Variables to Vercel

### Option 1: Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `plantogo`
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Key:** Variable name (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
   - **Value:** The actual value
   - **Environment:** Select all (Production, Preview, Development)
5. Click "Save"
6. **Redeploy** the project for changes to take effect

### Option 2: Vercel CLI

```bash
cd "E:\Websitovi Glavni\APP"

# Add public variables
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production

# Add secret variables
vercel env add FIREBASE_PROJECT_ID production
vercel env add FIREBASE_CLIENT_EMAIL production
vercel env add FIREBASE_PRIVATE_KEY production

# Redeploy
vercel --prod
```

## ⚠️ Important Notes

### FIREBASE_PRIVATE_KEY Format

The private key must include the newline characters. In Vercel, enter it exactly as it appears in the JSON file:

```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
```

**Do NOT remove the `\n` characters.**

### Security

- ✅ `NEXT_PUBLIC_*` variables are safe to expose (they're in the browser anyway)
- ❌ **NEVER commit** `FIREBASE_PRIVATE_KEY` or `FIREBASE_CLIENT_EMAIL` to Git
- ❌ **NEVER share** service account credentials publicly
- ✅ Use Vercel's environment variables feature for secrets

### Local Development

For local development, create `.env.local` file:

```bash
# Copy from .env.example
cp .env.example .env.local

# Edit .env.local and add your values
```

**Note:** `.env.local` is already in `.gitignore` and will NOT be committed.

## ✅ Verification

After adding environment variables and redeploying:

1. Visit your Vercel deployment URL
2. Open browser console (F12)
3. Verify no Firebase errors
4. Try to access the login page
5. Firebase should initialize correctly

## 🔄 Redeployment

After adding environment variables, you MUST redeploy:

### Vercel Dashboard
1. Go to Deployments
2. Click "..." on the latest deployment
3. Click "Redeploy"

### Vercel CLI
```bash
vercel --prod
```

### Git Push (Automatic)
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

## 📋 Checklist

- [ ] Get Firebase Web SDK config from Firebase Console
- [ ] Get Firebase Admin SDK credentials (service account JSON)
- [ ] Add all `NEXT_PUBLIC_*` variables to Vercel
- [ ] Add all `FIREBASE_*` secret variables to Vercel
- [ ] Redeploy the project
- [ ] Verify deployment URL loads without errors
- [ ] Test login functionality

---

**After completing these steps, the Vercel deployment will be fully functional.**
