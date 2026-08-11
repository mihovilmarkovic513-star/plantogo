# Firebase Security Rules Test Scenarios

## Test Setup

Create test users in Firebase Authentication and Firestore:

### Company A (companyId: "company-a")
- **Super Admin**: `superadmin@plantogo.com` (role: SUPER_ADMIN, companyId: null)
- **Company Admin A**: `admin-a@company-a.com` (role: COMPANY_ADMIN, companyId: "company-a")
- **Supervisor A**: `supervisor-a@company-a.com` (role: SUPERVISOR, companyId: "company-a")
- **Driver A1**: `drivera1@plantogo-driver.internal` (role: DRIVER, companyId: "company-a", uid: "driver-a1")
- **Driver A2**: `drivera2@plantogo-driver.internal` (role: DRIVER, companyId: "company-a", uid: "driver-a2")

### Company B (companyId: "company-b")
- **Company Admin B**: `admin-b@company-b.com` (role: COMPANY_ADMIN, companyId: "company-b")
- **Supervisor B**: `supervisor-b@company-b.com` (role: SUPERVISOR, companyId: "company-b")
- **Driver B1**: `driverb1@plantogo-driver.internal` (role: DRIVER, companyId: "company-b", uid: "driver-b1")

## Critical Security Tests

### 1. Tenant Isolation - Company Level

**Test**: Company A cannot access Company B data

```javascript
// As Company Admin A
firestore.collection('customers').where('companyId', '==', 'company-b').get()
// Expected: PERMISSION_DENIED or empty results

firestore.collection('deliveries').where('companyId', '==', 'company-b').get()
// Expected: PERMISSION_DENIED or empty results
```

**Test**: Company B cannot access Company A data

```javascript
// As Company Admin B
firestore.collection('tours').where('companyId', '==', 'company-a').get()
// Expected: PERMISSION_DENIED or empty results
```

### 2. Driver-to-Driver Isolation (Same Company)

**Setup**: Create two deliveries in Company A:
- Delivery 1: assigned to Driver A1 (driverId: "driver-a1")
- Delivery 2: assigned to Driver A2 (driverId: "driver-a2")

**Test**: Driver A1 cannot access Driver A2's delivery

```javascript
// As Driver A1
firestore.collection('deliveries').doc('delivery-2').get()
// Expected: PERMISSION_DENIED (delivery-2 is assigned to driver-a2)
```

**Test**: Driver A2 cannot access Driver A1's delivery

```javascript
// As Driver A2
firestore.collection('deliveries').doc('delivery-1').get()
// Expected: PERMISSION_DENIED (delivery-1 is assigned to driver-a1)
```

### 3. Driver Cannot Access Unassigned Deliveries

**Setup**: Create delivery in Company A with no driver assigned (driverId: null)

**Test**: Driver A1 cannot access unassigned delivery

```javascript
// As Driver A1
firestore.collection('deliveries').doc('delivery-unassigned').get()
// Expected: PERMISSION_DENIED
```

### 4. Driver Cannot Modify Planning Fields

**Setup**: Delivery assigned to Driver A1

**Test**: Driver cannot change driverId

```javascript
// As Driver A1
firestore.collection('deliveries').doc('delivery-1').update({
  driverId: 'driver-a2'  // Trying to reassign to another driver
})
// Expected: PERMISSION_DENIED
```

**Test**: Driver cannot change companyId

```javascript
// As Driver A1
firestore.collection('deliveries').doc('delivery-1').update({
  companyId: 'company-b'
})
// Expected: PERMISSION_DENIED
```

**Test**: Driver cannot change customer

```javascript
// As Driver A1
firestore.collection('deliveries').doc('delivery-1').update({
  customerId: 'different-customer'
})
// Expected: PERMISSION_DENIED
```

**Test**: Driver cannot change service level

```javascript
// As Driver A1
firestore.collection('deliveries').doc('delivery-1').update({
  serviceLevelId: 'premium'
})
// Expected: PERMISSION_DENIED
```

**Test**: Driver CAN update allowed operational fields

```javascript
// As Driver A1
firestore.collection('deliveries').doc('delivery-1').update({
  status: 'IN_PROGRESS',
  notes: 'Customer not home, will retry'
})
// Expected: SUCCESS
```

### 5. Photo Access Control

**Setup**: 
- Photo 1: belongs to delivery-1 (assigned to driver-a1)
- Photo 2: belongs to delivery-2 (assigned to driver-a2)

**Test**: Driver A1 cannot access Driver A2's photos

```javascript
// As Driver A1
firestore.collection('photos').doc('photo-2').get()
// Expected: PERMISSION_DENIED

// Storage
storage.ref('companies/company-a/deliveries/delivery-2/photos/photo-2.jpg').getDownloadURL()
// Expected: PERMISSION_DENIED
```

**Test**: Driver A1 CAN access own delivery photos

```javascript
// As Driver A1
firestore.collection('photos').doc('photo-1').get()
// Expected: SUCCESS

storage.ref('companies/company-a/deliveries/delivery-1/photos/photo-1.jpg').getDownloadURL()
// Expected: SUCCESS
```

### 6. Signature Immutability

**Setup**: Signature exists for delivery-1

**Test**: Driver cannot modify signature

```javascript
// As Driver A1
firestore.collection('signatures').doc('signature-1').update({
  signerName: 'Different Name'
})
// Expected: PERMISSION_DENIED
```

**Test**: Driver cannot delete signature

```javascript
// As Driver A1
firestore.collection('signatures').doc('signature-1').delete()
// Expected: PERMISSION_DENIED
```

### 7. Audit Log Security

**Test**: Driver cannot create audit log directly

```javascript
// As Driver A1
firestore.collection('auditLogs').add({
  eventType: 'FAKE_EVENT',
  userId: 'driver-a1',
  action: 'CREATED'
})
// Expected: PERMISSION_DENIED
```

**Test**: Driver cannot modify audit log

```javascript
// As Driver A1
firestore.collection('auditLogs').doc('log-1').update({
  eventType: 'MODIFIED_EVENT'
})
// Expected: PERMISSION_DENIED
```

**Test**: Driver cannot delete audit log

```javascript
// As Driver A1
firestore.collection('auditLogs').doc('log-1').delete()
// Expected: PERMISSION_DENIED
```

**Test**: Company Admin CAN read audit logs

```javascript
// As Company Admin A
firestore.collection('auditLogs').where('companyId', '==', 'company-a').get()
// Expected: SUCCESS
```

### 8. Cross-Company Driver Access

**Test**: Driver from Company A cannot access Company B delivery

```javascript
// As Driver A1
firestore.collection('deliveries').where('companyId', '==', 'company-b').get()
// Expected: PERMISSION_DENIED or empty results
```

### 9. Supervisor Access

**Test**: Supervisor can access all company deliveries

```javascript
// As Supervisor A
firestore.collection('deliveries').where('companyId', '==', 'company-a').get()
// Expected: SUCCESS (all Company A deliveries)
```

**Test**: Supervisor cannot access other company

```javascript
// As Supervisor A
firestore.collection('deliveries').where('companyId', '==', 'company-b').get()
// Expected: PERMISSION_DENIED or empty results
```

### 10. Super Admin Access

**Test**: Super Admin can access all companies

```javascript
// As Super Admin
firestore.collection('companies').get()
// Expected: SUCCESS (all companies)

firestore.collection('deliveries').where('companyId', '==', 'company-a').get()
// Expected: SUCCESS

firestore.collection('deliveries').where('companyId', '==', 'company-b').get()
// Expected: SUCCESS
```

## Running Tests

### Option 1: Firebase Emulator

```bash
cd "E:\Websitovi Glavni\APP"
firebase emulators:start
```

Then run tests against emulator using Firebase SDK.

### Option 2: Firebase Console Rules Playground

1. Go to Firebase Console → Firestore → Rules
2. Use the Rules Playground to simulate requests
3. Set authentication context (uid, custom claims)
4. Test read/write operations

### Option 3: Automated Test Suite

Create test file using `@firebase/rules-unit-testing`:

```bash
npm install --save-dev @firebase/rules-unit-testing
```

## Expected Results Summary

| Test | Expected Result |
|------|----------------|
| Company A → Company B data | ❌ DENIED |
| Company B → Company A data | ❌ DENIED |
| Driver A1 → Driver A2 delivery | ❌ DENIED |
| Driver A1 → Unassigned delivery | ❌ DENIED |
| Driver → Change driverId | ❌ DENIED |
| Driver → Change companyId | ❌ DENIED |
| Driver → Change customer | ❌ DENIED |
| Driver → Update status/notes | ✅ ALLOWED |
| Driver A1 → Driver A2 photos | ❌ DENIED |
| Driver → Modify signature | ❌ DENIED |
| Driver → Create audit log | ❌ DENIED |
| Driver → Modify audit log | ❌ DENIED |
| Supervisor → All company deliveries | ✅ ALLOWED |
| Supervisor → Other company | ❌ DENIED |
| Super Admin → All companies | ✅ ALLOWED |

## Critical: All tests must PASS before Phase 1
