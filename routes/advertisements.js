const express = require('express');
const router = express.Router();
const Advertisement = require('../models/Advertisement');

const getKey = (str) =>
  str
    .toLowerCase()
    .replace(/أ|إ/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[^a-z0-9]/g, '_')
    .trim();

router.get('/', async (req, res) => {
  try {
    const { category, subCategory, governorate, limit = 50, skip = 0 } = req.query;
    
    let query = { 
      isActive: true,
      subscriptionEndDate: { $gte: new Date() }
    };
    
    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory;
    if (governorate) query.governorate = governorate;
    
    const advertisements = await Advertisement.find(query)
      .sort({ displayOrder: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await Advertisement.countDocuments(query);
    
    const data = advertisements.map(ad => ({
      ...ad.toObject(),
      category_key: getKey(ad.subCategory || ad.category),
      socialMedia: {
          ...ad.toObject().socialMedia,
          tiktok: ad.toObject().socialMedia.tiktok || ''
      }
    }));
    
    res.json({
      success: true,
      count: advertisements.length,
      total,
      data
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

router.get('/:id', async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id);
    
    if (!advertisement) {
      return res.status(404).json({ 
        success: false,
        message: 'Advertisement not found' 
      });
    }
    
    const adObject = advertisement.toObject();

    const data = {
      ...adObject,
      category_key: getKey(adObject.subCategory || adObject.category),
      socialMedia: {
          ...adObject.socialMedia,
          tiktok: adObject.socialMedia.tiktok || ''
      }
    };
    
    res.json({
      success: true,
      data
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

router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { governorate, subCategory } = req.query;
    
    let query = { 
      category,
      isActive: true,
      subscriptionEndDate: { $gte: new Date() }
    };
    
    if (governorate) query.governorate = governorate;
    if (subCategory) query.subCategory = subCategory;
    
    const advertisements = await Advertisement.find(query)
      .sort({ displayOrder: -1, createdAt: -1 });
    
    const data = advertisements.map(ad => {
        const adObject = ad.toObject();
        return {
            ...adObject,
            category_key: getKey(adObject.subCategory || adObject.category),
            socialMedia: {
                ...adObject.socialMedia,
                tiktok: adObject.socialMedia.tiktok || ''
            }
        };
    });
    
    res.json({
      success: true,
      count: advertisements.length,
      data
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