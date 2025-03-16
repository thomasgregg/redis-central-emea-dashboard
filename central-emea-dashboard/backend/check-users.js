require('dotenv').config();
const redis = require('redis');

// Create Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  legacyMode: true
});

// Connect to Redis
redisClient.connect().catch(console.error);

// Handle Redis errors
redisClient.on('error', (err) => {
  console.error('Redis Error:', err);
});

// Handle Redis connection
redisClient.on('connect', () => {
  console.log('Connected to Redis Cloud');
  checkUsers();
});

function checkUsers() {
  redisClient.keys('user:*', (err, keys) => {
    if (err) {
      console.error('Error getting user keys:', err);
      redisClient.quit();
      return;
    }
    
    console.log('User keys:', keys);
    
    if (keys.length === 0) {
      console.log('No users found. Creating a test user...');
      
      const testUser = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'admin'
      };
      
      redisClient.set('user:test@example.com', JSON.stringify(testUser), (err) => {
        if (err) {
          console.error('Error creating test user:', err);
        } else {
          console.log('Test user created successfully!');
        }
        
        // Now let's create partner data
        createPartnerData();
      });
    } else {
      // Get the first user
      redisClient.get(keys[0], (err, userData) => {
        if (err) {
          console.error('Error getting user data:', err);
        } else {
          console.log('User data:', userData);
        }
        
        // Now let's create partner data
        createPartnerData();
      });
    }
  });
}

function createPartnerData() {
  console.log('Generating partner data...');
  
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
      // Generate realistic revenue values (higher for Hyperscaler, medium for GSI, lower for Local SI)
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
      const revenue = (baseRevenue * quarterMultiplier).toFixed(2);
      
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
    
    const value = (50000 + Math.random() * 200000).toFixed(2);
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
  
  console.log('Saving partner data to Redis...');
  redisClient.set('partners', JSON.stringify(partnerData), (err, reply) => {
    if (err) {
      console.error('Error saving partner data:', err);
    } else {
      console.log('Partner data updated successfully!');
      console.log('Redis reply:', reply);
      
      // Verify the data was saved
      redisClient.get('partners', (err, savedData) => {
        if (err) {
          console.error('Error retrieving saved data:', err);
        } else {
          console.log('Saved data size:', savedData.length, 'bytes');
          console.log('Sample of saved data:', JSON.stringify(JSON.parse(savedData).historicalData.slice(0, 2), null, 2));
        }
        
        // Close Redis connection
        redisClient.quit((err) => {
          if (err) {
            console.error('Error closing Redis connection:', err);
          } else {
            console.log('Redis connection closed properly');
          }
          process.exit(0);
        });
      });
    }
  });
} 