const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 8080;

// Proxy API requests to the backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5001',
  changeOrigin: true,
}));

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// For any other request, send the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
  console.log(`API requests will be forwarded to http://localhost:5001`);
  console.log('\nLogin with:');
  console.log('Email: thomas.gregg@redis.com');
  console.log('Password: password123');
}); 