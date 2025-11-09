const express = require('express');
const router = express.Router();
const Advertisement = require('../models/Advertisement');
const upload = require('../middleware/upload');
const { body, validationResult } = require('express-validator');

router.get('/advertisements', async (req, res) => {
  try {
    const advertisements = await Advertisement.find()
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: advertisements.length,
      data: advertisements.map(ad => ad.toObject())
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

router.post('/advertisements', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 }
]), [
  body('nameAr').trim().notEmpty().withMessage('Arabic name is required'),
  body('nameEn').trim().notEmpty().withMessage('English name is required'),
  body('descriptionAr').trim().notEmpty().withMessage('Arabic description is required'),
  body('descriptionEn').trim().notEmpty().withMessage('English description is required'),
  body('category').isIn(['men', 'women', 'children']).withMessage('Invalid category'),
  body('subCategory').isIn(['spa', 'cupping', 'beauty_clinic', 'mens_salon', 'womens_salon', 'home_services', 'body_care', 'children_salon']).withMessage('Invalid sub-category'),
  body('governorate').isIn(['capital', 'ahmadi', 'farwaniya', 'jahra', 'mubarak_al_kabeer', 'hawalli']).withMessage('Invalid governorate'),
  body('subscriptionEndDate').isISO8601().withMessage('Invalid subscription end date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (!req.files || !req.files.images || req.files.images.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'At least one image is required' 
      });
    }

    const images = req.files.images.map(file => file.location || file.path);
    const videos = req.files.videos ? req.files.videos.map(file => file.location || file.path) : [];

    const advertisement = new Advertisement({
      nameAr: req.body.nameAr,
      nameEn: req.body.nameEn,
      descriptionAr: req.body.descriptionAr,
      descriptionEn: req.body.descriptionEn,
      category: req.body.category,
      subCategory: req.body.subCategory,
      governorate: req.body.governorate,
      subscriptionEndDate: req.body.subscriptionEndDate,
      displayOrder: req.body.displayOrder || 0,
      images,
      videos,
      socialMedia: {
        twitter: req.body.twitter || '',
        instagram: req.body.instagram || '',
        facebook: req.body.facebook || '',
        snapchat: req.body.snapchat || '',
        whatsapp: req.body.whatsapp || '',
        tiktok: req.body.tiktok || '',
        phone: req.body.phone || '',
        website: req.body.website || '',
        mapLink: req.body.mapLink || ''
      },
      isActive: true
    });

    await advertisement.save();

    res.json({
      success: true,
      message: 'Advertisement created successfully',
      data: advertisement.toObject()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

router.put('/advertisements/:id', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 }
]), async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id);
    if (!advertisement) {
      return res.status(404).json({ success: false, message: 'Advertisement not found' });
    }

    const updateData = {
      nameAr: req.body.nameAr || advertisement.nameAr,
      nameEn: req.body.nameEn || advertisement.nameEn,
      descriptionAr: req.body.descriptionAr || advertisement.descriptionAr,
      descriptionEn: req.body.descriptionEn || advertisement.descriptionEn,
      category: req.body.category || advertisement.category,
      subCategory: req.body.subCategory || advertisement.subCategory,
      governorate: req.body.governorate || advertisement.governorate,
      subscriptionEndDate: req.body.subscriptionEndDate || advertisement.subscriptionEndDate,
      displayOrder: req.body.displayOrder !== undefined ? req.body.displayOrder : advertisement.displayOrder,
    };

    if (req.files && req.files.images) {
      updateData.images = req.files.images.map(file => file.location || file.path);
    }
    if (req.files && req.files.videos) {
      updateData.videos = req.files.videos.map(file => file.location || file.path);
    }

    const existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];
    const existingVideos = req.body.existingVideos ? JSON.parse(req.body.existingVideos) : [];

    if (req.files && req.files.images) {
      updateData.images = [...existingImages, ...updateData.images];
    } else {
      updateData.images = existingImages;
    }

    if (req.files && req.files.videos) {
      updateData.videos = [...existingVideos, ...updateData.videos];
    } else {
      updateData.videos = existingVideos;
    }

    const socialMediaFields = ['twitter', 'instagram', 'facebook', 'snapchat', 'whatsapp', 'phone', 'website', 'mapLink', 'tiktok'];
    updateData.socialMedia = { ...advertisement.socialMedia };

    socialMediaFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updateData.socialMedia[field] = req.body[field];
        }
    });

    const updated = await Advertisement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Advertisement updated successfully',
      data: updated.toObject()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

router.delete('/advertisements/:id', async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id);
    
    if (!advertisement) {
      return res.status(404).json({ 
        success: false,
        message: 'Advertisement not found' 
      });
    }

    await Advertisement.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Advertisement deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

router.patch('/advertisements/:id/toggle', async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id);
    
    if (!advertisement) {
      return res.status(404).json({ 
        success: false,
        message: 'Advertisement not found' 
      });
    }

    advertisement.isActive = !advertisement.isActive;
    await advertisement.save();

    res.json({
      success: true,
      message: `Advertisement ${advertisement.isActive ? 'activated' : 'deactivated'} successfully`,
      data: advertisement.toObject()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

module.exports = router;