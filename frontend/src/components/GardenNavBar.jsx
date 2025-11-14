import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';

export default function GardenNavBar({ value, onChange, items = [] }) {
  return (
    <Paper
      elevation={10}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        borderRadius: 0,
        background: 'rgba(5, 10, 5, 0.9)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(124, 179, 66, 0.2)',
        pb: 'env(safe-area-inset-bottom)'
      }}
    >
      <BottomNavigation
        value={value}
        onChange={(_event, next) => {
          if (next && typeof onChange === 'function') {
            onChange(next);
          }
        }}
        showLabels
        sx={{
          background: 'transparent',
          '& .Mui-selected': {
            color: '#CDDC39 !important'
          }
        }}
      >
        {items.map((item) => (
          <BottomNavigationAction
            key={item.value}
            label={item.label}
            value={item.value}
            icon={item.icon}
            sx={{
              color: '#9CCC65',
              minWidth: 0,
              maxWidth: '120px'
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}

