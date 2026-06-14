const jwt = require('jsonwebtoken');
const { SystemConfig } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_kdn_jwt_token_key_12345';
const SECRET_ADMIN_EMAIL = process.env.SECRET_ADMIN_EMAIL || 'workzeez2026@gmail.com';

const shutdownMiddleware = async (req, res, next) => {
  const config = await SystemConfig.get();
  
  // If the site is shut down, block requests unless they are secret admin controls or authenticated secret admin
  if (config.isShutdown) {
    const isSecretRoute = req.originalUrl.startsWith('/api/secret');
    const isStatusCheck = req.originalUrl === '/api/secret/status';
    
    if (!isSecretRoute && !isStatusCheck) {
      let isSecretAdmin = false;
      const authHeader = req.headers['authorization'];
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (process.env.NODE_ENV !== 'production') {
          // In local development, bypass verification if any bearer token is provided
          isSecretAdmin = true;
        } else {
          try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded.role === 'secret_admin' && decoded.email === SECRET_ADMIN_EMAIL) {
              isSecretAdmin = true;
            }
          } catch (err) {
            // invalid token, will deny access
          }
        }
      } else if (process.env.NODE_ENV !== 'production') {
        // Fallback for development ease-of-use (based on Referer or presence of custom bypass headers)
        const referer = req.headers['referer'] || '';
        if (referer.includes('dev-super-admin-portal-xyz') || referer.includes('secret-gatekeeper') || req.headers['x-secret-admin']) {
          isSecretAdmin = true;
        }
      }
      
      if (!isSecretAdmin) {
        return res.status(503).json({
          maintenance: true,
          message: 'The KDN Sport Complex website is temporarily offline for maintenance. Please check back later.'
        });
      }
    }
  }
  
  next();
};

module.exports = shutdownMiddleware;
