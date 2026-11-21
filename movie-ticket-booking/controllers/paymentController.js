const crypto = require('crypto');
const Razorpay = require('razorpay');
const pool = require('../config/db');

const KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

const isRazorpayConfigured = KEY_ID && KEY_ID !== 'rzp_test_placeholder' && !KEY_ID.includes('placeholder');

let razorpayClient = null;
if (isRazorpayConfigured) {
    try {
        razorpayClient = new Razorpay({
            key_id: KEY_ID,
            key_secret: KEY_SECRET
        });
    } catch (e) {
        console.warn('⚠️ Razorpay client initialization warning:', e.message);
    }
}

/**
 * Get Payment Gateway Configuration / Status
 */
exports.getPaymentConfig = (req, res) => {
    res.json({
        success: true,
        is_live_razorpay: !!razorpayClient,
        key_id: isRazorpayConfigured ? KEY_ID : 'rzp_test_simulated_key',
        currency: 'INR',
        mode: isRazorpayConfigured ? 'RAZORPAY_TEST_MODE' : 'DEVELOPMENT_SIMULATOR'
    });
};

/**
 * Create Payment Order (Razorpay Order or Simulation Order)
 */
exports.createOrder = async (req, res, next) => {
    try {
        const { amount, receipt } = req.body;

        const payableAmount = parseFloat(amount);
        if (isNaN(payableAmount) || payableAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
        }

        const amountInPaise = Math.round(payableAmount * 100);
        const orderReceipt = receipt || ('rcpt_' + Date.now());

        if (razorpayClient) {
            const options = {
                amount: amountInPaise,
                currency: 'INR',
                receipt: orderReceipt,
                payment_capture: 1
            };
            const order = await razorpayClient.orders.create(options);
            return res.json({
                success: true,
                mode: 'RAZORPAY_CHECKOUT',
                key_id: KEY_ID,
                order
            });
        }

        // Test Mode Simulator fallback
        const simulatedOrderId = 'order_test_' + crypto.randomBytes(6).toString('hex');
        return res.json({
            success: true,
            mode: 'DEVELOPMENT_SIMULATOR',
            key_id: 'rzp_test_simulated_key',
            order: {
                id: simulatedOrderId,
                entity: 'order',
                amount: amountInPaise,
                currency: 'INR',
                receipt: orderReceipt,
                status: 'created'
            }
        });

    } catch (err) {
        console.error('Error creating payment order:', err);
        next(err);
    }
};

/**
 * Verify Payment Signature on Backend
 */
exports.verifyPayment = async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, is_simulator } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id) {
            return res.status(400).json({ success: false, message: 'Missing payment verification credentials' });
        }

        // If simulated payment
        if (is_simulator || !razorpayClient) {
            const simulatedTransactionId = 'TXN-SIM-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
            return res.json({
                success: true,
                message: 'Test payment verified successfully via CinePass Payment Simulator.',
                transaction_id: simulatedTransactionId,
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id,
                payment_status: 'SUCCESS'
            });
        }

        // Verify cryptographic HMAC SHA256 signature for real Razorpay test keys
        const expectedSignature = crypto
            .createHmac('sha256', KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            const transactionId = 'TXN-RZP-' + Date.now();
            return res.json({
                success: true,
                message: 'Razorpay Test Payment verified successfully!',
                transaction_id: transactionId,
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id,
                payment_status: 'SUCCESS'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed: Invalid cryptographic signature.'
            });
        }

    } catch (err) {
        next(err);
    }
};

/**
 * View Payment Logs / History
 */
exports.getPaymentHistory = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            `SELECT p.payment_id, p.booking_id, p.amount, p.payment_method,
                    p.transaction_id, p.payment_status, p.payment_date,
                    b.booking_reference, b.seat_numbers,
                    COALESCE(u.name, c.customer_name) AS customer_name,
                    COALESCE(u.email, c.email) AS customer_email,
                    m.title AS movie_title
             FROM payments p
             JOIN bookings b ON p.booking_id = b.booking_id
             LEFT JOIN users u ON p.user_id = u.user_id
             LEFT JOIN customers c ON b.customer_id = c.customer_id
             JOIN shows s ON b.show_id = s.show_id
             JOIN movies m ON s.movie_id = m.movie_id
             ORDER BY p.payment_date DESC
             LIMIT 50`
        );
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        next(err);
    }
};
