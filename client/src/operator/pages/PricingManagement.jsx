import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import * as operatorAPI from '../../api/operator';
import { addToast } from '../../store/notificationSlice';
import { calculatePrice } from '../../utils/priceCalculator';
import { formatCurrency } from '../../utils/formatters';

import { 
  Box, Typography, Button, Grid, TextField, Paper, Switch, 
  InputAdornment, FormControlLabel
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import Card, { CardContent } from '../../shared/Card';

export default function PricingManagement() {
  const dispatch = useDispatch();
  const [pricing, setPricing] = useState({
    bwPricePerPage: 200,
    colourPricePerPage: 500,
    a3Surchargeperpage: 300,
    minimumOrderAmount: 500,
    allowPayAtCounter: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await operatorAPI.getPricing();
        if (res.data) setPricing(res.data);
      } catch { /* Use defaults */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await operatorAPI.updatePricing(pricing);
      dispatch(addToast({ type: 'success', message: 'Pricing updated!' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to update pricing' }));
    } finally { setSaving(false); }
  };

  // Sample preview
  const sampleBW = calculatePrice({ pageCount: 10, copies: 2, isColour: false, paperSize: 'A4' }, pricing);
  const sampleColour = calculatePrice({ pageCount: 5, copies: 1, isColour: true, paperSize: 'A3' }, pricing);

  const PriceInput = ({ label, field, suffix = 'paise' }) => (
    <Box>
      <TextField
        fullWidth
        label={label}
        type="number"
        value={(pricing[field] / 100).toFixed(2)}
        onChange={(e) => setPricing(prev => ({ ...prev, [field]: Math.round(parseFloat(e.target.value || 0) * 100) }))}
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          inputProps: { min: 0, step: "0.50" }
        }}
        variant="outlined"
      />
      <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
        {pricing[field]} {suffix}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 800, animation: 'fadeIn 0.5s ease', pb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">Pricing</Typography>
        <Typography variant="body2" color="text.secondary">Configure your shop&apos;s pricing rates.</Typography>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Per-Page Rates</Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <PriceInput label="B&W Price per Page" field="bwPricePerPage" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <PriceInput label="Colour Price per Page" field="colourPricePerPage" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <PriceInput label="A3 Size Surcharge per Page" field="a3Surchargeperpage" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <PriceInput label="Minimum Order Amount" field="minimumOrderAmount" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Payment Settings</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Allow Pay at Counter</Typography>
              <Typography variant="body2" color="text.secondary">Let customers pay when they collect</Typography>
            </Box>
            <Switch 
              checked={pricing.allowPayAtCounter}
              onChange={(e) => setPricing(prev => ({ ...prev, allowPayAtCounter: e.target.checked }))}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Price preview */}
      <Paper elevation={0} sx={{ mb: 4, p: 3, bgcolor: 'primaryContainer.main', borderRadius: 4, border: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <LightbulbIcon color="primary" />
          <Typography variant="h6" fontWeight="bold" color="onPrimaryContainer.main">Price Preview</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                10 pages × 2 copies (B&W, A4)
              </Typography>
              <Typography variant="h5" fontWeight="900">
                {formatCurrency(sampleBW.totalPrice)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                5 pages × 1 copy (Colour, A3)
              </Typography>
              <Typography variant="h5" fontWeight="900">
                {formatCurrency(sampleColour.totalPrice)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Button 
        variant="contained" 
        color="primary" 
        size="large"
        onClick={handleSave} 
        disabled={saving}
        sx={{ fontWeight: 'bold', minWidth: 200 }}
      >
        {saving ? 'Saving...' : 'Save Pricing'}
      </Button>
    </Box>
  );
}
