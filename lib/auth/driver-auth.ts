/**
 * Driver Username/Password Authentication Architecture
 * 
 * Drivers use username + password (not email) from their perspective.
 * Internally, Firebase Auth uses email-based authentication.
 * 
 * Username Format: username@plantogo-driver.internal
 * This allows Firebase Auth to work while hiding email complexity from drivers.
 */

/**
 * Convert driver username to internal email format
 * @param username - Driver username (e.g., "mihovil123")
 * @returns Internal email format (e.g., "mihovil123@plantogo-driver.internal")
 */
export function usernameToEmail(username: string): string {
  // Remove any existing @ symbol and domain
  const cleanUsername = username.split('@')[0].toLowerCase().trim();
  return `${cleanUsername}@plantogo-driver.internal`;
}

/**
 * Extract username from internal email format
 * @param email - Internal email (e.g., "mihovil123@plantogo-driver.internal")
 * @returns Username (e.g., "mihovil123")
 */
export function emailToUsername(email: string): string {
  return email.split('@')[0];
}

/**
 * Validate username format
 * @param username - Username to validate
 * @returns true if valid
 */
export function isValidUsername(username: string): boolean {
  // Username: 3-20 characters, alphanumeric and underscore only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Generate secure temporary password
 * @returns Random secure password
 */
export function generateTemporaryPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  
  // Fill remaining characters
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Driver authentication flow:
 * 
 * 1. DRIVER CREATION (Company Admin):
 *    - Admin enters: username, firstName, lastName, phone, employeeId
 *    - System generates: temporary password
 *    - System creates: Firebase Auth user with email = username@plantogo-driver.internal
 *    - System stores: username in Firestore user document
 *    - Admin receives: username + temporary password to give to driver
 * 
 * 2. DRIVER LOGIN (Android App):
 *    - Driver enters: username + password
 *    - App converts: username → email (username@plantogo-driver.internal)
 *    - App calls: Firebase Auth signInWithEmailAndPassword(email, password)
 *    - App verifies: role === DRIVER
 *    - App shows: username in UI (not email)
 * 
 * 3. FIRST LOGIN (Optional):
 *    - Check user document: forcePasswordChange === true
 *    - Require: driver to set new password
 *    - Update: forcePasswordChange = false
 *    - Driver's new password: never visible to admin
 * 
 * 4. PASSWORD RESET:
 *    - Admin triggers: password reset
 *    - System generates: new temporary password
 *    - System updates: Firebase Auth password
 *    - System sets: forcePasswordChange = true
 *    - Admin receives: new temporary password to give to driver
 */
