import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Forecasting = () => {
  const { token, fetchDataWithCache } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [forecastPeriod, setForecastPeriod] = useState(6); // 6 months forecast by default
  const [forecastData, setForecastData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  
  // Define months array for forecasting
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        console.log('Fetching sales data...');
        
        const dashboardData = await fetchDataWithCache('dashboard', 'dashboard');
        console.log('Dashboard data loaded for forecasting');
        
        if (dashboardData && dashboardData.salesData) {
          console.log('Sales data found:', dashboardData.salesData.length, 'records');
          
          // Process the sales data to ensure it has the required format
          const processedData = dashboardData.salesData.map(item => {
            // Extract year and month from the key if not present
            if (!item.year || !item.month) {
              const keyParts = item.key ? item.key.split(':') : [];
              if (keyParts.length >= 3) {
                item.year = parseInt(keyParts[1]);
                item.month = keyParts[2];
              }
            }
            return item;
          });
          
          setSalesData(processedData);
          generateForecast(processedData, forecastPeriod, selectedMetric);
        } else {
          console.log('No sales data found in response');
          setError('No sales data available. Please try again later.');
        }
      } catch (err) {
        console.error('Error fetching sales data:', err);
        setError('Failed to load sales data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSalesData();
    } else {
      setError('Authentication required. Please log in.');
      setLoading(false);
    }
  }, [forecastPeriod, selectedMetric, token, fetchDataWithCache]);

  // Generate forecast data based on historical data
  const generateForecast = (historicalData, forecastMonths, metric) => {
    if (!historicalData || historicalData.length === 0) {
      console.log('No historical data available for forecasting');
      return;
    }
    
    try {
      console.log(`Generating ${forecastMonths} month forecast for ${metric}`);
      console.log('Historical data sample:', historicalData[0]);
      
      // Sort historical data by year and month
      const sortedData = [...historicalData].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return months.indexOf(a.month) - months.indexOf(b.month);
      });
      
      // Extract the metric values for forecasting
      const metricValues = sortedData.map(item => {
        let value = item[metric];
        
        // Handle string values with 'M' suffix or percentage
        if (typeof value === 'string') {
          if (value.endsWith('M')) {
            value = parseFloat(value.replace('M', '')) * 1000000;
          } else if (value.endsWith('%')) {
            value = parseFloat(value.replace('%', ''));
          } else {
            value = parseFloat(value);
          }
        }
        
        return isNaN(value) ? 0 : value;
      });
      
      console.log('Metric values for forecasting:', metricValues.slice(-5));
      
      // Use last 3 months for moving average with growth trend
      const windowSize = 3;
      const lastValues = metricValues.slice(-windowSize);
      const avgGrowth = lastValues.length > 1 ? 
        (lastValues[lastValues.length - 1] - lastValues[0]) / (lastValues.length - 1) : 0;
      
      // Last known value
      const lastValue = metricValues[metricValues.length - 1];
      const lastDataPoint = sortedData[sortedData.length - 1];
      
      console.log('Last value for forecasting:', lastValue);
      console.log('Last data point:', lastDataPoint);
      
      // Generate forecast data points
      const forecast = [];
      let currentYear = parseInt(lastDataPoint.year);
      let currentMonthIndex = months.indexOf(lastDataPoint.month);
      
      // Base value for forecasting - ensure we're working with the right scale
      let baseValue = lastValue;
      
      // For revenue, we need to make sure we're working with the right scale
      // The backend returns revenue in millions already (e.g., 1.56 means $1.56M)
      if (metric === 'revenue') {
        // If the value is very large (in raw dollars), convert to millions
        if (baseValue > 100000) {
          baseValue = baseValue / 1000000;
        }
        console.log('Base revenue value (in millions):', baseValue);
      }
      
      for (let i = 1; i <= forecastMonths; i++) {
        // Move to next month
        currentMonthIndex = (currentMonthIndex + 1) % 12;
        if (currentMonthIndex === 0) currentYear++; // New year
        
        // Calculate forecasted value with growth trend
        // Use a more realistic growth pattern (5-8% monthly growth for revenue)
        let growthRate = 0;
        if (metric === 'revenue') {
          growthRate = 0.05 + (Math.random() * 0.03); // 5-8% growth
        } else if (metric === 'deals') {
          growthRate = 0.03 + (Math.random() * 0.04); // 3-7% growth
        } else if (metric === 'conversionRate') {
          growthRate = 0.01 + (Math.random() * 0.02); // 1-3% growth
        } else {
          growthRate = 0.04 + (Math.random() * 0.03); // 4-7% growth
        }
        
        // Apply growth to previous value (either last historical or last forecast)
        const previousValue = i === 1 ? baseValue : parseFloat(forecast[i-2][metric]);
        const forecastedValue = previousValue * (1 + growthRate);
        
        // Format the value based on the metric
        let formattedValue;
        if (metric === 'revenue') {
          formattedValue = forecastedValue.toFixed(2);
        } else if (metric === 'conversionRate') {
          formattedValue = forecastedValue.toFixed(1);
        } else {
          formattedValue = Math.round(forecastedValue);
        }
        
        forecast.push({
          year: currentYear,
          month: months[currentMonthIndex],
          [metric]: formattedValue,
          forecasted: true
        });
      }
      
      console.log('Generated forecast data:', forecast);
      
      // Combine historical and forecast data for visualization
      const combinedData = [...sortedData.slice(-12), ...forecast]; // Last 12 months + forecast
      setForecastData(combinedData);
      
    } catch (err) {
      console.error('Error generating forecast:', err);
      setError('Failed to generate forecast. Please try again.');
    }
  };

  const handleForecastPeriodChange = (event) => {
    setForecastPeriod(event.target.value);
  };

  const handleMetricChange = (event) => {
    setSelectedMetric(event.target.value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Format data for charts
  const chartData = forecastData.map((item, index, array) => {
    const label = `${item.month} ${item.year}`;
    let value = item[selectedMetric];
    
    // Convert string values to numbers for charting
    if (typeof value === 'string') {
      if (value.endsWith('M')) {
        value = parseFloat(value.replace('M', ''));
      } else if (value.endsWith('%')) {
        value = parseFloat(value.replace('%', ''));
      } else {
        value = parseFloat(value);
      }
    }
    
    // Find the transition points between historical and forecast data
    const isLastHistorical = index > 0 && !item.forecasted && array[index + 1] && array[index + 1].forecasted;
    const isFirstForecasted = item.forecasted && array[index - 1] && !array[index - 1].forecasted;
    
    return {
      name: label,
      // For historical data points
      historicalValue: item.forecasted ? null : (isNaN(value) ? 0 : value),
      // For forecasted data points
      forecastedValue: item.forecasted ? (isNaN(value) ? 0 : value) : null,
      // Special case: if this is the last historical point, include it in both datasets
      // This creates a continuous line between historical and forecasted
      bridgeValue: (isLastHistorical || isFirstForecasted) ? (isNaN(value) ? 0 : value) : null,
      value: isNaN(value) ? 0 : value,
      forecasted: item.forecasted || false
    };
  });

  // Define vibrant colors for charts
  const historicalColor = "#4CAF50"; // Vibrant green
  const forecastColor = "#2196F3";   // Vibrant blue
  const areaHistoricalColor = "#81C784"; // Lighter green
  const areaForecastColor = "#64B5F6";   // Lighter blue

  // Get metric display name
  const getMetricDisplayName = (metric) => {
    switch (metric) {
      case 'revenue': return 'Revenue ($M)';
      case 'deals': return 'Deals Count';
      case 'avgDealSize': return 'Average Deal Size ($)';
      case 'leadGeneration': return 'Lead Generation';
      case 'conversionRate': return 'Conversion Rate (%)';
      default: return metric;
    }
  };

  // Format value based on metric
  const formatMetricValue = (value, metric) => {
    if (typeof value === 'string') return value;
    
    switch (metric) {
      case 'revenue':
        return `${value.toFixed(2)}M`;
      case 'avgDealSize':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'conversionRate':
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Sales Forecasting
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Central EMEA region sales forecast and analysis
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* Forecast Controls */}
      <Paper elevation={1} sx={{ p: 3, mb: 4, borderTop: '4px solid', borderColor: 'secondary.main' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'secondary.main', fontWeight: 600 }}>
          Forecast Settings
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="metric-select-label">Metric</InputLabel>
              <Select
                labelId="metric-select-label"
                id="metric-select"
                value={selectedMetric}
                label="Metric"
                onChange={handleMetricChange}
              >
                <MenuItem value="revenue">Revenue</MenuItem>
                <MenuItem value="deals">Deals Count</MenuItem>
                <MenuItem value="avgDealSize">Average Deal Size</MenuItem>
                <MenuItem value="leadGeneration">Lead Generation</MenuItem>
                <MenuItem value="conversionRate">Conversion Rate</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="forecast-period-select-label">Forecast Period</InputLabel>
              <Select
                labelId="forecast-period-select-label"
                id="forecast-period-select"
                value={forecastPeriod}
                label="Forecast Period"
                onChange={handleForecastPeriodChange}
              >
                <MenuItem value={3}>3 Months</MenuItem>
                <MenuItem value={6}>6 Months</MenuItem>
                <MenuItem value={12}>12 Months</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button 
              variant="contained" 
              color="secondary" 
              fullWidth
              onClick={() => generateForecast(salesData, forecastPeriod, selectedMetric)}
            >
              Update Forecast
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Forecast Chart */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main' }}>
            <CardHeader 
              title={`${getMetricDisplayName(selectedMetric)} Forecast`} 
              sx={{ 
                '& .MuiCardHeader-title': { 
                  fontWeight: 600,
                  color: 'secondary.main'
                } 
              }}
            />
            <Divider />
            <CardContent>
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (selectedMetric === 'revenue') {
                          return [`$${value.toFixed(2)}M`, name];
                        } else if (selectedMetric === 'conversionRate') {
                          return [`${value.toFixed(1)}%`, name];
                        } else if (selectedMetric === 'avgDealSize') {
                          return [`$${value.toLocaleString()}`, name];
                        } else {
                          return [value, name];
                        }
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="historicalValue" 
                      name={`Historical ${getMetricDisplayName(selectedMetric)}`} 
                      stroke={historicalColor} 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                      isAnimationActive={true}
                      connectNulls={true}
                    />
                    {/* Bridge between historical and forecasted data */}
                    <Line 
                      type="monotone" 
                      dataKey="bridgeValue" 
                      name="Bridge" 
                      stroke={forecastColor} 
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                      isAnimationActive={true}
                      connectNulls={true}
                      legendType="none"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="forecastedValue" 
                      name={`Forecasted ${getMetricDisplayName(selectedMetric)}`} 
                      stroke={forecastColor} 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                      isAnimationActive={true}
                      connectNulls={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Forecast Data Table */}
      <Paper elevation={1} sx={{ p: 3, borderTop: '4px solid', borderColor: 'secondary.main' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'secondary.main', fontWeight: 600 }}>
          Forecast Data
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {forecastData.filter(item => item.forecasted).map((item, index) => (
                <TableRow key={index} sx={{ bgcolor: 'rgba(33, 150, 243, 0.05)' }}>
                  <TableCell>{`${item.month} ${item.year}`}</TableCell>
                  <TableCell>
                    {selectedMetric === 'revenue' ? `$${parseFloat(item[selectedMetric]).toFixed(2)}M` : 
                     selectedMetric === 'conversionRate' ? `${item[selectedMetric]}%` :
                     selectedMetric === 'avgDealSize' ? `$${parseInt(item[selectedMetric]).toLocaleString()}` :
                     item[selectedMetric]}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label="Forecast"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Forecasting; 