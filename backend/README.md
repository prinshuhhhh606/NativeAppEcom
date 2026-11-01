# Pan India E-Commerce REST API Backend

Production-ready REST API backend for the Pan India E-Commerce Mobile Application built with **Node.js**, **Express.js**, **MongoDB**, and **Mongoose**.

---

## 🚀 Key Features

- **Professional MVC Architecture**: Strict separation of concerns (Models, Controllers, Services, Middlewares, Routes, Validators, Utils, Constants).
- **Pan India Delivery Engine**:
  - Full Indian PIN code directory validation (`/^[1-9][0-9]{5}$/`).
  - Zone & Metro detection (North, West, South, East, Central, Army Postal Service).
  - Transit time estimation (2-4 business days for Metros, 3-6 days for Regional/Remote).
  - Free delivery threshold calculation (Orders $\ge$ ₹499 qualify for free shipping).
  - Cash on Delivery (COD) eligibility engine based on PIN code.
  - Multi-courier tracking simulation (Delhivery, BlueDart, DTDC, Ekart).
- **Secure Authentication & RBAC**:
  - Email/Password and Mobile OTP authentication (10-digit Indian numbers `[6-9]XXXXXXXXX`).
  - Dual JWT mechanism with short-lived Access Tokens (15m) and secure Refresh Tokens (7d).
  - Role-based authorization (`customer`, `admin`).
- **Cart, Wishlist & Dynamic Pricing**:
  - Server-side pricing recalculation (never trusts client prices).
  - Real-time stock checks and atomic inventory decrements upon order placement.
  - Discount coupons engine (Fixed amount or Percentage with max cap and minimum order value).
  - Automated GST calculation (18%) and Indian rupee breakdown.
- **Razorpay Payment Integration**:
  - Server-side Razorpay order creation.
  - Cryptographic HMAC-SHA256 signature verification.
  - Webhook listener for captured payments.
  - Automated refunds processing for returns.
- **Multi-channel Communication**:
  - Nodemailer email notifications (Welcome, Order Confirmation, Password Reset).
  - In-app notification center.
  - OTP dispatch system with development fallback.
- **Media Uploads**:
  - Multer multipart handling with 5MB file size limit and image mime-type filter.
  - Cloudinary upload integration with local disk fallback (`uploads/`).
- **Enterprise-grade Security**:
  - Helmet HTTP security headers.
  - CORS configuration tailored for React Native CLI mobile clients.
  - Express Rate Limiting (general API, sensitive auth endpoints, payment routes).
  - Express-validator input sanitization returning HTTP 422 with structured errors.

---

## 📁 Project Structure

```text
backend/
├── .env                  # Environment configuration
├── .env.example          # Template environment file
├── package.json          # Dependencies and scripts
├── uploads/              # Local storage fallback for uploaded images
├── scripts/
│   └── seed.js           # Database seeder (categories, products, admin, coupons)
├── tests/
│   └── verify.js         # Backend integrity and smoke test runner
└── src/
    ├── server.js         # Express app entry point
    ├── config/
    │   ├── db.js         # Mongoose database connection
    │   ├── env.js        # Environment loader
    │   ├── payment.js    # Razorpay instance
    │   └── cloudinary.js # Cloudinary v2 setup
    ├── constants/
    │   ├── roles.js
    │   ├── orderStatus.js
    │   └── paymentStatus.js
    ├── models/
    │   ├── User.js
    │   ├── Category.js
    │   ├── Product.js
    │   ├── Cart.js
    │   ├── Wishlist.js
    │   ├── Address.js
    │   ├── Order.js
    │   ├── Payment.js
    │   ├── Coupon.js
    │   ├── Review.js
    │   ├── Notification.js
    │   └── ReturnRequest.js
    ├── controllers/
    │   ├── authController.js
    │   ├── userController.js
    │   ├── productController.js
    │   ├── categoryController.js
    │   ├── cartController.js
    │   ├── wishlistController.js
    │   ├── addressController.js
    │   ├── orderController.js
    │   ├── paymentController.js
    │   ├── couponController.js
    │   ├── reviewController.js
    │   ├── notificationController.js
    │   ├── deliveryController.js
    │   └── returnController.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── userRoutes.js
    │   ├── productRoutes.js
    │   ├── categoryRoutes.js
    │   ├── cartRoutes.js
    │   ├── wishlistRoutes.js
    │   ├── addressRoutes.js
    │   ├── orderRoutes.js
    │   ├── paymentRoutes.js
    │   ├── couponRoutes.js
    │   ├── reviewRoutes.js
    │   ├── notificationRoutes.js
    │   ├── deliveryRoutes.js
    │   └── returnRoutes.js
    ├── middleware/
    │   ├── authMiddleware.js
    │   ├── errorMiddleware.js
    │   ├── uploadMiddleware.js
    │   ├── validationMiddleware.js
    │   └── rateLimitMiddleware.js
    ├── services/
    │   ├── otpService.js
    │   ├── emailService.js
    │   ├── paymentService.js
    │   ├── shippingService.js
    │   ├── cloudinaryService.js
    │   └── notificationService.js
    ├── utils/
    │   ├── apiResponse.js
    │   ├── asyncHandler.js
    │   ├── generateToken.js
    │   ├── generateOrderId.js
    │   └── calculateOrder.js
    └── validators/
        ├── authValidator.js
        ├── productValidator.js
        ├── addressValidator.js
        └── orderValidator.js
```

---

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Create or edit `.env` in the `backend/` folder:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/appecom_db

JWT_SECRET=supersecret_pan_india_appecom_jwt_key_2026
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=supersecret_pan_india_appecom_refresh_jwt_key_2026
JWT_REFRESH_EXPIRES_IN=7d

DEFAULT_TEST_OTP=123456
FREE_SHIPPING_THRESHOLD=499
STANDARD_SHIPPING_CHARGE=40
EXPRESS_SHIPPING_SURCHARGE=50
```

### 3. Seed Database with Initial Data
Seeds Admin, Sample Customer, Categories, Pan India Products, Coupons, and Addresses:
```bash
npm run seed
```

Default credentials seeded:
- **Admin**: `admin@appecom.in` / `AdminPassword@123`
- **Customer**: `rahul.sharma@example.in` / `CustomerPassword@123` (Phone: `9812345678`)
- **Active Coupons**: `WELCOME100`, `INDIA20`, `BIGSAVING`

### 4. Run Development Server
```bash
npm run dev
```
The server will start at `http://localhost:5000`.

---

## 🌐 API Endpoints Reference

All responses follow a consistent format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": { "page": 1, "limit": 20, "total": 45, "pages": 3 }
}
```

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register customer with name, email, phone, password | Public |
| `POST` | `/api/auth/login` | Login with email or phone + password | Public |
| `POST` | `/api/auth/send-otp` | Send 6-digit OTP to Indian mobile number | Public |
| `POST` | `/api/auth/verify-otp` | Verify OTP and authenticate | Public |
| `POST` | `/api/auth/refresh-token` | Exchange refresh token for new access token | Public |
| `POST` | `/api/auth/forgot-password` | Request password reset code via email | Public |
| `POST` | `/api/auth/reset-password` | Reset password using verified OTP | Public |
| `POST` | `/api/auth/logout` | Invalidate active refresh token | Bearer |
| `GET` | `/api/auth/me` | Fetch currently authenticated user | Bearer |

### 2. Pan India Delivery & PIN Code Services (`/api/delivery`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/delivery/check-pincode/:pinCode` | Check serviceability, shipping fee, transit days & COD | Public |
| `POST` | `/api/delivery/check-pincode` | Check serviceability with `orderAmount` in body | Public |
| `GET` | `/api/delivery/pincode-info/:pinCode` | Instant City & State lookup for 6-digit PIN code | Public |
| `GET` | `/api/delivery/track/:identifier` | Live shipment timeline & courier tracking | Public |

### 3. Products (`/api/products`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Paginated search, filters (`category`, `minPrice`, `brand`, etc.) | Public |
| `GET` | `/api/products/featured` | Featured products for home screen | Public |
| `GET` | `/api/products/trending` | Trending products for home screen | Public |
| `GET` | `/api/products/best-sellers` | Best seller products | Public |
| `GET` | `/api/products/new-arrivals` | New arrivals | Public |
| `GET` | `/api/products/special-offers` | Discounted products | Public |
| `GET` | `/api/products/:id` | Full product details with related products | Public |
| `POST` | `/api/products` | Create product (multipart with images) | Admin |
| `PUT` | `/api/products/:id` | Update product details | Admin |
| `DELETE` | `/api/products/:id` | Soft delete/deactivate product | Admin |

### 4. Categories (`/api/categories`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Get all active categories with subcategories | Public |
| `GET` | `/api/categories/:id` | Get category with product count | Public |
| `POST` | `/api/categories` | Create category (multipart icon/image) | Admin |
| `PUT` | `/api/categories/:id` | Update category details | Admin |
| `DELETE` | `/api/categories/:id` | Deactivate category | Admin |

### 5. Shopping Cart (`/api/cart`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cart` | Get cart items, dynamic pricing summary & applied coupon | Bearer |
| `POST` | `/api/cart/add` | Add product with quantity and variant | Bearer |
| `PUT` | `/api/cart/item/:itemId` | Update quantity of a cart item | Bearer |
| `DELETE` | `/api/cart/item/:itemId` | Remove item from cart | Bearer |
| `DELETE` | `/api/cart/clear` | Clear all items from cart | Bearer |
| `POST` | `/api/cart/apply-coupon` | Apply promo code to cart | Bearer |
| `DELETE` | `/api/cart/remove-coupon`| Remove applied promo code | Bearer |

### 6. Wishlist (`/api/wishlist`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/wishlist` | Get user's saved wishlist products | Bearer |
| `POST` | `/api/wishlist/add` | Add product to wishlist | Bearer |
| `DELETE` | `/api/wishlist/remove/:productId` | Remove product from wishlist | Bearer |
| `POST` | `/api/wishlist/toggle` | Toggle product in wishlist | Bearer |
| `POST` | `/api/wishlist/move-to-cart/:productId` | Move product from wishlist to cart | Bearer |

### 7. Delivery Addresses (`/api/addresses`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/addresses` | List all saved delivery addresses | Bearer |
| `POST` | `/api/addresses` | Add new Indian delivery address with PIN validation | Bearer |
| `PUT` | `/api/addresses/:id` | Update delivery address | Bearer |
| `DELETE` | `/api/addresses/:id` | Delete delivery address | Bearer |
| `PATCH` | `/api/addresses/:id/set-default` | Set address as default delivery destination | Bearer |

### 8. Orders (`/api/orders`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | Place order (calculates GST, shipping, stock deduction) | Bearer |
| `GET` | `/api/orders/my-orders` | Paginated customer orders | Bearer |
| `GET` | `/api/orders/:id` | Order details with delivery timeline | Bearer |
| `GET` | `/api/orders/:id/track`| Real-time courier tracking details | Bearer |
| `POST` | `/api/orders/:id/cancel`| Cancel unfulfilled order and restore stock | Bearer |
| `GET` | `/api/orders` | Admin orders listing with filters | Admin |
| `PATCH` | `/api/orders/:id/status`| Update status (`Shipped`, `Delivered`, etc.) & AWB | Admin |

### 9. Razorpay Payments (`/api/payments`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/payments/razorpay/order` | Initialize Razorpay payment order in paise | Bearer |
| `POST` | `/api/payments/razorpay/verify` | Verify cryptographic HMAC-SHA256 signature | Bearer |
| `GET` | `/api/payments/status/:orderId` | Check payment status | Bearer |
| `POST` | `/api/payments/razorpay/webhook`| Razorpay direct server webhook handler | Public |

### 10. Coupons, Reviews, Notifications & Returns
- **Coupons** (`/api/coupons`): `GET /`, `POST /validate`, `POST /` (Admin), `DELETE /:id` (Admin).
- **Reviews** (`/api/reviews`): `GET /product/:productId`, `POST /` (creates review with 1-5 rating & recalculates average product rating), `DELETE /:id`.
- **Notifications** (`/api/notifications`): `GET /`, `PATCH /mark-all-read`, `PATCH /:id/read`, `DELETE /:id`.
- **Returns** (`/api/returns`): `POST /` (requests return within 7-day window with reasons & pictures), `GET /my-returns`, `PATCH /:id/status` (Admin approval and refund).

---

## 🧪 Verification & Testing

To run the automated verification suite:
```bash
node tests/verify.js
```
Expected output:
```text
Testing modules loading...
✓ Configs loaded
✓ Utils loaded
✓ JWT Token generation & verification working
✓ Order ID generation working: BBIN-261031-XXXX
✓ PIN code lookup working: 110001 -> New Delhi, Delhi
✓ Pan India Serviceability check working: 560103 -> Free delivery: true
✓ All 12 Mongoose Models loaded without error
✓ All Middlewares loaded without error
✓ All Services loaded without error
✓ All 14 Controllers loaded without error
✓ Express Application and All 14 Route Groups initialized smoothly

======================================================
🎉 ALL BACKEND CODEBASE VERIFICATIONS PASSED (100%)
======================================================
```

