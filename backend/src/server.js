const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const { connectDB } = require('./config/db');
const { initSocket } = require('./sockets/socketManager');
const { startAdbReverseWatcher } = require('./utils/adbReverse');

// Middlewares
const { generalLimiter } = require('./middleware/rateLimitMiddleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

// Route modules (Customer app)
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const addressRoutes = require('./routes/addressRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const couponRoutes = require('./routes/couponRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const questionRoutes = require('./routes/questionRoutes');
const flashSaleRoutes = require('./routes/flashSaleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const returnRoutes = require('./routes/returnRoutes');

// Route module (Admin panel)
const adminRoutes = require('./routes/adminRoutes');

// Route module (Seller panel)
const sellerRoutes = require('./routes/sellerRoutes');

const app = express();
const httpServer = http.createServer(app);

// Initialize real-time Socket.IO
const io = initSocket(httpServer);

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, Vite dev)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate Limiting for general traffic
app.use('/api', generalLimiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static directory for uploaded media
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Appecom Backend API is running successfully!',
    status: 'OK',
    health: '/api/health',
    version: '2.0.0'
  });
});
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Pan India E-Commerce Backend API & Real-Time Socket Server',
    version: '2.0.0',
    environment: env.NODE_ENV,
    socketsActive: io ? io.engine?.clientsCount || 0 : 0,
  });
});

// Mount Customer API routes across both /api and /api/v1 prefixes
const mountCustomerRoutes = (prefix) => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/products`, productRoutes);
  app.use(`${prefix}/categories`, categoryRoutes);
  app.use(`${prefix}/cart`, cartRoutes);
  app.use(`${prefix}/wishlist`, wishlistRoutes);
  app.use(`${prefix}/addresses`, addressRoutes);
  app.use(`${prefix}/orders`, orderRoutes);
  app.use(`${prefix}/payments`, paymentRoutes);
  app.use(`${prefix}/coupons`, couponRoutes);
  app.use(`${prefix}/reviews`, reviewRoutes);
  app.use(`${prefix}/questions`, questionRoutes);
  app.use(`${prefix}/flash-sales`, flashSaleRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
  app.use(`${prefix}/delivery`, deliveryRoutes);
  app.use(`${prefix}/returns`, returnRoutes);
};

mountCustomerRoutes('/api');
mountCustomerRoutes('/api/v1');

// Mount Admin Panel API routes (supports both /api/v1/admin and /api/admin)
app.use('/api/v1/admin', adminRoutes);
app.use('/api/admin', adminRoutes);

// Mount Seller Panel API routes (supports both /api/v1/seller and /api/seller)
app.use('/api/v1/seller', sellerRoutes);
app.use('/api/seller', sellerRoutes);

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

// Start server
const PORT = env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(`🚀 Pan India E-Commerce API & Real-Time Socket Server`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🛡️  Admin API: http://localhost:${PORT}/api/v1/admin`);
      console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
      console.log(`⚡ Sockets: Enabled (Socket.IO)`);
      console.log(`⚙️  Environment: ${env.NODE_ENV}`);
      console.log(`=======================================================`);
      startAdbReverseWatcher();
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle process termination gracefully
const shutdown = () => {
  console.log('\nShutting down gracefully...');
  if (httpServer) {
    httpServer.close(() => {
      console.log('HTTP & Socket server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

// Global exception and rejection safeguards
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err.message, err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Rejection:', reason);
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

if (require.main === module) {
  startServer();
}

module.exports = { app, httpServer, startServer };
