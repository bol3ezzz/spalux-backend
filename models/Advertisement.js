const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
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
  
  images: [{
    type: String,
    required: true
  }],
  videos: [{
    type: String
  }],
  
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
  
  governorate: {
    type: String,
    required: true,
    enum: ['capital', 'ahmadi', 'farwaniya', 'jahra', 'mubarak_alkabeer', 'hawalli']
  },
  
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
  
  subscriptionEndDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

advertisementSchema.virtual('targetAudience').get(function() {
  return this.category;
});

advertisementSchema.set('toJSON', { virtuals: true });
advertisementSchema.set('toObject', { virtuals: true });

advertisementSchema.index({ category: 1, governorate: 1, isActive: 1 });
advertisementSchema.index({ subscriptionEndDate: 1 });

advertisementSchema.methods.isExpired = function() {
  return new Date() > this.subscriptionEndDate;
};

advertisementSchema.pre('save', function(next) {
  if (this.isExpired()) {
    this.isActive = false;
  }
  next();
});

module.exports = mongoose.model('Advertisement', advertisementSchema);