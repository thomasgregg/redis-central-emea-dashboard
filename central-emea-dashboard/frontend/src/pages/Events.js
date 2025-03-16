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
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip as MuiTooltip,
  Snackbar,
  LinearProgress
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
import {
  Event as EventIcon,
  LocationOn,
  AccessTime,
  Category,
  AttachMoney,
  Notes,
  CalendarToday,
  PersonAdd,
  Campaign,
  Group,
  DateRange,
  Assessment
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Events = () => {
  const { token, fetchDataWithCache } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventsData, setEventsData] = useState([]);
  const [bdrCampaigns, setBdrCampaigns] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const fetchEventsData = async () => {
    try {
      setLoading(true);
      const data = await fetchDataWithCache('events', 'events');
      console.log('Events data loaded:', data);
      
      // Process the events data
      const processedData = data.map(event => {
        // Ensure date values are properly formatted
        return {
          ...event,
          startDate: event.startDate || new Date().toISOString().split('T')[0],
          endDate: event.endDate || new Date().toISOString().split('T')[0],
          budget: parseFloat(event.budget || 0),
          leadsGenerated: parseInt(event.leadsGenerated || 0, 10) // Parse leadsGenerated to integer
        };
      });
      
      setEventsData(processedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching events data:', err);
      setError('Failed to load events data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBdrCampaigns = async () => {
    try {
      const data = await fetchDataWithCache('bdr-campaigns', 'bdr-campaigns');
      console.log('BDR campaigns data loaded:', data);
      setBdrCampaigns(data);
    } catch (err) {
      console.error('Error fetching BDR campaigns data:', err);
      // Don't set error state here to avoid blocking the entire page if only this data fails
    }
  };

  useEffect(() => {
    if (token) {
      fetchEventsData();
      fetchBdrCampaigns();
    } else {
      setError('Authentication required. Please log in.');
      setLoading(false);
    }
  }, [token, fetchDataWithCache]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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

  // Separate events into upcoming and past
  const now = new Date();
  const upcomingEvents = eventsData.filter(event => new Date(event.startDate) > now);
  const pastEvents = eventsData.filter(event => new Date(event.startDate) <= now);

  // Calculate events by type
  const eventsByType = {};
  eventsData.forEach(event => {
    if (!eventsByType[event.type]) {
      eventsByType[event.type] = 0;
    }
    eventsByType[event.type]++;
  });

  const eventTypeData = Object.keys(eventsByType).map(type => ({
    name: type,
    value: eventsByType[type]
  }));

  // Calculate events by location
  const eventsByLocation = {};
  eventsData.forEach(event => {
    if (!eventsByLocation[event.location]) {
      eventsByLocation[event.location] = 0;
    }
    eventsByLocation[event.location]++;
  });

  const eventLocationData = Object.keys(eventsByLocation).map(location => ({
    name: location,
    value: eventsByLocation[location]
  }));

  // Calculate leads generated per event type
  const leadsByEventType = {};
  eventsData.forEach(event => {
    if (event.leadsGenerated) {
      if (!leadsByEventType[event.type]) {
        leadsByEventType[event.type] = 0;
      }
      leadsByEventType[event.type] += event.leadsGenerated;
    }
  });

  const leadsEventTypeData = Object.keys(leadsByEventType).map(type => ({
    name: type,
    value: leadsByEventType[type]
  })).sort((a, b) => b.value - a.value); // Sort by value descending

  // Colors for charts
  const COLORS = [
    '#3498DB',  // Light blue
    '#F39C12',  // Orange
    '#F1C40F',  // Yellow
    '#E67E22',  // Dark orange
    '#2ECC71',  // Green
    '#DC382C'   // Redis red
  ];

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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

  // Get campaign status color
  const getCampaignStatusColor = (status) => {
    switch (status) {
      case 'Completed': return '#2ECC71'; // Green
      case 'In Progress': return '#3498DB'; // Blue
      case 'Planned': return '#F39C12'; // Orange
      default: return '#95A5A6'; // Gray
    }
  };

  // Calculate progress percentage for campaigns
  const calculateProgress = (generated, target) => {
    if (!target) return 0;
    const progress = (generated / target) * 100;
    return Math.min(progress, 100); // Cap at 100%
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Marketing
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Central EMEA region marketing and events management
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* Events Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main' }}>
            <CardHeader 
              title="Events by Type" 
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
                  <PieChart>
                    <Pie
                      data={eventTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {eventTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
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
              title="Events by Location" 
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
                    data={eventLocationData}
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
                    <Bar dataKey="value" name="Events" fill="#3498DB" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Leads Generated by Event Type */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main' }}>
            <CardHeader 
              title="Leads Generated by Event Type" 
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
                    data={leadsEventTypeData}
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
                    <Bar dataKey="value" name="Leads Generated" fill="#DC382C" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* BDR Campaigns */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main' }}>
            <CardHeader 
              title="BDR Campaigns" 
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
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Campaign</TableCell>
                      <TableCell>Target</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Timeline</TableCell>
                      <TableCell>Owner</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Conversion</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bdrCampaigns.length > 0 ? (
                      bdrCampaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Campaign sx={{ mr: 1, color: 'secondary.main' }} />
                              <Typography variant="body2" fontWeight="medium">
                                {campaign.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Group sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                              <Typography variant="body2">
                                {campaign.target}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={campaign.status} 
                              size="small"
                              sx={{ 
                                backgroundColor: getCampaignStatusColor(campaign.status),
                                color: 'white'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <DateRange sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                              <Typography variant="body2">
                                {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{campaign.owner}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 100 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {campaign.leadsGenerated} / {campaign.leadsTarget}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {calculateProgress(campaign.leadsGenerated, campaign.leadsTarget).toFixed(0)}%
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={calculateProgress(campaign.leadsGenerated, campaign.leadsTarget)}
                                sx={{ 
                                  height: 6, 
                                  borderRadius: 1,
                                  backgroundColor: 'rgba(0,0,0,0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: getCampaignStatusColor(campaign.status)
                                  }
                                }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Assessment sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                              <Typography variant="body2" fontWeight="medium">
                                {campaign.conversionRate}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          {loading ? (
                            <CircularProgress size={24} sx={{ my: 2 }} />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No BDR campaigns data available
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Events Tabs */}
      <Paper elevation={1} sx={{ p: 3, mb: 4, borderTop: '4px solid', borderColor: 'secondary.main' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'secondary.main', fontWeight: 600 }}>
          Marketing Events Calendar
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root.Mui-selected': {
                color: 'secondary.main',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'secondary.main',
              },
            }}
          >
            <Tab label={`Upcoming Events (${upcomingEvents.length})`} />
            <Tab label={`Past Events (${pastEvents.length})`} />
          </Tabs>
        </Box>
        <Box>
          {tabValue === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Attendees</TableCell>
                    <TableCell>Budget</TableCell>
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
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'EUR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(event.budget)}
                      </TableCell>
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
          )}
          {tabValue === 1 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Attendees</TableCell>
                    <TableCell>Budget</TableCell>
                    <TableCell>Leads</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pastEvents.map((event) => (
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
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'EUR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(event.budget)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<PersonAdd fontSize="small" />}
                          label={event.leadsGenerated || 0}
                          size="small"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.status}
                          size="small"
                          color={event.status === 'Completed' ? 'success' : 'primary'}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Events; 