const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  image: {
    type: String,
    trim: true
  },
  visible: {
    type: Boolean,
    default: true
  },
  deleted: {
    type: Boolean,
    default: false
  },
  // Available days for this menu item
  availableDays: [{
    type: String, // Format: "Monday", "Tuesday", etc.
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    required: true
  }],
  // Grade restrictions (optional)
  gradeRestrictions: [{
    type: String, // e.g., "G1", "G2", "G3", etc.
    required: true
  }],
  // Pickup window restrictions (optional)
  pickupWindows: [{
    type: String, // "recess", "lunch", "after"
    enum: ["recess", "lunch", "after"],
    required: true
  }],
  iconID: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
menuSchema.index({ category: 1 });
menuSchema.index({ visible: 1 });
menuSchema.index({ deleted: 1 });
menuSchema.index({ availableDates: 1 });
menuSchema.index({ 'availableDates': 1, visible: 1 });
menuSchema.index({ name: 'text', description: 'text' });

// Virtual for checking if item is available on a specific date
menuSchema.virtual('isAvailableOn').get(function(date) {
  if (!this.availableDates || this.availableDates.length === 0) {
    return true; // Available on all dates if no restrictions
  }
  return this.availableDates.includes(date);
});

// Method to check if item is available for specific grade
menuSchema.methods.isAvailableForGrade = function(grade) {
  if (!this.gradeRestrictions || this.gradeRestrictions.length === 0) {
    return true; // Available for all grades if no restrictions
  }
  return this.gradeRestrictions.includes(grade);
};

// Method to check if item is available for specific pickup window
menuSchema.methods.isAvailableForPickupWindow = function(window) {
  if (!this.pickupWindows || this.pickupWindows.length === 0) {
    return true; // Available for all windows if no restrictions
  }
  return this.pickupWindows.includes(window);
};

// Pre-save middleware to ensure at least one available date
menuSchema.pre('save', function(next) {
  if (this.isNew && (!this.availableDates || this.availableDates.length === 0)) {
    // For new items, if no available dates specified, make it available for all dates
    this.availableDates = [];
  }
  next();
});

module.exports = mongoose.models.Menu || mongoose.model('Menu', menuSchema);
