# Central EMEA Go-to-Market Dashboard

## Overview

This application is a comprehensive dashboard for managing Central EMEA go-to-market activities, powered by Redis Cloud. It provides a modern, interactive interface for sales leaders to track performance, manage pipeline, monitor events, and forecast future results.

## Technical Stack

- **Frontend**: React, Material UI, Recharts for data visualization
- **Backend**: Node.js, Express
- **Database**: Redis Cloud
- **Authentication**: JWT-based authentication

## Key Features

### 1. Dashboard Overview
- Quarterly performance metrics (revenue, new customers, expansions, renewals)
- Pipeline visualization by stage and country
- Upcoming events calendar
- Territory highlights

### 2. Pipeline Management
- Comprehensive view of all deals in the pipeline
- Visualization of pipeline by stage and value
- Detailed deal information including probability and expected close dates

### 3. Event Management
- Calendar of upcoming and past events
- Event analytics by type and location
- Budget and attendance tracking

### 4. Territory Management
- Market size and penetration analysis by country
- Competitor tracking
- Growth rate visualization
- Sales rep assignment

### 5. Sales Forecasting
- AI-powered sales prediction based on historical data
- Customizable forecast periods
- Multiple metrics forecasting (revenue, deals, conversion rates)
- Forecast visualization and data tables

## Redis Cloud Integration

The application leverages Redis Cloud for:

1. **Fast Data Access**: All dashboard data is stored in Redis for lightning-fast retrieval
2. **Real-time Updates**: Changes to pipeline, events, or territories are immediately reflected
3. **Data Structures**: Uses Redis hashes for storing structured data about deals, events, and territories
4. **Key-based Organization**: Data is organized with meaningful key patterns for easy retrieval

## User Experience

- **Personalized**: Dashboard is personalized for Thomas Gregg, Regional Director for Central EMEA
- **Responsive Design**: Works on desktop and mobile devices
- **Interactive Charts**: All visualizations are interactive with tooltips and filters
- **Modern UI**: Clean, professional interface using Material UI components

## Getting Started

1. Clone the repository
2. Install dependencies for both frontend and backend
3. Configure Redis Cloud connection in the `.env` file
4. Run the application using the provided start script:
   ```
   ./start.sh
   ```
5. Access the dashboard at http://localhost:3000
6. Login with:
   - Email: thomas.gregg@redis.com
   - Password: password123

## Future Enhancements

1. **Advanced Analytics**: Deeper insights with more advanced analytics
2. **Mobile App**: Native mobile application for on-the-go access
3. **Integration**: Connect with CRM systems like Salesforce
4. **Collaboration**: Add team collaboration features
5. **Notifications**: Real-time alerts for important changes in pipeline or events 