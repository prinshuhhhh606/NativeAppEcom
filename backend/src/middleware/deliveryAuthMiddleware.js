const DeliveryPartner = require('../models/DeliveryPartner');
const { verifyAccessToken } = require('../utils/generateToken');
const { errorResponse } = require('../utils/apiResponse');

const protectDelivery = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return errorResponse(res, 'Authentication required. Please log in as a delivery partner.', 401);
  }

  try {
    const decoded = verifyAccessToken(token);
    const partner = await DeliveryPartner.findById(decoded.id);

    if (!partner || !partner.isActive) {
      return errorResponse(res, 'Delivery partner account not found or deactivated.', 401);
    }

    req.deliveryPartner = partner;
    next();
  } catch (error) {
    return errorResponse(res, 'Session expired. Please log in again.', 401);
  }
};

module.exports = { protectDelivery };

