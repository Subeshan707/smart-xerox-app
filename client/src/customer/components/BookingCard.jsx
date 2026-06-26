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
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Thumbnail */}
          <Avatar 
            variant="rounded" 
            src={thumbnailUrl || undefined}
            sx={{ width: 48, height: 48, bgcolor: 'surfaceContainer.main', color: 'primary.main' }}
          >
            {!thumbnailUrl && <DescriptionIcon />}
          </Avatar>

          {/* Details */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" fontWeight="bold" noWrap>
                Token #{tokenNumber}
              </Typography>
              <Badge status={status} />
            </Box>

            <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ mt: 0.5 }}>
              {jobConfig?.fileName || 'Document'} · {jobConfig?.pageCount || 0} pg
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Chip 
                label={formatCurrency(totalPrice)} 
                color="warning" 
                variant="tonal" 
                size="small" 
                sx={{ height: 20, fontSize: '0.75rem', fontWeight: 'bold' }} 
              />
              <Typography variant="caption" color="text.secondary" fontWeight="medium">
                {formatDate(createdAt, 'date-only')}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (isClickable) {
    return <Link to={`/app/queue/${booking._id}`} style={{ textDecoration: 'none' }}>{content}</Link>;
  }

  return content;
}
