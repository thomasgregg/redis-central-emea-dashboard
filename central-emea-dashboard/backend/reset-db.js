const axios = require('axios');

async function main() {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:5001/api/login', {
      email: 'thomas.gregg@redis.com',
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    console.log('Login successful');
    
    console.log('Resetting database...');
    const resetRes = await axios.post(
      'http://localhost:5001/api/reset-database',
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Reset database response:', resetRes.data);
    
    console.log('Updating events with leads data...');
    const updateRes = await axios.post(
      'http://localhost:5001/api/update-events-leads',
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Update events response:', updateRes.data);
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

main(); 