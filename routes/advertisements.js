const express = require('express');
const router = express.Router();
const Advertisement = require('../models/Advertisement');
const upload = require('../middleware/upload');

const getKey = (str) =>
  str
    .toLowerCase()
    .replace(/أ|إ/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[^a-z0-9]/g, '_')
    .trim();

router.get('/', async (req, res) => {
  try {
    const { category, subCategory, governorate, limit = 50, skip = 0, audience } = req.query;

    let query = { 
      isActive: true,
      subscriptionEndDate: { $gte: new Date() }
    };
    
    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory;
    if (governorate) query.governorate = governorate;

    if (audience) {
      query.$or = [
        { targetAudiences: audience },
        { targetAudiences: { $size: 0 } },
        { targetAudiences: { $exists: false } }
      ];
    }

    const advertisements = await Advertisement.find(query)
      .sort({ displayOrder: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await Advertisement.countDocuments(query);
    
    const data = advertisements.map(ad => {
      const a = ad.toObject();
      return {
        ...a,
        images: a.images,
        videos: a.videos,
        category_key: getKey(a.subCategory || a.category),
        socialMedia: {
          ...a.socialMedia,
          tiktok: a.socialMedia.tiktok || ''
        }
      };
    });

    res.json({ success: true, count: data.length, total: total, data: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/random', async (req, res) => {
  try {
    const advertisements = await Advertisement.aggregate([
      { $match: { isActive: true, subscriptionEndDate: { $gte: new Date() } } },
      { $sample: { size: 1 } }
    ]);

    if (advertisements.length === 0) {
      return res.json({ success: true, data: null });
    }

    const ad = advertisements[0];
    const data = {
      ...ad,
      images: ad.images,
      videos: ad.videos,
      category_key: getKey(ad.subCategory || ad.category),
      socialMedia: {
        ...ad.socialMedia,
        tiktok: ad.socialMedia.tiktok || ''
      }
    };
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false });
    
    const a = ad.toObject();
    const data = {
      ...a,
      images: a.images,
      videos: a.videos,
      category_key: getKey(a.subCategory || a.category),
      socialMedia: {
        ...a.socialMedia,
        tiktok: a.socialMedia.tiktok || ''
      }
    };
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false });
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
      const a = ad.toObject();
      return {
        ...a,
        images: a.images,
        videos: a.videos,
        category_key: getKey(a.subCategory || a.category),
        socialMedia: {
          ...a.socialMedia,
          tiktok: a.socialMedia.tiktok || ''
        }
      };
    });
    
    res.json({ success: true, count: data.length, data: data });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;