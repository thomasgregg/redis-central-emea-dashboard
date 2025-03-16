const axios = require('axios');

// Function to login and get token
async function login() {
    try {
        const response = await axios.post('http://localhost:5001/api/login', {
            email: 'thomas.gregg@redis.com',
            password: 'password123'
        });
        
        return response.data.token;
    } catch (error) {
        console.error('Login failed:', error.message);
        throw error;
    }
}

// Function to update events with leads data
async function updateEventsWithLeads(token) {
    try {
        const response = await axios.post(
            'http://localhost:5001/api/reset-events',
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        console.log('Events reset successfully');
        return response.data;
    } catch (error) {
        console.error('Update failed:', error.message);
        throw error;
    }
}

// Main function
async function main() {
    try {
        console.log('Logging in...');
        const token = await login();
        console.log('Login successful');
        
        console.log('Resetting events data...');
        await updateEventsWithLeads(token);
        console.log('Events data has been reset successfully');
    } catch (error) {
        console.error('Script failed:', error);
    }
}

// Run the script
main(); 