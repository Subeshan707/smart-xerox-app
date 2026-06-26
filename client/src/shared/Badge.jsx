import React from 'react';
import Chip from '@mui/material/Chip';
import CircleIcon from '@mui/icons-material/Circle';

const statusConfig = {
  queued:    { label: 'Queued',    color: 'default', sx: { bgcolor: '#ADC2FF', color: '#00257A', '& .MuiSvgIcon-root': { color: '#00257A' } } },
  printing:  { label: 'Printing',  color: 'info' },
  printed:   { label: 'Printed',   color: 'secondary' },
  ready:     { label: 'Ready',     color: 'success' },
  completed: { label: 'Completed', color: 'default' },
  cancelled: { label: 'Cancelled', color: 'error' },
  paid:      { label: 'Paid',      color: 'success' },
  pending:   { label: 'Pending',   color: 'warning' },
  failed:    { label: 'Failed',    color: 'error' },
  refund_pending: { label: 'Refunding', color: 'warning' },
  partially_refunded: { label: 'Partial Refund', color: 'secondary' },
  refunded:  { label: 'Refunded',  color: 'secondary' },
};

export default function Badge({ status, showDot = true, className = '' }) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Chip
      label={config.label}
      color={config.color}
      variant="tonal" // M3 soft background style
      className={className}
      icon={showDot ? <CircleIcon sx={{ fontSize: '8px !important' }} /> : undefined}
      size="small"
      sx={config.sx}
    />
  );
}
