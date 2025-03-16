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
  Chip,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Alert,
  Divider,
  LinearProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { useAuth } from '../context/AuthContext';

const Meddpicc = () => {
  const { fetchDataWithCache } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchMeddpiccData = async () => {
      try {
        const data = await fetchDataWithCache('meddpicc', 'meddpicc');
        // Filter out opportunities with null values
        const validOpportunities = data.filter(opp => opp.opportunity && opp.metrics.value);
        setOpportunities(validOpportunities);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch MEDDPICC data');
        setLoading(false);
      }
    };
    
    fetchMeddpiccData();
  }, [fetchDataWithCache]);

  const handleAccordionChange = (id) => (event, isExpanded) => {
    setExpandedId(isExpanded ? id : null);
  };

  const getStageColor = (status) => {
    switch (status) {
      case 'At Risk':
        return '#FFC107'; // amber
      case 'Completed':
        return '#4CAF50'; // green
      default:
        return '#757575'; // grey
    }
  };

  const getMeddpiccScore = (opportunity) => {
    if (!opportunity || !opportunity.totalScore) return 0;
    // Each criterion has a max score of 5, and there are 8 criteria
    return Math.round((opportunity.totalScore / (8 * 5)) * 100);
  };

  const prepareMeddpiccRadarData = (opportunity) => {
    if (!opportunity) return [];
    
    return [
      { subject: 'Metrics', A: opportunity.metrics.score || 0, fullMark: 5 },
      { subject: 'Economic Buyer', A: opportunity.economicBuyer.score || 0, fullMark: 5 },
      { subject: 'Decision Criteria', A: opportunity.decisionCriteria.score || 0, fullMark: 5 },
      { subject: 'Decision Process', A: opportunity.decisionProcess.score || 0, fullMark: 5 },
      { subject: 'Paper Process', A: opportunity.paperProcess.score || 0, fullMark: 5 },
      { subject: 'Implicit Pain', A: opportunity.implicitPain.score || 0, fullMark: 5 },
      { subject: 'Champion', A: opportunity.champion.score || 0, fullMark: 5 },
      { subject: 'Competition', A: opportunity.competition.score || 0, fullMark: 5 }
    ];
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
        MEDDPICC Analysis
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Sales qualification methodology for Central EMEA opportunities
      </Typography>

      <Divider sx={{ my: 3 }} />
      
      <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main', mb: 4 }}>
        <CardHeader 
          title="What is MEDDPICC?" 
          sx={{ 
            '& .MuiCardHeader-title': { 
              fontWeight: 600,
              color: 'secondary.main'
            } 
          }}
        />
        <Divider />
        <CardContent>
          <Typography variant="body1" paragraph>
            MEDDPICC is a sales qualification methodology that helps sales teams qualify opportunities and increase win rates. It stands for:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1"><strong>M</strong>etrics - Quantifiable business impact</Typography>
              <Typography variant="body1"><strong>E</strong>conomic Buyer - Decision maker with budget authority</Typography>
              <Typography variant="body1"><strong>D</strong>ecision Criteria - Formal evaluation criteria</Typography>
              <Typography variant="body1"><strong>D</strong>ecision Process - Steps to make purchase decision</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1"><strong>P</strong>aper Process - Contract and procurement process</Typography>
              <Typography variant="body1"><strong>I</strong>mplicit Pain - Business challenges and pain points</Typography>
              <Typography variant="body1"><strong>C</strong>hampion - Internal advocate for your solution</Typography>
              <Typography variant="body1"><strong>C</strong>ompetition - Understanding of competitive landscape</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {opportunities.length > 0 ? (
        <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main' }}>
          <CardHeader 
            title="Opportunities" 
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
                    <TableCell>Opportunity</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>MEDDPICC Score</TableCell>
                    <TableCell>Next Steps</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {opportunities.map((opportunity) => (
                    <React.Fragment key={opportunity.id}>
                      <TableRow>
                        <TableCell>{opportunity.opportunity}</TableCell>
                        <TableCell>${opportunity.metrics.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>
                          <Chip 
                            label={opportunity.status} 
                            style={{ 
                              backgroundColor: getStageColor(opportunity.status),
                              color: 'white'
                            }} 
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Box width="100%" mr={1}>
                              <LinearProgress 
                                variant="determinate" 
                                value={getMeddpiccScore(opportunity)} 
                                sx={{ 
                                  height: 10, 
                                  borderRadius: 5,
                                  backgroundColor: '#e0e0e0',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: getMeddpiccScore(opportunity) < 40 ? '#f44336' : 
                                                    getMeddpiccScore(opportunity) < 70 ? '#ff9800' : '#4caf50'
                                  }
                                }}
                              />
                            </Box>
                            <Box minWidth={35}>
                              <Typography variant="body2" color="textSecondary">
                                {getMeddpiccScore(opportunity)}%
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{opportunity.nextSteps}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => handleAccordionChange(opportunity.id)(null, expandedId !== opportunity.id)}
                          >
                            {expandedId === opportunity.id ? 'Hide' : 'Show'}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedId === opportunity.id && (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ py: 0 }}>
                            <Box sx={{ margin: 1 }}>
                              <Grid container spacing={3}>
                                <Grid item xs={12} md={5}>
                                  <Card variant="outlined" sx={{ height: '100%' }}>
                                    <CardHeader title="MEDDPICC Radar" />
                                    <Divider />
                                    <CardContent>
                                      <ResponsiveContainer width="100%" height={300}>
                                        <RadarChart 
                                          cx="50%" 
                                          cy="50%" 
                                          outerRadius="80%" 
                                          data={prepareMeddpiccRadarData(opportunity)}
                                        >
                                          <PolarGrid />
                                          <PolarAngleAxis dataKey="subject" />
                                          <PolarRadiusAxis angle={30} domain={[0, 5]} />
                                          <Radar 
                                            name="Score" 
                                            dataKey="A" 
                                            stroke="#DC382C" 
                                            fill="#DC382C" 
                                            fillOpacity={0.6} 
                                          />
                                        </RadarChart>
                                      </ResponsiveContainer>
                                    </CardContent>
                                  </Card>
                                </Grid>
                                <Grid item xs={12} md={7}>
                                  <Card variant="outlined" sx={{ height: '100%' }}>
                                    <CardHeader title="MEDDPICC Details" />
                                    <Divider />
                                    <CardContent>
                                      <Grid container spacing={2}>
                                        {[
                                          { key: 'metrics', label: 'Metrics' },
                                          { key: 'economicBuyer', label: 'Economic Buyer' },
                                          { key: 'decisionCriteria', label: 'Decision Criteria' },
                                          { key: 'decisionProcess', label: 'Decision Process' },
                                          { key: 'paperProcess', label: 'Paper Process' },
                                          { key: 'implicitPain', label: 'Implicit Pain' },
                                          { key: 'champion', label: 'Champion' },
                                          { key: 'competition', label: 'Competition' }
                                        ].map(({ key, label }) => (
                                          <Grid item xs={12} key={key}>
                                            <Box display="flex" alignItems="center" mb={1}>
                                              <Typography variant="body1" sx={{ minWidth: 150 }}>
                                                {label}:
                                              </Typography>
                                              <Rating 
                                                value={opportunity[key].score || 0} 
                                                readOnly 
                                                max={5}
                                                sx={{ ml: 2 }}
                                              />
                                            </Box>
                                            <Typography variant="body2" color="textSecondary" sx={{ ml: 2 }}>
                                              {Object.entries(opportunity[key])
                                                .filter(([k]) => k !== 'score' && k !== 'value')
                                                .map(([k, v]) => `${k}: ${v}`).join(', ')}
                                            </Typography>
                                            {key !== 'competition' && <Divider sx={{ my: 1 }} />}
                                          </Grid>
                                        ))}
                                      </Grid>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              </Grid>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info">No MEDDPICC data available.</Alert>
      )}
    </Box>
  );
};

export default Meddpicc; 