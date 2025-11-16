import { Fab, Tooltip } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useAuth } from '../hooks/useAuth';

export default function FloatingScanButton({ onClick }) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Tooltip title="Start a new scan" placement="left">
      <Fab
        color="primary"
        onClick={onClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1500,
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)'
        }}
      >
        <CameraAltIcon />
      </Fab>
    </Tooltip>
  );
}


