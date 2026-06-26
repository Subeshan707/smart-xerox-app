import React from 'react';
import MuiCard from '@mui/material/Card';
import MuiCardContent from '@mui/material/CardContent';
import MuiCardActions from '@mui/material/CardActions';
import MuiCardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { CardActionArea } from '@mui/material';

export default function Card({
  children,
  className = '',
  hover = false,
  glass = false, // Not using glass in M3
  padding = 'md',
  onClick,
}) {
  const CardRoot = onClick ? CardActionArea : React.Fragment;
  const rootProps = onClick ? { onClick } : {};

  return (
    <MuiCard 
      className={className} 
      variant={hover ? "elevation" : "outlined"}
      sx={{ p: padding === 'none' ? 0 : padding === 'sm' ? 1 : 2 }}
    >
      <CardRoot {...rootProps}>
        {children}
      </CardRoot>
    </MuiCard>
  );
}

// Sub-components for structured cards
export function CardHeader({ children, className = '', title, action }) {
  if (title || action) {
    return <MuiCardHeader title={title} action={action} className={className} />;
  }
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <Typography variant="h6" component="h3" className={className}>
      {children}
    </Typography>
  );
}

export function CardContent({ children, className = '' }) {
  return <MuiCardContent className={className}>{children}</MuiCardContent>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <MuiCardActions className={`flex items-center justify-end gap-3 ${className}`}>
      {children}
    </MuiCardActions>
  );
}
