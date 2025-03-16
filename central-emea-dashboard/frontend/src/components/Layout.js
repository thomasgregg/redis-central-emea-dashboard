import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Button,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Timeline as TimelineIcon,
  Event as EventIcon,
  Public as PublicIcon,
  ShowChart as ShowChartIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Storage as StorageIcon,
  Business as BusinessIcon,
  AssessmentOutlined as AssessmentIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

// Redis cloud instance information
const REDIS_INSTANCE = {
  host: 'redis-16999.c74.us-east-1-4.ec2.redns.redis-cloud.com',
  port: '16999',
  region: 'us-east-1'
};

const Layout = () => {
  const { user, logout, backendReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Pipeline', icon: <TimelineIcon />, path: '/pipeline' },
    { text: 'Marketing', icon: <EventIcon />, path: '/events' },
    { text: 'Territories', icon: <PublicIcon />, path: '/territories' },
    { text: 'Forecasting', icon: <ShowChartIcon />, path: '/forecasting' },
    { text: 'Partners', icon: <BusinessIcon />, path: '/partners' },
    { text: 'MEDDPICC', icon: <AssessmentIcon />, path: '/meddpicc' }
  ];

  const drawer = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ justifyContent: 'center', py: 2, height: 64 }}>
        <Box
          component="img"
          src="https://redis.io/wp-content/uploads/2024/04/Logotype.svg?auto=webp&quality=85,75&width=120"
          alt="Redis Logo"
          sx={{ height: 40 }}
        />
      </Toolbar>
      <Divider sx={{ 
        bgcolor: 'rgba(255, 255, 255, 0.12)', 
        mx: 0, 
        mt: 0, 
        mb: 0,
        height: '1px'
      }} />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'secondary.dark',
                  '&:hover': {
                    backgroundColor: 'secondary.dark',
                  }
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                }
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'white' : 'white'
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  '& .MuiListItemText-primary': { 
                    color: 'white' 
                  } 
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {/* Spacer to push database status to bottom */}
      <Box sx={{ flexGrow: 1 }} />
      
      {/* Database connection status */}
      <Box sx={{ p: 2, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Chip 
          label={`Database: ${backendReady ? 'Connected' : 'Disconnected'}`}
          color={backendReady ? "success" : "error"}
          size="small"
          sx={{ 
            fontSize: '0.75rem',
            color: 'white',
            '& .MuiChip-label': { color: 'white' },
            bgcolor: backendReady ? 'rgba(46, 204, 113, 0.2)' : 'rgba(220, 56, 44, 0.2)',
            border: '1px solid',
            borderColor: backendReady ? 'rgba(46, 204, 113, 0.5)' : 'rgba(220, 56, 44, 0.5)'
          }}
        />
        
        {/* Redis Cloud Instance Info */}
        <Tooltip title={`${REDIS_INSTANCE.host}:${REDIS_INSTANCE.port}`} placement="top">
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 0.5,
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'default'
            }}
          >
            <StorageIcon sx={{ fontSize: '0.9rem' }} />
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              Redis Cloud ({REDIS_INSTANCE.region})
            </Typography>
          </Box>
        </Tooltip>
      </Box>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: 'none'
        }}
      >
        <Toolbar sx={{ height: 64, minHeight: 64 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Central EMEA Go-to-Market Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              onClick={handleProfileMenuOpen}
              color="inherit"
              startIcon={
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'primary.main',
                    fontSize: '0.875rem'
                  }}
                >
                  {user?.name?.split(' ').map(n => n[0]).join('')}
                </Avatar>
              }
            >
              {user?.name}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleProfileMenuClose}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
        <Divider sx={{ 
          mt: 0, 
          mb: 0, 
          height: '1px',
          borderColor: 'rgba(0, 0, 0, 0.12)'
        }} />
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: '1px 0 5px rgba(0, 0, 0, 0.1)',
              bgcolor: 'secondary.main',
              color: 'white'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: '1px 0 5px rgba(0, 0, 0, 0.1)',
              bgcolor: 'secondary.main',
              color: 'white'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout; 