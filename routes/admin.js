const express = require('express');
const router = express.Router();
const Advertisement = require('../models/Advertisement');
const upload = require('../middleware/upload');
const { body, validationResult } = require('express-validator');

router.get('/advertisements', async (req, res) => {
  try {
    const advertisements = await Advertisement.find().sort({ createdAt: -1 });
    res.json({ success: true, count: advertisements.length, data: advertisements });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

const uploadMiddleware = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 2 }
]);

router.post('/advertisements', uploadMiddleware, [
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

    if (!req.files || !req.files.images || req.files.images.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }

    const images = req.files.images.map(file => `/uploads/${file.filename}`);
    const videos = req.files.videos ? req.files.videos.map(file => `/uploads/${file.filename}`) : [];

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
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.put('/advertisements/:id', uploadMiddleware, async (req, res) => {
  try {
    let advertisement = await Advertisement.findById(req.params.id);
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
      subscriptionEndDate: req.body.subscriptionEndDate ? new Date(req.body.subscriptionEndDate) : advertisement.subscriptionEndDate,
      displayOrder: req.body.displayOrder !== undefined ? req.body.displayOrder : advertisement.displayOrder,
      isActive: req.body.isActive !== undefined ? req.body.isActive : advertisement.isActive
    };

    if (req.files?.images?.length > 0) {
      updateData.images = req.files.images.map(file => `/uploads/${file.filename}`);
    }
    if (req.files?.videos?.length > 0) {
      updateData.videos = req.files.videos.map(file => `/uploads/${file.filename}`);
    }

    if (
      req.body.twitter !== undefined ||
      req.body.instagram !== undefined ||
      req.body.facebook !== undefined ||
      req.body.snapchat !== undefined ||
      req.body.whatsapp !== undefined ||
      req.body.phone !== undefined ||
      req.body.website !== undefined ||
      req.body.mapLink !== undefined ||
      req.body.tiktok !== undefined
    ) {
      updateData.socialMedia = {
        twitter: req.body.twitter ?? advertisement.socialMedia.twitter,
        instagram: req.body.instagram ?? advertisement.socialMedia.instagram,
        facebook: req.body.facebook ?? advertisement.socialMedia.facebook,
        snapchat: req.body.snapchat ?? advertisement.socialMedia.snapchat,
        whatsapp: req.body.whatsapp ?? advertisement.socialMedia.whatsapp,
        phone: req.body.phone ?? advertisement.socialMedia.phone,
        website: req.body.website ?? advertisement.socialMedia.website,
        mapLink: req.body.mapLink ?? advertisement.socialMedia.mapLink,
        tiktok: req.body.tiktok ?? advertisement.socialMedia.tiktok
      };
    }

    advertisement = await Advertisement.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    res.json({ success: true, message: 'Advertisement updated successfully', data: advertisement });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/advertisements/:id', async (req, res) => {
  try {
    const advertisement = await Advertisement.findByIdAndDelete(req.params.id);
    if (!advertisement) {
      return res.status(404).json({ success: false, message: 'Advertisement not found' });
    }
 )   res.json({ success: true, message: 'Advertisement deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.patch('/advertisements/:id/toggle', async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id);
    if (!advertisement) {
      return res.status(404).json({ success: false, message: 'Advertisement not found' });
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
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;