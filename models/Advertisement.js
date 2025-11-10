const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({

  titleAr: {
    type: String,
    required: true
  },
  titleEn: {
    type: String,
    required: true
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
    enum: ['spa', 'cupping', 'beauty_clinic', 'mens_salon', 'womens_salon', 'home_services', 'body_care', 'children_salon']
  },

  governorate: {
    type: String,
    required: true,
    enum: ['capital', 'ahmadi', 'farwaniya', 'jahra', 'mubarak_al_kabeer', 'hawalli']
  },

  socialMedia: {
    twitter: String,
    instagram: String,
    facebook: String,
    snapchat: String,
    whatsapp: String,
    phone: String,
    website: String,
    mapLink: String,
    tiktok: String
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

}, { timestamps: true });

advertisementSchema.virtual('targetAudience').get(function() {
  return this.category;
});

advertisementSchema.set('toJSON', { virtuals: true });
advertisementSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Advertisement', advertisementSchema);
