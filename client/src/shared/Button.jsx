import React from 'react';
import MuiButton from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  // Map our custom variants to MUI variants and colors
  let muiVariant = 'contained';
  let muiColor = 'primary';

  switch (variant) {
    case 'primary':
      muiVariant = 'contained';
      muiColor = 'primary';
      break;
    case 'operator':
      muiVariant = 'contained';
      muiColor = 'primary'; // Will use operator theme from layout
      break;
    case 'secondary':
      muiVariant = 'contained';
      muiColor = 'secondary';
      break;
    case 'ghost':
      muiVariant = 'text';
      muiColor = 'inherit';
      break;
    case 'danger':
      muiVariant = 'contained';
      muiColor = 'error';
      break;
    case 'outline':
      muiVariant = 'outlined';
      muiColor = 'primary';
      break;
    default:
      break;
  }

  // Map sizes
  const muiSize = size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'medium';

  return (
    <MuiButton
      type={type}
      variant={muiVariant}
      color={muiColor}
      size={muiSize}
      disabled={disabled || loading}
      onClick={onClick}
      className={className}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : (iconPosition === 'left' && Icon ? <Icon /> : null)}
      endIcon={!loading && iconPosition === 'right' && Icon ? <Icon /> : null}
      {...props}
    >
      {children}
    </MuiButton>
  );
}
