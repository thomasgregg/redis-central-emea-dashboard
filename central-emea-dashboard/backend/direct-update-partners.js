const redis = require('redis');
const { promisify } = require('util');

async function updatePartnerData() {
    try {
        console.log('Connecting to Redis...');
        const client = redis.createClient();
        
        // Handle Redis connection errors
        client.on('error', (err) => {
            console.error('Redis connection error:', err);
            process.exit(1);
        });
        
        // Wait for connection
        client.on('connect', async () => {
            try {
                console.log('Connected to Redis');
                
                // Promisify Redis commands
                const setAsync = promisify(client.set).bind(client);
                const quitAsync = promisify(client.quit).bind(client);
                
                // Generate partner data
                console.log('Generating partner data...');
                const partnerData = generatePartnerData();
                
                // Save to Redis
                console.log('Saving partner data to Redis...');
                await setAsync('partners', JSON.stringify(partnerData));
                console.log('Partner data saved successfully');
                
                // Close the connection
                await quitAsync();
                console.log('Redis connection closed');
                process.exit(0);
            } catch (error) {
                console.error('Error in Redis operations:', error);
                process.exit(1);
            }
        });
    } catch (error) {
        console.error('Error updating partner data:', error);
        process.exit(1);
    }
}

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

// Execute the update function
updatePartnerData(); 