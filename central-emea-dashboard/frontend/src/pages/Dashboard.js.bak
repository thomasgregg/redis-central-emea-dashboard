import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// Default data in case API fails
const defaultData = {
  totalPipeline: 16223658,
  dealsClosedThisMonth: 14,
  revenueThisQuarter: 8750000,
  quarterlyQuota: 12000000,
  monthlyDealQuota: 20,
  monthlySales: [
    { month: 'Jan', value: 3200000 },
    { month: 'Feb', value: 4150000 },
    { month: 'Mar', value: 5720000 },
    { month: 'Apr', value: 4580000 },
    { month: 'May', value: 6950000 },
    { month: 'Jun', value: 7120000 }
  ]
};

const Dashboard = () => {
  const { fetchDataWithCache, backendReady } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    databaseConnected: false,
    totalPipeline: defaultData.totalPipeline,
    dealsClosedThisMonth: defaultData.dealsClosedThisMonth,
    revenueThisQuarter: defaultData.revenueThisQuarter,
    quarterlyQuota: defaultData.quarterlyQuota,
    monthlyDealQuota: defaultData.monthlyDealQuota,
    monthlySales: defaultData.monthlySales,
    pipelineByStage: {
      'Prospecting': 12000000,
      'Qualification': 9500000,
      'Proposal': 8500000,
      'Negotiation': 7500000,
      'Closed Won': 5250000
    },
    pipelineByCountry: {
      'Germany': 18000000,
      'Austria': 9500000,
      'Switzerland': 12000000,
      'Belgium': 7500000,
      'Netherlands': 8500000,
      'Luxembourg': 3500000
    }
  });
  const [pipelineChartData, setPipelineChartData] = useState([]);
  const [pipelineCountryData, setPipelineCountryData] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Try to fetch data from the API
        try {
          const data = await fetchDataWithCache('dashboard', 'dashboard');
          const eventsData = await fetchDataWithCache('events', 'events');
          
          // Process sales data for monthly trend
          let monthlySalesData = [];
          if (data.salesData && data.salesData.length > 0) {
            // Sort by year and month
            const sortedSalesData = [...data.salesData].sort((a, b) => {
              if (a.year !== b.year) return parseInt(a.year) - parseInt(b.year);
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              return months.indexOf(a.month) - months.indexOf(b.month);
            });
            
            // Get the last 6 months of data
            const recentSalesData = sortedSalesData.slice(-6);
            
            // Format for chart
            monthlySalesData = recentSalesData.map(item => ({
              month: item.month,
              value: parseFloat(item.revenue.replace('M', '')) * 1000000
            }));
          } else {
            monthlySalesData = defaultData.monthlySales;
          }
          
          // Process upcoming events
          const now = new Date();
          const filteredEvents = eventsData.filter(event => {
            const eventDate = new Date(event.startDate);
            return eventDate > now;
          }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).slice(0, 3);
          
          setUpcomingEvents(filteredEvents);
          
          // Process the data
          const processedData = {
            databaseConnected: backendReady,
            totalPipeline: calculateTotalPipeline(data.pipeline || []),
            dealsClosedThisMonth: countDealsClosedThisMonth(data.pipeline || []),
            revenueThisQuarter: calculateQuarterlyRevenue(data.pipeline || []),
            quarterlyQuota: 25000000, // Hardcoded quarterly quota
            monthlyDealQuota: 20, // Hardcoded monthly deal quota
            monthlySales: monthlySalesData,
            pipelineByStage: calculatePipelineByStage(data.pipeline || []),
            pipelineByCountry: calculatePipelineByCountry(data.pipeline || [])
          };
          
          setDashboardData(processedData);
        } catch (err) {
          console.error('Error fetching dashboard data:', err);
          
          // Use default data if API call fails
          setDashboardData({
            databaseConnected: false,
            totalPipeline: defaultData.totalPipeline,
            dealsClosedThisMonth: defaultData.dealsClosedThisMonth,
            revenueThisQuarter: defaultData.revenueThisQuarter,
            quarterlyQuota: defaultData.quarterlyQuota,
            monthlyDealQuota: defaultData.monthlyDealQuota,
            monthlySales: defaultData.monthlySales,
            pipelineByStage: {
              'Prospecting': 12000000,
              'Qualification': 9500000,
              'Proposal': 8500000,
              'Negotiation': 7500000,
              'Closed Won': 5250000
            },
            pipelineByCountry: {
              'Germany': 18000000,
              'Austria': 9500000,
              'Switzerland': 12000000,
              'Belgium': 7500000,
              'Netherlands': 8500000,
              'Luxembourg': 3500000
            }
          });
          
          // Set some default upcoming events
          setUpcomingEvents([
            {
              id: 1,
              name: 'Conference in Berlin',
              type: 'Conference',
              location: 'Berlin',
              startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              attendees: 75,
              status: 'Planned'
            },
            {
              id: 2,
              name: 'Webinar on Redis Enterprise',
              type: 'Webinar',
              location: 'Online',
              startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              attendees: 120,
              status: 'Planned'
            },
            {
              id: 3,
              name: 'Customer Meeting in Munich',
              type: 'Customer Meeting',
              location: 'Munich',
              startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              attendees: 8,
              status: 'Planned'
            }
          ]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error in dashboard data processing:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [fetchDataWithCache, backendReady]);

  // Calculate pipeline chart data whenever dashboardData changes
  useEffect(() => {
    // Process pipeline by stage data for the chart
    const chartData = Object.keys(dashboardData.pipelineByStage || {}).map(stage => ({
      name: stage,
      value: dashboardData.pipelineByStage[stage]
    }));
    setPipelineChartData(chartData);
    
    // Process pipeline by country data for the chart
    const countryData = Object.keys(dashboardData.pipelineByCountry || {}).map(country => ({
      name: country,
      value: dashboardData.pipelineByCountry[country]
    }));
    setPipelineCountryData(countryData);
  }, [dashboardData]);

  // Helper functions to calculate dashboard metrics
  const calculateTotalPipeline = (pipeline) => {
    if (!pipeline || pipeline.length === 0) return defaultData.totalPipeline;
    return pipeline.reduce((total, deal) => total + parseFloat(deal.value || 0), 0);
  };

  const countDealsClosedThisMonth = (pipeline) => {
    if (!pipeline || pipeline.length === 0) return defaultData.dealsClosedThisMonth;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return pipeline.filter(deal => {
      if (deal.stage !== 'Closed Won') return false;
      const closeDate = new Date(deal.expectedCloseDate);
      return closeDate.getMonth() === currentMonth && closeDate.getFullYear() === currentYear;
    }).length;
  };

  const calculateQuarterlyRevenue = (pipeline) => {
    if (!pipeline || pipeline.length === 0) return defaultData.revenueThisQuarter;
    const currentMonth = new Date().getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);
    const currentYear = new Date().getFullYear();
    
    return pipeline.filter(deal => {
      if (deal.stage !== 'Closed Won') return false;
      const closeDate = new Date(deal.expectedCloseDate);
      const dealQuarter = Math.floor(closeDate.getMonth() / 3);
      return dealQuarter === currentQuarter && closeDate.getFullYear() === currentYear;
    }).reduce((total, deal) => total + parseFloat(deal.value || 0), 0);
  };

  const calculatePipelineByStage = (pipeline) => {
    if (!pipeline || pipeline.length === 0) {
      return {
        'Prospecting': 12000000,
        'Qualification': 9500000,
        'Proposal': 8500000,
        'Negotiation': 7500000,
        'Closed Won': 5250000
      };
    }
    
    const stageData = {};
    
    pipeline.forEach(deal => {
      if (!stageData[deal.stage]) {
        stageData[deal.stage] = 0;
      }
      stageData[deal.stage] += parseFloat(deal.value || 0);
    });
    
    return stageData;
  };

  const calculatePipelineByCountry = (pipeline) => {
    if (!pipeline || pipeline.length === 0) {
      return {
        'Germany': 18000000,
        'Austria': 9500000,
        'Switzerland': 12000000,
        'Belgium': 7500000,
        'Netherlands': 8500000,
        'Luxembourg': 3500000
      };
    }
    
    const countryData = {};
    
    pipeline.forEach(deal => {
      if (!countryData[deal.country]) {
        countryData[deal.country] = 0;
      }
      countryData[deal.country] += parseFloat(deal.value || 0);
    });
    
    return countryData;
  };

  // Get stage color - consistent with Pipeline page
  const getStageColor = (stage) => {
    switch (stage) {
      case 'Prospecting': return '#3498DB';     // Light blue - beginning of the journey
      case 'Qualification': return '#F39C12';   // Orange - warming up
      case 'Proposal': return '#F1C40F';        // Yellow - getting closer
      case 'Negotiation': return '#E67E22';     // Dark orange - almost there
      case 'Closed Won': return '#2ECC71';      // Green - positive outcome
      case 'Closed Lost': return '#DC382C';     // Redis red - negative outcome
      default: return '#95A5A6';                // Gray for any other stages
    }
  };

  // Get event type color
  const getEventTypeColor = (type) => {
    switch (type) {
      case 'Conference': return '#3498DB';    // Light blue
      case 'Webinar': return '#F39C12';       // Orange
      case 'Customer Meeting': return '#F1C40F'; // Yellow
      case 'Partner Event': return '#E67E22'; // Dark orange
      case 'Workshop': return '#2ECC71';      // Green
      case 'Training': return '#DC382C';      // Redis red
      default: return '#95A5A6';              // Gray for any other types
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate percentage of quota achieved
  const calculateQuotaPercentage = (value, quota) => {
    if (!quota) return 0;
    return Math.round((value / quota) * 100);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value}%`;
  };

  // Get progress bar color based on percentage
  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'success.main';
    if (percentage >= 70) return 'info.main';
    if (percentage >= 40) return 'warning.main';
    return 'error.main';
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
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Overview
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Central EMEA region management overview
      </Typography>

      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Sales Summary */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main', height: '100%' }}>
            <CardHeader 
              title="Sales Summary" 
              sx={{ 
                '& .MuiCardHeader-title': { 
                  fontWeight: 600,
                  color: 'secondary.main'
                },
                py: 1
              }}
            />
            <Divider />
            <CardContent sx={{ py: 1.5 }}>
              <Stack spacing={2.5}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle1" color="text.secondary">Total Pipeline:</Typography>
                    <Typography variant="h4" fontWeight="bold">$16,223,658</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon color="success" />
                    <Typography variant="body2" color="success.main">
                      +12% from last quarter
                    </Typography>
                  </Box>
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle1" color="text.secondary">Deals Closed This Month:</Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h4" fontWeight="bold" color="success.main">14</Typography>
                      <Typography variant="body2" color="warning.main">
                        70% of quota
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mt: 0.5 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={70} 
                      color="warning"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle1" color="text.secondary">Revenue This Quarter:</Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h4" fontWeight="bold" color="success.main">$2,750,000</Typography>
                      <Typography variant="body2" color="warning.main">
                        73% of quota
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mt: 0.5 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={73} 
                      color="warning"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Monthly Trend */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main' }}>
            <CardHeader 
              title="Monthly Sales Trend" 
              sx={{ 
                '& .MuiCardHeader-title': { 
                  fontWeight: 600,
                  color: 'secondary.main'
                }
              }}
            />
            <Divider />
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dashboardData.monthlySales || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#3498DB" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Pipeline by Stage */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main' }}>
            <CardHeader 
              title="Pipeline by Stage" 
              sx={{ 
                '& .MuiCardHeader-title': { 
                  fontWeight: 600,
                  color: 'secondary.main'
                }
              }}
            />
            <Divider />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pipelineChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#95A5A6"
                    dataKey="value"
                  >
                    {pipelineChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStageColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Pipeline by Country */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main' }}>
            <CardHeader 
              title="Pipeline by Country" 
              sx={{ 
                '& .MuiCardHeader-title': { 
                  fontWeight: 600,
                  color: 'secondary.main'
                }
              }}
            />
            <Divider />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pipelineCountryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#95A5A6"
                    dataKey="value"
                  >
                    {pipelineCountryData.map((entry, index) => {
                      // Use a consistent color palette
                      const colors = ['#3498DB', '#F39C12', '#2ECC71', '#9B59B6', '#1ABC9C', '#E74C3C', '#34495E', '#D35400'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Upcoming Events */}
        <Grid item xs={12}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main' }}>
            <CardHeader 
              title="Upcoming Events" 
              sx={{ 
                '& .MuiCardHeader-title': { 
                  fontWeight: 600,
                  color: 'secondary.main'
                }
              }}
            />
            <Divider />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Event Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Attendees</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcomingEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={event.type}
                            size="small"
                            sx={{ bgcolor: getEventTypeColor(event.type), color: 'white' }}
                          />
                        </TableCell>
                        <TableCell>{event.location}</TableCell>
                        <TableCell>{formatDate(event.startDate)}</TableCell>
                        <TableCell>{event.attendees}</TableCell>
                        <TableCell>
                          <Chip
                            label={event.status}
                            size="small"
                            color={event.status === 'Planned' ? 'primary' : 'success'}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;