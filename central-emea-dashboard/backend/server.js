import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

// Get current file and directory paths (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Configure CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Connect to Redis and start server
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Redis client setup
const client = createClient({
    url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    socket: {
        reconnectStrategy: (retries) => {
            console.log(`Attempting to reconnect to Redis (attempt ${retries + 1})`);
            return Math.min(retries * 100, 3000);
        }
    }
});

// Log Redis connection events
client.on('connect', () => {
    console.log('Redis client connecting...');
});

client.on('ready', () => {
    console.log('Redis client ready');
});

client.on('error', (err) => {
    console.error('Redis error:', err);
    console.error('Redis connection details:', {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        username: process.env.REDIS_USERNAME
    });
});

client.on('end', () => {
    console.log('Redis connection ended');
});

// Global cache object
const dataCache = {};

// Redis connection function
async function connectRedis() {
    try {
        console.log('Attempting to connect to Redis...');
        console.log('Redis URL:', `redis://${process.env.REDIS_USERNAME}:***@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
        
        await client.connect();
        console.log('Connected to Redis at', process.env.REDIS_HOST);
        
        // Test Redis connection
        const pingResult = await client.ping();
        console.log('Redis ping result:', pingResult);
        
        return true;
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

// Health check endpoint (public)
app.get('/api/health', async (req, res) => {
    try {
        const isConnected = client.isOpen;
        const pingResult = isConnected ? await client.ping() : null;
        
        res.json({
            status: 'ok',
            redis: isConnected && pingResult === 'PONG' ? 'connected' : 'disconnected',
            details: {
                connected: isConnected,
                ping: pingResult === 'PONG',
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                username: process.env.REDIS_USERNAME
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            redis: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', email);

    try {
        // Check if user exists and get user data
        const userData = await client.hGetAll(`user:${email}`);
        console.log('User data from Redis:', userData);

        if (!userData || Object.keys(userData).length === 0) {
            console.log('User not found:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        if (userData.password !== password) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { 
                email: userData.email,
                name: userData.name,
                role: userData.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('Login successful for user:', email);
        res.json({
            token,
            user: {
                email: userData.email,
                name: userData.name,
                role: userData.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Authentication middleware
function authenticateToken(req, res, next) {
    // Skip authentication for health check
    if (req.path === '/api/health') {
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Token verification failed:', err);
            return res.status(403).json({ message: 'Invalid token' });
        }
        
        console.log('Token verified for user:', user.email);
        req.user = user;
        next();
    });
}

// Protected routes - protect all /api/* routes except health and login
app.use('/api/*', (req, res, next) => {
    if (req.path === '/api/health' || req.path === '/api/login') {
        return next();
    }
    return authenticateToken(req, res, next);
});

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Start server
async function startServer() {
    try {
        await connectRedis();
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Redis connected at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
        });
        
        server.on('error', (error) => {
            console.error('Server error:', error);
            process.exit(1);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Function to store event data
async function storeEventData(key, data) {
    try {
        if (!client.isOpen) {
            throw new Error('Redis is not connected');
        }
        const jsonData = JSON.stringify(data);
        await client.set(key, jsonData);
        console.log(`Stored event ${key} successfully`);
    } catch (error) {
        console.error(`Error storing event ${key}:`, error);
        throw error;
    }
}

// Function to retrieve event data
async function getEventData(key) {
    try {
        if (!client.isOpen) {
            throw new Error('Redis is not connected');
        }
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Error retrieving event ${key}:`, error);
        throw error;
    }
}

// Sales data route
app.get('/api/sales', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching sales data...');
        
        // Check if we have sales data
        const hasData = await client.get('sales:data');
        if (!hasData) {
            console.log('No sales data found, generating sample data...');
            await generateSampleSalesData();
        }
        
        // Get all keys matching the sales:YEAR:MONTH pattern
        const keys = await client.keys('sales:*');
        const salesData = [];
        
        // Filter out the 'sales:data' key and process only year:month keys
        for (const key of keys) {
            if (key === 'sales:data') continue;
            
            const data = await client.hGetAll(key);
            if (data && Object.keys(data).length > 0) {
                salesData.push({
                    year: parseInt(data.year),
                    month: data.month,
                    quarter: data.quarter,
                    revenue: parseFloat(data.revenue),
                    deals: parseInt(data.deals),
                    avgDealSize: parseFloat(data.avgDealSize),
                    leadGeneration: parseInt(data.leadGeneration),
                    conversionRate: parseFloat(data.conversionRate),
                    isHistorical: data.isHistorical === 'true'
                });
            }
        }
        
        // Sort data chronologically
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        salesData.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return months.indexOf(a.month) - months.indexOf(b.month);
        });
        
        console.log(`Returning ${salesData.length} sales records`);
        res.json(salesData);
    } catch (error) {
        console.error('Error fetching sales data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Function to generate sample sales data
async function generateSampleSalesData() {
    const salesData = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate historical data for the last 24 months (2 years of historical data)
    for (let i = 23; i >= 0; i--) {  // Start from oldest to newest
        const date = new Date(currentYear, currentMonth - i, 1);
        const year = date.getFullYear();
        const monthIndex = date.getMonth();
        const month = months[monthIndex];
        
        // Generate realistic revenue that shows consistent growth
        // Start from 1.5M and grow to 4M over 24 months with some variation
        const progress = (24 - i) / 24;  // 0 to 1 as we move forward in time
        const baseRevenue = 1.5 + (progress * 2.5);  // Grows from 1.5M to 4M
        const variation = (Math.random() * 0.3) - 0.1;  // Random variation of -0.1M to +0.2M
        const revenue = Math.max(baseRevenue + variation, baseRevenue * 0.95);  // Ensure we don't drop too much
        
        // Calculate quarter (0-3)
        const quarter = Math.floor(monthIndex / 3);
        
        // Generate more deals and better conversion rates as time progresses
        const baseDeals = 10 + Math.floor(progress * 15);  // Deals grow from 10 to 25
        const deals = baseDeals + Math.floor(Math.random() * 5);
        
        // Conversion rate improves over time (10% to 25%)
        const baseConversion = 10 + (progress * 15);
        const conversionRate = baseConversion + (Math.random() * 5);
        
        const monthData = {
            year: year.toString(),
            month,
            quarter: `Q${quarter + 1}`,
            revenue: revenue.toFixed(2),
            deals: deals.toString(),
            avgDealSize: ((revenue * 1000000) / deals).toFixed(2),
            leadGeneration: Math.floor(80 + (progress * 40) + (Math.random() * 20)).toString(),  // Leads grow from 80 to 120
            conversionRate: conversionRate.toFixed(2),
            isHistorical: 'true'  // Mark as historical data
        };
        
        // Store in Redis
        const key = `sales:${year}:${month}`;
        await client.hSet(key, monthData);
        
        salesData.push({
            ...monthData,
            year: parseInt(monthData.year),
            revenue: parseFloat(monthData.revenue),
            deals: parseInt(monthData.deals),
            avgDealSize: parseFloat(monthData.avgDealSize),
            leadGeneration: parseInt(monthData.leadGeneration),
            conversionRate: parseFloat(monthData.conversionRate),
            isHistorical: true
        });
    }
    
    // Generate forecast data for the next months until September 2025
    // Use the average of the last 3 months as the baseline for forecasting
    const lastThreeMonths = salesData.slice(-3);
    const avgRevenue = lastThreeMonths.reduce((sum, month) => sum + parseFloat(month.revenue), 0) / 3;
    const avgDeals = Math.round(lastThreeMonths.reduce((sum, month) => sum + parseInt(month.deals), 0) / 3);
    const avgLeadGen = Math.round(lastThreeMonths.reduce((sum, month) => sum + parseInt(month.leadGeneration), 0) / 3);
    const avgConversion = lastThreeMonths.reduce((sum, month) => sum + parseFloat(month.conversionRate), 0) / 3;

    // Calculate months until September 2025
    const targetYear = 2025;
    const targetMonth = 8; // September (0-based)
    let monthsToForecast = ((targetYear - currentYear) * 12 + (targetMonth - currentMonth));
    if (monthsToForecast < 0) {
        monthsToForecast = 0;
    } else {
        monthsToForecast += 1;
    }

    // Mark the current month as the last historical month
    const lastHistoricalDate = new Date(currentYear, currentMonth, 1);

    for (let i = 1; i <= monthsToForecast; i++) {
        const date = new Date(currentYear, currentMonth + i, 1);
        const year = date.getFullYear();
        const monthIndex = date.getMonth();
        const month = months[monthIndex];
        const quarter = Math.floor(monthIndex / 3);
        
        // Add small random variations to the forecast with slight upward trend
        const monthProgress = i / monthsToForecast;
        const trendIncrease = 1 + (monthProgress * 0.2);
        const variation = (Math.random() * 0.1) - 0.05;
        const revenue = avgRevenue * (trendIncrease + variation);
        
        const isHistorical = date <= lastHistoricalDate;
        
        const monthData = {
            year: year.toString(),
            month,
            quarter: `Q${quarter + 1}`,
            revenue: revenue.toFixed(2),
            deals: (avgDeals + Math.floor(Math.random() * 5) - 2).toString(),
            avgDealSize: ((revenue * 1000000) / avgDeals).toFixed(2),
            leadGeneration: (avgLeadGen + Math.floor(Math.random() * 10) - 5).toString(),
            conversionRate: (avgConversion + (Math.random() * 2) - 1).toFixed(2),
            isHistorical: isHistorical.toString()
        };
        
        // Store in Redis
        const key = `sales:${year}:${month}`;
        await client.hSet(key, monthData);
        
        salesData.push({
            ...monthData,
            year: parseInt(monthData.year),
            revenue: parseFloat(monthData.revenue),
            deals: parseInt(monthData.deals),
            avgDealSize: parseFloat(monthData.avgDealSize),
            leadGeneration: parseInt(monthData.leadGeneration),
            conversionRate: parseFloat(monthData.conversionRate),
            isHistorical: isHistorical
        });
    }
    
    // Sort data chronologically
    salesData.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return months.indexOf(a.month) - months.indexOf(b.month);
    });
    
    // Mark that we have sales data
    await client.set('sales:data', 'true');
    
    return salesData;
}

// Function to generate sample MEDDPICC data
async function generateMeddpiccData() {
    const opportunities = [
        {
            name: 'BMW Group Data Platform Modernization (Germany)',
            value: 2850000,
            status: 'In Progress',
            nextSteps: 'Schedule technical deep-dive with architecture team'
        },
        {
            name: 'ING Bank Real-time Analytics (Netherlands)',
            value: 1950000,
            status: 'At Risk',
            nextSteps: 'Present TCO analysis to economic buyer'
        },
        {
            name: 'Novartis Healthcare Analytics (Switzerland)',
            value: 2250000,
            status: 'On Track',
            nextSteps: 'Complete security compliance review'
        },
        {
            name: 'Deutsche Telekom 5G Infrastructure (Germany)',
            value: 3150000,
            status: 'In Progress',
            nextSteps: 'Finalize PoC success criteria'
        },
        {
            name: 'Siemens IoT Platform Enhancement (Germany)',
            value: 2750000,
            status: 'On Track',
            nextSteps: 'Review implementation timeline with stakeholders'
        },
        {
            name: 'Philips Healthcare Cloud Migration (Netherlands)',
            value: 1850000,
            status: 'At Risk',
            nextSteps: 'Present reference architecture'
        },
        {
            name: 'SAP Enterprise Caching Solution (Germany)',
            value: 3350000,
            status: 'On Track',
            nextSteps: 'Validate performance requirements'
        },
        {
            name: 'ABB Industrial IoT Platform (Switzerland)',
            value: 2450000,
            status: 'In Progress',
            nextSteps: 'Schedule executive business review'
        },
        {
            name: 'Rabobank Financial Services Platform (Netherlands)',
            value: 2150000,
            status: 'On Track',
            nextSteps: 'Present TCO analysis to economic buyer'
        },
        {
            name: 'Lufthansa Systems Upgrade (Germany)',
            value: 1750000,
            status: 'At Risk',
            nextSteps: 'Complete security compliance review'
        },
        {
            name: 'BASF Digital Transformation (Germany)',
            value: 2950000,
            status: 'In Progress',
            nextSteps: 'Schedule technical deep-dive with architecture team'
        },
        {
            name: 'UBS Trading Platform (Switzerland)',
            value: 3250000,
            status: 'On Track',
            nextSteps: 'Validate performance requirements'
        }
    ];
    
    for (let i = 0; i < opportunities.length; i++) {
        const metricsScore = Math.floor(Math.random() * 3) + 3; // Score between 3-5 for enterprise deals
        const economicBuyerScore = Math.floor(Math.random() * 3) + 3;
        const decisionCriteriaScore = Math.floor(Math.random() * 3) + 3;
        const decisionProcessScore = Math.floor(Math.random() * 3) + 3;
        const paperProcessScore = Math.floor(Math.random() * 3) + 3;
        const implicitPainScore = Math.floor(Math.random() * 3) + 3;
        const championScore = Math.floor(Math.random() * 3) + 3;
        const competitionScore = Math.floor(Math.random() * 3) + 3;
        
        const totalScore = (
            metricsScore +
            economicBuyerScore +
            decisionCriteriaScore +
            decisionProcessScore +
            paperProcessScore +
            implicitPainScore +
            championScore +
            competitionScore
        );
        
        const data = {
            id: (i + 1).toString(),
            opportunity: opportunities[i].name,
            value: opportunities[i].value.toString(),
            metricsScore: metricsScore.toString(),
            economicBuyerIdentified: (Math.random() > 0.3).toString(),
            economicBuyerEngaged: (Math.random() > 0.4).toString(),
            economicBuyerScore: economicBuyerScore.toString(),
            decisionCriteriaDefined: (Math.random() > 0.3).toString(),
            decisionCriteriaDocumented: (Math.random() > 0.4).toString(),
            decisionCriteriaScore: decisionCriteriaScore.toString(),
            decisionProcessUnderstood: (Math.random() > 0.3).toString(),
            decisionProcessValidated: (Math.random() > 0.4).toString(),
            decisionProcessScore: decisionProcessScore.toString(),
            paperProcessIdentified: (Math.random() > 0.3).toString(),
            paperProcessValidated: (Math.random() > 0.4).toString(),
            paperProcessScore: paperProcessScore.toString(),
            implicitPainIdentified: (Math.random() > 0.3).toString(),
            implicitPainQuantified: (Math.random() > 0.4).toString(),
            implicitPainScore: implicitPainScore.toString(),
            championIdentified: (Math.random() > 0.3).toString(),
            championEngaged: (Math.random() > 0.4).toString(),
            championScore: championScore.toString(),
            competitionIdentified: (Math.random() > 0.3).toString(),
            competitionAnalyzed: (Math.random() > 0.4).toString(),
            competitionScore: competitionScore.toString(),
            totalScore: totalScore.toString(),
            status: opportunities[i].status,
            nextSteps: opportunities[i].nextSteps
        };
        
        // Store in Redis as hash
        await client.hSet(`meddpicc:${i + 1}`, data);
    }
    
    // Mark that we have MEDDPICC data
    await client.set('meddpicc:data', 'true');
}

// MEDDPICC data route
app.get('/api/meddpicc', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching MEDDPICC data...');
        
        // Check if we have MEDDPICC data
        const hasData = await client.get('meddpicc:data');
        if (!hasData) {
            console.log('No MEDDPICC data found, generating sample data...');
            await generateMeddpiccData();
        }
        
        // Get all MEDDPICC records
        const meddpiccData = [];
        for (let i = 1; i <= 12; i++) {
            const data = await client.hGetAll(`meddpicc:${i}`);
            if (data && Object.keys(data).length > 0) {
                meddpiccData.push({
                    id: data.id,
                    opportunity: data.opportunity,
                    metrics: {
                        value: parseInt(data.value),
                        score: parseInt(data.metricsScore)
                    },
                    economicBuyer: {
                        identified: data.economicBuyerIdentified === 'true',
                        engaged: data.economicBuyerEngaged === 'true',
                        score: parseInt(data.economicBuyerScore)
                    },
                    decisionCriteria: {
                        defined: data.decisionCriteriaDefined === 'true',
                        documented: data.decisionCriteriaDocumented === 'true',
                        score: parseInt(data.decisionCriteriaScore)
                    },
                    decisionProcess: {
                        understood: data.decisionProcessUnderstood === 'true',
                        validated: data.decisionProcessValidated === 'true',
                        score: parseInt(data.decisionProcessScore)
                    },
                    paperProcess: {
                        identified: data.paperProcessIdentified === 'true',
                        validated: data.paperProcessValidated === 'true',
                        score: parseInt(data.paperProcessScore)
                    },
                    implicitPain: {
                        identified: data.implicitPainIdentified === 'true',
                        quantified: data.implicitPainQuantified === 'true',
                        score: parseInt(data.implicitPainScore)
                    },
                    champion: {
                        identified: data.championIdentified === 'true',
                        engaged: data.championEngaged === 'true',
                        score: parseInt(data.championScore)
                    },
                    competition: {
                        identified: data.competitionIdentified === 'true',
                        analyzed: data.competitionAnalyzed === 'true',
                        score: parseInt(data.competitionScore)
                    },
                    totalScore: parseInt(data.totalScore),
                    status: data.status,
                    nextSteps: data.nextSteps
                });
            }
        }
        
        console.log(`Returning ${meddpiccData.length} MEDDPICC records`);
        res.json(meddpiccData);
    } catch (error) {
        console.error('Error fetching MEDDPICC data:', error);
        res.status(500).json({ error: 'Failed to fetch MEDDPICC data' });
    }
});

// Partners data route
app.get('/api/partners', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching partners data...');
        
        // Check if we have partners data
        const hasData = await client.get('partners:data');
        if (!hasData) {
            console.log('No partners data found, generating sample data...');
            await generatePartnersData();
        }
        
        // Get partners data
        const partnersData = await client.get('partners');
        if (!partnersData) {
            console.log('No partners data found after generation attempt');
            return res.status(404).json({ message: 'No partners data found' });
        }
        
        console.log('Returning partners data');
        res.json(JSON.parse(partnersData));
    } catch (error) {
        console.error('Error fetching partners data:', error);
        res.status(500).json({ error: 'Failed to fetch partners data' });
    }
});

// Function to generate partners data
async function generatePartnersData() {
    const partnerData = {
        historicalData: [],
        currentDeals: []
    };
    
    // Partner categories
    const categories = ['Hyperscaler', 'GSI', 'Local SI'];
    
    // Generate historical data for the last 8 quarters
    for (let i = 0; i < 8; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - (i * 3));
        const year = date.getFullYear();
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        
        // For each partner category
        for (const category of categories) {
            // Generate realistic metrics
            const dealCount = Math.floor(Math.random() * 20) + 10;
            const revenue = (Math.random() * 2 + 0.5) * 1000000; // $500K to $2.5M
            const sourcedLeads = Math.floor(Math.random() * 30) + 20;
            
            partnerData.historicalData.push({
                year: year.toString(),
                quarter: `Q${quarter}`,
                category,
                dealCount: dealCount.toString(),
                revenue: revenue.toString(),
                sourcedLeads: sourcedLeads.toString()
            });
        }
    }
    
    // Generate current deals (15-25 deals)
    const dealCount = Math.floor(Math.random() * 10) + 15;
    const partnerNames = ['AWS', 'Azure', 'GCP', 'Accenture', 'Deloitte', 'KPMG', 'Local Partner A', 'Local Partner B'];
    const companyNames = ['BMW', 'Siemens', 'Deutsche Bank', 'Allianz', 'Bosch', 'Volkswagen', 'ABB', 'UBS', 'ING', 'Rabobank', 'Philips', 'BASF', 'Novartis', 'Lufthansa', 'SAP'];
    const regions = ['DACH', 'Benelux', 'DACH', 'DACH', 'DACH', 'DACH', 'DACH', 'DACH', 'Benelux', 'Benelux', 'Benelux', 'DACH', 'DACH', 'DACH', 'DACH'];
    const stages = ['Discovery', 'Qualification', 'Solution', 'Proposal', 'Negotiation', 'Closed Won'];
    
    // Create an array of deals first so we can control exactly how many are partner sourced
    const deals = [];
    
    for (let i = 0; i < dealCount; i++) {
        // Random partner name
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
        
        // Random company and region
        const companyIndex = Math.floor(Math.random() * companyNames.length);
        const company = companyNames[companyIndex];
        const region = regions[companyIndex];
        
        // Random stage
        const stage = stages[Math.floor(Math.random() * stages.length)];
        
        // Random deal value between $100K and $1M
        const value = Math.floor(Math.random() * 900000 + 100000);
        
        deals.push({
            id: (i + 1).toString(),
            dealName: `${company} Data Platform`,
            company,
            region,
            partnerName,
            partnerCategory,
            value: value.toString(),
            stage
        });
    }
    
    // Shuffle the deals array
    for (let i = deals.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deals[i], deals[j]] = [deals[j], deals[i]];
    }
    
    // Make exactly half of the deals partner sourced
    const halfCount = Math.floor(deals.length / 2);
    
    for (let i = 0; i < deals.length; i++) {
        // First half will be partner sourced, second half will not
        const partnerSourced = i < halfCount;
        
        partnerData.currentDeals.push({
            ...deals[i],
            partnerSourced: partnerSourced.toString()
        });
    }
    
    // Store in Redis
    await client.set('partners', JSON.stringify(partnerData));
    
    // Mark that we have partners data
    await client.set('partners:data', 'true');
    
    return partnerData;
}

// Dashboard data route
app.get('/api/dashboard', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching dashboard data...');
        
        // Get sales data
        const salesData = await fetchSalesData();
        
        // Get the current quarter
        const currentDate = new Date();
        const currentQuarter = 'Q' + (Math.floor(currentDate.getMonth() / 3) + 1);
        const currentYear = currentDate.getFullYear();
        
        // Create dashboard data
        const dashboardData = {
            quarterlyPerformance: {
                targets: {
                    revenue: (Math.random() * 5 + 5).toFixed(2) + 'M',
                    newCustomers: Math.floor(Math.random() * 50 + 50),
                    expansions: Math.floor(Math.random() * 30 + 20),
                    renewals: Math.floor(Math.random() * 40 + 80) + '%'
                },
                actuals: {
                    revenue: (Math.random() * 5 + 4).toFixed(2) + 'M',
                    newCustomers: Math.floor(Math.random() * 50 + 40),
                    expansions: Math.floor(Math.random() * 30 + 15),
                    renewals: Math.floor(Math.random() * 40 + 75) + '%'
                }
            },
            salesData: salesData
        };
        
        console.log(`Returning dashboard data with ${salesData.length} sales records`);
        res.json(dashboardData);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

// Helper function to fetch sales data
async function fetchSalesData() {
    try {
        // Check if we have sales data
        const hasData = await client.get('sales:data');
        if (!hasData) {
            console.log('No sales data found, generating sample data...');
            await generateSampleSalesData();
        }
        
        // Get all keys matching the sales:YEAR:MONTH pattern
        const keys = await client.keys('sales:*');
        const salesData = [];
        
        // Filter out the 'sales:data' key and process only year:month keys
        for (const key of keys) {
            if (key === 'sales:data') continue;
            
            const data = await client.hGetAll(key);
            if (data && Object.keys(data).length > 0) {
                salesData.push({
                    year: parseInt(data.year),
                    month: data.month,
                    quarter: data.quarter,
                    revenue: parseFloat(data.revenue),
                    deals: parseInt(data.deals),
                    avgDealSize: parseFloat(data.avgDealSize),
                    leadGeneration: parseInt(data.leadGeneration),
                    conversionRate: parseFloat(data.conversionRate),
                    isHistorical: data.isHistorical === 'true'
                });
            }
        }
        
        // Sort data chronologically
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        salesData.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return months.indexOf(a.month) - months.indexOf(b.month);
        });
        
        console.log(`Fetched ${salesData.length} sales records`);
        return salesData;
    } catch (error) {
        console.error('Error fetching sales data:', error);
        throw error;
    }
}

// Territories data route
app.get('/api/territories', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching territories data...');
        
        // Check if we have territories data
        const hasData = await client.exists('territory:0');
        if (!hasData) {
            console.log('No territories data found, generating sample data...');
            await generateTerritoriesData();
        }
        
        // Get all territory keys from Redis
        const territoryKeys = await client.keys('territory:*');
        let territories = [];
        
        // Retrieve each territory's data
        for (const key of territoryKeys) {
            const territoryData = await client.hGetAll(key);
            if (Object.keys(territoryData).length > 0) {
                territories.push(territoryData);
            }
        }
        
        console.log(`Retrieved ${territories.length} territories from Redis`);
        res.json(territories);
    } catch (error) {
        console.error('Error fetching territories data:', error);
        res.status(500).json({ message: 'Error fetching territories data' });
    }
});

// Function to generate territories data
async function generateTerritoriesData() {
    try {
        console.log('Generating territories data...');
        
        const territories = [
            {
                name: 'DACH - Germany',
                marketSize: '€25M',
                penetration: '45%',
                growthRate: '18%',
                keyAccounts: '15',
                salesRep: 'Michael Weber',
                competitors: 'MongoDB, Couchbase, DataStax',
                competitorShare: '35%'
            },
            {
                name: 'DACH - Austria',
                marketSize: '€12M',
                penetration: '38%',
                growthRate: '22%',
                keyAccounts: '8',
                salesRep: 'Anna Schmidt',
                competitors: 'MongoDB, Couchbase',
                competitorShare: '42%'
            },
            {
                name: 'DACH - Switzerland',
                marketSize: '€18M',
                penetration: '42%',
                growthRate: '20%',
                keyAccounts: '12',
                salesRep: 'Thomas Müller',
                competitors: 'MongoDB, DataStax, Aerospike',
                competitorShare: '38%'
            },
            {
                name: 'Benelux - Netherlands',
                marketSize: '€20M',
                penetration: '40%',
                growthRate: '19%',
                keyAccounts: '10',
                salesRep: 'Jan van der Berg',
                competitors: 'MongoDB, Couchbase, MemSQL',
                competitorShare: '40%'
            },
            {
                name: 'Benelux - Belgium',
                marketSize: '€15M',
                penetration: '35%',
                growthRate: '21%',
                keyAccounts: '7',
                salesRep: 'Sophie Dubois',
                competitors: 'MongoDB, DataStax',
                competitorShare: '45%'
            },
            {
                name: 'Benelux - Luxembourg',
                marketSize: '€8M',
                penetration: '30%',
                growthRate: '25%',
                keyAccounts: '5',
                salesRep: 'Marc Hoffmann',
                competitors: 'MongoDB, Couchbase',
                competitorShare: '50%'
            }
        ];
        
        // Delete existing territory data
        const existingKeys = await client.keys('territory:*');
        if (existingKeys.length > 0) {
            await client.del(existingKeys);
        }
        
        // Store each territory in Redis
        for (let i = 0; i < territories.length; i++) {
            const territory = territories[i];
            await client.hSet(`territory:${i}`, territory);
        }
        
        console.log(`Stored ${territories.length} territories in Redis`);
        return territories;
    } catch (error) {
        console.error('Error generating territories data:', error);
        throw error;
    }
}

// Events data route
app.get('/api/events', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching events data...');
        
        // Check if we have events data
        const hasData = await client.exists('event:0');
        if (!hasData) {
            console.log('No events data found, generating sample data...');
            await generateEventsData();
        }
        
        // Get all event keys from Redis
        const eventKeys = await client.keys('event:*');
        let events = [];
        
        // Retrieve each event's data
        for (const key of eventKeys) {
            const data = await client.get(key);
            if (data) {
                events.push(JSON.parse(data));
            }
        }
        
        console.log(`Retrieved ${events.length} events from Redis`);
        res.json(events);
    } catch (error) {
        console.error('Error fetching events data:', error);
        res.status(500).json({ message: 'Error fetching events data' });
    }
});

// Function to generate events data
async function generateEventsData() {
    try {
        console.log('Generating events data...');
        
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        
        // Generate events for the current year with uneven distribution across locations
        const events = [
            {
                id: '1',
                name: 'DACH Redis Summit',
                location: 'Berlin, Germany',
                type: 'Conference',
                startDate: `${currentYear}-03-15`,
                endDate: `${currentYear}-03-17`,
                status: 'Completed',
                budget: 75000,
                description: 'Annual Redis conference for the DACH region featuring technical workshops and customer success stories.',
                leadsGenerated: 120
            },
            {
                id: '2',
                name: 'Benelux Tech Days',
                location: 'Amsterdam, Netherlands',
                type: 'Conference',
                startDate: `${currentYear}-05-10`,
                endDate: `${currentYear}-05-12`,
                status: 'Completed',
                budget: 65000,
                description: 'Technology conference showcasing Redis solutions for Benelux customers.',
                leadsGenerated: 95
            },
            {
                id: '3',
                name: 'Financial Services Roundtable',
                location: 'Frankfurt, Germany',
                type: 'Webinar',
                startDate: `${currentYear}-02-20`,
                endDate: `${currentYear}-02-20`,
                status: 'Completed',
                budget: 15000,
                description: 'Virtual roundtable discussion on Redis solutions for the financial services industry.',
                leadsGenerated: 45
            },
            {
                id: '4',
                name: 'Redis for Retail Workshop',
                location: 'Brussels, Belgium',
                type: 'Workshop',
                startDate: `${currentYear}-04-05`,
                endDate: `${currentYear}-04-06`,
                status: 'Completed',
                budget: 25000,
                description: 'Hands-on workshop for retail customers to learn about Redis implementations.',
                leadsGenerated: 35
            },
            {
                id: '5',
                name: 'Partner Enablement Day',
                location: 'Berlin, Germany',
                type: 'Partner Event',
                startDate: `${currentYear}-06-15`,
                endDate: `${currentYear}-06-16`,
                status: 'Completed',
                budget: 30000,
                description: 'Training and enablement event for Redis partners in the DACH region.',
                leadsGenerated: 0
            },
            {
                id: '6',
                name: 'Healthcare Innovation Summit',
                location: 'Zurich, Switzerland',
                type: 'Conference',
                startDate: `${currentYear}-07-20`,
                endDate: `${currentYear}-07-22`,
                status: 'Upcoming',
                budget: 70000,
                description: 'Conference focused on Redis solutions for healthcare and life sciences.',
                leadsGenerated: 0
            },
            {
                id: '7',
                name: 'Redis Enterprise Webinar',
                location: 'Virtual',
                type: 'Webinar',
                startDate: `${currentYear}-08-10`,
                endDate: `${currentYear}-08-10`,
                status: 'Upcoming',
                budget: 10000,
                description: 'Webinar showcasing Redis Enterprise features and customer success stories.',
                leadsGenerated: 0
            },
            {
                id: '8',
                name: 'Manufacturing Tech Forum',
                location: 'Berlin, Germany',
                type: 'Workshop',
                startDate: `${currentYear}-09-05`,
                endDate: `${currentYear}-09-06`,
                status: 'Upcoming',
                budget: 35000,
                description: 'Technical forum for manufacturing customers to learn about Redis implementations.',
                leadsGenerated: 0
            },
            {
                id: '9',
                name: 'Benelux Partner Summit',
                location: 'Amsterdam, Netherlands',
                type: 'Partner Event',
                startDate: `${currentYear}-10-12`,
                endDate: `${currentYear}-10-13`,
                status: 'Upcoming',
                budget: 40000,
                description: 'Summit for Redis partners in the Benelux region to discuss strategy and enablement.',
                leadsGenerated: 0
            },
            {
                id: '10',
                name: 'DACH Customer Appreciation Day',
                location: 'Vienna, Austria',
                type: 'Customer Event',
                startDate: `${currentYear}-11-15`,
                endDate: `${currentYear}-11-15`,
                status: 'Upcoming',
                budget: 50000,
                description: 'Event to thank and recognize Redis customers in the DACH region.',
                leadsGenerated: 0
            },
            {
                id: '11',
                name: 'Redis Developer Workshop',
                location: 'Berlin, Germany',
                type: 'Workshop',
                startDate: `${currentYear}-04-25`,
                endDate: `${currentYear}-04-26`,
                status: 'Completed',
                budget: 28000,
                description: 'Hands-on workshop for developers to learn Redis implementation best practices.',
                leadsGenerated: 42
            },
            {
                id: '12',
                name: 'Enterprise Architecture Forum',
                location: 'Amsterdam, Netherlands',
                type: 'Conference',
                startDate: `${currentYear}-06-08`,
                endDate: `${currentYear}-06-09`,
                status: 'Completed',
                budget: 55000,
                description: 'Forum for enterprise architects to discuss Redis integration strategies.',
                leadsGenerated: 78
            },
            {
                id: '13',
                name: 'Redis Hackathon',
                location: 'Berlin, Germany',
                type: 'Workshop',
                startDate: `${currentYear}-08-20`,
                endDate: `${currentYear}-08-21`,
                status: 'Upcoming',
                budget: 22000,
                description: 'Coding competition for developers to build innovative solutions with Redis.',
                leadsGenerated: 0
            }
        ];
        
        // Delete existing event data
        const existingKeys = await client.keys('event:*');
        if (existingKeys.length > 0) {
            await client.del(existingKeys);
        }
        
        // Store each event in Redis
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            await storeEventData(`event:${i}`, event);
        }
        
        console.log(`Stored ${events.length} events in Redis`);
        return events;
    } catch (error) {
        console.error('Error generating events data:', error);
        throw error;
    }
}

// Reset events data endpoint (for development)
app.get('/api/reset-events', authenticateToken, async (req, res) => {
    try {
        console.log('Resetting events data...');
        
        // Delete existing event data
        const existingKeys = await client.keys('event:*');
        if (existingKeys.length > 0) {
            for (const key of existingKeys) {
                await client.del(key);
            }
        }
        
        // Generate new events data
        await generateEventsData();
        
        res.json({ message: 'Events data reset successfully' });
    } catch (error) {
        console.error('Error resetting events data:', error);
        res.status(500).json({ message: 'Error resetting events data' });
    }
});

// Pipeline data route
app.get('/api/pipeline', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching pipeline data...');
        
        // Check if we have pipeline data
        const hasData = await client.exists('pipeline:0');
        if (!hasData) {
            console.log('No pipeline data found, generating sample data...');
            await generatePipelineData();
        }
        
        // Get all pipeline keys from Redis
        const pipelineKeys = await client.keys('pipeline:*');
        let pipelineData = [];
        
        // Retrieve each pipeline entry's data
        for (const key of pipelineKeys) {
            const data = await client.hGetAll(key);
            if (Object.keys(data).length > 0) {
                // Convert numeric fields back to numbers
                pipelineData.push({
                    ...data,
                    value: parseFloat(data.value),
                    probability: parseInt(data.probability)
                });
            }
        }
        
        console.log(`Retrieved ${pipelineData.length} pipeline entries from Redis`);
        res.json(pipelineData);
    } catch (error) {
        console.error('Error fetching pipeline data:', error);
        res.status(500).json({ message: 'Error fetching pipeline data' });
    }
});

// Function to generate pipeline data
async function generatePipelineData() {
    try {
        console.log('Generating pipeline data...');
        
        // Enterprise companies by region with their use cases
        const companiesByRegion = {
            'DACH': {
                'Germany': [
                    {
                        name: 'Deutsche Bank AG',
                        useCase: 'Real-time Fraud Detection Platform'
                    },
                    {
                        name: 'SAP SE',
                        useCase: 'Enterprise Caching Solution'
                    },
                    {
                        name: 'BMW Group',
                        useCase: 'IoT Data Processing Platform'
                    },
                    {
                        name: 'Allianz SE',
                        useCase: 'Insurance Claims Processing System'
                    },
                    {
                        name: 'Deutsche Telekom',
                        useCase: 'Real-time Customer Data Platform'
                    }
                ],
                'Austria': [
                    {
                        name: 'Erste Group Bank',
                        useCase: 'Banking Analytics Platform'
                    },
                    {
                        name: 'OMV AG',
                        useCase: 'Energy Trading Platform'
                    },
                    {
                        name: 'Raiffeisen Bank',
                        useCase: 'Real-time Transaction Processing'
                    },
                    {
                        name: 'Voestalpine AG',
                        useCase: 'Manufacturing Analytics System'
                    }
                ],
                'Switzerland': [
                    {
                        name: 'UBS Group',
                        useCase: 'Wealth Management Platform'
                    },
                    {
                        name: 'Nestlé SA',
                        useCase: 'Supply Chain Optimization'
                    },
                    {
                        name: 'Roche Holding',
                        useCase: 'Clinical Data Platform'
                    },
                    {
                        name: 'Credit Suisse',
                        useCase: 'Trading Analytics System'
                    },
                    {
                        name: 'Swiss Re',
                        useCase: 'Risk Assessment Platform'
                    }
                ]
            },
            'Benelux': {
                'Netherlands': [
                    {
                        name: 'ING Group',
                        useCase: 'Digital Banking Platform'
                    },
                    {
                        name: 'ASML Holding',
                        useCase: 'Semiconductor Process Control'
                    },
                    {
                        name: 'Philips NV',
                        useCase: 'Healthcare Analytics Platform'
                    },
                    {
                        name: 'Ahold Delhaize',
                        useCase: 'Retail Analytics System'
                    },
                    {
                        name: 'ABN AMRO',
                        useCase: 'Financial Services Platform'
                    }
                ],
                'Belgium': [
                    {
                        name: 'KBC Group',
                        useCase: 'Banking and Insurance Platform'
                    },
                    {
                        name: 'Proximus',
                        useCase: 'Telecom Analytics System'
                    },
                    {
                        name: 'Solvay SA',
                        useCase: 'Chemical Process Optimization'
                    },
                    {
                        name: 'UCB SA',
                        useCase: 'Pharmaceutical Research Platform'
                    }
                ],
                'Luxembourg': [
                    {
                        name: 'ArcelorMittal',
                        useCase: 'Steel Production Optimization'
                    },
                    {
                        name: 'SES SA',
                        useCase: 'Satellite Communications Platform'
                    },
                    {
                        name: 'Banque Internationale Luxembourg',
                        useCase: 'Private Banking System'
                    }
                ]
            }
        };

        const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won'];
        const pipelineData = [];
        
        // Delete existing pipeline data
        const existingKeys = await client.keys('pipeline:*');
        if (existingKeys.length > 0) {
            for (const key of existingKeys) {
                await client.del(key);
            }
        }
        
        // Generate and store pipeline data
        let dealIndex = 0;
        
        // Use for...of loops instead of forEach for async/await
        for (const [region, countries] of Object.entries(companiesByRegion)) {
            for (const [country, companies] of Object.entries(countries)) {
                for (const company of companies) {
                    // Generate 1-2 deals per company with 70% probability
                    const numDeals = Math.random() < 0.7 ? Math.floor(Math.random() * 2) + 1 : 0;
                    
                    for (let i = 0; i < numDeals; i++) {
                        // Generate enterprise-level deal values (500K to 5M)
                        const value = Math.floor(500000 + Math.random() * 4500000);
                        
                        // Generate probability based on stage
                        const stageIndex = Math.floor(Math.random() * stages.length);
                        const stage = stages[stageIndex];
                        const baseProbability = (stageIndex + 1) * 20;
                        const probability = Math.min(Math.floor(baseProbability + (Math.random() * 10)), 95);
                        
                        // Generate expected close date within next 6 months
                        const expectedCloseDate = new Date();
                        expectedCloseDate.setDate(expectedCloseDate.getDate() + Math.floor(Math.random() * 180));
                        
                        const data = {
                            id: `opp-${dealIndex + 1}`,
                            company: company.name,
                            country: country,
                            region: region,
                            useCase: company.useCase,
                            value: value.toString(),
                            stage,
                            probability: probability.toString(),
                            expectedCloseDate: expectedCloseDate.toISOString(),
                            owner: 'Thomas Gregg',
                            product: Math.random() > 0.5 ? 'Redis Enterprise' : 'Redis Cloud'
                        };
                        
                        // Store in Redis
                        const key = `pipeline:${dealIndex}`;
                        await client.hSet(key, data);
                        pipelineData.push({
                            ...data,
                            value: parseFloat(data.value),
                            probability: parseInt(data.probability)
                        });
                        
                        dealIndex++;
                    }
                }
            }
        }
        
        console.log(`Stored ${pipelineData.length} pipeline entries in Redis`);
        return pipelineData;
    } catch (error) {
        console.error('Error generating pipeline data:', error);
        throw error;
    }
}

// Reset pipeline data endpoint (for development)
app.get('/api/reset-pipeline', authenticateToken, async (req, res) => {
    try {
        console.log('Resetting pipeline data...');
        
        // Delete existing pipeline data
        const existingKeys = await client.keys('pipeline:*');
        if (existingKeys.length > 0) {
            for (const key of existingKeys) {
                await client.del(key);
            }
        }
        
        // Generate new pipeline data
        await generatePipelineData();
        
        res.json({ message: 'Pipeline data reset successfully' });
    } catch (error) {
        console.error('Error resetting pipeline data:', error);
        res.status(500).json({ message: 'Error resetting pipeline data' });
    }
});

// Function to store BDR campaign data
async function storeBdrCampaignData(key, data) {
    try {
        if (!client.isOpen) {
            throw new Error('Redis is not connected');
        }
        const jsonData = JSON.stringify(data);
        await client.set(key, jsonData);
        console.log(`Stored BDR campaign ${key} successfully`);
    } catch (error) {
        console.error(`Error storing BDR campaign ${key}:`, error);
        throw error;
    }
}

// BDR Campaigns data route
app.get('/api/bdr-campaigns', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching BDR campaigns data...');
        
        // Check if we have BDR campaigns data
        const hasData = await client.exists('bdr-campaign:0');
        if (!hasData) {
            console.log('No BDR campaigns data found, generating sample data...');
            await generateBdrCampaignsData();
        }
        
        // Get all BDR campaign keys from Redis
        const campaignKeys = await client.keys('bdr-campaign:*');
        let campaigns = [];
        
        // Retrieve each campaign's data
        for (const key of campaignKeys) {
            const data = await client.get(key);
            if (data) {
                campaigns.push(JSON.parse(data));
            }
        }
        
        console.log(`Retrieved ${campaigns.length} BDR campaigns from Redis`);
        res.json(campaigns);
    } catch (error) {
        console.error('Error fetching BDR campaigns data:', error);
        res.status(500).json({ message: 'Error fetching BDR campaigns data' });
    }
});

// Function to generate BDR campaigns data
async function generateBdrCampaignsData() {
    try {
        console.log('Generating BDR campaigns data...');
        
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        
        // Generate BDR campaigns
        const campaigns = [
            {
                id: '1',
                name: 'HazelCast Replacement',
                target: 'Enterprise Java Applications',
                startDate: `${currentYear}-02-01`,
                endDate: `${currentYear}-04-30`,
                status: 'Completed',
                leadsTarget: 50,
                leadsGenerated: 62,
                conversionRate: '18%',
                owner: 'Sarah Johnson',
                description: 'Campaign targeting HazelCast users with Redis Enterprise as a superior alternative for caching and data grid.'
            },
            {
                id: '2',
                name: 'Cloud Cost Saving',
                target: 'Cloud-Native Applications',
                startDate: `${currentYear}-03-15`,
                endDate: `${currentYear}-06-15`,
                status: 'Completed',
                leadsTarget: 75,
                leadsGenerated: 68,
                conversionRate: '22%',
                owner: 'Michael Weber',
                description: 'Campaign focused on reducing cloud costs with Redis Enterprise Cloud for organizations using AWS, Azure, or GCP.'
            },
            {
                id: '3',
                name: 'Enterprise Wide Default DB',
                target: 'Fortune 500 Companies',
                startDate: `${currentYear}-05-01`,
                endDate: `${currentYear}-08-31`,
                status: 'In Progress',
                leadsTarget: 40,
                leadsGenerated: 28,
                conversionRate: '25%',
                owner: 'Anna Schmidt',
                description: 'Strategic campaign to position Redis as the default database solution across enterprise departments.'
            },
            {
                id: '4',
                name: 'Financial Services Modernization',
                target: 'Banking & Insurance',
                startDate: `${currentYear}-06-15`,
                endDate: `${currentYear}-09-15`,
                status: 'In Progress',
                leadsTarget: 35,
                leadsGenerated: 22,
                conversionRate: '20%',
                owner: 'Thomas Müller',
                description: 'Campaign targeting financial institutions looking to modernize their data infrastructure for real-time processing.'
            },
            {
                id: '5',
                name: 'Retail Peak Season Readiness',
                target: 'E-commerce & Retail',
                startDate: `${currentYear}-07-01`,
                endDate: `${currentYear}-10-31`,
                status: 'In Progress',
                leadsTarget: 45,
                leadsGenerated: 15,
                conversionRate: '13%',
                owner: 'Sophie Dubois',
                description: 'Campaign helping retailers prepare their infrastructure for peak shopping seasons with Redis.'
            },
            {
                id: '6',
                name: 'MongoDB Migration',
                target: 'MongoDB Users',
                startDate: `${currentYear}-09-01`,
                endDate: `${currentYear}-12-15`,
                status: 'Planned',
                leadsTarget: 60,
                leadsGenerated: 0,
                conversionRate: '0%',
                owner: 'Jan van der Berg',
                description: 'Campaign targeting MongoDB users facing scaling challenges or seeking better performance.'
            },
            {
                id: '7',
                name: 'AI/ML Data Infrastructure',
                target: 'AI/ML Teams',
                startDate: `${currentYear}-10-15`,
                endDate: `${currentYear+1}-01-31`,
                status: 'Planned',
                leadsTarget: 50,
                leadsGenerated: 0,
                conversionRate: '0%',
                owner: 'Marc Hoffmann',
                description: 'Campaign focused on Redis as the ideal data infrastructure for AI/ML applications requiring real-time data processing.'
            }
        ];
        
        // Delete existing BDR campaign data
        const existingKeys = await client.keys('bdr-campaign:*');
        if (existingKeys.length > 0) {
            for (const key of existingKeys) {
                await client.del(key);
            }
        }
        
        // Store each campaign in Redis
        for (let i = 0; i < campaigns.length; i++) {
            const campaign = campaigns[i];
            await storeBdrCampaignData(`bdr-campaign:${i}`, campaign);
        }
        
        console.log(`Stored ${campaigns.length} BDR campaigns in Redis`);
        return campaigns;
    } catch (error) {
        console.error('Error generating BDR campaigns data:', error);
        throw error;
    }
}

// Reset BDR campaigns data endpoint (for development)
app.get('/api/reset-bdr-campaigns', authenticateToken, async (req, res) => {
    try {
        console.log('Resetting BDR campaigns data...');
        
        // Delete existing BDR campaign data
        const existingKeys = await client.keys('bdr-campaign:*');
        if (existingKeys.length > 0) {
            for (const key of existingKeys) {
                await client.del(key);
            }
        }
        
        // Generate new BDR campaigns data
        await generateBdrCampaignsData();
        
        res.json({ message: 'BDR campaigns data reset successfully' });
    } catch (error) {
        console.error('Error resetting BDR campaigns data:', error);
        res.status(500).json({ message: 'Error resetting BDR campaigns data' });
    }
});

// For Vercel serverless functions
if (process.env.VERCEL) {
  // Export the Express app for serverless use
  export default app;
} else {
  // Start the server for local development
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Redis connected at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
  });
}