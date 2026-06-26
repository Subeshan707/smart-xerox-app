import React from 'react';
import { Stepper, Step, StepLabel, StepConnector, stepConnectorClasses, styled, Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import PrintIcon from '@mui/icons-material/Print';
import CelebrationIcon from '@mui/icons-material/Celebration';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const steps = [
  { key: 'queued', label: 'Queued' },
  { key: 'printing', label: 'Printing' },
  { key: 'ready', label: 'Ready' },
];

const statusOrder = { queued: 0, printing: 1, printed: 1, ready: 2, completed: 3 };

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
`;

const QConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
    left: 'calc(-50% + 20px)',
    right: 'calc(50% + 20px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.success.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.divider,
    borderTopWidth: 3,
    borderRadius: 1,
    transition: 'border-color 0.3s ease',
  },
}));

function CustomStepIcon({ active, completed, icon }) {
  if (completed) {
    return (
      <Box sx={{ color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: '50%', bgcolor: 'success.light' }}>
        <CheckCircleIcon />
      </Box>
    );
  }

  if (active) {
    if (icon === 2) {
      // Printing step
      return (
        <Box sx={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: '50%', bgcolor: 'info.main', animation: `${bounce} 1s infinite ease-in-out` }}>
          <PrintIcon />
        </Box>
      );
    }
    if (icon === 3) {
      // Ready step
      return (
        <Box sx={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: '50%', bgcolor: 'success.main', animation: `${pulse} 2s infinite` }}>
          <CelebrationIcon />
        </Box>
      );
    }
    // Queued step
    return (
      <Box sx={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: '50%', bgcolor: 'warning.main' }}>
        <HourglassEmptyIcon sx={{ animation: 'spin 3s linear infinite' }} />
      </Box>
    );
  }

  // Pending (not active, not completed)
  return (
    <Box sx={{ color: 'text.disabled', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: '50%', bgcolor: 'action.hover' }}>
      <Typography variant="body2" fontWeight="bold">{icon}</Typography>
    </Box>
  );
}

export default function QueueProgress({ status }) {
  const currentIndex = statusOrder[status] ?? 0;

  return (
    <Stepper activeStep={currentIndex} alternativeLabel connector={<QConnector />}>
      {steps.map((step, index) => {
        return (
          <Step key={step.key}>
            <StepLabel StepIconComponent={CustomStepIcon}>
              <Typography variant="body2" fontWeight={index === currentIndex ? 'bold' : 'medium'} color={index === currentIndex ? 'text.primary' : 'text.secondary'}>
                {step.label}
              </Typography>
            </StepLabel>
          </Step>
        );
      })}
    </Stepper>
  );
}
