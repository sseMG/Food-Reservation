# ✅ EXACT WORKING TEST - NO PLACEHOLDERS

## Your Test Item Details:
- **Name:** Overselling Test Burger
- **Stock:** 5 (only 5 available!)
- **Price:** ₱100
- **ID:** `ITM_1764941964703`

---

## 🎯 SIMPLE 3-STEP TEST:

### STEP 1: Start Backend
```bash
cd backend
npm run dev
```

### STEP 2: Login as Student
1. Go to http://localhost:5173 (or your frontend URL)
2. Login with any student account
3. You should see "Overselling Test Burger" in the Shop

### STEP 3: Copy-Paste This in Browser Console (F12)

Press `F12` on your Shop page, go to **Console** tab, paste this entire block:

```javascript
// ═══════════════════════════════════════════════════════
// COPY FROM HERE ↓
// ═══════════════════════════════════════════════════════

const ITEM_ID = 'ITM_1764941964703';  // Your test burger
const CONCURRENCY = 30;  // 30 people trying to order
const TOKEN = localStorage.getItem('token');
const BASE_URL = 'http://localhost:3000';

async function makeReservation(i) {
  try {
    const res = await fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        items: [{ id: ITEM_ID, qty: 1 }],
        slot: 'Lunch',
        grade: '10',
        section: 'A',
        student: 'Test Student',
        note: `Concurrent test #${i}`
      })
    });
    
    const data = await res.json().catch(() => ({}));
    const status = res.status === 200 ? '✅' : '❌';
    const msg = res.ok ? 'SUCCESS' : (data.error || 'Failed');
    console.log(`${status} #${i.toString().padStart(2)}`, res.status, msg);
    return { status: res.status };
  } catch (err) {
    console.log(`❌ #${i} ERROR`, err.message);
    return {};
  }
}

console.clear();
console.log('🔥 OVERSELLING TEST STARTED');
console.log('════════════════════════════════════════════');
console.log(`Item: Overselling Test Burger`);
console.log(`Stock: 5`);
console.log(`Attackers: 30 simultaneous requests`);
console.log('════════════════════════════════════════════\n');

(async () => {
  const results = await Promise.all(
    Array.from({ length: CONCURRENCY }, (_, i) => makeReservation(i + 1))
  );
  
  const success = results.filter(r => r.status === 200).length;
  const failed = results.filter(r => r.status === 400).length;
  
  console.log('\n════════════════════════════════════════════');
  console.log('📊 FINAL RESULTS:');
  console.log('════════════════════════════════════════════');
  console.log(`✅ Successful reservations: ${success}`);
  console.log(`❌ Failed (insufficient stock): ${failed}`);
  console.log(`📦 Expected max success: 5`);
  console.log('════════════════════════════════════════════');
  
  if (success <= 5) {
    console.log('✅✅✅ OVERSELLING PREVENTION WORKS! ✅✅✅');
  } else {
    console.log('❌❌❌ BUG DETECTED: OVERSOLD! ❌❌❌');
  }
  
  console.log('════════════════════════════════════════════');
  
  // Check final stock
  setTimeout(() => {
    fetch(`${BASE_URL}/api/menu`)
      .then(r => r.json())
      .then(items => {
        const item = items.find(x => x.id === ITEM_ID);
        if (item) {
          console.log(`\n📦 Final stock: ${item.stock}`);
          console.log(item.stock >= 0 ? '✅ Stock is non-negative' : '❌ OVERSOLD - Stock went negative!');
        }
      });
  }, 1000);
})();

// ═══════════════════════════════════════════════════════
// COPY UNTIL HERE ↑
// ═══════════════════════════════════════════════════════
```

---

## ✅ EXPECTED OUTPUT:

```
🔥 OVERSELLING TEST STARTED
════════════════════════════════════════════
Item: Overselling Test Burger
Stock: 5
Attackers: 30 simultaneous requests
════════════════════════════════════════════

✅ #01 200 SUCCESS
✅ #02 200 SUCCESS
✅ #03 200 SUCCESS
✅ #04 200 SUCCESS
✅ #05 200 SUCCESS
❌ #06 400 Insufficient stock for item ITM_1764941883376...
❌ #07 400 Insufficient stock for item ITM_1764941883376...
...
❌ #30 400 Insufficient stock for item ITM_1764941883376...

════════════════════════════════════════════
📊 FINAL RESULTS:
════════════════════════════════════════════
✅ Successful reservations: 5
❌ Failed (insufficient stock): 25
📦 Expected max success: 5
════════════════════════════════════════════
✅✅✅ OVERSELLING PREVENTION WORKS! ✅✅✅
════════════════════════════════════════════

📦 Final stock: 0
✅ Stock is non-negative
```

---

## 🚨 IF IT FAILS:

**If you see more than 5 successes:**
```
✅ Successful reservations: 30  ← BAD! Should be max 5
❌❌❌ BUG DETECTED: OVERSOLD! ❌❌❌
```

This means the fix didn't work. Check:
1. Backend restarted after changes?
2. Using MongoDB or JSON mode?
3. Are mutex dependencies installed? (`npm install` in backend)

---

## 📱 What You'll See on Frontend:

After the test, refresh the Shop page:
- "Overselling Test Burger" should show **0 in stock** or **sold out**
- You should have 5 new reservations in your History

---

## 🔄 To Test Again:

```bash
cd backend
node cleanup-menu.js     # Delete all items
node add-test-burger.js  # Re-add test burger (stock resets to 5)
```

Then run the browser test again.

---

## ✅ DONE!

No more placeholders, no more guessing. Just copy-paste and see the result! 🎯
