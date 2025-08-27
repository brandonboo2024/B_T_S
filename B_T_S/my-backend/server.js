// server.js
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'B_T_S Backend API is running!',
    status: 'success',
    timestamp: new Date().toISOString(),
    endpoints: {
      test: '/api/test',
      data: '/api/data'
    }
  });
});

// API routes
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'API connection successful!',
    timestamp: new Date().toISOString()
  });
});

// Example POST route
app.post('/api/data', (req, res) => {
  const { data } = req.body;
  
  res.json({
    success: true,
    message: 'Data received',
    received: data,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
  console.log(`Access from other devices: http://[YOUR-IP]:${port}`);
});

// Error handling
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection:', err.message);
});

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err.message);
  process.exit(1);
});