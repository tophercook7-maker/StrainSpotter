import { Box, Container, Typography, Stack, List, ListItem, ListItemText, Divider, Button } from '@mui/material';

export default function Guidelines({ onBack }) {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {onBack && (
        <Button onClick={onBack} size="small" variant="contained" sx={{ bgcolor: 'white', color: 'black', textTransform: 'none', fontWeight: 700, borderRadius: 999, mb: 1, '&:hover': { bgcolor: 'grey.100' } }}>Home</Button>
      )}
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
        Community Guidelines
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        These rules keep conversations helpful, safe, and legal. By participating in Groups & Chat, you agree to follow them.
      </Typography>

      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Be respectful</Typography>
          <List dense>
            <ListItem><ListItemText primary="No harassment, bullying, slurs, hate speech, or threats." /></ListItem>
            <ListItem><ListItemText primary="Debate ideas, not people. No personal attacks." /></ListItem>
          </List>
        </Box>
        <Divider />

        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Keep it legal and safe</Typography>
          <List dense>
            <ListItem><ListItemText primary="No buying, selling, trading, or soliciting cannabis, products, or services." /></ListItem>
            <ListItem><ListItemText primary="No arranging meetups, deliveries, or shipping; don’t share contact details to transact." /></ListItem>
            <ListItem><ListItemText primary="Avoid dangerous instructions or dosing advice. Follow local laws and age rules." /></ListItem>
          </List>
        </Box>
        <Divider />

        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>No spam or scams</Typography>
          <List dense>
            <ListItem><ListItemText primary="No promos, giveaways, referral/affiliate links unless approved by admins." /></ListItem>
            <ListItem><ListItemText primary="No link shorteners or off-platform sales groups (Telegram/WhatsApp/Discord)." /></ListItem>
            <ListItem><ListItemText primary="No repetitive, deceptive, or irrelevant content." /></ListItem>
          </List>
        </Box>
        <Divider />

        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Privacy first</Typography>
          <List dense>
            <ListItem><ListItemText primary="Don’t share personal information (phone numbers, emails, addresses, IDs)." /></ListItem>
            <ListItem><ListItemText primary="Don’t pressure others to move off-platform or share private info." /></ListItem>
          </List>
        </Box>
        <Divider />

        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Quality over quantity</Typography>
          <List dense>
            <ListItem><ListItemText primary="Share real experiences and helpful questions. Be specific and honest." /></ListItem>
            <ListItem><ListItemText primary="No medical diagnoses or claims; consult a professional." /></ListItem>
            <ListItem><ListItemText primary="Respect copyrights; don’t post content you don’t own rights to." /></ListItem>
          </List>
        </Box>
        <Divider />

        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Moderation and enforcement</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            We use automated filtering plus community reports. Depending on severity and history, actions may include content removal, warnings, temporary timeouts, or permanent bans.
          </Typography>
          <Typography variant="body2">
            You can report content via the flag button on messages. Appeals are available by replying to moderation notices with context.
          </Typography>
        </Box>
        <Divider />

        <Box>
          <Typography variant="caption" color="text.secondary">
            Health & legal: This is not medical advice. Always comply with your local laws and age requirements.
          </Typography>
        </Box>
      </Stack>
    </Container>
  );
}
