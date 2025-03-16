const redis = require('redis');
const { promisify } = require('util');

// Connect to Redis
const client = redis.createClient();
const setAsync = promisify(client.set).bind(client);
const existsAsync = promisify(client.exists).bind(client);
const quitAsync = promisify(client.quit).bind(client);

// Handle Redis connection errors
client.on('error', (err) => {
  console.error('Redis connection error:', err);
  process.exit(1);
});

// Initialize data when connected
client.on('connect', async () => {
  console.log('Connected to Redis');
  
  try {
    await initializeData();
    console.log('Data initialization completed successfully');
    await quitAsync();
  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }
});

async function initializeData() {
  try {
    // Check if data already exists
    const exists = await existsAsync('partners');
    if (exists) {
      console.log('Removing existing partner data...');
      await promisify(client.del).bind(client)('partners');
    }

    console.log('Initializing partner data...');
    
    // Generate partner data
    const partnerData = await generatePartnerData();
    
    // Save to Redis
    await setAsync('partners', JSON.stringify(partnerData));
    console.log('Partner data saved to Redis');
    
    return true;
  } catch (error) {
    console.error('Error initializing data:', error);
    throw error;
  }
}

async function generatePartnerData() {
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

// Run the initialization
console.log('Starting data initialization...'); 