import User from '../models/User.js';
import { verifyToken } from '../config/jwt.js';

const protect = async (req, res, next) => {
  let token;
  
  if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    console.log('No token found in cookies');
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.accountType)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user.accountType} is not authorized to access this route`
      });
    }
    next();
  };
};

export { protect, authorize };