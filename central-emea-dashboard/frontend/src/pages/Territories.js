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
  CardHeader,
  TextField,
  InputAdornment
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Territories = () => {
  const { token, fetchDataWithCache } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [territoriesData, setTerritoriesData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTerritoriesData = async () => {
      try {
        setLoading(true);
        const data = await fetchDataWithCache('territories', 'territories');
        console.log('Territories data loaded:', data);
        
        // Process the territories data
        const processedData = data.map(territory => {
          // Ensure numeric values are properly parsed
          return {
            ...territory,
            marketSize: territory.marketSize,
            penetration: territory.penetration,
            growthRate: territory.growthRate,
            competitorShare: territory.competitorShare || '0%',
            competitors: territory.competitors || '',
            keyAccounts: territory.keyAccounts || '0'
          };
        });
        
        setTerritoriesData(processedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching territories data:', err);
        setError('Failed to load territories data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchTerritoriesData();
    } else {
      setError('Authentication required. Please log in.');
      setLoading(false);
    }
  }, [token, fetchDataWithCache]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
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

  // Filter territories based on search term
  const filteredTerritories = territoriesData.filter(territory => 
    territory.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Prepare data for radar chart
  const radarData = territoriesData.map(territory => {
    // Extract numeric values from percentage strings
    const penetrationStr = territory.penetration || '0%';
    const growthRateStr = territory.growthRate || '0%';
    
    // Remove '%' and convert to number
    const penetrationValue = parseFloat(penetrationStr.replace('%', ''));
    const growthRateValue = parseFloat(growthRateStr.replace('%', ''));
    
    return {
      name: territory.name,
      'Market Size': parseFloat(territory.marketSize.replace(/[^\d.-]/g, '')),
      'Penetration': isNaN(penetrationValue) ? 0 : penetrationValue,
      'Growth Rate': isNaN(growthRateValue) ? 0 : growthRateValue,
      'Key Accounts': parseInt(territory.keyAccounts)
    };
  });

  // Prepare data for bar chart
  const barChartData = territoriesData.map(territory => ({
    name: territory.name,
    'Market Size': parseFloat(territory.marketSize.replace(/[^\d.-]/g, '')),
    'Penetration': parseFloat(territory.penetration)
  }));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Territories
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Central EMEA region territory management
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search territories..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Territory Visualizations */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main' }}>
            <CardHeader 
              title="Territory Market Size" 
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
                  <BarChart
                    data={barChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Market Size" fill="#4CAF50" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main' }}>
            <CardHeader 
              title="Territory Comparison" 
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
                  <RadarChart outerRadius={90} data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar 
                      name="Penetration" 
                      dataKey="Penetration" 
                      stroke="#2196F3" 
                      fill="#2196F3" 
                      fillOpacity={0.6} 
                    />
                    <Radar 
                      name="Growth Rate" 
                      dataKey="Growth Rate" 
                      stroke="#FF9800" 
                      fill="#FF9800" 
                      fillOpacity={0.6} 
                    />
                    <Legend />
                    <Tooltip formatter={(value) => `${value}%`} />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Territories Table */}
      <Paper elevation={1} sx={{ p: 3, borderTop: '4px solid', borderColor: 'secondary.main' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'secondary.main', fontWeight: 600 }}>
          Territory Details
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Territory</TableCell>
                <TableCell>Market Size</TableCell>
                <TableCell>Penetration</TableCell>
                <TableCell>Growth Rate</TableCell>
                <TableCell>Key Accounts</TableCell>
                <TableCell>Sales Rep</TableCell>
                <TableCell>Competitors</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTerritories.map((territory) => (
                <TableRow key={territory.name}>
                  <TableCell component="th" scope="row">
                    <Typography variant="body1" fontWeight={500}>
                      {territory.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{territory.marketSize}</TableCell>
                  <TableCell>{territory.penetration}</TableCell>
                  <TableCell>{territory.growthRate}</TableCell>
                  <TableCell>{territory.keyAccounts}</TableCell>
                  <TableCell>
                    {territory.salesRep === 'Unassigned' ? (
                      <Chip label="Unassigned" size="small" color="warning" />
                    ) : (
                      territory.salesRep
                    )}
                  </TableCell>
                  <TableCell>
                    {territory.competitors.split(',').map((competitor, index) => (
                      <Chip
                        key={index}
                        label={competitor.trim()}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5, bgcolor: 'secondary.main', color: 'white' }}
                      />
                    ))}
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

export default Territories; 