
/**
 * Dual Account Bridge Utility
 * Unifies Customer & Seller identities.
 * Enables sellers to shop as customers using a single identity.
 */

const User = require('../models/User');
const Seller = require('../models/Seller');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');

/**
 * Synchronize or create a corresponding User document for a Seller.
 *
 * @param {Object|String} sellerOrId - Seller document or Seller ObjectId
 * @returns {Promise<Object|null>} Synced User document
 */
async function syncSellerToUser(sellerOrId) {
  try {
    // Always extract Seller ID and reload Seller with hidden password.
    const sellerId =
      sellerOrId && typeof sellerOrId === 'object'
        ? sellerOrId._id
        : sellerOrId;

    if (!sellerId) {
      console.error('syncSellerToUser: Seller ID is missing');
      return null;
    }

    const seller = await Seller.findById(sellerId).select('+password');

    if (!seller) {
      console.error('syncSellerToUser: Seller not found:', sellerId);
      return null;
    }

    // Find corresponding User by exact ID first.
    let user = await User.findById(seller._id).select('+passwordHash');

    // Fallback to email only if no User exists with the same ID.
    if (!user && seller.email) {
      user = await User.findOne({
        email: seller.email.toLowerCase().trim(),
      }).select('+passwordHash');
    }

    // Normalize Indian mobile number.
    let phoneDigits = String(seller.phone || '').replace(/\D/g, '');

    if (phoneDigits.length === 12 && phoneDigits.startsWith('91')) {
      phoneDigits = phoneDigits.slice(2);
    }

    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      const idDigits = String(seller._id).replace(/\D/g, '');
      const fallbackDigits = idDigits.slice(-9).padStart(9, '0');

      phoneDigits = '9' + fallbackDigits;
    }

    if (user) {
      let needsSave = false;

      // Preserve Admin and Super Admin roles.
      if (
        user.role !== 'seller' &&
        user.role !== 'admin' &&
        user.role !== 'super_admin'
      ) {
        user.role = 'seller';
        needsSave = true;
      }

      if (!user.fullName && seller.name) {
        user.fullName = seller.name;
        needsSave = true;
      }

      // Copy Seller password hash only if User has no password hash.
      if (!user.passwordHash && seller.password) {
        user.passwordHash = seller.password;
        needsSave = true;
      }

      if (seller.isActive === false && user.isActive !== false) {
        user.isActive = false;
        needsSave = true;
      }

      if (needsSave) {
        await user.save({ validateBeforeSave: false });
      }
    } else {
      // Avoid duplicate mobile number.
      const phoneConflict = await User.findOne({
        mobileNumber: phoneDigits,
      });

      if (phoneConflict) {
        const idDigits = String(seller._id).replace(/\D/g, '');
        phoneDigits = '9' + idDigits.slice(-9).padStart(9, '0');
      }

      // Create User with the same ID as Seller.
      user = new User({
        _id: seller._id,
        fullName: seller.name || seller.businessName || 'Seller Partner',
        mobileNumber: phoneDigits,
        email: seller.email.toLowerCase().trim(),
        passwordHash: seller.password || '',
        role: 'seller',
        profileImage: seller.avatar || '',
        isActive: seller.isActive !== false,
        isVerified:
          seller.isVerified === true || seller.status === 'approved',
      });

      await user.save({ validateBeforeSave: false });
    }

    // Ensure Cart and Wishlist exist.
    await Promise.all([
      Cart.findOneAndUpdate(
        { user: user._id },
        {
          $setOnInsert: {
            user: user._id,
            items: [],
          },
        },
        {
          upsert: true,
          new: true,
        }
      ),

      Wishlist.findOneAndUpdate(
        { user: user._id },
        {
          $setOnInsert: {
            user: user._id,
            products: [],
          },
        },
        {
          upsert: true,
          new: true,
        }
      ),
    ]);

    return user;
  } catch (err) {
    console.error('Error in syncSellerToUser:', err);
    return null;
  }
}

/**
 * Find Seller associated with a User ID or email.
 *
 * @param {String|Object} identifier
 * @returns {Promise<Object|null>}
 */
async function findAssociatedSeller(identifier) {
  try {
    if (!identifier) return null;

    let seller = null;

    const idStr = identifier._id
      ? identifier._id.toString()
      : identifier.toString();

    // Search by MongoDB ObjectId.
    if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
      seller = await Seller.findById(idStr);
    }

    // Fallback search by email.
    const email =
      identifier.email ||
      (typeof identifier === 'string' && identifier.includes('@')
        ? identifier
        : null);

    if (!seller && email) {
      seller = await Seller.findOne({
        email: email.toLowerCase().trim(),
      });
    }

    return seller;
  } catch (err) {
    console.error('Error in findAssociatedSeller:', err);
    return null;
  }
}

module.exports = {
  syncSellerToUser,
  findAssociatedSeller,
};


