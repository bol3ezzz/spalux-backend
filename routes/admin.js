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
      data: advertisements
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
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

    const images = req.files.images.map(file => file.path);
    const videos = req.files.videos ? req.files.videos.map(file => file.path) : [];

    const socialMedia = {
      twitter: req.body.twitter || '',
      instagram: req.body.instagram || '',
      facebook: req.body.facebook || '',
      snapchat: req.body.snapchat || '',
      whatsapp: req.body.whatsapp || '',
      phone: req.body.phone || '',
      website: req.body.website || '',
      mapLink: req.body.mapLink || '',
      tiktok: req.body.tiktok || ''
    };

    const advertisement = new Advertisement({
      nameAr: req.body.nameAr,
      nameEn: req.body.nameEn,
      descriptionAr: req.body.descriptionAr,
      descriptionEn: req.body.descriptionEn,
      images,
      videos,
      category: req.body.category,
      subCategory: req.body.subCategory,
      governorate: req.body.governorate,
      socialMedia,
      subscriptionEndDate: new Date(req.body.subscriptionEndDate),
      displayOrder: req.body.displayOrder || 0
    });

    await advertisement.save();

    res.status(201).json({
      success: true,
      message: 'Advertisement created successfully',
      data: advertisement
    });
  } catch (error) {
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
    let advertisement = await Advertisement.findById(req.params.id);
    if (!advertisement) {
      return res.status(404).json({ 
        success: false,
        message: 'Advertisement not found' 
      });
    }

    const updateData = {};

    const fields = ['nameAr', 'nameEn', 'descriptionAr', 'descriptionEn', 'category', 'subCategory', 'governorate', 'displayOrder'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (req.body.subscriptionEndDate) {
        updateData.subscriptionEndDate = new Date(req.body.subscriptionEndDate);
    }
    
    let existingImages = advertisement.images;
    if (req.body.existingImages) {
        existingImages = req.body.existingImages.split(',').filter(p => p.trim() !== '');
    }

    let newImages = [];
    if (req.files && req.files.images && req.files.images.length > 0) {
      newImages = req.files.images.map(file => file.path);
    }
    updateData.images = [...existingImages, ...newImages];
    
    let existingVideos = advertisement.videos;
    if (req.body.existingVideos) {
        existingVideos = req.body.existingVideos.split(',').filter(p => p.trim() !== '');
    }

    let newVideos = [];
    if (req.files && req.files.videos && req.files.videos.length > 0) {
      newVideos = req.files.videos.map(file => file.path);
    }
    updateData.videos = [...existingVideos, ...newVideos];

    const socialMediaFields = ['twitter', 'instagram', 'facebook', 'snapchat', 'whatsapp', 'phone', 'website', 'mapLink', 'tiktok'];
    updateData.socialMedia = { ...advertisement.socialMedia };

    socialMediaFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updateData.socialMedia[field] = req.body[field];
        }
    });

    advertisement = await Advertisement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Advertisement updated successfully',
      data: advertisement
    });
  } catch (error) {
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
      data: advertisement
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

module.exports = router;