# How to Fix the Menu (Remove Placeholder Items & Add Real Food)

## Problem
Your shop page shows many "New Item" entries with placeholder clothing icons instead of real food pictures.

## Solution - 3 Steps

### Step 1: Clean Up Dummy Data

Run this command in the `backend` folder:

```bash
node cleanup-menu.js
```

This will:
- Delete all existing menu items
- Give you a fresh start

### Step 2: Add Real Menu Items (2 Options)

#### Option A: Through Admin Panel UI (RECOMMENDED)

1. **Start your backend**:
   ```bash
   npm run dev
   ```

2. **Login as admin**:
   - Go to http://localhost:5173 (or your frontend URL)
   - Login with: `admin@school.test` / `admin123`

3. **Add menu items**:
   - Go to Menu Management / Admin Panel
   - Click "Add New Item"
   - Fill in:
     - Name: e.g., "Chicken Burger"
     - Category: Choose from dropdown (Meals, Snacks, Beverages)
     - Price: e.g., 150
     - Stock: e.g., 50
     - **Upload a REAL food image** (JPG/PNG)
   - Click Save

4. **Repeat for all your food items**

#### Option B: Quick Sample Data (For Testing)

Run this in `backend` folder:

```bash
node add-sample-menu.js
```

This adds 5 sample items WITHOUT images. You'll still need to upload images through the admin panel.

### Step 3: Upload Real Food Images

For each menu item:

1. Find a good food photo (burger.jpg, pizza.jpg, etc.)
2. In admin panel, edit the item
3. Upload the image
4. Save

**Image requirements:**
- Format: JPG, PNG, WebP
- Recommended size: 800x600px or similar
- Keep file size under 2MB

## API Endpoints (For Manual Testing)

### Add item with image (using Postman/curl):

```bash
POST http://localhost:4000/api/admin/menu
Headers:
  Authorization: Bearer <your_admin_jwt_token>
Body (form-data):
  name: Chicken Burger
  category: Meals
  price: 150
  stock: 50
  description: Juicy grilled chicken with lettuce
  image: [upload file]
```

### Update item image:

```bash
PUT http://localhost:4000/api/admin/menu/<item_id>
Headers:
  Authorization: Bearer <your_admin_jwt_token>
Body (form-data):
  image: [upload new file]
```

## Where Images Are Stored

Images are saved to: `backend/uploads/menu-<timestamp>-<random>.ext`

## Troubleshooting

**Q: Images not showing on frontend?**
- Check that `backend/uploads/` folder exists
- Verify backend serves static files from `/uploads`
- Check image URLs in the database (should be like `/uploads/menu-123.jpg`)

**Q: "New Item" still showing?**
- Clear your browser cache (Ctrl+Shift+R)
- Check if backend cleaned properly: `GET /api/menu`

**Q: Can't upload images?**
- Make sure you're logged in as admin
- Check file size (max 5MB usually)
- Check file format (JPG, PNG, WebP)

## Quick Test

After setup, check:
```bash
curl http://localhost:4000/api/menu
```

Should return your real menu items with `imageUrl` fields.
