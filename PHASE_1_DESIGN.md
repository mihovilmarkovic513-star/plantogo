# Phase 1 Design Document

## Overview
Multi-tenant authentication and company management system with role-based access control.

## User Hierarchy
```
SUPER_ADMIN (platform-level)
  ↓
COMPANY
  ↓
COMPANY_ADMIN (company-level)
  ↓
SUPERVISOR (company-level)
  ↓
DRIVER (company-level)
```

## Firestore Schema

### companies/{companyId}
```typescript
{
  companyId: string;           // Auto-generated
  companyName: string;         // Display name
  legalName?: string;          // Legal entity name
  address: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;           // userId of creator
}
```

### users/{userId}
```typescript
{
  userId: string;              // Firebase Auth UID
  companyId: string | null;    // null for SUPER_ADMIN
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'SUPERVISOR' | 'DRIVER';
  username?: string;           // Required for DRIVER
  email?: string;              // For SUPER_ADMIN, COMPANY_ADMIN, SUPERVISOR
  displayName: string;
  firstName: string;
  lastName: string;
  phone: string;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;           // userId of creator
}
```

### usernames/{username}
```typescript
{
  userId: string;              // For global username uniqueness
  createdAt: Timestamp;
}
```

### auditLogs/{logId}
```typescript
{
  logId: string;               // Auto-generated
  actorId: string;             // userId performing action
  actorCompanyId?: string;     // null for SUPER_ADMIN
  action: string;              // 'COMPANY_CREATED', 'USER_CREATED', etc.
  targetType: 'company' | 'user';
  targetId: string;
  companyId?: string;          // Affected company
  metadata: object;            // Action-specific data
  timestamp: Timestamp;
}
```

## Firebase Custom Claims
```typescript
{
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'SUPERVISOR' | 'DRIVER';
  companyId: string | null;    // null for SUPER_ADMIN
  active: boolean;
}
```

## Authentication Architecture

### Driver Username System
- Driver username: `mihovil123`
- Internal Firebase email: `mihovil123@plantogo-driver.internal`
- Driver never sees or enters email
- Username must be globally unique

### Password Management
- Temporary password generated on creation
- Shown once to Company Admin
- Driver forced to change on first login
- Password reset generates new temporary password

## Cloud Functions

### createCompany(data)
**Auth:** SUPER_ADMIN only
**Input:**
```typescript
{
  companyName: string;
  legalName?: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
}
```
**Actions:**
- Create company document
- Set active = true
- Create audit log

### createCompanyAdmin(data)
**Auth:** SUPER_ADMIN only
**Input:**
```typescript
{
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  temporaryPassword: string;
}
```
**Actions:**
- Create Firebase Auth user
- Set custom claims (role: COMPANY_ADMIN, companyId)
- Create user document
- Create audit log

### createDriver(data)
**Auth:** COMPANY_ADMIN only
**Input:**
```typescript
{
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
}
```
**Actions:**
- Verify username uniqueness
- Generate temporary password
- Create Firebase Auth user (email: username@plantogo-driver.internal)
- Set custom claims (role: DRIVER, companyId: caller's companyId)
- Create user document
- Create username reservation
- Create audit log
- Return temporary password

### createSupervisor(data)
**Auth:** COMPANY_ADMIN only
**Input:**
```typescript
{
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}
```
**Actions:**
- Create Firebase Auth user
- Set custom claims (role: SUPERVISOR, companyId: caller's companyId)
- Create user document
- Create audit log

### updateUserStatus(data)
**Auth:** SUPER_ADMIN or COMPANY_ADMIN (own company only)
**Input:**
```typescript
{
  userId: string;
  active: boolean;
}
```
**Actions:**
- Update user document
- Update custom claims
- Create audit log

### resetDriverPassword(data)
**Auth:** COMPANY_ADMIN (own company only)
**Input:**
```typescript
{
  userId: string;
}
```
**Actions:**
- Generate new temporary password
- Update Firebase Auth password
- Set forcePasswordChange = true
- Create audit log
- Return temporary password

## Security Rules

### Companies Collection
```javascript
match /companies/{companyId} {
  // SUPER_ADMIN: full access
  allow read, write: if isSuperAdmin();
  
  // COMPANY_ADMIN, SUPERVISOR: read own company
  allow read: if belongsToCompany(companyId);
  
  // COMPANY_ADMIN: update own company (not companyId, createdAt, createdBy)
  allow update: if isCompanyAdmin(companyId) && 
                   !request.resource.data.diff(resource.data)
                     .affectedKeys().hasAny(['companyId', 'createdAt', 'createdBy']);
}
```

### Users Collection
```javascript
match /users/{userId} {
  // SUPER_ADMIN: full access
  allow read, write: if isSuperAdmin();
  
  // COMPANY_ADMIN: read users in own company
  allow read: if isCompanyAdmin(resource.data.companyId);
  
  // SUPERVISOR: read users in own company
  allow read: if isSupervisor(resource.data.companyId);
  
  // DRIVER: read own profile only
  allow read: if request.auth.uid == userId;
  
  // Users cannot modify: userId, companyId, role, createdAt, createdBy
  allow update: if request.auth.uid == userId &&
                   !request.resource.data.diff(resource.data)
                     .affectedKeys().hasAny(['userId', 'companyId', 'role', 'createdAt', 'createdBy']);
}
```

### Audit Logs Collection
```javascript
match /auditLogs/{logId} {
  // SUPER_ADMIN: read all
  allow read: if isSuperAdmin();
  
  // COMPANY_ADMIN: read own company logs
  allow read: if isCompanyAdmin(resource.data.companyId);
  
  // No client writes - server-side only
  allow write: if false;
}
```

## Web UI Routes

### Super Admin
- `/admin` - Dashboard
- `/admin/companies` - Company list
- `/admin/companies/new` - Create company
- `/admin/companies/[id]` - Company detail
- `/admin/companies/[id]/edit` - Edit company
- `/admin/users` - All users across companies

### Company Admin
- `/company` - Company dashboard
- `/company/drivers` - Driver management
- `/company/drivers/new` - Create driver
- `/company/supervisors` - Supervisor management
- `/company/supervisors/new` - Create supervisor
- `/company/settings` - Company settings

### Supervisor
- `/supervisor` - Supervisor dashboard
- `/supervisor/drivers` - View drivers (read-only)

## Android UI

### Driver Login
- Username field
- Password field
- Login button
- Remember me (optional)
- Error messages

### Driver Home (Post-Login)
- Driver name
- Company name
- "No tours assigned yet" message
- Logout button

## Username Uniqueness Strategy

**Decision: Global Uniqueness**

Usernames are globally unique across all companies.

**Rationale:**
- Simpler implementation
- No confusion if driver moves between companies
- Easier to prevent username squatting
- Better for future multi-company driver support

**Implementation:**
- `usernames/{username}` collection
- Transaction-based reservation in Cloud Function
- Prevents race conditions

## Immutable Fields

### All Users
- userId
- companyId
- role
- createdAt
- createdBy

### Additional Driver Restrictions
- Cannot change own active status
- Cannot change own role
- Cannot change own companyId

## Testing Strategy

### Unit Tests
- Username uniqueness validation
- Password generation
- Custom claims setting

### Integration Tests
- Company creation flow
- User creation flow
- Authentication flow

### Security Tests
- SUPER_ADMIN can access all companies
- COMPANY_ADMIN can only access own company
- COMPANY_ADMIN cannot create SUPER_ADMIN
- COMPANY_ADMIN cannot change own companyId
- DRIVER cannot access other company data
- DRIVER cannot change own role
- Inactive user cannot login

### End-to-End Test
1. SUPER_ADMIN creates Company A
2. SUPER_ADMIN creates Company Admin A
3. Company Admin A logs in
4. Company Admin A creates Driver A
5. Driver A logs into Android
6. Driver A sees correct company
7. Driver A cannot access Company B data

## Phase 1 Deliverables

### Backend
- [x] Firestore schema design
- [ ] Cloud Functions (8 functions)
- [ ] Security Rules updates
- [ ] Custom claims management

### Web Frontend
- [ ] Super Admin dashboard
- [ ] Company management UI
- [ ] Company Admin dashboard
- [ ] User management UI
- [ ] Supervisor dashboard
- [ ] Authentication flows

### Android
- [ ] Login screen
- [ ] Driver home screen
- [ ] Authentication persistence
- [ ] Logout functionality

### Testing
- [ ] Security rules tests
- [ ] Cloud Functions tests
- [ ] End-to-end test

### Documentation
- [ ] API documentation
- [ ] User management guide
- [ ] Testing guide
