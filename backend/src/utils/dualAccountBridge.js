/**
 * Dual Account Bridge Utility
 * Unifies Customer & Seller identities for Dual Access System
 * Enables sellers to shop as customers with a single account & auth session.
 */
const User = require('../models/User');
const Seller = require('../models/Seller');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');

/**
 * Synchronize or create a corresponding User document for a Seller
 * Ensures the seller has full customer capabilities (cart, wishlist, orders, addresses).
 * @param {Object|String} sellerOrId - Seller document or ObjectId
 * @returns {Promise<Object>} Synced User document
 */
async function syncSellerToUser(sellerOrId) {
  try {
    let seller = sellerOrId;
    if (!seller || typeof seller !== 'object' || !seller._id) {
      seller = await Seller.findById(sellerOrId).select('+password');
    }

    if (!seller) {
      return null;
    }

    // 1. Check if a User already exists with this exact _id
    let user = await User.findById(seller._id);

    // 2. If not found by _id, check if a User exists with the seller's email
    if (!user && seller.email) {
      user = await User.findOne({ email: seller.email.toLowerCase().trim() });
    }

    // 3. Format valid 10-digit Indian mobile number
    let phoneDigits = (seller.phone || '').toString().replace(/[^0-9]/g, '');
    if (phoneDigits.length === 12 && phoneDigits.startsWith('91')) {
      phoneDigits = phoneDigits.slice(2);
    }
    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      phoneDigits = '9' + (phoneDigits.slice(-9) || '98765432').padStart(9, '0');
    }

    if (user) {
      // User exists: update role and status to ensure dual access
      let needsSave = false;
      if (user.role !== 'seller' && user.role !== 'admin' && user.role !== 'super_admin') {
        user.role = 'seller';
        needsSave = true;
      }
      if (!user.fullName && seller.name) {
        user.fullName = seller.name;
        needsSave = true;
      }
      if (seller.isActive === false && user.isActive) {
        user.isActive = false;
        needsSave = true;
      }
      if (needsSave) {
        await user.save({ validateBeforeSave: false });
      }
    } else {
      // 4. Create new User with the exact same _id as the Seller
      // Check if phoneDigits is already taken by another User
      const phoneConflict = await User.findOne({ mobileNumber: phoneDigits });
      if (phoneConflict) {
        // Derive a unique 10-digit mobile number using seller._id digits
        const idDigits = String(seller._id).replace(/[^0-9]/g, '');
        phoneDigits = '9' + (idDigits.slice(-9) || '12345678').padStart(9, '1');
      }

      user = new User({
        _id: seller._id,
        fullName: seller.name || seller.businessName || 'Seller Partner',
        mobileNumber: phoneDigits,
        email: seller.email.toLowerCase().trim(),
        passwordHash: seller.password || '',
        role: 'seller',
        profileImage: seller.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
        isActive: seller.isActive !== false,
        isVerified: seller.isVerified || seller.status === 'approved',
      });

      await user.save({ validateBeforeSave: false });
    }

    // 5. Ensure Cart and Wishlist documents exist for user._id
    await Promise.all([
      Cart.findOneAndUpdate(
        { user: user._id },
        { $setOnInsert: { user: user._id, items: [] } },
        { upsert: true, new: true }
      ).catch(() => {}),
      Wishlist.findOneAndUpdate(
        { user: user._id },
        { $setOnInsert: { user: user._id, products: [] } },
        { upsert: true, new: true }
      ).catch(() => {}),
    ]);

    return user;
  } catch (err) {
    console.error('Error in syncSellerToUser:', err.message);
    return null;
  }
}

/**
 * Check if a User ID or email also has an associated Seller account
 * @param {String|Object} identifier - User ID, email, or User document
 * @returns {Promise<Object|null>} Seller document if exists
 */
async function findAssociatedSeller(identifier) {
  try {
    if (!identifier) return null;

    let seller = null;

    // Check by ObjectId if valid
    const idStr = identifier._id ? identifier._id.toString() : identifier.toString();
    if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
      seller = await Seller.findById(idStr);
    }

    // Check by email if not found
    const email = identifier.email || (typeof identifier === 'string' && identifier.includes('@') ? identifier : null);
    if (!seller && email) {
      seller = await Seller.findOne({ email: email.toLowerCase().trim() });
    }

    return seller;
  } catch (err) {
    console.error('Error in findAssociatedSeller:', err.message);
    return null;
  }
}

module.exports = {
  syncSellerToUser,
  findAssociatedSeller,
};

