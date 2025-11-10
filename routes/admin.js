const express = require('express');
const router = express.Router();
const path = require('path');
const Advertisement = require('../models/Advertisement');
const upload = require('../middleware/upload');
const { body, validationResult } = require('express-validator');

const PROJECT_ROOT = path.join(__dirname, '..');

const resolveStoredFilePath = (file) => {
  if (!file) return null;
  if (file.location) return file.location;

  const absolutePath = file.path
    || (file.destination && file.filename
      ? path.join(file.destination, file.filename)
      : null);

  if (!absolutePath) return null;

  const relativePath = path.relative(PROJECT_ROOT, absolutePath);
  return `/${relativePath.replace(/\\/g, '/')}`;
};

const mapStoredFiles = (files = []) =>
  files
    .map(resolveStoredFilePath)
    .filter(Boolean);

const parseJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

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

    const uploadedImages = (req.files && req.files.images) ? req.files.images : [];
    const images = mapStoredFiles(uploadedImages);
    
    if (!images.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }

    const uploadedVideos = (req.files && req.files.videos) ? req.files.videos : [];
    const videos = mapStoredFiles(uploadedVideos);

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

    res.status(201).json({
      success: true,
      message: 'Advertisement created successfully',
      data: advertisement.toObject()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
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

    const newImages = mapStoredFiles((req.files && req.files.images) ? req.files.images : []);
    const newVideos = mapStoredFiles((req.files && req.files.videos) ? req.files.videos : []);

    const existingImages = parseJsonArray(req.body.existingImages);
    const existingVideos = parseJsonArray(req.body.existingVideos);

    updateData.images = newImages.length
      ? [...existingImages, ...newImages]
      : existingImages;

    updateData.videos = newVideos.length
      ? [...existingVideos, ...newVideos]
      : existingVideos;

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
      message: 'Server error'
    });
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
      data: advertisement.toObject()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

router.delete('/advertisements/:id', async (req, res) => {
  try {
    const advertisement = await Advertisement.findByIdAndDelete(req.params.id);
    if (!advertisement) {
      return res.status(404).json({ success: false, message: 'Advertisement not found' });
    }

    res.json({
      success: true,
      message: 'Advertisement deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
