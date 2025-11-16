// frontend/src/components/ScanResultCard.jsx

import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  Divider,
} from '@mui/material'

/**
 * Props:
 * - result: {
 *     topMatch: {
 *       id,
 *       name,
 *       type,          // e.g. "Hybrid"
 *       description,   // long strain description text
 *       confidence,    // 0–1 or 0–100
 *     },
 *     otherMatches: [
 *       { id, name, type, description, confidence }
 *     ]
 *   }
 * - onSaveMatch(match)
 * - onLogExperience(match)
 * - onReportMismatch(match)
 * - onViewStrain(match)
 */
export default function ScanResultCard({
  result,
  onSaveMatch,
  onLogExperience,
  onReportMismatch,
  onViewStrain,
}) {
  if (!result || !result.topMatch) return null

  const { topMatch, otherMatches = [] } = result

  const confidencePercent =
    topMatch.confidence > 1 ? Math.round(topMatch.confidence) : Math.round(topMatch.confidence * 100)

  const handleSave = () => onSaveMatch && onSaveMatch(topMatch)
  const handleLog = () => onLogExperience && onLogExperience(topMatch)
  const handleMismatch = () => onReportMismatch && onReportMismatch(topMatch)

  return (
    <Box sx={{ mt: 3, mb: 6 }}>
      <Card
        sx={{
          backgroundColor: '#262b26',
          borderRadius: 3,
          border: '1px solid #4b8b3b',
          boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          {/* Top match header */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Typography
              variant="overline"
              sx={{
                color: '#c8e6c9',
                letterSpacing: 1.2,
              }}
            >
              Top match
            </Typography>
            <Chip
              label={`${confidencePercent}% confidence`}
              sx={{
                backgroundColor: '#ffb74d',
                color: '#1b1b1b',
                fontWeight: 600,
                fontSize: 13,
              }}
              size="small"
            />
          </Stack>

          {/* Strain name + type */}
          <Typography
            variant="h4"
            sx={{
              color: '#ffffff',
              fontWeight: 700,
              mb: 0.5,
            }}
          >
            {topMatch.name}
          </Typography>
          {topMatch.type && (
            <Typography
              variant="subtitle1"
              sx={{
                color: '#9ccc65',
                mb: 2,
                fontWeight: 500,
              }}
            >
              {topMatch.type}
            </Typography>
          )}

          {/* Description */}
          {topMatch.description && (
            <Typography
              variant="body1"
              sx={{
                color: '#d8f5c0',
                mb: 3,
                lineHeight: 1.5,
              }}
            >
              {topMatch.description}
            </Typography>
          )}

          {/* Explicit call to action: this is the part that used to trail off */}
          <Typography
            variant="body2"
            sx={{
              color: '#b2df8a',
              mb: 3,
              lineHeight: 1.5,
            }}
          >
            Have you tried this strain before? Tap{' '}
            <strong>Log experience</strong> below to leave a review of how it
            looked, tasted, and felt. Your notes will be saved to your journal
            so you can come back to them later.
          </Typography>

          {/* Primary actions */}
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSave}
              sx={{
                backgroundColor: '#4caf50',
                '&:hover': { backgroundColor: '#43a047' },
                textTransform: 'none',
                fontWeight: 600,
                py: 1.2,
              }}
            >
              Save this match
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={handleLog}
              sx={{
                borderColor: '#8bc34a',
                color: '#c5e1a5',
                '&:hover': {
                  borderColor: '#aed581',
                  backgroundColor: 'rgba(139,195,74,0.08)',
                },
                textTransform: 'none',
                fontWeight: 600,
                py: 1.2,
              }}
            >
              Leave a review / log experience
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={handleMismatch}
              sx={{
                color: '#ef9a9a',
                textTransform: 'none',
                fontWeight: 500,
                py: 1.1,
                opacity: 0.9,
                '&:hover': {
                  backgroundColor: 'rgba(239,154,154,0.1)',
                },
              }}
            >
              Report mismatch
            </Button>
          </Stack>

          {/* Other matches */}
          {otherMatches.length > 0 && (
            <>
              <Divider
                sx={{
                  my: 2.5,
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              />
              <Typography
                variant="subtitle1"
                sx={{ color: '#f5f5f5', mb: 1.5, fontWeight: 600 }}
              >
                Other possible matches
              </Typography>

              <Stack spacing={1.5}>
                {otherMatches.map((m) => {
                  const otherConfidence =
                    m.confidence > 1
                      ? Math.round(m.confidence)
                      : Math.round(m.confidence * 100)

                  const handleView = () =>
                    onViewStrain && onViewStrain(m)

                  return (
                    <Stack
                      key={m.id ?? m.name}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            color: '#c8e6c9',
                            fontWeight: 500,
                            mb: 0.3,
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                          }}
                        >
                          {m.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#a5d6a7',
                            fontSize: 13,
                          }}
                        >
                          Confidence {otherConfidence}% • {m.type || 'Hybrid'}
                        </Typography>
                      </Box>

                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleView}
                        sx={{
                          borderColor: '#8bc34a',
                          color: '#c5e1a5',
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 2.2,
                          whiteSpace: 'nowrap',
                          '&:hover': {
                            borderColor: '#aed581',
                            backgroundColor: 'rgba(139,195,74,0.08)',
                          },
                        }}
                      >
                        View strain
                      </Button>
                    </Stack>
                  )
                })}
              </Stack>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}