const { activeTokens } = require('../controllers/adminController');

const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Admin login required' });
    }
    const token = authHeader.split(' ')[1];
    if (!token || !activeTokens.has(token)) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
    }
    req.isAdmin = true;
    next();
};

module.exports = adminAuth;
