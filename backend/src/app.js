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
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));
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
