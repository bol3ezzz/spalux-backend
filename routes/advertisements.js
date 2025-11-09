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

const formatPath = (baseUrl, img) => {
  if (typeof img !== 'string') return '';
  if (img.startsWith('http')) return img;
  return `${baseUrl}/${img.replace(/^\/+/, '')}`;
};

router.get('/', async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL;
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
    
    const data = advertisements.map(ad => {
      const adObject = ad.toObject();
      return {
        ...adObject,
        images: adObject.images.map(img => formatPath(baseUrl, img)),
        videos: adObject.videos.map(img => formatPath(baseUrl, img)),
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
      total,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL;
    const advertisement = await Advertisement.findById(req.params.id);
    
    if (!advertisement) {
      return res.status(404).json({ success: false });
    }
    
    const adObject = advertisement.toObject();
    
    const data = {
      ...adObject,
      images: adObject.images.map(img => formatPath(baseUrl, img)),
      videos: adObject.videos.map(img => formatPath(baseUrl, img)),
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
    res.status(500).json({ success: false });
  }
});

router.get('/category/:category', async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL;
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
        images: adObject.images.map(img => formatPath(baseUrl, img)),
        videos: adObject.videos.map(img => formatPath(baseUrl, img)),
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
    res.status(500).json({ success: false });
  }
});

module.exports = router;
