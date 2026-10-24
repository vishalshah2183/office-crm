const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const errorHandler = require('./middlewares/errorMiddleware');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const roleRoutes = require('./routes/roleRoutes');
const fileRoutes = require('./routes/fileRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const fileQuotationRoutes = require('./routes/fileQuotationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const designFileRoutes = require('./routes/designFileRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Security & Parsing Middlewares
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'https://deepdesigning.vercel.app',
  'https://office-crm-six.vercel.app',
  (env.FRONTEND_URL || '').replace(/\/$/, '')
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests or tools like Postman/cURL with no origin
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, '');

      // Allow any .vercel.app preview deployment or matched configured origin
      if (cleanOrigin.endsWith('.vercel.app') || allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      return callback(new Error('Blocked by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/files/:fileId/quotations', fileQuotationRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/files/:fileId/payments', paymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', designFileRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
