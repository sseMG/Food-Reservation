# Browser Console Overselling Test

## Step 1: Get Item ID

Paste this in your browser console (on any page of your app):

```js
fetch('http://localhost:3000/api/menu')
  .then(r => r.json())
  .then(items => {
    console.table(items.map(i => ({ id: i.id, name: i.name, stock: i.stock, price: i.price })));
  });
```

Pick an item with **low stock** (e.g. 5 or 10) and copy its `id`.

---

## Step 2: Get Your Auth Token

```js
const TOKEN = localStorage.getItem('token');
console.log('Token:', TOKEN ? 'Found ✓' : 'Missing ✗');
```

If "Missing", login first, then re-run this.

---

## Step 3: Fire Concurrent Requests (CORRECTED)

**IMPORTANT**: Replace `ITEM_ID` with your actual item ID!

```js
// ===== CONFIG =====
const ITEM_ID = 'ITM_1764938162337';  // <-- CHANGE THIS to your item ID
const CONCURRENCY = 30;
const QTY = 1;

// ===== SETUP =====
const TOKEN = localStorage.getItem('token');
const BASE_URL = 'http://localhost:3000';

async function makeReservation(i) {
  const body = {
    items: [{ id: ITEM_ID, qty: QTY }],
    slot: 'Lunch',         // REQUIRED: pickupSlot
    grade: '10',
    section: 'A',
    student: 'Test Student',
    note: `Stress test #${i}`
  };

  const headers = {
    'Content-Type': 'application/json'
  };
  if (TOKEN) {
    headers['Authorization'] = `Bearer ${TOKEN}`;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    let data;
    try { data = await res.json(); } catch (_) {}
    
    const msg = res.ok 
      ? `✓ SUCCESS` 
      : `✗ ${data?.error || res.statusText}`;
    
    console.log(`#${i.toString().padStart(2)}`, res.status, msg);
    return { i, status: res.status, data };
  } catch (err) {
    console.log(`#${i.toString().padStart(2)} ERROR`, err.message);
    return { i, error: err.message };
  }
}

// ===== RUN TEST =====
(async () => {
  console.log('🔥 Starting overselling test...');
  console.log(`Target: ${ITEM_ID}, Concurrency: ${CONCURRENCY}\n`);
  
  const jobs = [];
  for (let i = 1; i <= CONCURRENCY; i++) {
    jobs.push(makeReservation(i));
  }
  
  const results = await Promise.all(jobs);
  
  console.log('\n📊 RESULTS:');
  console.log('✓ Success (200):', results.filter(r => r.status === 200).length);
  console.log('✗ Failed (400):', results.filter(r => r.status === 400).length);
  console.log('✗ Other errors:', results.filter(r => r.status && r.status !== 200 && r.status !== 400).length);
  
  // Check final stock
  console.log('\n📦 Checking final stock...');
  fetch(`${BASE_URL}/api/menu`)
    .then(r => r.json())
    .then(items => {
      const item = items.find(x => x.id === ITEM_ID);
      if (item) {
        console.log(`Final stock for "${item.name}": ${item.stock}`);
        console.log(item.stock >= 0 ? '✓ Stock is non-negative' : '✗ OVERSOLD!');
      }
    });
})();
```

---

## What You Should See

**Console output:**
```
#01 200 ✓ SUCCESS
#02 200 ✓ SUCCESS
...
#06 400 ✗ Insufficient stock for item...
#07 400 ✗ Insufficient stock for item...
...
#30 400 ✗ Insufficient stock for item...

📊 RESULTS:
✓ Success (200): 5
✗ Failed (400): 25

📦 Checking final stock...
Final stock for "Test Item": 0
✓ Stock is non-negative
```

**Expected behavior:**
- Number of 200s **≤ original stock** (e.g. 5 if stock was 5)
- Remaining requests fail with "Insufficient stock"
- Final stock is **0 or positive, never negative**

---

## If Token is Missing

1. Login normally through your app
2. Then run Step 2 again to check token
3. Then run Step 3

---

## Common Issues

**"Missing pickup slot"** → Fixed in the code above (now uses `slot: 'Lunch'`)

**CORS error** → Make sure backend URL matches your actual backend (default is `http://localhost:3000`)

**All 401 Unauthorized** → Token expired or missing, login again
