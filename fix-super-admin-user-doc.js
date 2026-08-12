const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();
const auth = getAuth();

async function fixSuperAdminUserDoc() {
  const username = 'markovicmihovil1437';
  const email = 'markovicmihovil1437@gmail.com';
  
  try {
    console.log('Looking for user with email:', email);
    
    // Find user by email
    const userRecord = await auth.getUserByEmail(email);
    const userId = userRecord.uid;
    console.log('✅ Found user in Firebase Auth:', userId);
    
    // Check if username reservation exists
    const usernameDoc = await db.collection('usernames').doc(username).get();
    
    if (!usernameDoc.exists) {
      console.log('Creating username reservation...');
      await db.collection('usernames').doc(username).set({
        userId: userId,
        createdAt: FieldValue.serverTimestamp(),
      });
      console.log('✅ Username reserved');
    } else {
      console.log('✅ Username already reserved');
    }
    
    // Check if user document exists
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      console.log('✅ User document already exists');
      console.log('User data:', userDoc.data());
      process.exit(0);
    }
    
    console.log('User document does not exist, creating it...');
    
    // Create user document
    await db.collection('users').doc(userId).set({
      userId: userId,
      companyId: null,
      role: 'SUPER_ADMIN',
      username: username,
      email: userRecord.email,
      displayName: userRecord.displayName || 'Mihovil Markovic',
      firstName: 'Mihovil',
      lastName: 'Markovic',
      phone: '',
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: 'SYSTEM_INIT',
    });
    
    console.log('✅ User document created successfully');
    console.log('');
    console.log('🎉 SUCCESS! You can now log in with:');
    console.log('   Username:', username);
    console.log('   Password: (your password)');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixSuperAdminUserDoc();
