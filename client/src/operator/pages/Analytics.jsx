import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import * as operatorAPI from '../../api/operator';
import { addToast } from '../../store/notificationSlice';
import { formatCurrency } from '../../utils/formatters';
import { PageSpinner } from '../../shared/Spinner';

import { 
  Box, Typography, Grid, Paper, ToggleButtonGroup, ToggleButton,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import MoneyIcon from '@mui/icons-material/AttachMoney';
import ListIcon from '@mui/icons-material/FormatListNumbered';
import TimelineIcon from '@mui/icons-material/Timeline';
import TimeIcon from '@mui/icons-material/AccessTime';
import NoShowIcon from '@mui/icons-material/PersonOff';
import Card, { CardContent } from '../../shared/Card';

import { 
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function Analytics() {
  const dispatch = useDispatch();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('weekly');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await operatorAPI.getAnalytics({ period });
        setData(res.data);
      } catch { /* Use mock data */ }
      finally { setLoading(false); }
    };
    fetch();
  }, [period]);

  if (loading) return <PageSpinner message="Loading analytics..." />;

  const stats = data?.stats || {
    totalRevenue: 45200,
    totalJobs: 142,
    avgJobsPerDay: 20,
    popularSlot: '10 AM - 11 AM',
    noShowRate: 2.1,
  };

  const peakHours = data?.peakHours || [
    [1,2,5,8,4,2,0],
    [2,4,8,12,6,3,1],
    [5,8,15,20,12,5,2],
    [10,15,25,35,20,10,5],
    [8,12,20,25,15,8,4],
    [5,8,15,18,10,5,2],
    [3,5,8,10,6,3,1],
    [1,2,4,5,3,1,0],
  ];

  const hours = ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxVal = Math.max(...peakHours.flat(), 1);

  const trendData = data?.trendData?.length ? data.trendData : [
    { day: 'Mon', revenue: 4000 },
    { day: 'Tue', revenue: 5200 },
    { day: 'Wed', revenue: 6100 },
    { day: 'Thu', revenue: 4800 },
    { day: 'Fri', revenue: 7500 },
    { day: 'Sat', revenue: 8900 },
    { day: 'Sun', revenue: 8700 },
  ];

  const pieData = data?.jobsByType ? [
    { name: 'B&W', value: data.jobsByType.bw },
    { name: 'Colour', value: data.jobsByType.color },
  ] : [
    { name: 'B&W', value: 75 },
    { name: 'Colour', value: 25 },
  ];

  const COLORS = ['#0f172a', '#0ea5e9']; // Slate for B&W, Blue for Color

  const StatIcon = ({ icon: Icon, color }) => (
    <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: `${color}.light`, color: `${color}.main`, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
      <Icon />
    </Box>
  );

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease', pb: 8 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Analytics</Typography>
          <Typography variant="body2" color="text.secondary">Insights into your shop&apos;s performance.</Typography>
        </Box>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(e, val) => val && setPeriod(val)}
          size="small"
          color="primary"
        >
          <ToggleButton value="daily" sx={{ fontWeight: 'bold' }}>Daily</ToggleButton>
          <ToggleButton value="weekly" sx={{ fontWeight: 'bold' }}>Weekly</ToggleButton>
          <ToggleButton value="monthly" sx={{ fontWeight: 'bold' }}>Monthly</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Stats cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {[
          { label: 'Revenue', value: formatCurrency(stats.totalRevenue), icon: MoneyIcon, color: 'success' },
          { label: 'Total Jobs', value: stats.totalJobs, icon: ListIcon, color: 'info' },
          { label: 'Avg/Day', value: stats.avgJobsPerDay, icon: TimelineIcon, color: 'secondary' },
          { label: 'Popular Slot', value: stats.popularSlot, icon: TimeIcon, color: 'warning' },
          { label: 'No-Show Rate', value: `${stats.noShowRate}%`, icon: NoShowIcon, color: 'error' },
        ].map(stat => (
          <Grid item xs={6} md={2.4} key={stat.label}>
            <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
              <CardContent>
                <StatIcon icon={stat.icon} color={stat.color} />
                <Typography variant="h5" fontWeight="900">{stat.value}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase">{stat.label}</Typography>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', bgcolor: `${stat.color}.main`, opacity: 0.05 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Revenue chart */}
      <Card sx={{ mb: 6 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Revenue Trend</Typography>
          <Box sx={{ height: 350, width: '100%', mt: 3 }}>
            <ResponsiveContainer>
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Jobs by type and Peak Hours */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} lg={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Jobs by Type (B&W vs Colour)</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3 }}>
                <Box sx={{ height: 250, width: '100%' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`${value}%`, 'Volume']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ display: 'flex', gap: 4, mt: 2 }}>
                  {pieData.map((entry, index) => (
                    <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS[index % COLORS.length] }} />
                      <Typography variant="body2" fontWeight="bold">{entry.name} ({entry.value}%)</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Peak Hours Heatmap</Typography>
              <TableContainer sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ borderBottom: 'none' }}></TableCell>
                      {days.map(d => (
                        <TableCell key={d} align="center" sx={{ borderBottom: 'none', color: 'text.secondary', fontWeight: 'bold' }}>
                          {d}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {hours.map((h, hi) => (
                      <TableRow key={h}>
                        <TableCell sx={{ borderBottom: 'none', color: 'text.secondary', fontWeight: 'bold', width: 60, p: 1 }}>
                          {h}
                        </TableCell>
                        {peakHours[hi]?.map((val, di) => {
                          const intensity = val / maxVal;
                          return (
                            <TableCell key={di} sx={{ borderBottom: 'none', p: 0.5 }}>
                              <Box 
                                sx={{ 
                                  width: '100%', 
                                  aspectRatio: '1', 
                                  bgcolor: `rgba(14, 165, 233, ${intensity * 0.8 + 0.05})`,
                                  borderRadius: 1,
                                  transition: 'all 0.2s',
                                  '&:hover': { transform: 'scale(1.1)', boxShadow: 2 }
                                }} 
                                title={`${days[di]} ${h}: ${val} bookings`}
                              />
                            </TableCell>
                          );
                        })}
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
}
