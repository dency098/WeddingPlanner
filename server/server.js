require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const venueRoutes = require('./src/routes/venueRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const vendorRoutes = require('./src/routes/vendorRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const cateringRoutes = require('./src/routes/cateringRoutes');
const cateringInquiryRoutes = require('./src/routes/cateringInquiryRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const portfolioRoutes = require('./src/routes/portfolioRoutes');
const decoratorRoutes = require('./src/routes/decoratorRoutes');
const decoratorEnquiryRoutes = require('./src/routes/decoratorEnquiryRoutes');
const venueEnquiryRoutes = require('./src/routes/venueEnquiryRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/venue-enquiries', venueEnquiryRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/catering', cateringRoutes);
app.use('/api/catering-inquiries', cateringInquiryRoutes);
app.use('/api/decorators', decoratorRoutes);
app.use('/api/decorator-enquiries', decoratorEnquiryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/portfolio', portfolioRoutes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
