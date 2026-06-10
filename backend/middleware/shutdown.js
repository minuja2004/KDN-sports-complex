const { SystemConfig } = require('../config/db');

const shutdownMiddleware = async (req, res, next) => {
  const config = await SystemConfig.get();
  
  // If the site is shut down, only allow requests to /api/secret (secret admin OTP/shutdown toggling)
  // and public routes needed for the shutdown state display (like basic status checks)
  if (config.isShutdown) {
    const isSecretRoute = req.originalUrl.startsWith('/api/secret');
    const isStatusCheck = req.originalUrl === '/api/secret/status';
    
    if (!isSecretRoute && !isStatusCheck) {
      return res.status(503).json({
        maintenance: true,
        message: 'The KDN Sport Complex website is temporarily offline for maintenance. Please check back later.'
      });
    }
  }
  
  next();
};

module.exports = shutdownMiddleware;
