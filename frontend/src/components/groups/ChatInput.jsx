// frontend/src/components/groups/ChatInput.jsx
// Discord/Telegram-style message input composer with swipe-to-reply and photo uploads

import { useState, useRef } from 'react';
import { Box, TextField, IconButton, Stack, Typography, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '../../supabaseClient';

export default function ChatInput({
  value,
  onChange,
  onSend,
  onAttach,
  disabled,
  sending,
  placeholder = 'Type a message…',
  showAttach = false,
  replyToMessage = null,
  onCancelReply = null,
  notifyTyping = null,
  scope = 'group', // 'group' or 'dm'
  channelId = null, // groupId or conversationId for uploads
}) {
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || pendingAttachments.length > 0) && !disabled && !sending && !uploading) {
        handleSend();
      }
    }
  };

  const handleChange = (newValue) => {
    onChange?.(newValue);
    // Notify typing when user types
    if (notifyTyping && newValue.trim()) {
      notifyTyping();
    }
  };

  const handleImagePick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (8MB limit)
    if (file.size > 8 * 1024 * 1024) {
      alert('Image must be smaller than 8MB');
      return;
    }

    if (!channelId) {
      alert('Channel ID is required for uploads');
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${crypto.randomUUID()}.${ext}`;
      const path = `${scope}/${channelId}/${filename}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(path, file, {
          contentType: file.type,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('[ChatInput] Upload error', uploadError);
        alert('Failed to upload image. Please try again.');
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(path);

      // Get image dimensions (optional, for better layout)
      const img = new Image();
      img.src = urlData.publicUrl;
      await new Promise((resolve, reject) => {
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
      });

      // Add to pending attachments
      const attachment = {
        type: 'image',
        url: urlData.publicUrl,
        width: img.width,
        height: img.height,
      };

      setPendingAttachments(prev => [...prev, attachment]);
    } catch (err) {
      console.error('[ChatInput] File handling error', err);
      alert('Failed to process image. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSend = () => {
    if (!value.trim() && pendingAttachments.length === 0) return;
    if (disabled || sending || uploading) return;

    // Call onSend with attachments
    onSend?.(value, pendingAttachments.length > 0 ? pendingAttachments : null);
    
    // Clear state
    onChange?.('');
    setPendingAttachments([]);
    if (onCancelReply) {
      onCancelReply();
    }
  };

  const removeAttachment = (index) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const canSend = (value.trim() || pendingAttachments.length > 0) && !disabled && !sending && !uploading;

  return (
    <Box
      sx={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: 1.5,
        flexShrink: 0,
        backgroundColor: 'transparent',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Reply preview bar */}
      {replyToMessage && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1,
            p: 1,
            borderRadius: 1,
            bgcolor: 'rgba(124,179,66,0.15)',
            borderLeft: '3px solid rgba(124,179,66,0.5)',
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#CDDC39', display: 'block' }}>
              Replying to {replyToMessage.senderName || replyToMessage.sender?.display_name || 'someone'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.7rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {replyToMessage.text || replyToMessage.body || replyToMessage.content || ''}
            </Typography>
          </Box>
          {onCancelReply && (
            <IconButton
              size="small"
              onClick={onCancelReply}
              sx={{
                color: '#9CCC65',
                '&:hover': {
                  bgcolor: 'rgba(124,179,66,0.2)',
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )}

      {/* Pending attachments preview */}
      {pendingAttachments.length > 0 && (
        <Box sx={{ mb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {pendingAttachments.map((att, idx) => (
            <Box
              key={idx}
              sx={{
                position: 'relative',
                width: 60,
                height: 60,
                borderRadius: 1,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <img
                src={att.url}
                alt="Attachment preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <IconButton
                size="small"
                onClick={() => removeAttachment(idx)}
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bgcolor: 'rgba(124, 179, 66, 0.2)',
                  color: '#fff',
                  width: 20,
                  height: 20,
                  '&:hover': {
                    bgcolor: 'rgba(124, 179, 66, 0.3)',
                  },
                }}
              >
                <CloseIcon sx={{ fontSize: '0.75rem' }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      <Stack direction="row" spacing={1} alignItems="flex-end">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {/* Image upload button */}
        <IconButton
          onClick={handleImagePick}
          disabled={disabled || uploading || !channelId}
          sx={{
            color: '#9CCC65',
            '&:hover': {
              bgcolor: 'rgba(124,179,66,0.1)',
            },
            '&:disabled': {
              opacity: 0.5,
            },
          }}
        >
          <ImageIcon />
        </IconButton>

        {showAttach && onAttach && (
          <IconButton
            onClick={onAttach}
            disabled={disabled}
            sx={{
              color: '#9CCC65',
              '&:hover': {
                bgcolor: 'rgba(124,179,66,0.1)',
              },
            }}
          >
            <AttachFileIcon />
          </IconButton>
        )}

        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || uploading}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255,255,255,0.05)',
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#F1F8E9',
              '&:hover': {
                borderColor: 'rgba(124,179,66,0.3)',
              },
              '&.Mui-focused': {
                borderColor: 'rgba(124,179,66,0.5)',
                bgcolor: 'rgba(255,255,255,0.08)',
              },
              '& fieldset': {
                border: 'none',
              },
            },
            '& .MuiInputBase-input': {
              padding: '10px 14px',
              fontSize: '0.9rem',
              '&::placeholder': {
                color: 'rgba(255,255,255,0.4)',
                opacity: 1,
              },
            },
          }}
        />

        <IconButton
          onClick={handleSend}
          disabled={!canSend}
          sx={{
            color: canSend ? '#7CB342' : 'rgba(255,255,255,0.3)',
            bgcolor: canSend ? 'rgba(124,179,66,0.2)' : 'transparent',
            '&:hover': {
              bgcolor: canSend ? 'rgba(124,179,66,0.3)' : 'transparent',
            },
            '&:disabled': {
              opacity: 0.5,
            },
          }}
        >
          <SendIcon />
        </IconButton>
      </Stack>

      {uploading && (
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', mt: 0.5, display: 'block' }}>
          Uploading image...
        </Typography>
      )}
    </Box>
  );
}

