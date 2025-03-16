import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Redis client setup
let redisClient = null;
const REDIS_DISABLED = process.env.REDIS_DISABLED === 'true';

if (!REDIS_DISABLED) {
  try {
    redisClient = createClient({
      url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      socket: {
        connectTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || 5000),
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    redis: REDIS_DISABLED ? 'disabled' : (redisClient?.isOpen ? 'connected' : 'disconnected') 
  });
});

// Authentication route
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  // Check if email is from Redis domain
  if (!email.includes('@redis.com')) {
    return res.status(401).json({ message: 'Please use a Redis email address' });
  }
  
  // In a real app, you would validate against a database
  // For now, we'll just create a token for any Redis email
  const token = jwt.sign(
    { email, name: email.split('@')[0] },
    process.env.JWT_SECRET || 'central-emea-dashboard-secret',
    { expiresIn: '24h' }
  );
  
  res.json({
    token,
    user: {
      email,
      name: email.split('@')[0]
    }
  });
});

// Dashboard stats route
app.get('/api/dashboard/stats', (req, res) => {
  // Mock data
  const stats = {
    events: 42,
    campaigns: 18,
    leads: 156,
    pipeline: '€2.4M'
  };
  
  res.json(stats);
});

// Events route
app.get('/api/events', (req, res) => {
  // Mock data
  const events = [
    {
      id: 1,
      name: 'Redis Day London',
      date: '2023-06-15',
      location: 'London, UK',
      attendees: 250,
      leads: 45
    },
    {
      id: 2,
      name: 'Redis Day Paris',
      date: '2023-07-20',
      location: 'Paris, France',
      attendees: 180,
      leads: 32
    },
    {
      id: 3,
      name: 'Redis Day Berlin',
      date: '2023-08-10',
      location: 'Berlin, Germany',
      attendees: 210,
      leads: 38
    }
  ];
  
  res.json(events);
});

// BDR Campaigns route
app.get('/api/campaigns', (req, res) => {
  // Mock data
  const campaigns = [
    {
      id: 1,
      name: 'Q2 Financial Services Campaign',
      startDate: '2023-04-01',
      endDate: '2023-06-30',
      target: 50,
      leads: 42,
      status: 'active'
    },
    {
      id: 2,
      name: 'Q2 Retail Campaign',
      startDate: '2023-04-15',
      endDate: '2023-06-30',
      target: 35,
      leads: 28,
      status: 'active'
    },
    {
      id: 3,
      name: 'Q3 Healthcare Campaign',
      startDate: '2023-07-01',
      endDate: '2023-09-30',
      target: 45,
      leads: 0,
      status: 'planned'
    }
  ];
  
  res.json(campaigns);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app; 