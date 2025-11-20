import React, { useMemo, useState } from "react";
import { Box, Card, CardContent, Typography, TextField, Stack } from "@mui/material";

function BusinessSummaryCard({ packaging }) {
  if (!packaging) return null;
  
  const potency = packaging.potency || {};
  const details = packaging.package_details || {};
  const [price, setPrice] = useState("");

  const metrics = useMemo(() => {
    const thcPercent = typeof potency.thc_percent === "number" ? potency.thc_percent : null;
    const grams = typeof details.net_weight_grams === "number" ? details.net_weight_grams : null;
    if (!thcPercent || !grams) {
      return null;
    }
    // Rough estimate: mg THC = grams * 1000 * (thcPercent / 100)
    const mgThc = grams * 1000 * (thcPercent / 100);
    const priceNum = parseFloat(price);
    const costPerMg = !isNaN(priceNum) && priceNum > 0 ? priceNum / mgThc : null;
    const costPerGram = !isNaN(priceNum) && priceNum > 0 ? priceNum / grams : null;
    return { mgThc, costPerMg, costPerGram };
  }, [potency.thc_percent, details.net_weight_grams, price]);

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
          Business mode
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mb: 2 }}>
          Estimate total mg THC and cost metrics for this package.
        </Typography>
        
        <TextField
          label="Enter retail price"
          type="number"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price in your currency"
          fullWidth
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              '& fieldset': {
                borderColor: 'rgba(255,255,255,0.3)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255,255,255,0.5)',
              },
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255,255,255,0.7)',
            },
          }}
        />

        {metrics ? (
          <Stack spacing={1}>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
              Estimated total THC: <strong>{metrics.mgThc.toFixed(0)} mg</strong>
            </Typography>
            {metrics.costPerGram != null && (
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                Cost per gram: <strong>{metrics.costPerGram.toFixed(2)}</strong>
              </Typography>
            )}
            {metrics.costPerMg != null && (
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                Cost per mg THC: <strong>{metrics.costPerMg.toFixed(4)}</strong>
              </Typography>
            )}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontStyle: 'italic' }}>
            THC% and net weight are required for this calculation.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default BusinessSummaryCard;

