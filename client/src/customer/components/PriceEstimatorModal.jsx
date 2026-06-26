import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Grid, Typography, Box,
  Divider, IconButton, useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CalculateIcon from '@mui/icons-material/Calculate';
import { calculatePrice, DEFAULT_PRICING } from '../../utils/priceCalculator';
import { formatCurrency } from '../../utils/formatters';

export default function PriceEstimatorModal({ open, onClose }) {
  const theme = useTheme();
  const [pages, setPages] = useState(10);
  const [copies, setCopies] = useState(1);
  const [isColour, setIsColour] = useState(false);
  const [paperSize, setPaperSize] = useState('A4');

  const files = [{
    name: 'Estimate',
    pageCount: pages,
    jobConfig: { copies, isColour, paperSize, pageRange: 'all' }
  }];

  const estimate = calculatePrice(files, DEFAULT_PRICING);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ m: 0, p: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalculateIcon color="primary" /> Price Estimator
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Get a quick estimate before you upload your documents. Rates are based on standard shop pricing.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Number of Pages"
              type="number"
              fullWidth
              value={pages}
              onChange={(e) => setPages(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Copies"
              type="number"
              fullWidth
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Color Type"
              fullWidth
              value={isColour ? 'true' : 'false'}
              onChange={(e) => setIsColour(e.target.value === 'true')}
            >
              <MenuItem value="false">Black & White</MenuItem>
              <MenuItem value="true">Color</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Paper Size"
              fullWidth
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
            >
              <MenuItem value="A4">A4</MenuItem>
              <MenuItem value="A3">A3</MenuItem>
              <MenuItem value="Letter">Letter</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'primaryContainer.main', borderRadius: 3, textAlign: 'center' }}>
          <Typography variant="subtitle2" color="onPrimaryContainer.main" gutterBottom>
            Estimated Total
          </Typography>
          <Typography variant="h3" fontWeight="bold" color="onPrimaryContainer.main">
            {formatCurrency(estimate.totalPrice)}
          </Typography>
          <Typography variant="caption" color="onPrimaryContainer.main" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
            Includes minimum order requirements if applicable.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} variant="contained" fullWidth size="large" sx={{ borderRadius: 8 }}>
          Got It
        </Button>
      </DialogActions>
    </Dialog>
  );
}
