const axios = require('axios');

async function main() {
  try {
    console.log('Logging in to get token...');
    const loginResponse = await axios.post('http://localhost:5001/api/login', {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Successfully logged in and got token');
    
    console.log('Calling update-partner-data endpoint...');
    const response = await axios.post(
      'http://localhost:5001/api/update-partner-data',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log('Response:', response.data);
    console.log('Partner data updated successfully!');
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

main(); 