/**
 * Test environment variable detection
 * Only outputs true/false for each variable (never prints actual values)
 */

console.log('\n🔍 Environment Variable Detection Test\n');

console.log('API_KEY:', !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log('AUTH_DOMAIN:', !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log('PROJECT_ID:', !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('STORAGE_BUCKET:', !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
console.log('MESSAGING_SENDER_ID:', !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
console.log('APP_ID:', !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID);

console.log('\n');

const allPresent = 
  !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
  !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET &&
  !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
  !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

if (allPresent) {
  console.log('✅ All Firebase environment variables detected\n');
  process.exit(0);
} else {
  console.log('❌ Some Firebase environment variables are missing\n');
  process.exit(1);
}
