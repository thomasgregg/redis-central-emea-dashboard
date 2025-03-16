// Import required packages
import express from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';

// Create Express app
const app = express();

// Debug logging
console.log('API server starting...');
console.log('Environment variables:', {
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  REDIS_USERNAME: process.env.REDIS_USERNAME,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD ? '***' : 'not set',
  JWT_SECRET: process.env.JWT_SECRET ? '***' : 'not set',
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  REDIS_TIMEOUT_ENABLED: process.env.REDIS_TIMEOUT_ENABLED,
  REDIS_CONNECTION_TIMEOUT: process.env.REDIS_CONNECTION_TIMEOUT,
  REDIS_DISABLED: process.env.REDIS_DISABLED
});

// Configure middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Check if Redis is disabled
const isRedisDisabled = process.env.REDIS_DISABLED === 'true';
if (isRedisDisabled) {
  console.log('Redis is disabled by environment variable. Using fallback data only.');
}

// Redis connection
let redisClient = null;
if (!isRedisDisabled) {
  console.log('Setting up Redis client...');
  try {
    // Get timeout from environment or use default
    const connectionTimeout = parseInt(process.env.REDIS_CONNECTION_TIMEOUT) || 10000;
    console.log(`Using Redis connection timeout: ${connectionTimeout}ms`);
    
    redisClient = createClient({
      url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      socket: {
        connectTimeout: connectionTimeout,
        reconnectStrategy: (retries) => {
          console.log(`Redis reconnect attempt ${retries}`);
          if (retries > 3) {
            console.log('Maximum Redis reconnection attempts reached');
            return new Error('Maximum Redis reconnection attempts reached');
          }
          return Math.min(retries * 1000, 3000);
        }
      }
    });
    console.log('Redis client created successfully');
    
    // Add event listeners for Redis client
    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });
    
    redisClient.on('connect', () => {
      console.log('Redis client connecting...');
    });
    
    redisClient.on('ready', () => {
      console.log('Redis client ready');
    });
    
    redisClient.on('end', () => {
      console.log('Redis connection ended');
    });
    
    redisClient.on('reconnecting', () => {
      console.log('Redis client reconnecting...');
    });
  } catch (error) {
    console.error('Error creating Redis client:', error);
  }

  // Connect to Redis with timeout protection
  (async () => {
    try {
      console.log('Attempting to connect to Redis...');
      
      // Get timeout from environment or use default
      const timeoutEnabled = process.env.REDIS_TIMEOUT_ENABLED === 'true';
      const timeoutDuration = parseInt(process.env.REDIS_CONNECTION_TIMEOUT) || 15000;
      
      if (timeoutEnabled) {
        console.log(`Redis connection timeout enabled: ${timeoutDuration}ms`);
        // Create a promise that rejects after timeout
        const connectWithTimeout = Promise.race([
          redisClient.connect(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Redis connection timeout after ${timeoutDuration}ms`)), timeoutDuration)
          )
        ]);
        
        await connectWithTimeout;
      } else {
        console.log('Redis connection timeout disabled');
        await redisClient.connect();
      }
      
      console.log('Connected to Redis successfully');
    } catch (err) {
      console.error('Redis connection error:', err);
      console.log('Will continue without Redis connection and use fallback data');
    }
  })();
} else {
  console.log('Skipping Redis client creation and connection');
}

// Add a simple root route for debugging
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    redis: redisClient?.isReady ? 'connected' : 'disconnected'
  });
});

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
    const isConnected = redisClient?.isReady || false;
    let pingResult = null;
    
    if (isConnected) {
      try {
        pingResult = await Promise.race([
          redisClient.ping(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Ping timeout')), 5000))
        ]);
      } catch (error) {
        console.error('Redis ping error:', error);
      }
    }
    
    res.json({
      status: 'ok',
      redis: isConnected && pingResult === 'PONG' ? 'connected' : 'disconnected',
      details: {
        serverRunning: true,
        redisConnected: isConnected,
        pingSuccess: pingResult === 'PONG',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
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
    console.log('Fetching events data...');
    let eventsData = null;
    
    // Try to get data from Redis if connected
    if (redisClient?.isReady) {
      try {
        const redisData = await Promise.race([
          redisClient.get('events'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Redis get timeout')), 5000))
        ]);
        
        if (redisData) {
          console.log('Retrieved events data from Redis');
          eventsData = JSON.parse(redisData);
        }
      } catch (error) {
        console.error('Error fetching from Redis:', error);
      }
    }
    
    // Generate sample data if none exists or Redis is not connected
    if (!eventsData) {
      console.log('Generating sample events data');
      eventsData = generateEventsData();
      
      // Try to store in Redis if connected
      if (redisClient?.isReady) {
        try {
          await redisClient.set('events', JSON.stringify(eventsData));
          console.log('Stored events data in Redis');
        } catch (error) {
          console.error('Error storing in Redis:', error);
        }
      }
    }
    
    res.json(eventsData);
  } catch (error) {
    console.error('Failed to fetch events:', error);
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
});

// Get BDR campaigns endpoint
app.get('/api/bdr-campaigns', verifyToken, async (req, res) => {
  try {
    console.log('Fetching BDR campaigns data...');
    let bdrData = null;
    
    // Try to get data from Redis if connected
    if (redisClient?.isReady) {
      try {
        const redisData = await Promise.race([
          redisClient.get('bdr-campaigns'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Redis get timeout')), 5000))
        ]);
        
        if (redisData) {
          console.log('Retrieved BDR campaigns data from Redis');
          bdrData = JSON.parse(redisData);
        }
      } catch (error) {
        console.error('Error fetching BDR campaigns from Redis:', error);
      }
    }
    
    // Generate sample data if none exists or Redis is not connected
    if (!bdrData) {
      console.log('Generating sample BDR campaigns data');
      bdrData = generateBdrCampaignsData();
      
      // Try to store in Redis if connected
      if (redisClient?.isReady) {
        try {
          await redisClient.set('bdr-campaigns', JSON.stringify(bdrData));
          console.log('Stored BDR campaigns data in Redis');
        } catch (error) {
          console.error('Error storing BDR campaigns in Redis:', error);
        }
      }
    }
    
    res.json(bdrData);
  } catch (error) {
    console.error('Failed to fetch BDR campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch BDR campaigns', details: error.message });
  }
});

// Get dashboard data endpoint
app.get('/api/dashboard', verifyToken, async (req, res) => {
  try {
    console.log('Fetching dashboard data...');
    let dashboardData = null;
    
    // Try to get data from Redis if connected
    if (redisClient?.isReady) {
      try {
        const redisData = await Promise.race([
          redisClient.get('dashboard'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Redis get timeout')), 5000))
        ]);
        
        if (redisData) {
          console.log('Retrieved dashboard data from Redis');
          dashboardData = JSON.parse(redisData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data from Redis:', error);
      }
    }
    
    // Generate sample data if none exists or Redis is not connected
    if (!dashboardData) {
      console.log('Generating sample dashboard data');
      dashboardData = generateDashboardData();
      
      // Try to store in Redis if connected
      if (redisClient?.isReady) {
        try {
          await redisClient.set('dashboard', JSON.stringify(dashboardData));
          console.log('Stored dashboard data in Redis');
        } catch (error) {
          console.error('Error storing dashboard data in Redis:', error);
        }
      }
    }
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data', details: error.message });
  }
});

// Add a debug endpoint
app.get('/api/debug', async (req, res) => {
  try {
    // Collect system information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL
    };

    // Collect Redis information
    let redisInfo = {
      clientCreated: !!redisClient,
      isReady: redisClient?.isReady || false,
      isOpen: redisClient?.isOpen || false
    };

    // Try to ping Redis if connected
    if (redisClient?.isReady) {
      try {
        const pingResult = await redisClient.ping();
        redisInfo.pingResult = pingResult;
      } catch (error) {
        redisInfo.pingError = error.message;
      }
    }

    // Return all debug information
    res.json({
      timestamp: new Date().toISOString(),
      system: systemInfo,
      redis: redisInfo,
      envVars: {
        REDIS_HOST: process.env.REDIS_HOST,
        REDIS_PORT: process.env.REDIS_PORT,
        REDIS_USERNAME: process.env.REDIS_USERNAME,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD ? '[REDACTED]' : undefined,
        JWT_SECRET: process.env.JWT_SECRET ? '[REDACTED]' : undefined,
        FRONTEND_URL: process.env.FRONTEND_URL
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: 'Debug endpoint error', details: error.message });
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
  console.log(`Handling ${req.method} request to ${req.url}`);
  
  // Add request timestamp for debugging
  req.requestTimestamp = Date.now();
  
  try {
    // Set a timeout for the entire request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout after 30 seconds'));
      }, 30000);
    });
    
    // Race between the actual request and the timeout
    await Promise.race([
      new Promise((resolve) => {
        app(req, res);
        // For API routes that don't end the response
        if (!res.headersSent) {
          resolve();
        }
      }),
      timeoutPromise
    ]);
    
    // Log request duration
    const duration = Date.now() - req.requestTimestamp;
    console.log(`Request to ${req.url} completed in ${duration}ms`);
    
  } catch (error) {
    console.error('Error handling request:', error);
    
    // Only send response if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal Server Error', 
        details: error.message,
        url: req.url,
        method: req.method
      });
    }
  }
} 