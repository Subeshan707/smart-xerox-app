import React from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../shared/Badge';
import { formatDate, formatCurrency } from '../../utils/formatters';

import { Box, Typography, Chip, Avatar } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import Card, { CardContent } from '../../shared/Card';

export default function BookingCard({ booking, showActions = true }) {
  const { jobConfig, status, tokenNumber, totalPrice, paymentStatus, createdAt, thumbnailUrl, files = [], printDate } = booking;
  const fileCount = files.length || 1;

  const isClickable = ['queued', 'printing', 'printed', 'ready'].includes(status);
  
  const content = (
    <Card 
      sx={{ 
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.3s',
        '&:hover': isClickable ? { 
          transform: 'translateY(-2px)',
          boxShadow: 3
        } : {}
      }}
    >
      <CardContent sx={{ pb: '16px !important' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Thumbnail */}
          <Avatar 
            variant="rounded" 
            src={thumbnailUrl || undefined}
            sx={{ width: 56, height: 56, bgcolor: 'surfaceContainerHighest.main', color: 'onSurfaceVariant.main' }}
          >
            {!thumbnailUrl && <DescriptionIcon />}
          </Avatar>

          {/* Details */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  #{tokenNumber}
                </Typography>
                <Badge status={status} />
              </Box>
              <Badge status={paymentStatus} showDot={false} />
            </Box>

            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mb: 1 }}>
              {jobConfig?.fileName || 'Document'} · {jobConfig?.pageCount || 0} pg · {jobConfig?.copies || 1} copies
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(createdAt, 'date-only')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Need {printDate ? formatDate(printDate, 'date-only') : 'ASAP'}
                </Typography>
              </Box>
              <Typography variant="subtitle2" fontWeight="bold">
                {formatCurrency(totalPrice)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Config tags */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Chip size="small" label={jobConfig?.paperSize || 'A4'} sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold', bgcolor: 'surfaceContainerHighest.main' }} />
          <Chip size="small" label={jobConfig?.isColour ? 'Colour' : 'B&W'} sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold', bgcolor: 'surfaceContainerHighest.main' }} />
          {jobConfig?.isDoubleSided && (
            <Chip size="small" label="Double-sided" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold', bgcolor: 'surfaceContainerHighest.main' }} />
          )}
          <Chip size="small" label={jobConfig?.binding === 'none' ? 'No binding' : jobConfig?.binding || 'No binding'} sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold', bgcolor: 'surfaceContainerHighest.main' }} />
        </Box>
      </CardContent>
    </Card>
  );

  if (isClickable) {
    return <Link to={`/app/queue/${booking._id}`} style={{ textDecoration: 'none' }}>{content}</Link>;
  }

  return content;
}
