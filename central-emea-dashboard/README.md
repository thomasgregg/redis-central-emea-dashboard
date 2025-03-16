# Central EMEA Dashboard

A dashboard application for Redis, focusing on a go-to-market strategy in Central EMEA. The application features forecasting, event data, and achievements, built with React and Node.js.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Install dependencies for both frontend and backend:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

#### Option 1: Using the provided scripts

1. Start the backend server:
```bash
./start-backend.sh
```

2. In a new terminal, start the frontend server:
```bash
./start-frontend.sh
```

#### Option 2: Manual startup

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. In a new terminal, start the frontend server:
```bash
cd frontend
npm start
```

### Accessing the Application

Once both servers are running:

1. Open your browser and navigate to: http://localhost:3000
2. Log in with the following credentials:
   - Email: thomas.gregg@redis.com
   - Password: password123

## Troubleshooting

### No data appears in the application

If you're logged in but don't see any data:

1. Go to the Forecasting page
2. Click the "Set Debug Token" button in the debug section
3. The page will reload and should now display data

### Backend server fails to start with "address already in use" error

This means the backend server is already running. You can either:

1. Use the existing server instance
2. Kill the existing server process and start a new one:
```bash
# Find the process ID
ps aux | grep node | grep server

# Kill the process (replace XXXX with the actual process ID)
kill XXXX
```

## Features

- Authentication and user management
- Dashboard with key performance indicators
- Sales forecasting with predictive analytics
- Pipeline management
- Event tracking
- Territory management 