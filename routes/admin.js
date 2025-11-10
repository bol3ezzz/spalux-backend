const express = require('express');
const router = express.Router();
const Advertisement = require('../models/Advertisement');
const authMiddleware = require('../middleware/auth');
const { uploadFields } = require('../middleware/upload');
const { body, validationResult } = require('express-validator');

// Apply auth middleware to all routes
// router.use(authMiddleware); // DISABLED - No authentication required

// @route   GET /api/admin/advertisements
// @desc    Get all advertisements (including inactive)
// @access  Private (Admin only)
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
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   POST /api/admin/advertisements
// @desc    Create new advertisement
// @access  Private (Admin only)
router.post('/advertisements', uploadFields, [
  body('nameAr').trim().notEmpty().withMessage('Arabic name is required'),
  body('nameEn').trim().notEmpty().withMessage('English name is required'),
  body('descriptionAr').trim().notEmpty().withMessage('Arabic description is required'),
  body('descriptionEn').trim().notEmpty().withMessage('English description is required'),
  body('category').isIn(['men', 'women', 'children']).withMessage('Invalid category'),
  body('subCategory').isIn(['spa', 'cupping', 'beauty_clinic', 'mens_salon', 'womens_salon', 'home_services', 'body_care']).withMessage('Invalid sub-category'),
  body('governorate').isIn(['capital', 'ahmadi', 'farwaniya', 'jahra', 'mubarak_al_kabeer', 'hawalli']).withMessage('Invalid governorate'),
  body('subscriptionEndDate').isISO8601().withMessage('Invalid subscription end date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check if files were uploaded
    if (!req.files || !req.files.images || req.files.images.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'At least one image is required' 
      });
    }

    // Prepare image URLs
    const images = req.files.images.map(file => `/uploads/${file.filename}`);
    
    // Prepare video URLs (if any)
    const videos = req.files.videos ? req.files.videos.map(file => `/uploads/${file.filename}`) : [];

    // Parse social media data
    const socialMedia = {
      twitter: req.body.twitter || '',
      instagram: req.body.instagram || '',
      facebook: req.body.facebook || '',
      snapchat: req.body.snapchat || '',
      whatsapp: req.body.whatsapp || '',
      phone: req.body.phone || '',
      website: req.body.website || '',
      mapLink: req.body.mapLink || ''
    };

    // Create advertisement
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
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   PUT /api/admin/advertisements/:id
// @desc    Update advertisement
// @access  Private (Admin only)
router.put('/advertisements/:id', uploadFields, async (req, res) => {
  try {
    let advertisement = await Advertisement.findById(req.params.id);
    
    if (!advertisement) {
      return res.status(404).json({ 
        success: false,
        message: 'Advertisement not found' 
      });
    }

    // Prepare update data
    const updateData = {
      nameAr: req.body.nameAr || advertisement.nameAr,
      nameEn: req.body.nameEn || advertisement.nameEn,
      descriptionAr: req.body.descriptionAr || advertisement.descriptionAr,
      descriptionEn: req.body.descriptionEn || advertisement.descriptionEn,
      category: req.body.category || advertisement.category,
      subCategory: req.body.subCategory || advertisement.subCategory,
      governorate: req.body.governorate || advertisement.governorate,
      subscriptionEndDate: req.body.subscriptionEndDate ? new Date(req.body.subscriptionEndDate) : advertisement.subscriptionEndDate,
      displayOrder: req.body.displayOrder !== undefined ? req.body.displayOrder : advertisement.displayOrder,
      isActive: req.body.isActive !== undefined ? req.body.isActive : advertisement.isActive
    };

    // Update images if new ones uploaded
    if (req.files && req.files.images && req.files.images.length > 0) {
      updateData.images = req.files.images.map(file => `/uploads/${file.filename}`);
    }

    // Update videos if new ones uploaded
    if (req.files && req.files.videos && req.files.videos.length > 0) {
      updateData.videos = req.files.videos.map(file => `/uploads/${file.filename}`);
    }

    // Update social media
    if (req.body.twitter !== undefined || 
        req.body.instagram !== undefined || 
        req.body.facebook !== undefined || 
        req.body.snapchat !== undefined || 
        req.body.whatsapp !== undefined || 
        req.body.phone !== undefined || 
        req.body.website !== undefined || 
        req.body.mapLink !== undefined) {
      updateData.socialMedia = {
        twitter: req.body.twitter || advertisement.socialMedia.twitter,
        instagram: req.body.instagram || advertisement.socialMedia.instagram,
        facebook: req.body.facebook || advertisement.socialMedia.facebook,
        snapchat: req.body.snapchat || advertisement.socialMedia.snapchat,
        whatsapp: req.body.whatsapp || advertisement.socialMedia.whatsapp,
        phone: req.body.phone || advertisement.socialMedia.phone,
        website: req.body.website || advertisement.socialMedia.website,
        mapLink: req.body.mapLink || advertisement.socialMedia.mapLink
      };
    }

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
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   DELETE /api/admin/advertisements/:id
// @desc    Delete advertisement
// @access  Private (Admin only)
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
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   PATCH /api/admin/advertisements/:id/toggle
// @desc    Toggle advertisement active status
// @access  Private (Admin only)
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
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;
