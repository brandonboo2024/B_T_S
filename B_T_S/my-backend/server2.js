// server.js
const express = require('express');
const cors = require('cors');
const { networkInterfaces } = require('os');

const app = express();
const port = process.env.PORT || 3001;

// Get local IP address dynamically
function getLocalIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000', 
    'http://localhost:5173',
    `http://${localIP}:3000`,
    `http://${localIP}:5173`
  ],
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
      data: '/api/data',
      health: '/api/health'
    },
    access_points: {
      local: `http://localhost:${port}`,
      network: `http://${localIP}:${port}`,
      your_ip: localIP
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'API connection successful!',
    client_ip: req.ip || req.connection.remoteAddress,
    server_ip: localIP,
    timestamp: new Date().toISOString()
  });
});

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'API test successful!',
    timestamp: new Date().toISOString(),
    client: req.ip || req.connection.remoteAddress
  });
});

// Example POST route
app.post('/api/data', (req, res) => {
  const { data } = req.body;
  
  if (!data) {
    return res.status(400).json({
      success: false,
      message: 'Data field is required',
      timestamp: new Date().toISOString()
    });
  }
  
  res.json({
    success: true,
    message: 'Data received successfully',
    received: data,
    timestamp: new Date().toISOString(),
    client_ip: req.ip || req.connection.remoteAddress
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    requested_url: req.originalUrl,
    available_endpoints: [
      '/',
      '/api/health',
      '/api/test',
      '/api/data'
    ],
    timestamp: new Date().toISOString()
  });
});

// Start server on all network interfaces
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running locally: http://localhost:${port}`);
  console.log(`📡 Internal network access: http://${localIP}:${port}`);
  console.log(`🌐 External access: http://[YOUR-PUBLIC-IP]:${port} (if port forwarded)`);
  console.log(`🔧 Health check: http://${localIP}:${port}/api/health`);
  console.log(`⚡ Test endpoint: http://${localIP}:${port}/api/test`);
  console.log('');
  console.log('📱 Other devices can connect using:');
  console.log(`   http://${localIP}:${port}`);
  console.log('');
  console.log('💡 Tip: Make sure Windows Firewall allows port', port);
});

// Error handling
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection:', err.message);
});

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err.message);
  process.exit(1);
});
