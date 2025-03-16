import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Default data in case API returns empty array
const defaultPipelineData = [
  {
    id: 1,
    company: 'Acme Corp',
    country: 'Germany',
    stage: 'Qualification',
    value: '250000',
    probability: '60',
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'Thomas Gregg',
    product: 'Redis Enterprise'
  },
  {
    id: 2,
    company: 'Globex',
    country: 'Switzerland',
    stage: 'Proposal',
    value: '350000',
    probability: '75',
    expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'Thomas Gregg',
    product: 'Redis Cloud'
  },
  {
    id: 3,
    company: 'Initech',
    country: 'Austria',
    stage: 'Negotiation',
    value: '420000',
    probability: '85',
    expectedCloseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'Thomas Gregg',
    product: 'Redis Enterprise'
  },
  {
    id: 4,
    company: 'Umbrella Corp',
    country: 'Belgium',
    stage: 'Prospecting',
    value: '180000',
    probability: '30',
    expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'Thomas Gregg',
    product: 'Redis Cloud'
  },
  {
    id: 5,
    company: 'Stark Industries',
    country: 'Netherlands',
    stage: 'Closed Won',
    value: '520000',
    probability: '100',
    expectedCloseDate: new Date().toISOString(),
    owner: 'Thomas Gregg',
    product: 'Redis Enterprise'
  }
];

const Pipeline = () => {
  const { token, fetchDataWithCache } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pipelineData, setPipelineData] = useState([]);

  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        setLoading(true);
        const data = await fetchDataWithCache('pipeline', 'pipeline');
        console.log('Pipeline data loaded:', data);
        
        // Check if data is empty and use default data if needed
        if (!data || data.length === 0) {
          console.log('Using default pipeline data');
          setPipelineData(defaultPipelineData);
        } else {
          // Process the pipeline data
          const processedData = data.map(deal => {
            // Ensure numeric values are properly parsed
            return {
              ...deal,
              amount: parseFloat(deal.amount || 0),
              probability: parseInt(deal.probability || 0),
              expectedCloseDate: deal.expectedCloseDate || new Date().toISOString().split('T')[0]
            };
          });
          
          setPipelineData(processedData);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching pipeline data:', err);
        setError('Failed to load pipeline data. Please try again later.');
        // Use default data on error
        setPipelineData(defaultPipelineData);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchPipelineData();
    } else {
      setError('Authentication required. Please log in.');
      setLoading(false);
    }
  }, [token, fetchDataWithCache]);

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

  // Calculate pipeline by stage
  const pipelineByStage = {};
  pipelineData.forEach(deal => {
    if (!pipelineByStage[deal.stage]) {
      pipelineByStage[deal.stage] = {
        count: 0,
        value: 0
      };
    }
    pipelineByStage[deal.stage].count += 1;
    pipelineByStage[deal.stage].value += parseFloat(deal.value);
  });

  const pipelineChartData = Object.keys(pipelineByStage).map(stage => ({
    name: stage,
    value: pipelineByStage[stage].value
  }));

  // Colors for pie chart
  const COLORS = ['#3498DB', '#F39C12', '#F1C40F', '#E67E22', '#2ECC71', '#DC382C', '#95A5A6'];

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Get stage color
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

  const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = 100;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Sales Pipeline
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Central EMEA region pipeline overview
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* Pipeline Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart width={300} height={300}>
                    <Pie
                      data={pipelineChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
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
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main' }}>
            <CardHeader 
              title="Pipeline Summary" 
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
                      <TableCell>Stage</TableCell>
                      <TableCell align="right">Deals</TableCell>
                      <TableCell align="right">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.keys(pipelineByStage).map((stage) => (
                      <TableRow key={stage}>
                        <TableCell component="th" scope="row">
                          <Chip
                            label={stage}
                            size="small"
                            sx={{ bgcolor: getStageColor(stage), color: 'white' }}
                          />
                        </TableCell>
                        <TableCell align="right">{pipelineByStage[stage].count}</TableCell>
                        <TableCell align="right">{formatCurrency(pipelineByStage[stage].value)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ '& td': { fontWeight: 'bold' } }}>
                      <TableCell>Total</TableCell>
                      <TableCell align="right">
                        {Object.values(pipelineByStage).reduce((sum, stage) => sum + stage.count, 0)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(Object.values(pipelineByStage).reduce((sum, stage) => sum + stage.value, 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pipeline Deals Table */}
      <Paper elevation={1} sx={{ p: 3, borderTop: '4px solid', borderColor: 'secondary.main' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'secondary.main', fontWeight: 600 }}>
          Pipeline Deals
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell align="right">Probability</TableCell>
                <TableCell>Expected Close</TableCell>
                <TableCell>Product</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pipelineData.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell>{deal.company}</TableCell>
                  <TableCell>{deal.country}</TableCell>
                  <TableCell>
                    <Chip
                      label={deal.stage}
                      size="small"
                      sx={{ bgcolor: getStageColor(deal.stage), color: 'white' }}
                    />
                  </TableCell>
                  <TableCell align="right">{formatCurrency(deal.value)}</TableCell>
                  <TableCell align="right">{deal.probability}%</TableCell>
                  <TableCell>{new Date(deal.expectedCloseDate).toLocaleDateString()}</TableCell>
                  <TableCell>{deal.product}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Pipeline; 