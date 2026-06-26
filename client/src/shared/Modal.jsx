import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  showCloseButton = true,
}) {
  return (
    <Dialog
      open={isOpen}
      onClose={closeOnBackdrop ? onClose : undefined}
      maxWidth={size === 'full' ? false : size}
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4 } // M3 styling
      }}
    >
      {title && (
        <DialogTitle sx={{ m: 0, p: 2 }}>
          {title}
          {showCloseButton && (
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}
      <DialogContent dividers={!!title}>
        {children}
      </DialogContent>
      {footer && (
        <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
          {footer}
        </DialogActions>
      )}
    </Dialog>
  );
}
