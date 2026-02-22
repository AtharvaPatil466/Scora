import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink, Navigate, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import './App.css';

import {
  ThemeProvider, createTheme, CssBaseline,
  Box, AppBar, Toolbar, Typography,
  IconButton, Tooltip
} from '@mui/material';

import DashboardIcon from '@mui/icons-material/Dashboard';
import TimelineIcon from '@mui/icons-material/Timeline';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

import StudentDashboard from './components/StudentDashboard';
import ProgressTracker from './components/ProgressTracker';
import KnowledgeGraphViz from './components/KnowledgeGraphViz';
import ErrorBoundary from './components/ErrorBoundary';
import DemoMode from './components/DemoMode';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import ContentManager from './components/teacher/ContentManager';

const darkTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2D5A3D',
      light: '#3A7A52',
      dark: '#1B4332',
    },
    secondary: {
      main: '#2D5A3D',
      light: '#4A8C62',
      dark: '#1B4332',
    },
    background: {
      default: '#F8F5F0',
      paper: '#FFFFFF',
    },
    warning: {
      main: '#D97706',
      light: '#F59E0B',
      dark: '#B45309',
    },
    error: {
      main: '#DC2626',
    },
    info: {
      main: '#2D5A3D',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#5C5C5C',
      disabled: '#8C8C8C',
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em', fontFamily: '"Playfair Display", serif' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em', fontFamily: '"Playfair Display", serif' },
    h6: { fontWeight: 600, fontFamily: '"Playfair Display", serif' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          transition: 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 250ms cubic-bezier(0.16, 1, 0.3, 1), border-color 250ms ease',
          '&:hover': {
            borderColor: 'rgba(0, 0, 0, 0.12)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none' as const,
          fontWeight: 600,
          transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: 'rgba(0,0,0,0.06)',
        },
        bar: {
          borderRadius: 10,
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        }
      }
    }
  }
});

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
  section: 'student' | 'instructor' | 'system';
  description: string;
  preview: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, section: 'student', description: 'Your learning hub with AI-powered recommendations, mastery stats, and daily focus areas.', preview: 'Stats · Focus · Streak' },
  { label: 'Knowledge Graph', path: '/knowledge-graph', icon: <AccountTreeIcon />, section: 'student', description: 'Interactive visualization of concepts and their connections. See how topics relate.', preview: 'Nodes · Links · Skills' },
  { label: 'Progress', path: '/progress', icon: <TimelineIcon />, section: 'student', description: 'Track your learning journey with detailed mastery timelines and achievement milestones.', preview: 'Timeline · Mastery · Goals' },
  { label: 'Analytics', path: '/teacher', icon: <AutoAwesomeIcon />, section: 'instructor', description: 'AI-driven insights into student performance, risk alerts, and class-wide trends.', preview: 'Insights · Alerts · Trends' },
  { label: 'Content', path: '/content-manager', icon: <EditNoteIcon />, section: 'instructor', description: 'Create, edit, and manage learning materials with the built-in content editor.', preview: 'Create · Edit · Publish' },
  { label: 'Demo', path: '/demo', icon: <PlayCircleOutlineIcon />, section: 'system', description: 'Try the full platform experience with simulated student data and AI interactions.', preview: 'Simulate · Explore · Test' },
];

const NAVBAR_HEIGHT = 56;

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <ErrorBoundary>
          <Router>
            <AppShell />
          </Router>
        </ErrorBoundary>
      </ThemeProvider>
    </Provider>
  );
};

const AppShell: React.FC = () => {
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      {/* ── Top Navigation Bar ── */}
      <AppBar
        position="fixed"
        sx={{
          background: 'rgba(248, 245, 240, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          boxShadow: 'none',
          zIndex: 1200,
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${NAVBAR_HEIGHT}px !important`,
            px: { xs: 2, md: 4 },
            justifyContent: 'space-between',
          }}
        >
          {/* Logo — left */}
          <Box
            component={RouterLink}
            to="/dashboard/demo_student_001"
            sx={{ textDecoration: 'none', flexShrink: 0 }}
          >
            <Typography
              noWrap
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 700,
                fontSize: '1.5rem',
                color: '#1A1A1A',
                letterSpacing: '-0.02em',
                cursor: 'pointer',
              }}
            >
              Scora
            </Typography>
          </Box>

          {/* Nav Links — centered */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            {navItems.map((item, idx) => (
              <React.Fragment key={item.path}>
                {idx > 0 && navItems[idx - 1].section !== item.section && (
                  <Box sx={{ width: 1, height: 20, bgcolor: 'rgba(0,0,0,0.1)', mx: 0.8, borderRadius: 1 }} />
                )}
                <Box
                  onMouseEnter={() => setHoveredNav(item.path)}
                  onMouseLeave={() => setHoveredNav(null)}
                  sx={{ position: 'relative' }}
                >
                  <Box
                    component={RouterLink}
                    to={item.path}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.7,
                      px: 1.3,
                      py: 0.8,
                      borderRadius: '10px',
                      textDecoration: 'none',
                      color: isActive(item.path) ? '#2D5A3D' : '#5C5C5C',
                      bgcolor: isActive(item.path) ? 'rgba(45, 90, 61, 0.08)' : 'transparent',
                      transition: 'all 200ms ease',
                      cursor: 'pointer',
                      flexShrink: 0,
                      '&:hover': {
                        color: '#2D5A3D',
                        bgcolor: 'rgba(45, 90, 61, 0.05)',
                      },
                      '& .MuiSvgIcon-root': {
                        fontSize: 18,
                      }
                    }}
                  >
                    {item.icon}
                    <Typography
                      sx={{
                        fontSize: '0.8rem',
                        fontWeight: isActive(item.path) ? 600 : 500,
                        whiteSpace: 'nowrap',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {item.label}
                    </Typography>
                  </Box>

                  {/* ── Hover Preview Card ── */}
                  {hoveredNav === item.path && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        mt: 1,
                        width: 280,
                        p: 2,
                        borderRadius: '14px',
                        background: '#FFFFFF',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.1)',
                        animation: 'previewIn 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                        zIndex: 1300,
                        pointerEvents: 'none',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: -6,
                          left: '50%',
                          transform: 'translateX(-50%) rotate(45deg)',
                          width: 12,
                          height: 12,
                          background: '#FFFFFF',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          borderBottom: 'none',
                          borderRight: 'none',
                        }
                      }}
                    >
                      {/* Preview header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
                        <Box sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          bgcolor: 'rgba(45, 90, 61, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#2D5A3D',
                          '& .MuiSvgIcon-root': { fontSize: 17 },
                        }}>
                          {item.icon}
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#1A1A1A' }}>
                          {item.label}
                        </Typography>
                      </Box>
                      {/* Description */}
                      <Typography sx={{ fontSize: '0.75rem', color: '#5C5C5C', lineHeight: 1.5, mb: 1.5 }}>
                        {item.description}
                      </Typography>
                      {/* Preview tags */}
                      <Box sx={{ display: 'flex', gap: 0.8 }}>
                        {item.preview.split(' · ').map((tag) => (
                          <Box
                            key={tag}
                            sx={{
                              px: 1,
                              py: 0.3,
                              borderRadius: '6px',
                              bgcolor: 'rgba(45, 90, 61, 0.06)',
                              border: '1px solid rgba(45, 90, 61, 0.1)',
                            }}
                          >
                            <Typography sx={{ fontSize: '0.62rem', color: '#2D5A3D', fontWeight: 600, letterSpacing: '0.03em' }}>
                              {tag}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </React.Fragment>
            ))}
          </Box>

          {/* Right side utilities */}
          < Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <IconButton size="small" sx={{
              color: '#5C5C5C',
              bgcolor: 'rgba(0,0,0,0.04)',
              '&:hover': { color: '#1A1A1A', bgcolor: 'rgba(0,0,0,0.08)' },
              width: 34, height: 34,
            }}>
              <SearchIcon sx={{ fontSize: 17 }} />
            </IconButton>
            <IconButton size="small" sx={{
              color: '#5C5C5C',
              bgcolor: 'rgba(0,0,0,0.04)',
              '&:hover': { color: '#1A1A1A', bgcolor: 'rgba(0,0,0,0.08)' },
              width: 34, height: 34,
            }}>
              <NotificationsNoneIcon sx={{ fontSize: 17 }} />
            </IconButton>
            <Box sx={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: '#2D5A3D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ml: 0.5,
              cursor: 'pointer',
              transition: 'transform 200ms ease',
              '&:hover': { transform: 'scale(1.05)' },
            }}>
              <Typography sx={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'white',
              }}>S</Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Main Content ── */}
      <Box
        component="main"
        className="page-enter"
        sx={{
          mt: `${NAVBAR_HEIGHT}px`,
          minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
          p: { xs: 2, md: 4 },
          bgcolor: 'transparent',
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/demo_student_001" replace />} />
          <Route path="/dashboard" element={<Navigate to="/dashboard/demo_student_001" replace />} />
          <Route path="/dashboard/:studentId" element={<StudentDashboard />} />
          <Route path="/learn/:contentId" element={<StudentDashboard />} />
          <Route path="/knowledge-graph" element={<KnowledgeGraphViz />} />
          <Route path="/progress" element={<ProgressTracker />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/content-manager" element={<ContentManager />} />
          <Route path="/demo" element={<DemoMode />} />
        </Routes>
      </Box>
    </>
  );
};

export default App;
