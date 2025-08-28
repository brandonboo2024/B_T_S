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

app.get('/api/feed', (req, res) => {
  const mockVideos = [
    { id: 1, author: '@johndoe', description: 'Check out this amazing dance! #viral #dance', likes: 15200, comments: 892, shares: 234 },
    { id: 2, author: '@janesmith', description: 'Cooking hack that will blow your mind #cooking #lifehack', likes: 8900, comments: 445, shares: 123 },
    { id: 3, author: '@bobjohnson', description: 'My cat does the funniest thing #cats #funny #pets', likes: 25600, comments: 1205, shares: 567 },
    { id: 4, author: '@coolcreator', description: 'This trend is taking over! #trending #viral', likes: 45300, comments: 2100, shares: 890 }
  ];
  
  res.json({
    success: true,
    data: mockVideos,
    timestamp: new Date().toISOString()
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