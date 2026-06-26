import React from 'react';
import { 
  Typography, Box, Avatar, Stack, Chip, IconButton, Tooltip, Button 
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import ViewIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import Card, { CardContent } from '../../shared/Card';
import Badge from '../../shared/Badge';
import StatusBadge from './StatusBadge';

const nextStatus = {
  queued: 'printing',
  printing: 'printed',
  printed: 'ready',
  ready: 'completed',
};

const actionLabels = {
  queued: 'Start Printing',
  printing: 'Mark Printed',
  printed: 'Mark Ready',
  ready: 'Complete',
};

export default function QueueCard({ booking, onStatusUpdate, onViewFile, onPrintFile }) {
  const { tokenNumber, customerId, jobConfig, status, thumbnailUrl, fileDeleted, paymentStatus, files = [], printDate, createdAt } = booking;
  const customerName = customerId?.name || 'Customer';
  const customerPhone = customerId?.phone || '';
  const fileCount = files.length || 1;

  return (
    <Card hover sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {/* Thumbnail */}
          <Avatar 
            variant="rounded" 
            src={thumbnailUrl || undefined}
            sx={{ width: 56, height: 56, bgcolor: 'surfaceContainer.main', border: 1, borderColor: 'divider' }}
          >
            {!thumbnailUrl && <ImageIcon color="action" />}
          </Avatar>

          {/* Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" fontWeight="black">#{tokenNumber}</Typography>
                <StatusBadge status={status} />
              </Box>
              <Badge status={paymentStatus} showDot={false} />
            </Box>
            <Typography variant="body2" fontWeight="medium" noWrap>{customerName}</Typography>
            {customerPhone && <Typography variant="caption" color="text.secondary" display="block">{customerPhone}</Typography>}
            <Typography variant="caption" color="text.secondary" display="block">
              Queued {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        </Box>

        {/* Job config summary */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pt: 2, mt: 'auto', borderTop: 1, borderColor: 'divider' }}>
          <Chip size="small" label={`${fileCount} PDF${fileCount === 1 ? '' : 's'}`} sx={{ fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase' }} />
          <Chip size="small" label={`${jobConfig?.pageCount || 0} pg × ${jobConfig?.copies || 1}`} sx={{ fontSize: '0.65rem', fontWeight: 'bold' }} />
          <Chip size="small" label={jobConfig?.isColour ? 'Colour' : 'B&W'} sx={{ fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase' }} />
          <Chip size="small" label={jobConfig?.paperSize || 'A4'} sx={{ fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase' }} />
          <Chip size="small" label={jobConfig?.binding === 'none' ? 'No binding' : jobConfig?.binding || 'No binding'} sx={{ fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase' }} />
          <Chip 
            size="small" 
            color="primary"
            variant="outlined"
            label={`Need ${printDate ? new Date(printDate).toLocaleDateString() : 'ASAP'}`} 
            sx={{ fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase' }} 
          />
        </Box>

        {jobConfig?.comments && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'warningContainer.main', borderRadius: 2 }}>
            <Typography variant="caption" color="onWarningContainer.main">
              <Box component="span" fontWeight="bold">Note:</Box> {jobConfig.comments}
            </Typography>
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mt: 2 }}>
          {nextStatus[status] && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => onStatusUpdate(booking._id, nextStatus[status])}
              sx={{ fontWeight: 'bold' }}
            >
              {actionLabels[status]}
            </Button>
          )}

          {!fileDeleted ? (
            <>
              <Tooltip title="View">
                <IconButton size="small" color="secondary" onClick={() => onViewFile(booking)}>
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Print">
                <IconButton size="small" color="primary" onClick={() => onPrintFile(booking)}>
                  <PrintIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Typography variant="caption" color="text.secondary" fontStyle="italic">File deleted after print</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
