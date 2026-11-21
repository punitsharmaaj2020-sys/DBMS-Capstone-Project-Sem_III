const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { adminAuth } = require('../middleware/authMiddleware');

router.get('/', couponController.getActiveCoupons);
router.post('/apply', couponController.validateCoupon);
router.post('/', adminAuth, couponController.addCoupon);
router.delete('/:id', adminAuth, couponController.deleteCoupon);

module.exports = router;
