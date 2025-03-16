// Simple script to start the backend server directly
const express = require('express');
const cors = require('cors');
const redis = require('redis');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Redis Client
const client = redis.createClient();

// Handle Redis connection errors
client.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access denied' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Create test users
client.on('connect', async () => {
  console.log('Connected to Redis');
  
  // Promisify Redis commands
  const setAsync = promisify(client.set).bind(client);
  
  // Create admin user
  await setAsync('user:admin@redis.com', JSON.stringify({
    email: 'admin@redis.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin'
  }));
  
  // Create regular user
  await setAsync('user:thomas.gregg@redis.com', JSON.stringify({
    email: 'thomas.gregg@redis.com',
    password: 'password123',
    name: 'Thomas Gregg',
    role: 'user'
  }));
  
  console.log('Test users created successfully');
  
  // Generate partner data
  const partnerData = generatePartnerData();
  await setAsync('partners', JSON.stringify(partnerData));
  console.log('Partner data created successfully');
});

// Login route
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Get user from Redis
    client.get(`user:${email}`, (err, userData) => {
      if (err) {
        console.error('Error fetching user data:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      
      if (!userData) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const user = JSON.parse(userData);
      
      // Check password
      if (user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      res.json({ token, user: { email: user.email, name: user.name, role: user.role } });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// API endpoint for partner data
app.get('/api/partners', authenticateToken, (req, res) => {
  try {
    client.get('partners', (err, partnersData) => {
      if (err) {
        console.error('Error fetching partners data:', err);
        return res.status(500).json({ message: 'Error fetching partners data' });
      }
      
      if (!partnersData) {
        return res.status(404).json({ message: 'No partner data found' });
      }
      
      res.json(JSON.parse(partnersData));
    });
  } catch (error) {
    console.error('Error fetching partners data:', error);
    res.status(500).json({ message: 'Error fetching partners data' });
  }
});

// Generate partner data function
function generatePartnerData() {
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  
  // Generate quarterly data for the last 4 quarters
  const partnerData = {
    historicalData: [],
    currentDeals: []
  };
  
  // Partner categories
  const categories = ['Hyperscaler', 'GSI', 'Local SI'];
  
  // Generate data for last 4 quarters
  for (let q = 1; q <= 4; q++) {
    const year = q < 3 ? currentYear : lastYear;
    const quarter = q < 3 ? q : q + 2; // Q1, Q2 of current year and Q3, Q4 of last year
    
    // For each partner category
    categories.forEach(category => {
      // Generate realistic revenue values
      let baseRevenue;
      if (category === 'Hyperscaler') {
        baseRevenue = 1000000 + Math.random() * 500000;
      } else if (category === 'GSI') {
        baseRevenue = 800000 + Math.random() * 400000;
      } else {
        baseRevenue = 600000 + Math.random() * 300000;
      }
      
      // Add some quarterly growth
      const quarterMultiplier = 1 + (q * 0.05);
      const revenue = Math.floor(baseRevenue * quarterMultiplier);
      
      // Generate deal count
      const dealCount = Math.floor(5 + Math.random() * 10);
      
      // Generate sourced leads
      const sourcedLeads = Math.floor(10 + Math.random() * 20);
      
      partnerData.historicalData.push({
        category,
        year,
        quarter: `Q${quarter}`,
        dealCount,
        revenue,
        sourcedLeads
      });
    });
  }
  
  // Generate some current deals
  const companies = ['Acme Corp', 'Globex', 'Initech', 'Umbrella Corp', 'Stark Industries', 'Wayne Enterprises'];
  const partnerNames = ['AWS', 'Azure', 'GCP', 'Accenture', 'Deloitte', 'KPMG', 'Local Partner A', 'Local Partner B'];
  const statuses = ['Proposal', 'Negotiation', 'Closing', 'Technical Validation'];
  
  for (let i = 0; i < 10; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const partnerName = partnerNames[Math.floor(Math.random() * partnerNames.length)];
    
    // Determine category based on partner name
    let partnerCategory;
    if (['AWS', 'Azure', 'GCP'].includes(partnerName)) {
      partnerCategory = 'Hyperscaler';
    } else if (['Accenture', 'Deloitte', 'KPMG'].includes(partnerName)) {
      partnerCategory = 'GSI';
    } else {
      partnerCategory = 'Local SI';
    }
    
    const value = Math.floor(50000 + Math.random() * 200000);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const partnerSourced = Math.random() > 0.5;
    
    partnerData.currentDeals.push({
      id: `deal-${i + 1}`,
      company,
      partnerName,
      partnerCategory,
      value,
      status,
      partnerSourced
    });
  }
  
  return partnerData;
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`You can access the API at http://localhost:${PORT}`);
  console.log('Login credentials:');
  console.log('  - Email: thomas.gregg@redis.com / Password: password123');
  console.log('  - OR -');
  console.log('  - Email: admin@redis.com / Password: admin123');
}); 