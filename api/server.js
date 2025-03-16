// Import the original server.js file
const originalServer = require('../central-emea-dashboard/backend/server');

// Export a serverless function handler
module.exports = (req, res) => {
  // Forward the request to the original server
  return originalServer(req, res);
}; 