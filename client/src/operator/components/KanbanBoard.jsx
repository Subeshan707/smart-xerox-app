import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Box, Typography, Paper, useTheme, CardContent, Divider, Tooltip, IconButton } from '@mui/material';
import { keyframes } from '@mui/system';
import PrintIcon from '@mui/icons-material/Print';
import Card from '../../shared/Card';
import Badge from '../../shared/Badge';
import { formatDate } from '../../utils/formatters';

const pulseRed = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); border-color: rgba(239, 68, 68, 1); }
  70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); border-color: rgba(239, 68, 68, 0.5); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); border-color: rgba(239, 68, 68, 1); }
`;

const COLUMNS = {
  queued: { id: 'queued', title: 'Queued', color: 'warning.main' },
  printing: { id: 'printing', title: 'Printing', color: 'info.main' },
  ready: { id: 'ready', title: 'Ready', color: 'success.main' },
};

export default function KanbanBoard({ bookings, onStatusChange }) {
  const theme = useTheme();
  // Force re-render every minute to update the 10-minute warning
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Group active bookings into columns
  const columns = {
    queued: bookings.filter(b => b.status === 'queued'),
    printing: bookings.filter(b => b.status === 'printing'),
    ready: bookings.filter(b => b.status === 'ready'),
  };

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    
    // Dropped outside the list
    if (!destination) return;
    
    // Dropped in the same column at the same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Call the API via parent handler
    onStatusChange(draggableId, destination.droppableId);
  };

  const isWarning = (booking) => {
    if (booking.status !== 'queued') return false;
    const minutesWaiting = (new Date() - new Date(booking.createdAt)) / 1000 / 60;
    return minutesWaiting > 10;
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2, minHeight: 600 }}>
        {Object.values(COLUMNS).map(col => (
          <Paper 
            key={col.id}
            elevation={0}
            sx={{ 
              flex: '1 1 320px', 
              minWidth: 320, 
              bgcolor: 'surfaceContainer.main', 
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Column Header */}
            <Box sx={{ p: 2, borderBottom: 2, borderColor: col.color, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="bold">{col.title}</Typography>
              <Typography variant="caption" sx={{ bgcolor: col.color, color: 'white', px: 1, py: 0.5, borderRadius: 2, fontWeight: 'bold' }}>
                {columns[col.id].length}
              </Typography>
            </Box>

            {/* Droppable Area */}
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    p: 2,
                    flexGrow: 1,
                    minHeight: 150,
                    bgcolor: snapshot.isDraggingOver ? 'surfaceContainerHighest.main' : 'transparent',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  {columns[col.id].map((booking, index) => {
                    const warning = isWarning(booking);
                    return (
                      <Draggable key={booking._id} draggableId={booking._id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              mb: 2,
                              opacity: snapshot.isDragging ? 0.9 : 1,
                              transform: snapshot.isDragging ? 'scale(1.02)' : 'none',
                              boxShadow: snapshot.isDragging ? theme.shadows[4] : 'none',
                              transition: 'transform 0.1s ease',
                              borderLeft: 4,
                              borderColor: warning ? 'error.main' : col.color,
                              animation: warning && !snapshot.isDragging ? `${pulseRed} 2s infinite` : 'none',
                              cursor: 'grab'
                            }}
                          >
                            <CardContent sx={{ pb: '16px !important', p: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                                <Typography variant="subtitle1" fontWeight="900" color={warning ? 'error.main' : 'primary.main'}>
                                  #{booking.tokenNumber}
                                </Typography>
                                <Badge status={booking.paymentStatus} />
                              </Box>
                              
                              <Typography variant="body2" fontWeight="bold" noWrap>
                                {booking.customerId?.name || 'Walk-in Customer'}
                              </Typography>
                              
                              <Divider sx={{ my: 1 }} />
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Tooltip title={booking.jobConfig?.fileName || 'Document'}>
                                  <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: '80%' }}>
                                    📄 {booking.jobConfig?.fileName || 'Document'}
                                  </Typography>
                                </Tooltip>
                                {booking.jobConfig?.fileUrl && (
                                  <Tooltip title="View File">
                                    <IconButton 
                                      size="small" 
                                      color="primary" 
                                      onClick={(e) => { e.stopPropagation(); window.open(booking.jobConfig.fileUrl, '_blank'); }}
                                    >
                                      <PrintIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, alignItems: 'center' }}>
                                <Typography variant="caption" fontWeight="medium">
                                  {booking.jobConfig?.pageCount}pg × {booking.jobConfig?.copies} ({booking.jobConfig?.isColour ? 'Color' : 'B&W'})
                                </Typography>
                                <Typography variant="caption" color={warning ? 'error.main' : 'text.secondary'} fontWeight={warning ? 'bold' : 'regular'}>
                                  {formatDate(booking.createdAt, 'time')}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </Paper>
        ))}
      </Box>
    </DragDropContext>
  );
}
