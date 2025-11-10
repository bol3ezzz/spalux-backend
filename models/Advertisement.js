const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
  // Basic Information
  nameAr: {
    type: String,
    required: true,
    trim: true
  },
  nameEn: {
    type: String,
    required: true,
    trim: true
  },
  descriptionAr: {
    type: String,
    required: true
  },
  descriptionEn: {
    type: String,
    required: true
  },
  
  // Media
  images: [{
    type: String,
    required: true
  }],
  videos: [{
    type: String
  }],
  
  // Categories
  category: {
    type: String,
    required: true,
    enum: ['men', 'women', 'children']
  },
  subCategory: {
    type: String,
    required: true,
    enum: ['spa', 'cupping', 'beauty_clinic', 'mens_salon', 'womens_salon', 'home_services', 'body_care']
  },
  
  // Location
  governorate: {
    type: String,
    required: true,
    enum: ['capital', 'ahmadi', 'farwaniya', 'jahra', 'mubarak_al_kabeer', 'hawalli']
  },
  
  // Social Media & Contact
  socialMedia: {
    twitter: String,
    instagram: String,
    facebook: String,
    snapchat: String,
    whatsapp: String,
    phone: String,
    website: String,
    mapLink: String
  },
  
  // Subscription
  subscriptionEndDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Order for display
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
advertisementSchema.index({ category: 1, governorate: 1, isActive: 1 });
advertisementSchema.index({ subscriptionEndDate: 1 });

// Method to check if subscription is expired
advertisementSchema.methods.isExpired = function() {
  return new Date() > this.subscriptionEndDate;
};

// Auto-deactivate expired ads
advertisementSchema.pre('save', function(next) {
  if (this.isExpired()) {
    this.isActive = false;
  }
  next();
});

module.exports = mongoose.model('Advertisement', advertisementSchema);
