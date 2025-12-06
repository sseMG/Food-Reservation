# 🎯 FOOLPROOF TEST - Auto-Detects Item ID

## Step 1: Make Sure Backend is Running

```bash
cd backend
npm run dev
```

## Step 2: Login to Frontend

Go to http://localhost:5173 and login as a student.

## Step 3: Run This Test (Auto-Finds the Burger)

Open browser console (F12) on the Shop page and paste this:

```javascript
// ═══════════════════════════════════════════════════════
// FOOLPROOF TEST - Automatically finds the test burger
// ═══════════════════════════════════════════════════════

const TOKEN = localStorage.getItem('token');
const BASE_URL = 'http://localhost:3000';
const CONCURRENCY = 30;

async function runTest() {
  console.clear();
  console.log('🔍 Step 1: Finding "Overselling Test Burger"...\n');
  
  // Get all menu items
  const menuRes = await fetch(`${BASE_URL}/api/menu`);
  const items = await menuRes.json();
  
  // Find the test burger
  const burger = items.find(i => i.name === 'Overselling Test Burger');
  
  if (!burger) {
    console.error('❌ Test burger not found!');
    console.log('Available items:', items.map(i => i.name));
    return;
  }
  
  console.log(`✅ Found: ${burger.name}`);
  console.log(`   ID: ${burger.id}`);
  console.log(`   Stock: ${burger.stock}`);
  console.log(`   Price: ₱${burger.price}\n`);
  
  console.log('🔥 Step 2: Launching 30 concurrent orders...\n');
  console.log('════════════════════════════════════════════\n');
  
  const ITEM_ID = burger.id;
  const initialStock = burger.stock;
  
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
          student: 'Test Student'
        })
      });
      
      const data = await res.json().catch(() => ({}));
      const status = res.status === 200 ? '✅' : '❌';
      const msg = res.ok ? 'SUCCESS' : (data.error || 'Failed').substring(0, 50);
      console.log(`${status} #${i.toString().padStart(2)}`, res.status, msg);
      return { status: res.status };
    } catch (err) {
      console.log(`❌ #${i} ERROR`, err.message);
      return {};
    }
  }
  
  const results = await Promise.all(
    Array.from({ length: CONCURRENCY }, (_, i) => makeReservation(i + 1))
  );
  
  const success = results.filter(r => r.status === 200).length;
  const failed = results.filter(r => r.status === 400).length;
  
  console.log('\n════════════════════════════════════════════');
  console.log('📊 FINAL RESULTS:');
  console.log('════════════════════════════════════════════');
  console.log(`Initial stock: ${initialStock}`);
  console.log(`✅ Successful orders: ${success}`);
  console.log(`❌ Failed orders: ${failed}`);
  console.log(`📦 Expected max success: ${initialStock}`);
  console.log('════════════════════════════════════════════');
  
  if (success === 0 && failed === CONCURRENCY) {
    console.log('⚠️  ALL FAILED - Possible issues:');
    console.log('   - Stock was already 0');
    console.log('   - Insufficient balance');
    console.log('   - Wrong item ID');
  } else if (success <= initialStock && success > 0) {
    console.log('✅✅✅ OVERSELLING PREVENTION WORKS! ✅✅✅');
  } else if (success > initialStock) {
    console.log('❌❌❌ BUG: OVERSOLD! ❌❌❌');
  }
  
  console.log('════════════════════════════════════════════');
  
  // Check final stock
  setTimeout(async () => {
    const finalRes = await fetch(`${BASE_URL}/api/menu`);
    const finalItems = await finalRes.json();
    const finalBurger = finalItems.find(i => i.id === ITEM_ID);
    
    if (finalBurger) {
      console.log(`\n📦 Final stock: ${finalBurger.stock}`);
      console.log(`   Expected: ${Math.max(0, initialStock - success)}`);
      
      if (finalBurger.stock >= 0) {
        console.log('✅ Stock is non-negative');
      } else {
        console.log('❌ Stock went negative - OVERSOLD!');
      }
    }
  }, 1500);
}

runTest();

// ═══════════════════════════════════════════════════════
```

---

## ✅ Expected Output (If Working):

```
🔍 Step 1: Finding "Overselling Test Burger"...

✅ Found: Overselling Test Burger
   ID: ITM_1764941964703
   Stock: 5
   Price: ₱100

🔥 Step 2: Launching 30 concurrent orders...

════════════════════════════════════════════

✅ #01 200 SUCCESS
✅ #02 200 SUCCESS
✅ #03 200 SUCCESS
✅ #04 200 SUCCESS
✅ #05 200 SUCCESS
❌ #06 400 Insufficient stock...
❌ #07 400 Insufficient stock...
...
❌ #30 400 Insufficient stock...

════════════════════════════════════════════
📊 FINAL RESULTS:
════════════════════════════════════════════
Initial stock: 5
✅ Successful orders: 5
❌ Failed orders: 25
📦 Expected max success: 5
════════════════════════════════════════════
✅✅✅ OVERSELLING PREVENTION WORKS! ✅✅✅
════════════════════════════════════════════

📦 Final stock: 0
   Expected: 0
✅ Stock is non-negative
```

---

## 🔄 To Reset and Test Again:

```bash
cd backend
node cleanup-menu.js
node add-test-burger.js
```

Then run the browser test again.

---

## ✅ This test:
- ✅ Automatically finds the correct item ID
- ✅ Shows initial stock
- ✅ Shows which requests succeeded/failed
- ✅ Verifies final stock
- ✅ Tells you if overselling prevention works

**No more wrong IDs!** 🎯
