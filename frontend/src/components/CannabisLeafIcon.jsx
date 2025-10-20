import { Box } from '@mui/material';
import { cannabisTheme } from '../theme/cannabisTheme';

export default function CannabisLeafIcon({ size = 28, color, sx, ...props }) {
  return (
    <Box
      component="svg"
      width={size}
      height={size}
      viewBox={cannabisTheme.leafIcon.viewBox}
      fill="none"
      sx={{
        color: color || cannabisTheme.colors.primary.main,
        ...sx
      }}
      {...props}
    >
      <path
        d={cannabisTheme.leafIcon.path}
        fill="currentColor"
      />
    </Box>
  );
}
