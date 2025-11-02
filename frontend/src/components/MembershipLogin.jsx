import { useState } from "react";
import { Box, Button, Typography, TextField, Paper, CircularProgress } from "@mui/material";

export default function MembershipLogin({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);

  const handleApply = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/membership/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name: name })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.error || "Application failed");
      setApplied(true);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "none" }}>
      <Paper sx={{ p: 4, borderRadius: 6, minWidth: 340, maxWidth: 400, textAlign: "center", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px)", border: "2px solid rgba(124, 179, 66, 0.3)" }}>
        <Typography variant="h4" sx={{ mb: 2, color: "#fff", fontWeight: 900 }}>Enter the Garden</Typography>
        <Typography variant="body1" sx={{ mb: 3, color: "#e0e0e0" }}>
          Welcome! Please apply for membership to access the full app.
        </Typography>
        <TextField
          label="Full Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Email Address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        {!applied ? (
          <>
            <Button
              variant="contained"
              color="success"
              sx={{
                fontWeight: 700,
                borderRadius: 999,
                px: 4,
                py: 1,
                fontSize: 18,
                boxShadow: "none",
                bgcolor: "rgba(124, 179, 66, 0.3)",
                border: "2px solid rgba(124, 179, 66, 0.6)",
                backdropFilter: "blur(10px)",
                color: "#fff",
                textTransform: "none",
                mb: 2,
                '&:hover': {
                  bgcolor: "rgba(124, 179, 66, 0.5)",
                  border: "2px solid rgba(124, 179, 66, 0.8)"
                }
              }}
              onClick={handleApply}
              disabled={loading || !email || !name}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Apply for Membership"}
            </Button>
            <Button
              variant="text"
              sx={{
                fontWeight: 600,
                color: "#fff",
                textTransform: "none",
                bgcolor: "rgba(124, 179, 66, 0.15)",
                backdropFilter: "blur(10px)",
                '&:hover': {
                  bgcolor: "rgba(124, 179, 66, 0.25)"
                }
              }}
              onClick={() => onSuccess && onSuccess()}
            >
              Skip for now (Browse only)
            </Button>
          </>
        ) : (
          <>
            <Typography variant="h6" sx={{ mt: 3, color: "#fff", mb: 2 }}>
              Membership application complete! You may now enter the garden.
            </Typography>
            <Button
              variant="contained"
              color="success"
              sx={{
                fontWeight: 700,
                borderRadius: 999,
                px: 4,
                py: 1,
                fontSize: 18,
                boxShadow: "none",
                bgcolor: "rgba(124, 179, 66, 0.3)",
                border: "2px solid rgba(124, 179, 66, 0.6)",
                backdropFilter: "blur(10px)",
                color: "#fff",
                textTransform: "none",
                '&:hover': {
                  bgcolor: "rgba(124, 179, 66, 0.5)",
                  border: "2px solid rgba(124, 179, 66, 0.8)"
                }
              }}
              onClick={() => onSuccess && onSuccess()}
            >
              Continue
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}
