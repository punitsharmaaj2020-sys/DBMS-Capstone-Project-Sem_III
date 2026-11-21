const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cinepass_jwt_super_secret_key_2026';

// In-memory token set for legacy admin bearer tokens as fallback
const activeAdminTokens = new Set(['admin-token-super-secret']);

/**
 * Middleware: Verify Admin Authorization
 */
const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Admin authentication required' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    // Check in-memory admin tokens
    if (activeAdminTokens.has(token)) {
        req.isAdmin = true;
        req.user = { role: 'ADMIN', name: 'Administrator' };
        return next();
    }

    // Check JWT token
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role === 'ADMIN') {
            req.isAdmin = true;
            req.user = decoded;
            return next();
        }
        return res.status(403).json({ success: false, message: 'Forbidden: Admin privilege required' });
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
    }
};

/**
 * Middleware: Required User Authentication (Customers or Admins)
 */
const userAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Session expired or invalid. Please log in again.' });
    }
};

/**
 * Middleware: Optional Authentication (Extracts user if present, otherwise guest)
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (e) {
            // Ignore error for optional auth
        }
    }
    next();
};

module.exports = {
    adminAuth,
    userAuth,
    optionalAuth,
    activeAdminTokens,
    JWT_SECRET
};
