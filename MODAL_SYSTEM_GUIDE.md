# Custom Modal System Guide

## ✨ Overview

We've replaced all default browser `alert()` and `confirm()` popups with beautiful, custom-designed modals that match the app's design system.

## 🎨 Features

- **Beautiful Design** - Rounded corners, smooth animations, backdrop blur
- **Icon Support** - Success (✓), Warning (⚠), Info (ℹ), Confirm (?)
- **Type Safety** - TypeScript-ready with proper types
- **Responsive** - Works perfectly on mobile and desktop
- **Keyboard Support** - Press ESC to close
- **Accessible** - Prevents body scroll when open

## 📦 Components Created

### 1. `CustomModal.jsx`
The reusable modal component with:
- Icon display based on type
- Smooth animations (fadeIn, slideUp)
- Customizable buttons
- Auto-close on ESC key

### 2. `ModalContext.jsx`
Global context provider that:
- Manages modal state
- Provides `showAlert()` and `showConfirm()` functions
- Handles promise-based confirmations

### 3. `modalUtils.js`
Utility functions for non-React contexts

## 🚀 Usage

### In React Components (with hooks)

```jsx
import { useModal } from '../../contexts/ModalContext';

function MyComponent() {
  const { showAlert, showConfirm } = useModal();

  // BEFORE (ugly default popup):
  // alert("Success!");
  
  // AFTER (beautiful custom modal):
  await showAlert("Success!", "success");

  // BEFORE (confirm):
  // if (window.confirm("Delete this?")) { ... }
  
  // AFTER:
  const confirmed = await showConfirm("Are you sure you want to delete this?", "Delete Item");
  if (confirmed) {
    // User clicked OK
  }
}
```

### showAlert() API

```jsx
showAlert(message, type?, title?)
```

**Parameters:**
- `message` (string) - The message to display
- `type` (string, optional) - One of: `"info"`, `"success"`, `"warning"`. Default: `"info"`
- `title` (string, optional) - Modal title. Auto-generated if not provided.

**Examples:**
```jsx
// Info (default)
await showAlert("Your profile has been updated");

// Success
await showAlert("Reservation submitted successfully!", "success");

// Warning
await showAlert("Insufficient balance", "warning", "Payment Error");
```

### showConfirm() API

```jsx
showConfirm(message, title?)
```

**Parameters:**
- `message` (string) - The confirmation question
- `title` (string, optional) - Modal title. Default: `"Confirm Action"`

**Returns:** Promise<boolean> - `true` if confirmed, `false` if cancelled

**Examples:**
```jsx
// Simple confirm
const confirmed = await showConfirm("Clear all items from cart?");
if (confirmed) {
  clearCart();
}

// With custom title
const confirmed = await showConfirm(
  "This action cannot be undone. Are you sure?",
  "Delete Account"
);
```

## 🔧 Migration Guide

### Replacing alert()

**Before:**
```jsx
alert("Item added to cart");
```

**After:**
```jsx
await showAlert("Item added to cart", "success");
```

### Replacing confirm()

**Before:**
```jsx
if (window.confirm("Clear cart?")) {
  clear();
}
```

**After:**
```jsx
const confirmed = await showConfirm("Are you sure you want to clear your cart?", "Clear Cart");
if (confirmed) {
  clear();
}
```

### Making Functions Async

Since modals return Promises, you need to make your handler functions `async`:

**Before:**
```jsx
const handleDelete = () => {
  if (window.confirm("Delete?")) {
    deleteItem();
  }
};
```

**After:**
```jsx
const handleDelete = async () => {
  const confirmed = await showConfirm("Delete this item?", "Confirm Delete");
  if (confirmed) {
    deleteItem();
  }
};
```

## 📝 Modal Types & Icons

| Type | Icon | Use Case |
|------|------|----------|
| `info` | ℹ️ (Info) | General information |
| `success` | ✅ (CheckCircle) | Successful operations |
| `warning` | ⚠️ (AlertTriangle) | Warnings, errors, validations |
| `confirm` | ⚠️ (AlertTriangle) | Confirmation dialogs |

## 🎯 Files Already Updated

✅ **Cart.jsx** - All alerts/confirms replaced
✅ **Shop.jsx** - All alerts/confirms replaced

## 📋 Files Remaining to Update

### Student Pages
- [ ] TopUp.jsx (4 alerts)
- [ ] EditProfile.jsx (3 alerts)

### Admin Pages
- [ ] AdminUsers.jsx (14 alerts, 1 confirm)
- [ ] adminCategories.jsx (13 alerts, 3 confirms)
- [ ] adminTopUp.jsx (8 alerts, 2 confirms)
- [ ] AdminNotifications.jsx (5 alerts, 2 confirms)
- [ ] adminShop.jsx (5 alerts, 5 confirms)
- [ ] adminOrders.jsx (4 alerts)
- [ ] adminhomes.jsx (4 alerts, 3 confirms)
- [ ] ArchivedUsers.jsx (3 alerts, 1 confirm)
- [ ] adminInventory.jsx (3 alerts)
- [ ] adminReservations.jsx (2 alerts)
- [ ] editItem.jsx (2 alerts, 2 confirms)
- [ ] InventoryEdit.jsx (1 alert)
- [ ] adminEditItems.jsx (1 alert, 2 confirms)
- [ ] adminReports.jsx (1 alert)

### Components
- [ ] avbar.jsx (1 alert, 3 confirms)
- [ ] adminavbar.jsx (1 alert, 2 confirms)
- [ ] BottomNav.jsx (1 confirm)
- [ ] AdminBottomNav.jsx (1 confirm)

### Other
- [ ] Notifications.jsx (5 alerts, 3 confirms)
- [ ] Register.jsx (1 confirm)

## 🎨 Customization

### Changing Colors

Edit `CustomModal.jsx` to customize button colors:

```jsx
// Line ~120
className={`... ${
  type === "warning" || type === "confirm"
    ? "bg-jckl-navy hover:bg-jckl-light-navy"  // Change these
    : "bg-jckl-navy hover:bg-jckl-light-navy"
}`}
```

### Changing Animations

Edit the `<style jsx>` section in `CustomModal.jsx`:

```jsx
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);  // Adjust distance
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## 🐛 Troubleshooting

### Modal doesn't appear
- Check that `ModalProvider` is wrapping your app in `index.js`
- Make sure you're using `await` before `showAlert` or `showConfirm`

### Can't use in class components
- Use the utility functions from `modalUtils.js` instead:
  ```jsx
  import { showAlert, showConfirm } from '../../lib/modalUtils';
  ```

### Body still scrolls when modal is open
- This is handled automatically, but check that no parent component is overriding `overflow: hidden`

## 📚 Best Practices

1. **Always use await** - Modals are async, use `await` to wait for user response
2. **Descriptive titles** - Use clear, actionable titles for confirms
3. **Short messages** - Keep modal text concise and scannable
4. **Right type** - Use appropriate type (success/warning/info) for context
5. **Don't nest** - Avoid showing a modal from within another modal

## 🎯 Next Steps

To complete the migration:

1. Search for remaining `alert(` calls:
   ```bash
   grep -r "alert(" frontend/src --include="*.jsx"
   ```

2. Search for remaining `confirm(` calls:
   ```bash
   grep -r "confirm(" frontend/src --include="*.jsx"
   ```

3. Replace them using the patterns above

4. Test thoroughly on mobile and desktop

---

**Need help?** Check the example implementations in `Cart.jsx` and `Shop.jsx`.
