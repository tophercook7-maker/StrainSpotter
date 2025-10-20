import { AppBar, Toolbar, Button, Box } from '@mui/material';

export default function TopNav({ current, onNavigate }) {
  const Tab = ({ id, label }) => (
    <Button
      color={current === id ? 'primary' : 'inherit'}
      variant={current === id ? 'contained' : 'text'}
      onClick={() => onNavigate(id)}
      sx={{ mr: 1 }}
    >
      {label}
    </Button>
  );

  return (
    <AppBar position="sticky" sx={{ mb: 2, background: 'linear-gradient(90deg, #0c1b0c 0%, #143014 100%)' }}>
      <Toolbar>
        <Box sx={{ flexGrow: 1 }} />
        <Tab id="home" label="Home" />
        <Tab id="scanner" label="Scanner" />
        <Tab id="history" label="History" />
        <Tab id="growers" label="Growers" />
        <Tab id="groups" label="Groups" />
        <Tab id="dev" label="Dev" />
        <Tab id="feedback" label="Feedback" />
      </Toolbar>
    </AppBar>
  );
}
