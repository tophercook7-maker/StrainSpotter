import React, { useMemo } from "react";
import { Box, Card, CardContent, Typography, Stack, Chip } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

function ComplianceSummaryCard({ packaging }) {
  if (!packaging) return null;

  const reg = packaging.regulatory || {};
  const flags = Array.isArray(reg.compliance_flags) ? reg.compliance_flags : [];

  const hasWarnings = flags.includes("has_state_warning_text");
  const hasSymbol = flags.includes("has_state_symbol");
  const hasLicense = flags.includes("has_license_number");
  const missingLicense = flags.includes("missing_license_number");
  const missingSymbol = flags.includes("missing_state_symbol");

  const risk = useMemo(() => {
    // Simple heuristic: start at 0, add points for missing key fields.
    let score = 0;
    if (!hasLicense || missingLicense) score += 40;
    if (!hasSymbol || missingSymbol) score += 30;
    if (!hasWarnings) score += 20;
    if (!reg.testing_lab_name) score += 10;
    return Math.min(score, 100);
  }, [hasLicense, missingLicense, hasSymbol, missingSymbol, hasWarnings, reg.testing_lab_name]);

  const riskLabel =
    risk >= 70 ? "High" : risk >= 40 ? "Medium" : risk > 0 ? "Low" : "Minimal";

  return (
    <Card
      elevation={6}
      sx={{
        mb: 2.5,
        background: "linear-gradient(135deg, rgba(0,0,0,0.52), rgba(0,0,0,0.72))",
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(14px)",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography
          variant="overline"
          sx={{ color: "rgba(255,255,255,0.6)", letterSpacing: 1.3, mb: 1.5, display: 'block' }}
        >
          Compliance snapshot
        </Typography>
        <Box sx={{ mb: 1.5 }}>
          <Chip
            label={`Risk: ${riskLabel} (${risk}/100)`}
            size="small"
            sx={{
              backgroundColor:
                risk >= 70 ? 'rgba(244, 67, 54, 0.2)' :
                risk >= 40 ? 'rgba(255, 152, 0, 0.2)' :
                risk > 0 ? 'rgba(255, 235, 59, 0.2)' :
                'rgba(76, 175, 80, 0.2)',
              color:
                risk >= 70 ? '#f44336' :
                risk >= 40 ? '#ff9800' :
                risk > 0 ? '#fbc02d' :
                '#4caf50',
              border: '1px solid',
              borderColor:
                risk >= 70 ? '#f44336' :
                risk >= 40 ? '#ff9800' :
                risk > 0 ? '#fbc02d' :
                '#4caf50',
            }}
          />
        </Box>
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {hasLicense && !missingLicense ? (
              <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
            ) : (
              <WarningIcon sx={{ color: '#ff9800', fontSize: 20 }} />
            )}
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
              License number {hasLicense ? "present" : "not detected"}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {hasSymbol && !missingSymbol ? (
              <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
            ) : (
              <WarningIcon sx={{ color: '#ff9800', fontSize: 20 }} />
            )}
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
              State cannabis symbol {hasSymbol ? "present" : "not detected"}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {hasWarnings ? (
              <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
            ) : (
              <WarningIcon sx={{ color: '#ff9800', fontSize: 20 }} />
            )}
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
              Government warning text {hasWarnings ? "present" : "not detected"}
            </Typography>
          </Box>
        </Stack>
        {Array.isArray(reg.warning_statements) && reg.warning_statements.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <details>
              <summary style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
                View warning statements
              </summary>
              <Box component="ul" sx={{ pl: 2, mt: 1, mb: 0 }}>
                {reg.warning_statements.map((w, idx) => (
                  <Typography key={idx} component="li" variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mb: 0.5 }}>
                    {w}
                  </Typography>
                ))}
              </Box>
            </details>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default ComplianceSummaryCard;

