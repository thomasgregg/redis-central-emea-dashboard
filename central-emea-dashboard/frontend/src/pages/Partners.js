import React, { useState, useEffect } from 'react';
import { 
  Box,
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';

const Partners = () => {
  const { fetchDataWithCache } = useAuth();
  const [partnerData, setPartnerData] = useState({
    historicalData: [],
    currentDeals: []
  });
  const [processedData, setProcessedData] = useState({
    quarterlyData: [],
    categoryData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [usingSampleData, setUsingSampleData] = useState(false);

  useEffect(() => {
    const fetchPartnerData = async () => {
      try {
        const data = await fetchDataWithCache('partners', 'partners');
        if (data && data.historicalData && data.historicalData.length > 0) {
          // Convert partnerSourced from string to boolean
          if (data.currentDeals && Array.isArray(data.currentDeals)) {
            data.currentDeals = data.currentDeals.map(deal => ({
              ...deal,
              partnerSourced: deal.partnerSourced === 'true' || deal.partnerSourced === true
            }));
          }
          
          console.log('Partner data after conversion:', data.currentDeals);
          setPartnerData(data);
          setUsingSampleData(false);
        } else {
          console.log("No data returned from API, using sample data");
          const sampleData = generateSampleData();
          setPartnerData(sampleData);
          setUsingSampleData(true);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching partner data:", err);
        setError(err.message || 'Failed to fetch partner data');
        console.log("Error occurred, using sample data");
        const sampleData = generateSampleData();
        setPartnerData(sampleData);
        setUsingSampleData(true);
        setLoading(false);
      }
    };
    
    fetchPartnerData();
  }, [fetchDataWithCache]);

  useEffect(() => {
    if (!loading && partnerData) {
      try {
        setProcessedData({
          quarterlyData: processQuarterlyData(partnerData.historicalData || []),
          categoryData: processCategoryData(partnerData.historicalData || [])
        });
      } catch (err) {
        console.error("Error processing data:", err);
      }
    }
  }, [partnerData, loading]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Process historical data for charts
  const processQuarterlyData = (data) => {
    try {
      if (!data || !data.length || data.length === 0) {
        console.log("No historical data available for quarterly chart");
        return [];
      }

      // Get unique quarters
      const uniqueQuarters = [...new Set(data
        .filter(item => item && item.year && item.quarter)
        .map(item => `${item.year} ${item.quarter}`))];
      
      if (uniqueQuarters.length === 0) {
        console.log("No valid quarters found in data");
        return [];
      }
      
      // Sort quarters chronologically
      uniqueQuarters.sort((a, b) => {
        const [yearA, quarterA] = a.split(' ');
        const [yearB, quarterB] = b.split(' ');
        return yearA === yearB 
          ? quarterA.substring(1) - quarterB.substring(1) 
          : yearA - yearB;
      });
      
      // Take only the last 4 quarters
      const lastFourQuarters = uniqueQuarters.slice(-4);
      
      // Aggregate data by quarter
      const quarterlyData = lastFourQuarters.map(quarter => {
        const [year, q] = quarter.split(' ');
        const quarterItems = data.filter(
          item => item && item.year && item.quarter && `${item.year} ${item.quarter}` === quarter
        );
        
        const totalRevenue = quarterItems.reduce(
          (sum, item) => sum + (parseFloat(item.revenue || 0)), 
          0
        );
        
        return {
          quarter: `${q} ${year}`,
          actualRevenue: totalRevenue
        };
      });
      
      // Add 4 quarter projections with 10% growth each quarter
      const projections = [];
      let lastRevenue = quarterlyData.length > 0 
        ? quarterlyData[quarterlyData.length - 1].actualRevenue 
        : 1000000;
      
      if (lastFourQuarters.length > 0) {
        const lastQuarterInfo = lastFourQuarters[lastFourQuarters.length - 1].split(' ');
        let year = parseInt(lastQuarterInfo[0]);
        let quarter = parseInt(lastQuarterInfo[1].substring(1));
        
        for (let i = 1; i <= 4; i++) {
          quarter += 1;
          if (quarter > 4) {
            quarter = 1;
            year += 1;
          }
          
          lastRevenue = lastRevenue * 1.1; // 10% growth
          
          projections.push({
            quarter: `Q${quarter} ${year}`,
            projectedRevenue: lastRevenue
          });
        }
      }
      
      return [...quarterlyData, ...projections];
    } catch (error) {
      console.error("Error processing quarterly data:", error);
      return [];
    }
  };

  // Process category data for pie chart
  const processCategoryData = (data) => {
    try {
      if (!data || !data.length || data.length === 0) {
        console.log("No historical data available for category chart");
        return [];
      }
      
      // Get unique categories
      const categories = [...new Set(data
        .filter(item => item && item.category)
        .map(item => item.category))];
      
      if (categories.length === 0) {
        console.log("No valid categories found in data");
        return [];
      }
      
      // Calculate total revenue by category
      return categories.map(category => {
        const categoryItems = data.filter(
          item => item && item.category === category
        );
        
        const totalRevenue = categoryItems.reduce(
          (sum, item) => sum + (parseFloat(item.revenue || 0)), 
          0
        );
        
        return {
          name: category,
          value: totalRevenue
        };
      }).filter(item => item.value > 0); // Only include categories with revenue
    } catch (error) {
      console.error("Error processing category data:", error);
      return [];
    }
  };

  // Generate sample data if none is available
  const generateSampleData = () => {
    try {
      const currentYear = new Date().getFullYear();
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      const categories = ['Hyperscaler', 'GSI', 'Local SI'];
      
      const historicalData = [];
      
      // Generate 4 quarters of data
      for (let q = 0; q < 4; q++) {
        const quarterIndex = Math.floor((new Date().getMonth() / 3) - q + 4) % 4;
        const yearOffset = Math.floor(q / 4);
        const year = currentYear - yearOffset;
        const quarter = quarters[quarterIndex];
        
        // For each partner category
        for (const category of categories) {
          const revenue = (Math.random() * 500000 + 200000 + (3 - q) * 100000).toFixed(2);
          const dealCount = Math.floor(Math.random() * 10 + 5 + (3 - q) * 2);
          const sourcedLeads = Math.floor(Math.random() * 15 + 5 + (3 - q) * 1.5);
          
          historicalData.push({
            category,
            year,
            quarter,
            dealCount,
            revenue,
            sourcedLeads
          });
        }
      }
      
      return {
        historicalData,
        currentDeals: []
      };
    } catch (error) {
      console.error("Error generating sample data:", error);
      // Return minimal valid data structure
      return {
        historicalData: [
          {
            category: 'Sample',
            year: new Date().getFullYear(),
            quarter: 'Q1',
            dealCount: 10,
            revenue: 1000000,
            sourcedLeads: 5
          }
        ],
        currentDeals: []
      };
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // Use the processed data from state
  const { quarterlyData, categoryData } = processedData;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Partner Business
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Central EMEA region partner performance and deals
      </Typography>

      {usingSampleData && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Using sample data for demonstration purposes. Connect to the backend server to see actual data.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Partner Deals" />
        </Tabs>
      </Box>
      
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main', mb: 4 }}>
              <CardHeader 
                title="Partner Performance Metrics" 
                sx={{ 
                  '& .MuiCardHeader-title': { 
                    fontWeight: 600,
                    color: 'secondary.main'
                  } 
                }}
              />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ height: '100%' }}>
                      <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom variant="subtitle2">
                            Total Partner Deals
                          </Typography>
                          <Typography variant="h3" component="div" align="center" sx={{ my: 2 }}>
                            {partnerData?.historicalData?.reduce((sum, item) => sum + (parseInt(item?.dealCount) || 0), 0) || 0}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ height: '100%' }}>
                      <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom variant="subtitle2">
                            Partner-Sourced Revenue
                          </Typography>
                          <Typography variant="h3" component="div" align="center" sx={{ my: 2 }}>
                            ${(partnerData?.historicalData?.reduce((sum, item) => sum + (parseFloat(item?.revenue) || 0), 0) / 1000000 || 0).toFixed(2)}M
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ height: '100%' }}>
                      <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom variant="subtitle2">
                            Active Partners
                          </Typography>
                          <Typography variant="h3" component="div" align="center" sx={{ my: 2 }}>
                            {partnerData?.historicalData ? new Set(partnerData.historicalData.map(item => item?.category).filter(Boolean)).size : 0}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ height: '100%' }}>
                      <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom variant="subtitle2">
                            Partner Sourced Leads
                          </Typography>
                          <Typography variant="h3" component="div" align="center" sx={{ my: 2 }}>
                            {partnerData?.historicalData?.reduce((sum, item) => sum + (parseInt(item?.sourcedLeads) || 0), 0) || 0}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main' }}>
              <CardHeader 
                title="Partner Revenue Contribution by Quarter" 
                subheader="Last 4 quarters and 4 quarter projection"
                sx={{ 
                  '& .MuiCardHeader-title': { 
                    fontWeight: 600,
                    color: 'secondary.main'
                  } 
                }}
              />
              <Divider />
              <CardContent sx={{ height: 400 }}>
                {quarterlyData && quarterlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={quarterlyData}
                      margin={{ top: 20, right: 30, left: 30, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="quarter" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60}
                        tick={{ fontSize: 12 }}
                        tickMargin={20}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                        label={{ value: 'Revenue (Millions)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                      />
                      <Tooltip 
                        formatter={(value) => [`$${(value / 1000000).toFixed(2)}M`, 'Revenue']}
                        labelFormatter={(label) => `Quarter: ${label}`}
                      />
                      <Legend wrapperStyle={{ bottom: 0, left: 0, marginTop: 10 }} />
                      <Bar 
                        dataKey="actualRevenue" 
                        name="Actual Revenue" 
                        fill="#8884d8" 
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={false}
                      />
                      <Bar 
                        dataKey="projectedRevenue" 
                        name="Projected Revenue" 
                        fill="#82ca9d" 
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography variant="body1" color="textSecondary">
                      No historical data available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main' }}>
              <CardHeader 
                title="Partner Category Revenue Distribution" 
                subheader="Revenue contribution by partner type"
                sx={{ 
                  '& .MuiCardHeader-title': { 
                    fontWeight: 600,
                    color: 'secondary.main'
                  } 
                }}
              />
              <Divider />
              <CardContent sx={{ height: 400 }}>
                {categoryData && categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend 
                        formatter={(value, entry) => {
                          const { payload } = entry;
                          if (!payload) return value;
                          return `${value}: $${(payload.value / 1000000).toFixed(1)}M`;
                        }}
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        wrapperStyle={{ paddingLeft: 20 }}
                      />
                      <Tooltip 
                        formatter={(value) => [`$${(value / 1000000).toFixed(2)}M`, 'Revenue']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography variant="body1" color="textSecondary">
                      No category data available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {tabValue === 1 && (
        <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main' }}>
          <CardHeader 
            title="Current Partner Deals" 
            sx={{ 
              '& .MuiCardHeader-title': { 
                fontWeight: 600,
                color: 'secondary.main'
              } 
            }}
          />
          <Divider />
          <CardContent>
            {partnerData?.currentDeals?.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Company</TableCell>
                      <TableCell>Region</TableCell>
                      <TableCell>Partner</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Stage</TableCell>
                      <TableCell>Partner Sourced</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {partnerData.currentDeals.map((deal) => {
                      // Debug log for each deal
                      console.log(`Deal ${deal.id} partnerSourced:`, deal.partnerSourced, typeof deal.partnerSourced);
                      
                      return (
                        <TableRow 
                          key={deal.id || Math.random().toString()}
                          sx={deal.partnerSourced ? {
                            backgroundColor: 'rgba(76, 175, 80, 0.1)', // Light green background
                            '&:hover': {
                              backgroundColor: 'rgba(76, 175, 80, 0.2)' // Slightly darker on hover
                            }
                          } : {}}
                        >
                          <TableCell>{deal.company || 'N/A'}</TableCell>
                          <TableCell>{deal.region || 'N/A'}</TableCell>
                          <TableCell>{deal.partnerName || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={deal.category || deal.partnerCategory || 'N/A'}
                              size="small"
                              sx={{ 
                                bgcolor: (deal.category || deal.partnerCategory) === 'Hyperscaler' ? '#0088FE' :
                                        (deal.category || deal.partnerCategory) === 'GSI' ? '#00C49F' : '#FFBB28',
                                color: 'white'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'EUR',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            }).format(parseFloat(deal.value || 0))}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={deal.stage || 'N/A'}
                              size="small"
                              sx={{ 
                                bgcolor: deal.stage === 'Closing' ? '#4CAF50' :
                                        deal.stage === 'Negotiation' ? '#FF9800' :
                                        deal.stage === 'Proposal' ? '#2196F3' :
                                        '#9E9E9E',
                                color: 'white'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={deal.partnerSourced ? 'Yes' : 'No'}
                              size="small"
                              sx={{ 
                                bgcolor: deal.partnerSourced ? '#4CAF50' : '#9E9E9E',
                                color: 'white'
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" p={3}>
                <Typography variant="body1" color="textSecondary">
                  No partner deals available
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Partners; 