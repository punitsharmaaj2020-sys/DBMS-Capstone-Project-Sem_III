const pool = require('../config/db');

/**
 * Get all active coupons (for public offers page)
 */
exports.getActiveCoupons = async (req, res, next) => {
    try {
        const [coupons] = await pool.query(
            `SELECT coupon_id, code, description, discount_percent, max_discount, min_amount, expiry_date
             FROM coupons
             WHERE is_active = TRUE AND expiry_date >= CURDATE()
             ORDER BY discount_percent DESC`
        );
        res.json({ success: true, count: coupons.length, data: coupons });
    } catch (err) {
        next(err);
    }
};

/**
 * Validate and calculate discount for a coupon code
 */
exports.validateCoupon = async (req, res, next) => {
    try {
        const { code, amount } = req.body;

        if (!code || amount === undefined) {
            return res.status(400).json({ success: false, message: 'Coupon code and booking amount are required' });
        }

        const bookingAmount = parseFloat(amount);
        if (isNaN(bookingAmount) || bookingAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid booking amount' });
        }

        const normalizedCode = code.trim().toUpperCase();

        const [rows] = await pool.query(
            `SELECT coupon_id, code, description, discount_percent, max_discount, min_amount, expiry_date, is_active
             FROM coupons
             WHERE code = ?`,
            [normalizedCode]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Invalid coupon code. Please check and try again.' });
        }

        const coupon = rows[0];

        if (!coupon.is_active) {
            return res.status(400).json({ success: false, message: 'This coupon is no longer active.' });
        }

        const expiry = new Date(coupon.expiry_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expiry < today) {
            return res.status(400).json({ success: false, message: 'This coupon has expired.' });
        }

        const minAmount = parseFloat(coupon.min_amount);
        if (bookingAmount < minAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount of ₹${minAmount.toFixed(2)} required for coupon "${coupon.code}".`
            });
        }

        const discountPercent = parseFloat(coupon.discount_percent);
        const maxDiscount = parseFloat(coupon.max_discount);

        let calculatedDiscount = (bookingAmount * discountPercent) / 100;
        if (calculatedDiscount > maxDiscount) {
            calculatedDiscount = maxDiscount;
        }

        calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;
        const finalPayable = Math.max(0, Math.round((bookingAmount - calculatedDiscount) * 100) / 100);

        res.json({
            success: true,
            message: `Coupon "${coupon.code}" applied successfully! You saved ₹${calculatedDiscount.toFixed(2)}.`,
            coupon: {
                code: coupon.code,
                discount_percent: discountPercent,
                discount_amount: calculatedDiscount,
                original_amount: bookingAmount,
                final_amount: finalPayable
            }
        });

    } catch (err) {
        next(err);
    }
};

/**
 * Admin: Add coupon
 */
exports.addCoupon = async (req, res, next) => {
    try {
        const { code, description, discount_percent, max_discount = 200, min_amount = 300, expiry_date } = req.body;

        if (!code || !discount_percent || !expiry_date) {
            return res.status(400).json({ success: false, message: 'code, discount_percent, and expiry_date are required' });
        }

        await pool.query(
            `INSERT INTO coupons (code, description, discount_percent, max_discount, min_amount, expiry_date, is_active)
             VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
            [
                code.trim().toUpperCase(),
                description ? description.trim() : null,
                parseInt(discount_percent, 10),
                parseFloat(max_discount),
                parseFloat(min_amount),
                expiry_date
            ]
        );

        res.status(201).json({ success: true, message: 'Coupon created successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'A coupon with this code already exists' });
        }
        next(err);
    }
};

/**
 * Admin: Delete coupon
 */
exports.deleteCoupon = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        await pool.query('DELETE FROM coupons WHERE coupon_id = ?', [id]);
        res.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (err) {
        next(err);
    }
};
