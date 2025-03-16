# Central EMEA Dashboard

A dashboard application for the Central EMEA region powered by Redis Cloud.

## Features

- Real-time sales and pipeline data visualization
- Marketing events management
- Territory mapping and analysis
- Partner relationship management
- MEDDPICC sales methodology tracking
- BDR campaign tracking

## Technology Stack

- **Frontend**: React, Material-UI, Recharts
- **Backend**: Node.js, Express
- **Database**: Redis Cloud
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Redis Cloud account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/redis-central-emea-dashboard.git
   cd redis-central-emea-dashboard
   ```

2. Install dependencies:
   ```
   # Install backend dependencies
   cd central-emea-dashboard/backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file in the backend directory with your Redis Cloud credentials

4. Start the application:
   ```
   # Start the backend server
   cd ../backend
   node server.js

   # Start the frontend server in a new terminal
   cd ../frontend
   npm start
   ```

5. Access the application at http://localhost:3000

## Deployment

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for instructions on deploying to Vercel.

## License

MIT 