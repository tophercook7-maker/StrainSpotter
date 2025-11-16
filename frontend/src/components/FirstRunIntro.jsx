import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  MobileStepper
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ScienceIcon from '@mui/icons-material/Science';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';

const slides = [
  {
    icon: <CameraAltIcon sx={{ fontSize: 48 }} />,
    title: 'Snap a bud or label',
    body: 'Use your camera to capture the bud, jar label, or packaging. Clear lighting and sharp focus give Vision the best chance to identify the strain.'
  },
  {
    icon: <ScienceIcon sx={{ fontSize: 48 }} />,
    title: 'AI compares against known strains',
    body: 'We run your photo through Vision, cross-reference 35k+ strains, and rank the closest matches with transparent confidence scores.'
  },
  {
    icon: <PlaylistAddCheckIcon sx={{ fontSize: 48 }} />,
    title: 'Log grows & experiences',
    body: 'Save matches to your journal or grow log, track effects and ratings, and build a personal profile of what works best for you.'
  }
];

export default function FirstRunIntro({ open, onFinish }) {
  const [index, setIndex] = useState(0);
  const activeSlide = useMemo(() => slides[index], [index]);

  const handleNext = () => {
    if (index >= slides.length - 1) {
      onFinish?.();
    } else {
      setIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <Dialog open={open} fullScreen PaperProps={{ sx: { background: '#041204', color: '#fff' } }}>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 3 }}>
        <Box>{activeSlide.icon}</Box>
        <Typography variant="h4" fontWeight={800}>
          {activeSlide.title}
        </Typography>
        <Typography variant="body1" color="rgba(255,255,255,0.75)" sx={{ maxWidth: 420 }}>
          {activeSlide.body}
        </Typography>
        <MobileStepper
          steps={slides.length}
          position="static"
          activeStep={index}
          nextButton={
            <Button variant="contained" color="success" onClick={handleNext}>
              {index === slides.length - 1 ? 'Start scanning' : 'Next'}
            </Button>
          }
          backButton={
            <Button onClick={handleBack} disabled={index === 0}>
              Back
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  );
}


