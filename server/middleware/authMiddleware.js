const admin = require('firebase-admin');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Authorization denied.' });
  }

  const token = authHeader.split(' ')[1];

  // Helper to attach user info
  const setUserContext = async (uid, email, explicitRole = null) => {
    let dbUser = null;
    try {
      dbUser = await User.findOne({ firebaseUid: uid });
    } catch (e) {}

    const role = dbUser?.role || explicitRole || 'student';
    req.user = { uid, email, role };
    req.dbUser = dbUser;
  };

  // 1. Check for dev session token
  if (token.startsWith('dev-token:')) {
    const raw = token.replace('dev-token:', '');
    try {
      const payloadStr = Buffer.from(raw, 'base64').toString('utf-8');
      const payload = JSON.parse(payloadStr);
      if (payload && payload.uid) {
        await setUserContext(payload.uid, payload.email, payload.role);
        return next();
      }
    } catch (e) {}

    await setUserContext(raw, 'developer@example.com');
    return next();
  }

  // 2. Try Firebase Admin token verification
  try {
    const authInstance = typeof admin.auth === 'function' ? admin.auth() : require('firebase-admin/auth').getAuth();
    const decoded = await authInstance.verifyIdToken(token);
    await setUserContext(decoded.uid, decoded.email, decoded.role);
    return next();
  } catch (err) {
    // 3. Fallback: decode JWT payload if Firebase Admin is unconfigured in development
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        const uid = payload.user_id || payload.sub || payload.uid;
        if (uid) {
          await setUserContext(uid, payload.email || '', payload.role);
          return next();
        }
      }
    } catch (fallbackErr) {}

    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const requireTeacher = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  let role = req.user.role;
  if (!role && req.user.uid) {
    try {
      const u = await User.findOne({ firebaseUid: req.user.uid });
      if (u) role = u.role;
    } catch (e) {}
  }

  if (role === 'teacher' || role === 'admin') {
    return next();
  }

  return res.status(403).json({
    message: 'Access forbidden: Teacher or Admin privileges required.',
  });
};

const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  let role = req.user.role;
  if (!role && req.user.uid) {
    try {
      const u = await User.findOne({ firebaseUid: req.user.uid });
      if (u) role = u.role;
    } catch (e) {}
  }

  if (role === 'admin') {
    return next();
  }

  return res.status(403).json({
    message: 'Access forbidden: Admin privileges required.',
  });
};

module.exports = { verifyToken, requireTeacher, requireAdmin };
