// Import required packages
import express from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';

// Create Express app
const app = express();

// Configure middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Redis connection
const redisClient = createClient({
  url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (err) {
    console.error('Redis connection error:', err);
  }
})();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, process.env.JWT_SECRET || 'central-emea-dashboard-secret', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = decoded;
    next();
  });
};

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const isConnected = redisClient.isReady;
    res.json({
      status: 'ok',
      redis: isConnected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed', details: error.message });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Simple authentication for demo purposes
  if (email === 'thomas.gregg@redis.com' && password === 'password123') {
    const token = jwt.sign({ email }, process.env.JWT_SECRET || 'central-emea-dashboard-secret', { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Get events endpoint
app.get('/api/events', verifyToken, async (req, res) => {
  try {
    // Check if events data exists in Redis
    const eventsData = await redisClient.get('events');
    
    if (eventsData) {
      return res.json(JSON.parse(eventsData));
    }
    
    // Generate sample data if none exists
    const sampleEvents = generateEventsData();
    
    // Store in Redis
    await redisClient.set('events', JSON.stringify(sampleEvents));
    
    res.json(sampleEvents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
});

// Get BDR campaigns endpoint
app.get('/api/bdr-campaigns', verifyToken, async (req, res) => {
  try {
    // Check if BDR campaigns data exists in Redis
    const bdrData = await redisClient.get('bdr-campaigns');
    
    if (bdrData) {
      return res.json(JSON.parse(bdrData));
    }
    
    // Generate sample data if none exists
    const sampleBdrCampaigns = generateBdrCampaignsData();
    
    // Store in Redis
    await redisClient.set('bdr-campaigns', JSON.stringify(sampleBdrCampaigns));
    
    res.json(sampleBdrCampaigns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch BDR campaigns', details: error.message });
  }
});

// Get dashboard data endpoint
app.get('/api/dashboard', verifyToken, async (req, res) => {
  try {
    // Check if dashboard data exists in Redis
    const dashboardData = await redisClient.get('dashboard');
    
    if (dashboardData) {
      return res.json(JSON.parse(dashboardData));
    }
    
    // Generate sample data if none exists
    const sampleDashboardData = generateDashboardData();
    
    // Store in Redis
    await redisClient.set('dashboard', JSON.stringify(sampleDashboardData));
    
    res.json(sampleDashboardData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data', details: error.message });
  }
});

// Helper function to generate sample events data
function generateEventsData() {
  const eventTypes = ['Conference', 'Webinar', 'Workshop', 'Partner Event', 'Customer Event'];
  const locations = ['Berlin', 'Frankfurt', 'Vienna', 'Zurich', 'Amsterdam', 'Rotterdam', 'Brussels', 'Luxembourg'];
  const statuses = ['Completed', 'Upcoming'];
  
  const events = [];
  
  for (let i = 1; i <= 10; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (i % 2 === 0 ? i * 5 : -i * 5)); // Some past, some future
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2);
    
    const status = i % 2 === 0 ? 'Upcoming' : 'Completed';
    
    events.push({
      id: i,
      name: i % 2 === 0 
        ? `DACH ${eventTypes[i % eventTypes.length]}` 
        : `Benelux ${eventTypes[i % eventTypes.length]}`,
      location: locations[i % locations.length],
      type: eventTypes[i % eventTypes.length],
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: status,
      budget: Math.floor(Math.random() * 50000) + 10000,
      attendees: Math.floor(Math.random() * 100) + 50,
      leadsGenerated: status === 'Completed' ? Math.floor(Math.random() * 30) + 10 : 0,
      description: `A ${eventTypes[i % eventTypes.length]} focused on Redis solutions for enterprise customers.`
    });
  }
  
  return events;
}

// Helper function to generate sample BDR campaigns data
function generateBdrCampaignsData() {
  const campaigns = [];
  const statuses = ['Completed', 'In Progress', 'Planned'];
  const targets = ['Enterprise', 'Mid-Market', 'SMB', 'Financial Services', 'Healthcare'];
  const owners = ['Anna Schmidt', 'Thomas Weber', 'Julia Müller', 'Marc Dubois', 'Sophie Jansen'];
  
  for (let i = 1; i <= 8; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30 + i * 10);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 60);
    
    const status = statuses[i % statuses.length];
    const leadsTarget = Math.floor(Math.random() * 50) + 30;
    const leadsGenerated = status === 'Completed' 
      ? leadsTarget 
      : status === 'In Progress' 
        ? Math.floor(leadsTarget * (Math.random() * 0.7 + 0.1)) 
        : 0;
    
    campaigns.push({
      id: i,
      name: `${targets[i % targets.length]} ${i % 2 === 0 ? 'DACH' : 'Benelux'} Campaign`,
      target: targets[i % targets.length],
      status: status,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      owner: owners[i % owners.length],
      leadsTarget: leadsTarget,
      leadsGenerated: leadsGenerated,
      conversionRate: `${Math.floor(Math.random() * 30) + 10}%`
    });
  }
  
  return campaigns;
}

// Helper function to generate sample dashboard data
function generateDashboardData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const salesData = months.map((month, index) => {
    return {
      month,
      year: 2023,
      revenue: (Math.random() * 5 + 3).toFixed(2), // Revenue in millions
      deals: Math.floor(Math.random() * 15) + 5,
      leadGeneration: Math.floor(Math.random() * 100) + 50,
      conversionRate: (Math.random() * 0.2 + 0.1).toFixed(2)
    };
  });
  
  return {
    salesData
  };
}

// Export the serverless function handler
export default async function handler(req, res) {
  return app(req, res);
} 