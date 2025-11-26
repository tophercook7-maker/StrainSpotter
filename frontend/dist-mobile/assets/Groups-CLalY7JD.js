var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, D as Dialog, p as DialogTitle, q as DialogContent, S as Stack, T as Typography, m as TextField, u as DialogActions, i as Button, B as Box, M as Avatar, a4 as GroupsIcon, ay as Badge, I as IconButton, y as ArrowBackIcon, az as MoreVertIcon, ai as CloseIcon, aA as ImageIcon, aB as AttachFileIcon, O as SendIcon, aC as useTheme, aD as useMediaQuery, A as Alert, o as Link, f as Card, k as Tabs, l as Tab, aE as ChatIcon, h as CardContent, aF as ToggleButtonGroup, aG as ToggleButton, aH as ArrowBackIosNewIcon, aI as List, aJ as ListItem, aK as ListItemText, aL as ListItemAvatar, s as FormControlLabel, t as Checkbox, as as Snackbar } from "./react-vendor-DaVUs1pH.js";
import { B as BackHeader } from "./BackHeader-jwQJOBEe.js";
import { u as useAuth, a as API_BASE, s as supabase } from "./App-BxlAc3TE.js";
import "./vendor-qR99EfKL.js";
function ProfileSetupDialog({
  open,
  email,
  initialDisplayName = "",
  saving = false,
  error = "",
  onSave,
  onClose
}) {
  const [displayName, setDisplayName] = reactExports.useState(initialDisplayName);
  reactExports.useEffect(() => {
    if (open) {
      setDisplayName(initialDisplayName || "");
    }
  }, [open, initialDisplayName]);
  const handleSubmit = /* @__PURE__ */ __name(() => {
    const trimmedName = displayName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return;
    }
    onSave?.({
      displayName: trimmedName
    });
  }, "handleSubmit");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Dialog,
    {
      open,
      onClose,
      maxWidth: "xs",
      fullWidth: true,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { sx: { fontWeight: 700, color: "#2e7d32" }, children: "Complete Your Profile" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, sx: { mt: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "text.secondary" }, children: "Pick the name other members will see in groups and direct messages. You can change this anytime." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TextField,
            {
              label: "Display Name",
              value: displayName,
              onChange: /* @__PURE__ */ __name((e) => setDisplayName(e.target.value), "onChange"),
              placeholder: "e.g. Topher",
              required: true,
              inputProps: { maxLength: 60 }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TextField,
            {
              label: "Email",
              value: email || "",
              InputProps: { readOnly: true }
            }
          ),
          error && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#d32f2f" }, children: error })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogActions, { sx: { px: 3, pb: 2 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onClose, disabled: saving, children: "Not now" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "contained",
              onClick: handleSubmit,
              disabled: saving,
              children: saving ? "Saving..." : "Save"
            }
          )
        ] })
      ]
    }
  );
}
__name(ProfileSetupDialog, "ProfileSetupDialog");
function normalizeMessage(msg, mode, currentUserId) {
  if (mode === "group") {
    return {
      id: msg.id,
      groupId: msg.group_id,
      senderId: msg.sender_user_id,
      senderName: msg.users?.display_name || msg.users?.username || "User",
      senderAvatarUrl: msg.users?.avatar_url || null,
      text: msg.body,
      attachments: msg.image_url ? [{ type: "image", url: msg.image_url }] : [],
      createdAt: msg.created_at,
      isSystem: false,
      isPinned: msg.is_pinned || false,
      raw: msg
      // Keep raw data for compatibility
    };
  } else {
    const attachments = Array.isArray(msg.attachments) ? msg.attachments : msg.image_url ? [{ type: "image", url: msg.image_url }] : [];
    return {
      id: msg.id,
      dmId: msg.conversation_id,
      senderId: msg.sender_id || msg.sender_user_id,
      senderName: msg.sender?.display_name || msg.sender?.username || msg.profiles?.display_name || msg.profiles?.username || "User",
      senderAvatarUrl: msg.sender?.avatar_url || msg.profiles?.avatar_url || null,
      text: msg.text || msg.body || "",
      attachments,
      createdAt: msg.created_at,
      isSystem: false,
      raw: msg
      // Keep raw data for compatibility
    };
  }
}
__name(normalizeMessage, "normalizeMessage");
function useInfiniteMessages({ mode, id }) {
  const { session } = useAuth();
  const [messages, setMessages] = reactExports.useState([]);
  const [pinnedMessages, setPinnedMessages] = reactExports.useState([]);
  const [isLoadingInitial, setIsLoadingInitial] = reactExports.useState(true);
  const [isLoadingMore, setIsLoadingMore] = reactExports.useState(false);
  const [hasMore, setHasMore] = reactExports.useState(false);
  const [nextCursor, setNextCursor] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  const scrollToBottomRef = reactExports.useRef(null);
  const scrollContainerRef = reactExports.useRef(null);
  const isNearBottomRef = reactExports.useRef(true);
  const shouldAutoScrollRef = reactExports.useRef(true);
  const handleScroll = reactExports.useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const distanceFromBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
    isNearBottomRef.current = distanceFromBottom < 200;
  }, []);
  const scrollToBottom = reactExports.useCallback((behavior = "smooth") => {
    if (scrollToBottomRef.current) {
      scrollToBottomRef.current.scrollIntoView({ behavior, block: "end" });
    }
  }, []);
  reactExports.useEffect(() => {
    if (!id || !session?.access_token) {
      setMessages([]);
      setPinnedMessages([]);
      setIsLoadingInitial(false);
      return;
    }
    let cancel = false;
    setIsLoadingInitial(true);
    setError(null);
    shouldAutoScrollRef.current = true;
    const token = session.access_token;
    const url = mode === "group" ? `${API_BASE}/api/groups/${id}/messages?limit=50` : `${API_BASE}/api/dm/${id}/messages?limit=50`;
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }).then(async (res) => {
      if (!res.ok) {
        console.error("[useInfiniteMessages] Failed to load messages", res.status, res.statusText);
        if (!cancel) {
          setError(new Error(`Failed to load messages (${res.status})`));
          setIsLoadingInitial(false);
          setHasMore(false);
        }
        return { messages: [], pinned: [], hasMore: false, error: "unavailable" };
      }
      return res.json();
    }).then((data) => {
      if (cancel) return;
      if (data.error) {
        console.warn("[useInfiniteMessages] backend indicated error", data.error);
      }
      const incoming = data.messages || [];
      const normalizedMessages = incoming.map(
        (msg) => normalizeMessage(msg, mode)
      );
      normalizedMessages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      setMessages(normalizedMessages);
      if (mode === "group" && data.pinned) {
        const normalizedPinned = (data.pinned || []).map(
          (msg) => normalizeMessage(msg, mode)
        );
        setPinnedMessages(normalizedPinned);
      }
      setHasMore(data.hasMore || false);
      setNextCursor(data.nextCursor || null);
      setTimeout(() => {
        scrollToBottom("auto");
        isNearBottomRef.current = true;
      }, 100);
    }).catch((err) => {
      console.error("[useInfiniteMessages] error", err);
      if (!cancel) {
        setMessages([]);
        setHasMore(false);
        setError("Unable to load messages");
      }
    }).finally(() => {
      if (!cancel) {
        setIsLoadingInitial(false);
      }
    });
    return () => {
      cancel = true;
    };
  }, [id, mode, session]);
  const loadMore = reactExports.useCallback(async () => {
    if (!id || !session?.access_token || isLoadingMore || !hasMore || !nextCursor) {
      return;
    }
    setIsLoadingMore(true);
    setError(null);
    const container = scrollContainerRef.current;
    const oldScrollHeight = container ? container.scrollHeight : 0;
    const token = session.access_token;
    const url = mode === "group" ? `${API_BASE}/api/groups/${id}/messages?limit=50&before=${encodeURIComponent(nextCursor)}` : `${API_BASE}/api/dm/${id}/messages?limit=50&before=${encodeURIComponent(nextCursor)}`;
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to load more messages: ${res.status} ${text}`);
      }
      const data = await res.json();
      const normalizedMessages = (data.messages || []).map(
        (msg) => normalizeMessage(msg, mode)
      );
      normalizedMessages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      setMessages((prev) => {
        const combined = [...normalizedMessages, ...prev];
        const unique = combined.reduce((acc, msg) => {
          if (!acc.find((m) => m.id === msg.id)) {
            acc.push(msg);
          }
          return acc;
        }, []);
        return unique.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });
      setHasMore(data.hasMore || false);
      setNextCursor(data.nextCursor || null);
      if (container) {
        const newScrollHeight = container.scrollHeight;
        const scrollDiff = newScrollHeight - oldScrollHeight;
        container.scrollTop += scrollDiff;
      }
    } catch (err) {
      console.error("[useInfiniteMessages] loadMore error", err);
      setError(err?.message || "Failed to load more messages");
    } finally {
      setIsLoadingMore(false);
    }
  }, [id, mode, session, isLoadingMore, hasMore, nextCursor]);
  const onNewMessage = reactExports.useCallback((newMsg) => {
    const normalized = normalizeMessage(newMsg, mode);
    setMessages((prev) => {
      if (prev.find((m) => m.id === normalized.id)) {
        return prev;
      }
      return [...prev, normalized].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    });
    if (isNearBottomRef.current) {
      setTimeout(() => {
        scrollToBottom("smooth");
      }, 100);
    }
  }, [mode, session, scrollToBottom]);
  return {
    messages,
    pinnedMessages,
    isLoadingInitial,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    scrollToBottomRef,
    scrollContainerRef,
    onNewMessage,
    scrollToBottom,
    handleScroll
  };
}
__name(useInfiniteMessages, "useInfiniteMessages");
function useTypingIndicator({ scope, id, currentUserId }) {
  const { session } = useAuth();
  const [typingUsers, setTypingUsers] = reactExports.useState([]);
  const typingTimeoutRef = reactExports.useRef(null);
  const lastTypingSentRef = reactExports.useRef(0);
  reactExports.useEffect(() => {
    if (!id || !scope || !session?.access_token) {
      setTypingUsers([]);
      return;
    }
    const pollTyping = /* @__PURE__ */ __name(async () => {
      try {
        const token = session.access_token;
        const res = await fetch(`${API_BASE}/api/chat/typing?scope=${scope}&id=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        if (res.ok) {
          const data = await res.json();
          setTypingUsers(data.users || []);
        }
      } catch (err) {
        console.error("[useTypingIndicator] poll error", err);
      }
    }, "pollTyping");
    pollTyping();
    const interval = setInterval(pollTyping, 3e3);
    return () => clearInterval(interval);
  }, [id, scope, session]);
  const notifyTyping = reactExports.useCallback(() => {
    if (!id || !scope || !session?.access_token || !currentUserId) {
      return;
    }
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2e3) {
      return;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    const token = session.access_token;
    fetch(`${API_BASE}/api/chat/typing`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        scope,
        id,
        isTyping: true
      })
    }).catch((err) => {
      console.error("[useTypingIndicator] notifyTyping error", err);
    });
    lastTypingSentRef.current = now;
    typingTimeoutRef.current = setTimeout(() => {
      fetch(`${API_BASE}/api/chat/typing`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          scope,
          id,
          isTyping: false
        })
      }).catch((err) => {
        console.error("[useTypingIndicator] stopTyping error", err);
      });
    }, 5e3);
  }, [id, scope, session, currentUserId]);
  reactExports.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (id && scope && session?.access_token && currentUserId) {
        fetch(`${API_BASE}/api/chat/typing`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            scope,
            id,
            isTyping: false
          })
        }).catch(() => {
        });
      }
    };
  }, [id, scope, session, currentUserId]);
  return {
    typingUsers,
    notifyTyping
  };
}
__name(useTypingIndicator, "useTypingIndicator");
function formatTime$1(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const now = /* @__PURE__ */ new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 6e4);
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}
__name(formatTime$1, "formatTime$1");
function messageSnippet(content) {
  if (!content) return "No messages yet";
  return content.length > 50 ? `${content.slice(0, 47)}…` : content;
}
__name(messageSnippet, "messageSnippet");
function GroupList({ groups, selectedGroupId, onSelectGroup, isLoading }) {
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { p: 2, textAlign: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(255,255,255,0.5)" }, children: "Loading groups..." }) });
  }
  if (!groups || groups.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { p: 2, textAlign: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(255,255,255,0.5)" }, children: "No groups available" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Box,
    {
      sx: {
        flex: 1,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        padding: 1
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 0.5, children: groups.map((group) => {
        const isActive = group.id === selectedGroupId;
        const lastMessage = group.last_message;
        const unreadCount = group.unread_count || 0;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Box,
          {
            onClick: /* @__PURE__ */ __name(() => onSelectGroup?.(group), "onClick"),
            sx: {
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              padding: "10px 12px",
              borderRadius: 2,
              cursor: "pointer",
              backgroundColor: isActive ? "rgba(124, 179, 66, 0.15)" : "transparent",
              border: isActive ? "1px solid rgba(124, 179, 66, 0.3)" : "1px solid transparent",
              "&:hover": {
                backgroundColor: isActive ? "rgba(124, 179, 66, 0.2)" : "rgba(255,255,255,0.06)"
              },
              transition: "background-color 0.2s"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Avatar,
                {
                  sx: {
                    width: 40,
                    height: 40,
                    bgcolor: "rgba(124, 179, 66, 0.3)",
                    color: "#CDDC39",
                    flexShrink: 0
                  },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(GroupsIcon, {})
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { flex: 1, minWidth: 0 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Typography,
                    {
                      variant: "subtitle2",
                      sx: {
                        fontWeight: 600,
                        color: "#F1F8E9",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      },
                      children: group.name
                    }
                  ),
                  lastMessage && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Typography,
                    {
                      variant: "caption",
                      sx: {
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "0.7rem",
                        flexShrink: 0,
                        ml: 1
                      },
                      children: formatTime$1(lastMessage.created_at)
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Typography,
                    {
                      variant: "caption",
                      sx: {
                        color: "rgba(255,255,255,0.6)",
                        fontSize: "0.75rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1
                      },
                      children: lastMessage ? `${lastMessage.user?.display_name || lastMessage.user?.username || "Someone"}: ${messageSnippet(lastMessage.content)}` : "No messages yet"
                    }
                  ),
                  unreadCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Badge,
                    {
                      badgeContent: unreadCount,
                      sx: {
                        "& .MuiBadge-badge": {
                          bgcolor: "#7CB342",
                          color: "#0c220f",
                          fontWeight: 700,
                          fontSize: "0.65rem",
                          minWidth: "18px",
                          height: "18px"
                        }
                      }
                    }
                  )
                ] })
              ] })
            ]
          },
          group.id
        );
      }) })
    }
  );
}
__name(GroupList, "GroupList");
function GroupHeader({
  group,
  memberCount,
  onBack,
  onMenu,
  isMobile = false,
  typingUsers = []
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Box,
    {
      sx: {
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        paddingX: 1.5,
        paddingY: 1,
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
        backgroundColor: "transparent",
        backdropFilter: "blur(10px)",
        minHeight: 44,
        maxHeight: 44
      },
      children: [
        onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(
          IconButton,
          {
            onClick: onBack,
            sx: {
              color: "#CDDC39",
              "&:hover": {
                bgcolor: "rgba(124,179,66,0.1)"
              }
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowBackIcon, {})
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Box,
          {
            sx: {
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: "rgba(124, 179, 66, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(GroupsIcon, { sx: { color: "#CDDC39" } })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { flex: 1, minWidth: 0 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "subtitle1",
              sx: {
                fontWeight: 600,
                color: "#F1F8E9",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              },
              children: group?.name || "Group"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Typography,
            {
              variant: "caption",
              sx: {
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.75rem"
              },
              children: [
                memberCount || 0,
                " member",
                memberCount !== 1 ? "s" : ""
              ]
            }
          ),
          typingUsers.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "caption",
              sx: {
                color: "#9CCC65",
                fontSize: "0.7rem",
                fontStyle: "italic",
                mt: 0.25
              },
              children: typingUsers.length === 1 ? `${typingUsers[0].displayName} is typing…` : "Several people are typing…"
            }
          )
        ] }),
        onMenu && /* @__PURE__ */ jsxRuntimeExports.jsx(
          IconButton,
          {
            onClick: onMenu,
            sx: {
              color: "#9CCC65",
              "&:hover": {
                bgcolor: "rgba(124,179,66,0.1)"
              }
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(MoreVertIcon, {})
          }
        )
      ]
    }
  );
}
__name(GroupHeader, "GroupHeader");
function ChatInput({
  value,
  onChange,
  onSend,
  onAttach,
  disabled,
  sending,
  placeholder = "Type a message…",
  showAttach = false,
  replyToMessage = null,
  onCancelReply = null,
  notifyTyping = null,
  scope = "group",
  // 'group' or 'dm'
  channelId = null
  // groupId or conversationId for uploads
}) {
  const [pendingAttachments, setPendingAttachments] = reactExports.useState([]);
  const [uploading, setUploading] = reactExports.useState(false);
  const fileInputRef = reactExports.useRef(null);
  const handleKeyDown = /* @__PURE__ */ __name((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || pendingAttachments.length > 0) && !disabled && !sending && !uploading) {
        handleSend();
      }
    }
  }, "handleKeyDown");
  const handleChange = /* @__PURE__ */ __name((newValue) => {
    onChange?.(newValue);
    if (notifyTyping && newValue.trim()) {
      notifyTyping();
    }
  }, "handleChange");
  const handleImagePick = /* @__PURE__ */ __name(() => {
    fileInputRef.current?.click();
  }, "handleImagePick");
  const handleFileSelect = /* @__PURE__ */ __name(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert("Image must be smaller than 8MB");
      return;
    }
    if (!channelId) {
      alert("Channel ID is required for uploads");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${crypto.randomUUID()}.${ext}`;
      const path = `${scope}/${channelId}/${filename}`;
      const { error: uploadError } = await supabase.storage.from("chat-attachments").upload(path, file, {
        contentType: file.type,
        cacheControl: "3600"
      });
      if (uploadError) {
        console.error("[ChatInput] Upload error", uploadError);
        alert("Failed to upload image. Please try again.");
        return;
      }
      const { data: urlData } = supabase.storage.from("chat-attachments").getPublicUrl(path);
      const img = new Image();
      img.src = urlData.publicUrl;
      await new Promise((resolve, reject) => {
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
      });
      const attachment = {
        type: "image",
        url: urlData.publicUrl,
        width: img.width,
        height: img.height
      };
      setPendingAttachments((prev) => [...prev, attachment]);
    } catch (err) {
      console.error("[ChatInput] File handling error", err);
      alert("Failed to process image. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, "handleFileSelect");
  const handleSend = /* @__PURE__ */ __name(() => {
    if (!value.trim() && pendingAttachments.length === 0) return;
    if (disabled || sending || uploading) return;
    onSend?.(value, pendingAttachments.length > 0 ? pendingAttachments : null);
    onChange?.("");
    setPendingAttachments([]);
    if (onCancelReply) {
      onCancelReply();
    }
  }, "handleSend");
  const removeAttachment = /* @__PURE__ */ __name((index) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  }, "removeAttachment");
  const canSend = (value.trim() || pendingAttachments.length > 0) && !disabled && !sending && !uploading;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Box,
    {
      sx: {
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: 1.5,
        flexShrink: 0,
        backgroundColor: "transparent",
        backdropFilter: "blur(10px)"
      },
      children: [
        replyToMessage && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Box,
          {
            sx: {
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1,
              p: 1,
              borderRadius: 1,
              bgcolor: "rgba(124,179,66,0.15)",
              borderLeft: "3px solid rgba(124,179,66,0.5)"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { flex: 1, minWidth: 0 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { fontWeight: 600, color: "#CDDC39", display: "block" }, children: [
                  "Replying to ",
                  replyToMessage.senderName || replyToMessage.sender?.display_name || "someone"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Typography,
                  {
                    variant: "caption",
                    sx: {
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "0.7rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "block"
                    },
                    children: replyToMessage.text || replyToMessage.body || replyToMessage.content || ""
                  }
                )
              ] }),
              onCancelReply && /* @__PURE__ */ jsxRuntimeExports.jsx(
                IconButton,
                {
                  size: "small",
                  onClick: onCancelReply,
                  sx: {
                    color: "#9CCC65",
                    "&:hover": {
                      bgcolor: "rgba(124,179,66,0.2)"
                    }
                  },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(CloseIcon, { fontSize: "small" })
                }
              )
            ]
          }
        ),
        pendingAttachments.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mb: 1, display: "flex", gap: 1, flexWrap: "wrap" }, children: pendingAttachments.map((att, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Box,
          {
            sx: {
              position: "relative",
              width: 60,
              height: 60,
              borderRadius: 1,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.2)"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: att.url,
                  alt: "Attachment preview",
                  style: {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                IconButton,
                {
                  size: "small",
                  onClick: /* @__PURE__ */ __name(() => removeAttachment(idx), "onClick"),
                  sx: {
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bgcolor: "rgba(124, 179, 66, 0.2)",
                    color: "#fff",
                    width: 20,
                    height: 20,
                    "&:hover": {
                      bgcolor: "rgba(124, 179, 66, 0.3)"
                    }
                  },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(CloseIcon, { sx: { fontSize: "0.75rem" } })
                }
              )
            ]
          },
          idx
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, alignItems: "flex-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: fileInputRef,
              type: "file",
              accept: "image/*",
              style: { display: "none" },
              onChange: handleFileSelect
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            IconButton,
            {
              onClick: handleImagePick,
              disabled: disabled || uploading || !channelId,
              sx: {
                color: "#9CCC65",
                "&:hover": {
                  bgcolor: "rgba(124,179,66,0.1)"
                },
                "&:disabled": {
                  opacity: 0.5
                }
              },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ImageIcon, {})
            }
          ),
          showAttach && onAttach && /* @__PURE__ */ jsxRuntimeExports.jsx(
            IconButton,
            {
              onClick: onAttach,
              disabled,
              sx: {
                color: "#9CCC65",
                "&:hover": {
                  bgcolor: "rgba(124,179,66,0.1)"
                }
              },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(AttachFileIcon, {})
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TextField,
            {
              fullWidth: true,
              multiline: true,
              maxRows: 4,
              value,
              onChange: /* @__PURE__ */ __name((e) => handleChange(e.target.value), "onChange"),
              onKeyDown: handleKeyDown,
              placeholder,
              disabled: disabled || uploading,
              variant: "outlined",
              sx: {
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,255,255,0.05)",
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#F1F8E9",
                  "&:hover": {
                    borderColor: "rgba(124,179,66,0.3)"
                  },
                  "&.Mui-focused": {
                    borderColor: "rgba(124,179,66,0.5)",
                    bgcolor: "rgba(255,255,255,0.08)"
                  },
                  "& fieldset": {
                    border: "none"
                  }
                },
                "& .MuiInputBase-input": {
                  padding: "10px 14px",
                  fontSize: "0.9rem",
                  "&::placeholder": {
                    color: "rgba(255,255,255,0.4)",
                    opacity: 1
                  }
                }
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            IconButton,
            {
              onClick: handleSend,
              disabled: !canSend,
              sx: {
                color: canSend ? "#7CB342" : "rgba(255,255,255,0.3)",
                bgcolor: canSend ? "rgba(124,179,66,0.2)" : "transparent",
                "&:hover": {
                  bgcolor: canSend ? "rgba(124,179,66,0.3)" : "transparent"
                },
                "&:disabled": {
                  opacity: 0.5
                }
              },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(SendIcon, {})
            }
          )
        ] }),
        uploading && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "rgba(255,255,255,0.6)", fontSize: "0.7rem", mt: 0.5, display: "block" }, children: "Uploading image..." })
      ]
    }
  );
}
__name(ChatInput, "ChatInput");
function formatTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const now = /* @__PURE__ */ new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 6e4);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
__name(formatTime, "formatTime");
function getInitials(name) {
  return name.slice(0, 2).toUpperCase();
}
__name(getInitials, "getInitials");
function GroupMessages({
  messages,
  pinnedMessages,
  isLoadingInitial,
  isLoadingMore,
  hasMore,
  onLoadMore,
  scrollContainerRef,
  scrollToBottomRef,
  onScroll,
  currentUserId,
  onReply = null,
  group,
  onBack,
  onSend,
  typingUsers = []
}) {
  const { user } = useAuth();
  const userId = currentUserId || user?.id;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [replyTo, setReplyTo] = reactExports.useState(null);
  const clearReply = /* @__PURE__ */ __name(() => setReplyTo(null), "clearReply");
  const handleSend = /* @__PURE__ */ __name((text, attachments) => {
    if (onSend) {
      onSend(text, attachments, replyTo);
      clearReply();
    }
  }, "handleSend");
  const scrollAnchorRef = reactExports.useRef(null);
  const touchStartXRef = reactExports.useRef(0);
  const touchStartYRef = reactExports.useRef(0);
  const loading = isLoadingInitial;
  if (!loading && (!messages || messages.length === 0)) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Box,
      {
        sx: {
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          bgcolor: "#0a0f0a"
          // Match app background
        },
        children: [
          group && /* @__PURE__ */ jsxRuntimeExports.jsx(
            GroupHeader,
            {
              group,
              onBack,
              typingUsers,
              isMobile
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: {
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            textAlign: "center"
          }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#9CCC65", mb: 1 }, children: "Couldn't load messages right now. You can still send a new one." }),
            onSend && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#7CB342" }, children: "Try sending a message to refresh the conversation." })
          ] }) }),
          group && onSend && /* @__PURE__ */ jsxRuntimeExports.jsx(
            ChatInput,
            {
              value: "",
              onChange: /* @__PURE__ */ __name(() => {
              }, "onChange"),
              onSend: handleSend,
              disabled: false,
              sending: false,
              placeholder: "Type a message…",
              replyToMessage: replyTo,
              onCancelReply: clearReply,
              scope: "group",
              channelId: group.id
            }
          )
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Box,
    {
      sx: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        bgcolor: "#0a0f0a",
        // Match app background
        width: "100%"
        // Ensure full width
      },
      children: [
        group && /* @__PURE__ */ jsxRuntimeExports.jsx(
          GroupHeader,
          {
            group,
            onBack,
            typingUsers,
            isMobile
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Box,
          {
            sx: {
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              paddingBottom: "16px"
            },
            ref: scrollContainerRef,
            onScroll,
            children: [
              loading && (!messages || messages.length === 0) && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                p: 2,
                color: "#9CCC65"
              }, children: "Loading messages…" }),
              !loading && (!messages || messages.length === 0) && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: {
                p: 2,
                color: "#9CCC65",
                textAlign: "center",
                mt: 2
              }, children: "No messages yet. Be the first to say hi 👋" }),
              hasMore && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mb: 2, display: "flex", justifyContent: "center", pt: 2 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  onClick: onLoadMore,
                  disabled: isLoadingMore,
                  variant: "outlined",
                  size: "small",
                  sx: {
                    color: "#9CCC65",
                    borderColor: "rgba(124,179,66,0.4)",
                    "&:hover": {
                      borderColor: "rgba(124,179,66,0.6)",
                      bgcolor: "rgba(124,179,66,0.1)"
                    }
                  },
                  children: isLoadingMore ? "Loading…" : "Load earlier messages"
                }
              ) }),
              pinnedMessages && pinnedMessages.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Box,
                {
                  sx: {
                    mb: 2,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "rgba(205, 220, 57, 0.15)",
                    border: "2px solid rgba(205, 220, 57, 0.4)"
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Typography,
                      {
                        variant: "subtitle2",
                        sx: {
                          color: "#CDDC39",
                          fontWeight: 700,
                          mb: 1,
                          fontSize: "0.75rem"
                        },
                        children: "📌 Pinned Messages"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 1, children: pinnedMessages.slice(0, 3).map((pm) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Typography,
                      {
                        variant: "caption",
                        sx: {
                          color: "#F1F8E9",
                          fontSize: "0.75rem",
                          display: "block"
                        },
                        children: pm.body || pm.text || pm.content
                      },
                      pm.id
                    )) })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 1, sx: { px: 2 }, children: (Array.isArray(messages) ? messages : []).filter((m) => !m.isPinned && !m.pinned_at).map((message, idx) => {
                const msg = message.raw || message;
                const isMine = msg.sender_user_id === userId || msg.senderId === userId;
                const senderName = msg.senderName || msg.users?.display_name || msg.users?.username || msg.sender?.display_name || msg.sender?.username || "User";
                const text = msg.text || msg.body || msg.content || "";
                const createdAt = msg.createdAt || msg.created_at;
                const avatarUrl = msg.senderAvatarUrl || msg.users?.avatar_url || msg.sender?.avatar_url || null;
                const prevMessage = idx > 0 ? messages[idx - 1] : null;
                const prevMsg = prevMessage?.raw || prevMessage;
                const isSameSender = prevMsg && (prevMsg.sender_user_id === msg.sender_user_id || prevMsg.senderId === msg.senderId);
                const showAvatar = !isMine && (!isSameSender || idx === 0);
                const showName = !isMine && !isSameSender;
                const handleTouchStart = /* @__PURE__ */ __name((e) => {
                  if (!isMobile || !onReply || isMine) return;
                  touchStartXRef.current = e.touches[0].clientX;
                  touchStartYRef.current = e.touches[0].clientY;
                }, "handleTouchStart");
                const handleTouchEnd = /* @__PURE__ */ __name((e) => {
                  if (!isMobile || !onReply || isMine) return;
                  const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
                  const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartYRef.current);
                  if (deltaX > 40 && deltaY < 50) {
                    onReply(message);
                  }
                }, "handleTouchEnd");
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Box,
                  {
                    onTouchStart: handleTouchStart,
                    onTouchEnd: handleTouchEnd,
                    sx: {
                      display: "flex",
                      justifyContent: isMine ? "flex-end" : "flex-start",
                      paddingX: 1,
                      paddingY: showAvatar ? 0.5 : 0.25,
                      cursor: isMobile && !isMine && onReply ? "grab" : "default",
                      userSelect: "none"
                    },
                    children: [
                      !isMine && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Avatar,
                        {
                          sx: {
                            width: 32,
                            height: 32,
                            bgcolor: "rgba(124, 179, 66, 0.3)",
                            color: "#CDDC39",
                            mr: 1,
                            flexShrink: 0,
                            display: showAvatar ? "flex" : "none"
                          },
                          src: avatarUrl,
                          children: getInitials(senderName)
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Box,
                        {
                          sx: {
                            maxWidth: "75%",
                            minWidth: "120px"
                          },
                          children: [
                            showName && /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Typography,
                              {
                                variant: "caption",
                                sx: {
                                  color: "rgba(255,255,255,0.7)",
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  mb: 0.25,
                                  display: "block"
                                },
                                children: senderName
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              Box,
                              {
                                sx: {
                                  borderRadius: 3,
                                  padding: "8px 12px",
                                  backgroundColor: isMine ? "rgba(124, 179, 66, 0.25)" : "rgba(255, 255, 255, 0.08)",
                                  border: isMine ? "1px solid rgba(124, 179, 66, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                                  backdropFilter: "blur(10px)"
                                },
                                children: [
                                  text && /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    Typography,
                                    {
                                      variant: "body2",
                                      sx: {
                                        color: "#F1F8E9",
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                        fontSize: "0.9rem",
                                        lineHeight: 1.4
                                      },
                                      children: text
                                    }
                                  ),
                                  msg.image_url && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mt: text ? 1 : 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    "img",
                                    {
                                      src: msg.image_url,
                                      alt: "Attachment",
                                      style: {
                                        maxWidth: "100%",
                                        borderRadius: "8px",
                                        display: "block"
                                      }
                                    }
                                  ) }),
                                  msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mt: text ? 1 : 0, display: "flex", flexDirection: "column", gap: 1 }, children: msg.attachments.map((att, idx2) => {
                                    if (att.type === "image" && att.url) {
                                      return /* @__PURE__ */ jsxRuntimeExports.jsx(
                                        Box,
                                        {
                                          sx: {
                                            borderRadius: 2,
                                            overflow: "hidden",
                                            border: "1px solid rgba(255,255,255,0.1)"
                                          },
                                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                            "img",
                                            {
                                              src: att.url,
                                              alt: "Message attachment",
                                              style: {
                                                maxWidth: "100%",
                                                height: "auto",
                                                display: "block"
                                              }
                                            }
                                          )
                                        },
                                        idx2
                                      );
                                    }
                                    return null;
                                  }) }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                    Typography,
                                    {
                                      variant: "caption",
                                      sx: {
                                        display: "block",
                                        textAlign: isMine ? "right" : "left",
                                        color: "rgba(255,255,255,0.5)",
                                        fontSize: "0.65rem",
                                        marginTop: 0.25
                                      },
                                      children: [
                                        formatTime(createdAt),
                                        msg.optimistic && " • sending…"
                                      ]
                                    }
                                  )
                                ]
                              }
                            )
                          ]
                        }
                      )
                    ]
                  },
                  msg.id || idx
                );
              }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  ref: scrollAnchorRef,
                  "data-scroll-anchor": "group-messages-end",
                  style: { height: 1 }
                }
              ),
              scrollToBottomRef && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: scrollToBottomRef })
            ]
          }
        ),
        group && onSend && /* @__PURE__ */ jsxRuntimeExports.jsx(
          ChatInput,
          {
            value: "",
            onChange: /* @__PURE__ */ __name(() => {
            }, "onChange"),
            onSend: handleSend,
            disabled: false,
            sending: false,
            placeholder: "Type a message…",
            replyToMessage: replyTo,
            onCancelReply: clearReply,
            scope: "group",
            channelId: group.id
          }
        )
      ]
    }
  );
}
__name(GroupMessages, "GroupMessages");
function Groups({ userId: userIdProp, onNavigate, onBack }) {
  const { user: authUser } = useAuth();
  useTheme();
  const isMobile = useMediaQuery("(max-width:900px)");
  const [groups, setGroups] = reactExports.useState([]);
  const [groupsInitialized, setGroupsInitialized] = reactExports.useState(false);
  const [userId, setUserId] = reactExports.useState(userIdProp || authUser?.id || null);
  const [selectedGroup, setSelectedGroup] = reactExports.useState(null);
  const [groupDialogOpen, setGroupDialogOpen] = reactExports.useState(false);
  const [members, setMembers] = reactExports.useState([]);
  const groupMessagesHook = useInfiniteMessages({
    mode: "group",
    id: selectedGroup?.id || null
  });
  const groupTypingHook = useTypingIndicator({
    scope: "group",
    id: selectedGroup?.id || null,
    currentUserId: userId
  });
  const [messages, setMessages] = reactExports.useState([]);
  const [pinnedMessages, setPinnedMessages] = reactExports.useState([]);
  const [userRole, setUserRole] = reactExports.useState("consumer");
  const [input, setInput] = reactExports.useState("");
  const [sending, setSending] = reactExports.useState(false);
  const [sendError, setSendError] = reactExports.useState("");
  const [replyTo, setReplyTo] = reactExports.useState(null);
  reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [activeTab, setActiveTab] = reactExports.useState(0);
  const [directChats, setDirectChats] = reactExports.useState([]);
  const [selectedChat, setSelectedChat] = reactExports.useState(null);
  const [chatDialogOpen, setChatDialogOpen] = reactExports.useState(false);
  const [dmConversationId, setDmConversationId] = reactExports.useState(null);
  const [allUsers, setAllUsers] = reactExports.useState([]);
  const dmMessagesHook = useInfiniteMessages({
    mode: "dm",
    id: dmConversationId || null
  });
  const [directMessages, setDirectMessages] = reactExports.useState([]);
  const [usersError, setUsersError] = reactExports.useState(null);
  const [loadingUsers, setLoadingUsers] = reactExports.useState(false);
  const [userSearchTerm, setUserSearchTerm] = reactExports.useState("");
  const [dmFilter, setDmFilter] = reactExports.useState("recent");
  reactExports.useState(false);
  const ALLOWED_GROUPS = [
    "Growers",
    "Budtenders",
    "Medical",
    "Recreational",
    "Local Chat",
    "General",
    "Dispensary Owners",
    "Seed Swap",
    "Events",
    "Help & Advice"
  ];
  const [isMember, setIsMember] = reactExports.useState(false);
  const [reportDialogOpen, setReportDialogOpen] = reactExports.useState(false);
  const [reportingMessage, setReportingMessage] = reactExports.useState(null);
  const [reportReason, setReportReason] = reactExports.useState("inappropriate");
  const [reportDetails, setReportDetails] = reactExports.useState("");
  const [guidelinesOpen, setGuidelinesOpen] = reactExports.useState(false);
  const [guidelinesChecked, setGuidelinesChecked] = reactExports.useState(false);
  const [guidelinesAccepted, setGuidelinesAccepted] = reactExports.useState(false);
  const [snackbar, setSnackbar] = reactExports.useState({ open: false, message: "", severity: "success" });
  const guidelinesKey = reactExports.useMemo(() => `ss_guidelines_accepted_${userId || "guest"}`, [userId]);
  const handleSnackbarClose = /* @__PURE__ */ __name((_event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, "handleSnackbarClose");
  const normalizeText = reactExports.useCallback((value) => (value || "").toString().toLowerCase().trim(), []);
  const userDisplayName = reactExports.useCallback((user) => {
    return user?.display_name || user?.username || (user?.email ? user.email.split("@")[0] : null) || "User";
  }, []);
  const filteredDirectChats = reactExports.useMemo(() => {
    const term = normalizeText(userSearchTerm);
    if (!term) return directChats;
    return directChats.filter((chat) => normalizeText(userDisplayName(chat.user)).includes(term));
  }, [directChats, userSearchTerm, normalizeText, userDisplayName]);
  const filteredUsers = reactExports.useMemo(() => {
    const term = normalizeText(userSearchTerm);
    const list = allUsers.map((user) => ({
      ...user,
      _label: userDisplayName(user)
    })).sort((a, b) => a._label.localeCompare(b._label));
    if (!term) return list;
    return list.filter((user) => normalizeText(user._label).includes(term));
  }, [allUsers, userSearchTerm, normalizeText, userDisplayName]);
  const [adminUserId, setAdminUserId] = reactExports.useState(null);
  const [lastRefresh, setLastRefresh] = reactExports.useState(null);
  const [profileInfo, setProfileInfo] = reactExports.useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = reactExports.useState(false);
  const [profileSaving, setProfileSaving] = reactExports.useState(false);
  const [profileError, setProfileError] = reactExports.useState("");
  const [profilePromptDismissed, setProfilePromptDismissed] = reactExports.useState(false);
  const sendHeartbeat = reactExports.useCallback(async () => {
    if (!userId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      await fetch(`${API_BASE}/api/users/heartbeat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error("[Groups] Heartbeat failed:", err);
    }
  }, [userId]);
  const formatTimestamp = reactExports.useCallback((iso) => {
    if (!iso) return "";
    const date = new Date(iso);
    const diffSeconds = (Date.now() - date.getTime()) / 1e3;
    if (diffSeconds < 45) return "just now";
    if (diffSeconds < 90) return "1 min ago";
    const diffMinutes = diffSeconds / 60;
    if (diffMinutes < 60) return `${Math.round(diffMinutes)} min ago`;
    const diffHours = diffMinutes / 60;
    if (diffHours < 24) return `${Math.round(diffHours)} hr${Math.round(diffHours) === 1 ? "" : "s"} ago`;
    const diffDays = diffHours / 24;
    if (diffDays < 30) return `${Math.round(diffDays)} day${Math.round(diffDays) === 1 ? "" : "s"} ago`;
    return date.toLocaleDateString();
  }, []);
  const messageSnippet2 = reactExports.useCallback((content) => {
    if (!content) return "";
    return content.length > 90 ? `${content.slice(0, 87)}…` : content;
  }, []);
  const [currentUserName, setCurrentUserName] = reactExports.useState("You");
  const shouldPromptProfile = reactExports.useCallback((profile, email, id) => {
    const name = (profile?.display_name || "").trim();
    if (!name) return true;
    if (name.length < 3) return true;
    const lower = name.toLowerCase();
    const emailPrefix = email ? email.split("@")[0].toLowerCase() : "";
    const sanitizedEmail = emailPrefix.replace(/[^a-z]/g, "");
    const fallbacks = [
      emailPrefix,
      sanitizedEmail,
      `user_${(id || "").slice(0, 8)}`.toLowerCase(),
      `user ${(id || "").slice(0, 8)}`.toLowerCase(),
      `member ${(id || "").slice(0, 8)}`.toLowerCase()
    ];
    if (fallbacks.includes(lower)) return true;
    if (lower.includes("@")) return true;
    if (/_/.test(lower) || /[0-9]{3,}/.test(lower)) return true;
    return false;
  }, []);
  const deriveDisplayName = reactExports.useCallback((profile, email, id) => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.username) return profile.username;
    if (email === "topher.cook7@gmail.com") return "Topher";
    if (email) return email.split("@")[0];
    if (id) return `Member ${id.slice(0, 8)}`;
    return "You";
  }, []);
  reactExports.useEffect(() => {
    if (userIdProp) {
      setUserId(userIdProp);
      return;
    }
    if (authUser?.id) {
      setUserId(authUser.id);
      console.log("[Groups] Using auth context user:", authUser.email);
      return;
    }
    let sub;
    (async () => {
      try {
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        const sessionUserId = data?.session?.user?.id || null;
        console.log("[Groups] Session user ID:", sessionUserId);
        setUserId(sessionUserId);
      } catch {
        console.error("Groups: getSession failed");
      }
    })();
    if (supabase) {
      const listener = supabase.auth.onAuthStateChange((_e, session) => {
        setUserId(session?.user?.id || null);
      });
      sub = listener?.data?.subscription;
    }
    return () => sub?.unsubscribe?.();
  }, [userIdProp, authUser]);
  reactExports.useEffect(() => {
    if (!userId) return;
    sendHeartbeat();
    const interval = setInterval(() => {
      sendHeartbeat();
    }, 6e4);
    return () => clearInterval(interval);
  }, [userId, sendHeartbeat]);
  const hasLoadedRef = reactExports.useRef(false);
  const lastUserIdRef = reactExports.useRef(null);
  const loadGroups = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      console.log("[Groups] Fetching from:", `${API_BASE}/api/groups`);
      const res = await fetch(`${API_BASE}/api/groups`);
      console.log("[Groups] Response status:", res.status, res.statusText);
      if (res.ok) {
        const payload = await res.json();
        console.log("[Groups] Received groups:", payload?.length || 0);
        const curated = Array.isArray(payload) ? payload.filter((group) => ALLOWED_GROUPS.includes(group.name)) : [];
        console.log("[Groups] Filtered groups:", curated?.length || 0);
        setGroups(curated || []);
        setGroupsInitialized(true);
        setAdminUserId((prev) => {
          if (!prev && Array.isArray(payload) && payload.length) {
            return payload[0]?.admin_user_id || null;
          }
          return prev;
        });
      } else {
        console.error("[Groups] Failed to fetch groups:", res.status, res.statusText);
        setGroups([]);
      }
    } catch (err) {
      console.error("[Groups] Fetch error:", err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    if (!userId) {
      setLoading(false);
      hasLoadedRef.current = false;
      lastUserIdRef.current = null;
      return;
    }
    if (hasLoadedRef.current && lastUserIdRef.current === userId) {
      return;
    }
    hasLoadedRef.current = true;
    lastUserIdRef.current = userId;
    loadGroups();
  }, [userId, loadGroups]);
  reactExports.useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        console.log("[Groups] Auto-setting up user account for:", userId);
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email;
        if (email) {
          const { data: profile } = await supabase.from("profiles").select("display_name, username, email, role").eq("user_id", userId).single();
          const profileWithEmail = profile ? { ...profile, email: profile.email ?? email } : { display_name: null, username: null, email, role: "consumer" };
          setProfileInfo(profileWithEmail);
          setUserRole(profile?.role || "consumer");
          const userName = deriveDisplayName(profileWithEmail, email, userId);
          setCurrentUserName(userName);
          if (!profilePromptDismissed && shouldPromptProfile(profileWithEmail, email, userId)) {
            setProfileDialogOpen(true);
          }
          console.log("[Groups] Ensuring user record exists for:", userId, email);
          const ensureRes = await fetch(`${API_BASE}/api/users/ensure`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, email, username: userName })
          });
          if (ensureRes.ok) {
            console.log("[Groups] User account ready");
          }
        } else if (!profilePromptDismissed) {
          setProfileDialogOpen(true);
        }
      } catch (e) {
        console.error("[Groups] Auto-setup error:", e);
      }
    })();
  }, [userId, profilePromptDismissed, deriveDisplayName, shouldPromptProfile]);
  reactExports.useEffect(() => {
    const stored = localStorage.getItem(guidelinesKey);
    if (stored === "true") setGuidelinesAccepted(true);
  }, [guidelinesKey]);
  const loadMessages = reactExports.useCallback(async (groupId) => {
    try {
      console.log("📥 Loading messages for group:", groupId);
      console.log("📥 API URL:", `${API_BASE}/api/groups/${groupId}/messages`);
      const res = await fetch(`${API_BASE}/api/groups/${groupId}/messages`);
      console.log("📥 Load messages response:", res.status, res.ok);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(data);
          setPinnedMessages([]);
        } else {
          setMessages(data.messages || []);
          setPinnedMessages(data.pinnedMessages || []);
        }
        console.log("📥 Loaded messages:", (data.messages || data).length, "messages");
        console.log("📥 Loaded pinned messages:", (data.pinnedMessages || []).length);
        setLastRefresh(/* @__PURE__ */ new Date());
      } else {
        console.error("❌ Failed to load messages:", res.status, res.statusText);
      }
    } catch (e) {
      console.error("❌ Error loading messages:", e);
    }
  }, []);
  reactExports.useEffect(() => {
    if (!selectedGroup || !groupDialogOpen) {
      setMessages([]);
      return;
    }
    console.log("🔄 Starting auto-refresh for group:", selectedGroup.id);
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing messages...");
      if (selectedGroup?.id && groupDialogOpen) {
        loadMessages(selectedGroup.id);
      }
    }, 3e3);
    return () => {
      console.log("🛑 Stopping auto-refresh");
      clearInterval(interval);
      setMessages([]);
    };
  }, [selectedGroup?.id, groupDialogOpen, loadMessages]);
  reactExports.useEffect(() => {
    if (chatDialogOpen && selectedChat) {
      setDirectMessages(dmMessagesHook.messages.map((m) => m.raw || m));
    }
  }, [dmMessagesHook.messages, chatDialogOpen, selectedChat]);
  const loadDirectChats = reactExports.useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/direct-chats/chats/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setDirectChats(data);
      }
    } catch (e) {
      console.error("Failed to load direct chats:", e);
    }
  }, [userId]);
  const loadDirectMessages = reactExports.useCallback(async (otherUserId) => {
    if (!userId) return;
    try {
      console.log("💬 Loading direct messages with user:", otherUserId);
      const res = await fetch(`${API_BASE}/api/direct-messages/${userId}/${otherUserId}`);
      console.log("💬 Direct messages response:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("💬 Loaded direct messages:", data.length);
        setDirectMessages(data);
        setLastRefresh(/* @__PURE__ */ new Date());
      }
    } catch (e) {
      console.error("Failed to load direct messages:", e);
    }
  }, [userId]);
  const startDirectChat = reactExports.useCallback(async (otherUser) => {
    console.log("💬 Starting direct chat with:", otherUser.display_name || otherUser.username, otherUser.user_id);
    setSelectedChat(otherUser);
    setDirectMessages([]);
    setChatDialogOpen(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token && userId) {
        const res = await fetch(`${API_BASE}/api/dm/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ userId: otherUser.user_id })
        });
        if (res.ok) {
          const data = await res.json();
          setDmConversationId(data.conversation_id || data.id);
        }
      }
    } catch (e) {
      console.error("Failed to get conversation ID:", e);
    }
    await loadDirectMessages(otherUser.user_id);
    if (userId) {
      try {
        await fetch(`${API_BASE}/api/direct-messages/mark-read/${userId}/${otherUser.user_id}`, {
          method: "PUT"
        });
        loadDirectChats();
      } catch (e) {
        console.error("Failed to mark messages as read:", e);
      }
    }
  }, [userId, loadDirectMessages, loadDirectChats]);
  reactExports.useEffect(() => {
    if (activeTab === 1 && userId) {
      const interval = setInterval(() => {
        loadDirectChats();
      }, 5e3);
      return () => clearInterval(interval);
    }
  }, [activeTab, userId, loadDirectChats]);
  reactExports.useEffect(() => {
    if (activeTab === 1 && userId) {
      console.log("🔄 Direct Messages tab activated, loading users...");
      console.log("🔄 API_BASE:", API_BASE);
      console.log("🔄 userId:", userId);
      loadAllUsers();
      loadDirectChats();
      const openDMWith = sessionStorage.getItem("openDMWith");
      if (openDMWith) {
        try {
          const userData = JSON.parse(openDMWith);
          sessionStorage.removeItem("openDMWith");
          setTimeout(() => {
            if (startDirectChat) {
              startDirectChat(userData);
              setActiveTab(1);
            }
          }, 1e3);
        } catch (e) {
          console.error("Failed to parse openDMWith:", e);
        }
      }
    }
  }, [activeTab, userId, loadDirectChats, startDirectChat]);
  const loadMembers = /* @__PURE__ */ __name(async (groupId) => {
    console.log("👥 Loading members for group:", groupId);
    const res = await fetch(`${API_BASE}/api/groups/${groupId}/members`);
    if (res.ok) {
      const data = await res.json();
      console.log("👥 Members loaded:", data.length, "members");
      console.log("👥 Member details:", data.map((m) => ({
        user_id: m.user_id,
        username: m.users?.username,
        email: m.users?.email
      })));
      setMembers(data);
      setIsMember(userId ? data.some((m) => m.user_id === userId) : false);
      return data;
    }
    console.error("👥 Failed to load members:", res.status);
    return [];
  }, "loadMembers");
  const loadAllUsers = /* @__PURE__ */ __name(async () => {
    setUsersError(null);
    setLoadingUsers(true);
    try {
      console.log("👤 Loading all users from:", `${API_BASE}/api/users`);
      console.log("👤 Current user ID:", userId);
      const res = await fetch(`${API_BASE}/api/users`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });
      console.log("👤 Users response status:", res.status, res.statusText);
      console.log("👤 Response headers:", Object.fromEntries(res.headers.entries()));
      if (res.ok) {
        const data = await res.json();
        console.log("👤 Total users loaded:", data.length);
        console.log("👤 User details:", data.map((u) => ({
          user_id: u.user_id,
          display_name: u.display_name,
          username: u.username,
          email: u.email
        })));
        const otherUsers = data.filter((u) => u.user_id !== userId);
        console.log("👤 Other users (excluding current):", otherUsers.length);
        setAllUsers(otherUsers);
        setUsersError(null);
      } else {
        const errorText = await res.text();
        console.error("👤 Failed to load users:", res.status, res.statusText);
        console.error("👤 Error response:", errorText);
        const errorMsg = `Failed to load users: ${res.status} ${res.statusText}`;
        setUsersError(errorMsg);
      }
    } catch (e) {
      console.error("👤 Failed to load users - Exception:", e);
      console.error("👤 Error stack:", e.stack);
      const errorMsg = `Cannot connect to backend: ${e.message}

Make sure:
1. Backend is running (npm run dev)
2. You're on the same WiFi network
3. API_BASE is set to: ${API_BASE}`;
      setUsersError(errorMsg);
    } finally {
      setLoadingUsers(false);
    }
  }, "loadAllUsers");
  const handleProfileSave = /* @__PURE__ */ __name(async ({ displayName }) => {
    setProfileSaving(true);
    setProfileError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error("Please log in again.");
      }
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          display_name: displayName
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update profile.");
      }
      const { profile } = await res.json();
      if (profile) {
        setProfileInfo(profile);
        const friendlyName = deriveDisplayName(profile, profile.email || session?.user?.email, userId);
        setCurrentUserName(friendlyName);
      }
      setProfileDialogOpen(false);
      setProfilePromptDismissed(false);
      setSnackbar({ open: true, message: "Profile updated!", severity: "success" });
      if (selectedGroup) {
        await loadMembers(selectedGroup.id);
      }
      await loadAllUsers();
    } catch (e) {
      console.error("[Groups] Profile update failed:", e);
      setProfileError(e.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  }, "handleProfileSave");
  const handleProfileDialogClose = /* @__PURE__ */ __name(() => {
    setProfileDialogOpen(false);
    setProfilePromptDismissed(true);
  }, "handleProfileDialogClose");
  const sendDirectMessage = /* @__PURE__ */ __name(async () => {
    const content = input.trim();
    if (!content || !selectedChat) return;
    if (!userId) {
      alert("Please log in to send messages.");
      onNavigate && onNavigate("login");
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      alert("Please log in to send messages.");
      onNavigate && onNavigate("login");
      return;
    }
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      content,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      sender_id: userId,
      receiver_id: selectedChat.user_id,
      sender: {
        user_id: userId,
        display_name: currentUserName,
        username: currentUserName,
        avatar_url: null
      },
      optimistic: true
    };
    setDirectMessages((prev) => [...prev, optimisticMessage]);
    setInput("");
    const apiUrl = `${API_BASE}/api/direct-messages`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1e4);
      console.log("🚀 Sending direct message to:", apiUrl);
      console.log("📝 Message content:", content);
      console.log("👤 Sender ID:", userId);
      console.log("👤 Receiver ID:", selectedChat.user_id);
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: selectedChat.user_id,
          content
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        console.log("✅ Direct message sent successfully!");
        const responseData = await res.json();
        setDirectMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        if (responseData && responseData.id) {
          dmMessagesHook.onNewMessage(responseData);
        } else {
          setTimeout(async () => {
            if (selectedChat?.user_id) {
              await loadDirectMessages(selectedChat.user_id);
            }
          }, 500);
        }
        loadDirectChats();
        setInput("");
      } else {
        const errorText = await res.text();
        console.error("❌ Server error response:", errorText);
        setDirectMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        alert(`Failed to send direct message!

Status: ${res.status} ${res.statusText}
Error: ${errorText}

API: ${apiUrl}

Make sure:
1. Backend is running
2. You're on the same WiFi
3. API is: ${API_BASE}`);
      }
    } catch (e) {
      setDirectMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      console.error("❌ Send direct message error:", e);
      alert(`Failed to send direct message!

Error: ${e.message}

API: ${apiUrl}

This usually means:
1. Backend is not running
2. Wrong WiFi network
3. Firewall blocking connection

Current API: ${API_BASE}`);
    }
  }, "sendDirectMessage");
  const selectGroup = /* @__PURE__ */ __name(async (g) => {
    console.log("📂 Opening group:", g.name, g.id);
    console.log("📂 Current messages state before clearing:", messages.length);
    setSelectedGroup(g);
    setMessages([]);
    console.log("📂 Messages cleared, opening dialog");
    setGroupDialogOpen(true);
    await loadMessages(g.id);
    const currentMembers = await loadMembers(g.id);
    const alreadyMember = userId ? currentMembers.some((m) => m.user_id === userId) : false;
    if (userId && !alreadyMember) {
      await joinGroup({ group: g, silent: true });
      await loadMembers(g.id);
      await loadMessages(g.id);
    }
  }, "selectGroup");
  const joinGroup = /* @__PURE__ */ __name(async ({ group = selectedGroup, silent = false } = {}) => {
    const targetGroup = group;
    if (!targetGroup) return;
    try {
      if (!userId) {
        if (!silent) {
          alert("Please log in to join groups.");
          onNavigate && onNavigate("login");
        }
        return;
      }
      const res = await fetch(`${API_BASE}/api/groups/${targetGroup.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });
      if (res.ok) {
        await loadMembers(targetGroup.id);
        setIsMember(true);
        if (!silent) {
          setSnackbar({ open: true, message: "Joined group!", severity: "success" });
        }
        return;
      }
      const err = await res.json().catch(() => ({}));
      const message = err.error || "";
      if (typeof message === "string" && message.toLowerCase().includes("already a member")) {
        await loadMembers(targetGroup.id);
        setIsMember(true);
        if (!silent) {
          setSnackbar({ open: true, message: "You are already in this group.", severity: "info" });
        }
        return;
      }
      if (!silent) {
        alert(message || "Failed to join group");
      } else {
        console.error("Failed to join group silently:", message || "Unknown error");
      }
    } catch (e) {
      console.error("Failed to join group", e);
      if (!silent) {
        alert("Failed to join group");
      }
    }
  }, "joinGroup");
  const closeGroupDialog = reactExports.useCallback(() => {
    setGroupDialogOpen(false);
    setSelectedGroup(null);
    setMessages([]);
  }, []);
  const sendMessage = /* @__PURE__ */ __name(async (textOverride = null, attachmentsOverride = null) => {
    const content = (textOverride || input).trim();
    if (!content || !selectedGroup) return;
    if (sending) return;
    if (!guidelinesAccepted) {
      setGuidelinesOpen(true);
      return;
    }
    if (!userId) {
      setSendError("Please log in to send messages.");
      onNavigate && onNavigate("login");
      return;
    }
    setSending(true);
    setSendError("");
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      setSendError("Please log in to send messages.");
      setSending(false);
      onNavigate && onNavigate("login");
      return;
    }
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      content,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      user_id: userId,
      users: {
        id: userId,
        display_name: currentUserName,
        username: currentUserName,
        avatar_url: null
      },
      optimistic: true
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    const messageToSend = input;
    setInput("");
    const replyToId = replyTo?.id || null;
    setReplyTo(null);
    let timeoutId;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 1e4);
      const apiUrl = `${API_BASE}/api/groups/${selectedGroup.id}/messages`;
      console.log("🚀 Sending message to:", apiUrl);
      console.log("📝 Message content:", content);
      console.log("👤 User ID:", userId);
      const payload = {
        content: messageToSend.trim() || null,
        user_id: userId,
        // Include reply_to_id if backend supports it (will be ignored if not)
        reply_to_id: replyToId,
        // Include attachments if provided (from parameter or state)
        attachments: attachmentsOverride && attachmentsOverride.length > 0 ? attachmentsOverride : null
      };
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      console.log("📡 Response status:", res.status);
      console.log("📡 Response ok:", res.ok);
      if (res.ok) {
        console.log("✅ Message sent successfully!");
        const responseData = await res.json();
        console.log("📨 Response data:", responseData);
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        if (responseData && responseData.id) {
          console.log("📨 Adding message from response:", responseData);
          groupMessagesHook.onNewMessage(responseData);
        } else {
          console.log("📨 No message in response, reloading...");
          setTimeout(async () => {
          }, 500);
        }
        loadGroups();
      } else {
        let body = null;
        try {
          body = await res.json();
        } catch {
          body = null;
        }
        const errorMsg = body?.error || body?.hint || `Send failed (${res.status})`;
        console.error("❌ Server error response:", errorMsg);
        setSendError(errorMsg);
        setInput(messageToSend);
        if (replyToId) {
          const currentMessages = groupMessagesHook.messages || [];
          const originalReply = currentMessages.find((m) => m.id === replyToId || m.raw?.id === replyToId);
          if (originalReply) setReplyTo(originalReply);
        }
      }
    } catch (err) {
      console.error("❌ Error sending message:", err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      let errorMsg = "Failed to send message. Please try again.";
      if (err.name === "AbortError") {
        errorMsg = "Request timed out. Please check your connection and try again.";
      } else if (err.message) {
        errorMsg = err.message;
      }
      setSendError(errorMsg);
      setInput(messageToSend);
      if (replyToId) {
        const originalReply = messages.find((m) => m.id === replyToId);
        if (originalReply) setReplyTo(originalReply);
      }
    } finally {
      setSending(false);
    }
  }, "sendMessage");
  const handleReport = /* @__PURE__ */ __name(async () => {
    if (!reportingMessage) return;
    try {
      if (!userId) {
        alert("Please log in to report messages.");
        onNavigate && onNavigate("login");
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {
        "Content-Type": "application/json"
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`${API_BASE}/api/moderation/report`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message_id: reportingMessage.id,
          reported_by: userId,
          reason: reportReason,
          details: reportDetails
        })
      });
      if (res.ok) {
        alert("Report submitted. Thank you for helping keep our community safe.");
        setReportDialogOpen(false);
        setReportingMessage(null);
        setReportDetails("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit report");
      }
    } catch (e) {
      console.error("Failed to submit report", e);
      alert("Failed to submit report");
    }
  }, "handleReport");
  reactExports.useEffect(() => {
    if (!selectedGroup) return;
    const updated = groups.find((g) => g.id === selectedGroup.id);
    if (updated && updated !== selectedGroup) {
      setSelectedGroup(updated);
    }
  }, [groups, selectedGroup, groupsInitialized]);
  const sortedGroups = reactExports.useMemo(() => {
    if (!groupsInitialized || !Array.isArray(groups)) {
      return [];
    }
    if (groups.length === 0) {
      return [];
    }
    try {
      const copy = [...groups];
      return copy.sort((a, b) => {
        if (!a || !b) return 0;
        const aTime = a?.last_message?.created_at || a?.created_at || 0;
        const bTime = b?.last_message?.created_at || b?.created_at || 0;
        try {
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        } catch {
          return 0;
        }
      });
    } catch (err) {
      console.error("[Groups] Error sorting groups:", err);
      return groups;
    }
  }, [groups, groupsInitialized]);
  const renderGroupButton = /* @__PURE__ */ __name((group) => {
    if (!group || !group.id) {
      return null;
    }
    try {
      const last = group?.last_message;
      const lastAuthor = last?.user?.display_name || last?.user?.username;
      const snippet = last ? `${lastAuthor ? `${lastAuthor}: ` : ""}${messageSnippet2(last?.content || "")}` : "No conversations yet.";
      const timestamp = formatTimestamp(last?.created_at || group?.created_at);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "outlined",
          onClick: /* @__PURE__ */ __name(() => selectGroup(group), "onClick"),
          fullWidth: true,
          sx: {
            justifyContent: "space-between",
            alignItems: "flex-start",
            textAlign: "left",
            p: 2,
            borderRadius: 3,
            borderColor: "rgba(124,179,66,0.4)",
            bgcolor: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            color: "#CDDC39",
            "&:hover": {
              bgcolor: "rgba(124,179,66,0.2)",
              borderColor: "rgba(124,179,66,0.6)"
            }
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 0.5, sx: { flex: 1, pr: 2 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle1", sx: { fontWeight: 700, color: "#CDDC39" }, children: group?.name || "Unnamed Group" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#9CCC65" }, children: snippet }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { color: "#7CB342" }, children: [
                group?.member_count || 0,
                " member",
                (group?.member_count || 0) === 1 ? "" : "s"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "rgba(22,34,22,0.6)" }, children: timestamp })
          ]
        },
        group.id
      );
    } catch (err) {
      console.error("[Groups] Error rendering group button:", err, group);
      return null;
    }
  }, "renderGroupButton");
  if (!isMobile && selectedGroup && groupDialogOpen) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Box,
      {
        sx: {
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          position: "relative"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Box,
            {
              sx: {
                width: { xs: "100%", sm: "50%", md: "50%" },
                minWidth: { xs: "100%", sm: "400px" },
                flexShrink: 0,
                borderRight: { xs: "none", sm: "1px solid rgba(255,255,255,0.08)" },
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                backgroundColor: "transparent",
                backdropFilter: "blur(10px)"
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { p: 2, borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { fontWeight: 700, color: "#CDDC39" }, children: "Groups" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  GroupList,
                  {
                    groups: sortedGroups,
                    selectedGroupId: selectedGroup?.id,
                    onSelectGroup: /* @__PURE__ */ __name((g) => {
                      setSelectedGroup(g);
                      setGroupDialogOpen(true);
                    }, "onSelectGroup"),
                    isLoading: loading
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Box,
            {
              sx: {
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              },
              children: [
                !guidelinesAccepted && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Alert,
                  {
                    severity: "warning",
                    icon: false,
                    sx: {
                      background: "rgba(255,193,7,0.25)",
                      color: "#CDDC39",
                      border: "1px solid rgba(255,193,7,0.5)",
                      flexShrink: 0,
                      m: 1,
                      mb: 0
                    },
                    children: [
                      "By participating, you agree to our",
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Link,
                        {
                          component: "button",
                          onClick: /* @__PURE__ */ __name(() => onNavigate && onNavigate("guidelines"), "onClick"),
                          sx: { fontWeight: 700, color: "#fff", textDecoration: "underline" },
                          children: "Community Guidelines"
                        }
                      ),
                      "."
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  GroupMessages,
                  {
                    messages: groupMessagesHook.messages,
                    pinnedMessages: groupMessagesHook.pinnedMessages,
                    isLoadingInitial: groupMessagesHook.isLoadingInitial,
                    isLoadingMore: groupMessagesHook.isLoadingMore,
                    hasMore: groupMessagesHook.hasMore,
                    onLoadMore: groupMessagesHook.loadMore,
                    scrollContainerRef: groupMessagesHook.scrollContainerRef,
                    scrollToBottomRef: groupMessagesHook.scrollToBottomRef,
                    onScroll: groupMessagesHook.handleScroll,
                    currentUserId: userId,
                    group: selectedGroup,
                    onBack: /* @__PURE__ */ __name(() => {
                      setGroupDialogOpen(false);
                      setSelectedGroup(null);
                    }, "onBack"),
                    onSend: isMember && guidelinesAccepted ? async (text, attachments, replyToMsg) => {
                      if (!text?.trim() && (!attachments || attachments.length === 0)) return;
                      if (!selectedGroup || !userId) return;
                      if (replyToMsg) {
                        setReplyTo(replyToMsg);
                      }
                      await sendMessage(text, attachments);
                    } : null,
                    typingUsers: groupTypingHook.typingUsers || []
                  }
                ),
                !isMember && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { p: 2, textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "contained",
                    onClick: /* @__PURE__ */ __name(() => joinGroup(), "onClick"),
                    sx: {
                      bgcolor: "rgba(124,179,66,0.9)",
                      color: "#fff",
                      "&:hover": {
                        bgcolor: "rgba(156,204,101,1)"
                      }
                    },
                    children: "Join Group to Send Messages"
                  }
                ) })
              ]
            }
          )
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Box,
    {
      sx: {
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        position: "relative"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Box,
          {
            sx: {
              position: "absolute",
              inset: 0,
              zIndex: 0,
              background: `
            linear-gradient(135deg,
              rgba(10, 31, 10, 0.4) 0%,
              rgba(26, 58, 26, 0.5) 15%,
              rgba(45, 90, 45, 0.6) 30%,
              rgba(34, 139, 34, 0.5) 45%,
              rgba(45, 90, 45, 0.6) 60%,
              rgba(26, 58, 26, 0.5) 75%,
              rgba(10, 31, 10, 0.4) 100%
            ),
            radial-gradient(circle at 20% 30%, rgba(124, 179, 66, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(34, 139, 34, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(45, 90, 45, 0.2) 0%, transparent 70%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 50, 0, 0.4) 100%)
          `,
              backgroundSize: "100% 100%, 150% 150%, 150% 150%, 200% 200%, 100% 100%",
              backgroundPosition: "center, 20% 30%, 80% 70%, 50% 50%, center",
              boxShadow: "inset 0 0 100px rgba(0, 0, 0, 0.3), inset 0 0 50px rgba(124, 179, 66, 0.1)",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                background: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
                opacity: 0.5,
                pointerEvents: "none"
              }
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { flexShrink: 0, position: "relative", zIndex: 1 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Box,
          {
            sx: {
              pt: "calc(env(safe-area-inset-top, 0px) + 8px)",
              pb: 1.5,
              px: { xs: 1.5, md: 2 }
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ProfileSetupDialog,
                {
                  open: profileDialogOpen,
                  email: profileInfo?.email || authUser?.email || "",
                  initialDisplayName: profileInfo?.display_name || currentUserName,
                  initialUsername: profileInfo?.username || "",
                  saving: profileSaving,
                  error: profileError,
                  onSave: handleProfileSave,
                  onClose: handleProfileDialogClose
                }
              ),
              onBack ? /* @__PURE__ */ jsxRuntimeExports.jsx(BackHeader, { title: "Groups", onBack }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  onClick: /* @__PURE__ */ __name(() => window.history.back(), "onClick"),
                  size: "small",
                  variant: "contained",
                  sx: {
                    bgcolor: "rgba(124, 179, 66, 0.9)",
                    color: "#fff",
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 999,
                    mb: 2,
                    boxShadow: "0 4px 12px rgba(124, 179, 66, 0.4)",
                    "&:hover": {
                      bgcolor: "rgba(156, 204, 101, 1)",
                      boxShadow: "0 6px 16px rgba(124, 179, 66, 0.6)",
                      transform: "translateY(-2px)"
                    }
                  },
                  children: "← Back to Garden"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Box,
                  {
                    sx: {
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "transparent",
                      border: "2px solid rgba(124, 179, 66, 0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 16px rgba(124, 179, 66, 0.4)",
                      overflow: "hidden",
                      flexShrink: 0
                    },
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "img",
                      {
                        src: "/hero.png?v=13",
                        alt: "StrainSpotter",
                        style: { width: "100%", height: "100%", objectFit: "cover" }
                      }
                    )
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { fontWeight: 700, fontSize: "1.1rem", color: "#CDDC39" }, children: "Groups & Chat" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, sx: { mb: 1.5 }, alignItems: "center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#9CCC65", flex: 1 }, children: [
                  "Signed in as ",
                  currentUserName
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    size: "small",
                    variant: "outlined",
                    onClick: /* @__PURE__ */ __name(() => {
                      setProfilePromptDismissed(false);
                      setProfileDialogOpen(true);
                    }, "onClick"),
                    sx: {
                      color: "#CDDC39",
                      borderColor: "rgba(124,179,66,0.4)",
                      textTransform: "none",
                      fontWeight: 600,
                      "&:hover": {
                        borderColor: "rgba(124,179,66,0.7)",
                        bgcolor: "rgba(124,179,66,0.15)"
                      }
                    },
                    children: "Edit Profile"
                  }
                )
              ] })
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Box,
          {
            sx: {
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              position: "relative",
              zIndex: 1
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Box,
              {
                sx: {
                  px: { xs: 1.5, md: 2 },
                  py: 2,
                  pb: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
                  width: "100%"
                  // Ensure full width
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { sx: {
                  bgcolor: "rgba(255,255,255,0.08)",
                  color: "#CDDC39",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  borderRadius: 3,
                  border: "1px solid rgba(124,179,66,0.3)"
                }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Tabs,
                    {
                      value: activeTab,
                      onChange: /* @__PURE__ */ __name((e, newValue) => setActiveTab(newValue), "onChange"),
                      sx: {
                        borderBottom: "1px solid rgba(124,179,66,0.3)",
                        "& .MuiTab-root": {
                          color: "#9CCC65",
                          "&.Mui-selected": {
                            color: "#CDDC39"
                          }
                        },
                        "& .MuiTabs-indicator": {
                          backgroundColor: "#CDDC39"
                        }
                      },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(GroupsIcon, {}), label: "Groups", iconPosition: "start" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Tab,
                          {
                            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Badge,
                              {
                                badgeContent: directChats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0),
                                color: "error",
                                sx: {
                                  "& .MuiBadge-badge": {
                                    bgcolor: "#FF5252",
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: "0.65rem",
                                    minWidth: "18px",
                                    height: "18px"
                                  }
                                },
                                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChatIcon, {})
                              }
                            ),
                            label: "Direct Messages",
                            iconPosition: "start"
                          }
                        )
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { sx: { p: 2 }, children: [
                    activeTab === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1.5, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { mb: 0.5, color: "#9CCC65", fontSize: "0.75rem" }, children: userId ? "Tap a group to open the chat." : "Sign in to join groups." }),
                      !userId && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          variant: "contained",
                          color: "primary",
                          fullWidth: true,
                          onClick: /* @__PURE__ */ __name(() => onNavigate && onNavigate("login"), "onClick"),
                          sx: { mb: 2 },
                          children: "Sign In to Continue"
                        }
                      ),
                      loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { textAlign: "center", py: 3 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(255,255,255,0.7)" }, children: "Loading groups..." }) }) : !Array.isArray(sortedGroups) || sortedGroups.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1.5, sx: { py: 2 }, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#9CCC65", textAlign: "center" }, children: groups.length === 0 && !loading ? "No groups available. Make sure the backend is running and try refreshing." : "No groups match the filter." }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            variant: "outlined",
                            onClick: /* @__PURE__ */ __name(() => {
                              setLoading(true);
                              loadGroups();
                            }, "onClick"),
                            sx: {
                              borderColor: "rgba(124,179,66,0.4)",
                              color: "#CDDC39",
                              "&:hover": {
                                borderColor: "rgba(124,179,66,0.6)",
                                bgcolor: "rgba(124,179,66,0.1)"
                              }
                            },
                            children: "Refresh Groups"
                          }
                        )
                      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 1.5, children: sortedGroups.filter((g) => g && g.id).map(renderGroupButton) })
                    ] }),
                    activeTab === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1.5, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { mb: 0.5, color: "#9CCC65", fontSize: "0.75rem" }, children: userId ? "Start a private conversation with any user." : "Sign in to send direct messages." }),
                      !userId && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          variant: "contained",
                          color: "primary",
                          fullWidth: true,
                          onClick: /* @__PURE__ */ __name(() => onNavigate && onNavigate("login"), "onClick"),
                          sx: { mb: 2 },
                          children: "Sign In to Continue"
                        }
                      ),
                      userId && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          TextField,
                          {
                            size: "small",
                            value: userSearchTerm,
                            onChange: /* @__PURE__ */ __name((e) => setUserSearchTerm(e.target.value), "onChange"),
                            placeholder: "Search by name",
                            variant: "outlined",
                            fullWidth: true,
                            sx: {
                              "& .MuiInputBase-root": {
                                bgcolor: "rgba(255,255,255,0.05)",
                                borderRadius: 2,
                                border: "1px solid rgba(124,179,66,0.3)",
                                color: "#CDDC39"
                              },
                              mb: 2
                            }
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 1, alignItems: { xs: "stretch", sm: "center" }, sx: { mb: 1 }, children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", sx: { color: "#CDDC39", fontWeight: 700 }, children: "Direct Messages" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            ToggleButtonGroup,
                            {
                              color: "success",
                              exclusive: true,
                              value: dmFilter,
                              onChange: /* @__PURE__ */ __name((_e, next) => next && setDmFilter(next), "onChange"),
                              size: "small",
                              sx: {
                                borderRadius: 999,
                                "& .MuiToggleButton-root": {
                                  color: "#9CCC65",
                                  borderColor: "rgba(124,179,66,0.3)",
                                  textTransform: "none",
                                  fontSize: "0.8rem"
                                },
                                "& .Mui-selected": {
                                  color: "#0c220f",
                                  backgroundColor: "rgba(124,179,66,0.7) !important"
                                }
                              },
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleButton, { value: "recent", children: "Recent" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleButton, { value: "all", children: "All Users" })
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Button,
                            {
                              size: "small",
                              onClick: loadAllUsers,
                              disabled: loadingUsers,
                              variant: "outlined",
                              sx: {
                                color: "#CDDC39",
                                borderColor: "rgba(124,179,66,0.4)",
                                "&:hover": {
                                  borderColor: "rgba(124,179,66,0.6)",
                                  bgcolor: "rgba(124,179,66,0.1)"
                                }
                              },
                              children: loadingUsers ? "Loading..." : "Refresh"
                            }
                          )
                        ] }),
                        usersError && /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Typography,
                          {
                            variant: "body2",
                            sx: {
                              color: "#ff8a80",
                              fontWeight: 500,
                              mb: 1
                            },
                            children: usersError
                          }
                        ),
                        loadingUsers && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#9CCC65" }, children: "Loading users..." }),
                        dmFilter === "recent" && filteredDirectChats.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 3 }, children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", sx: { color: "#CDDC39", fontWeight: 700, mb: 1.5, display: "flex", alignItems: "center", gap: 1 }, children: "💬 Recent Chats" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 1, children: filteredDirectChats.map((chat) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Button,
                            {
                              variant: "outlined",
                              onClick: /* @__PURE__ */ __name(() => startDirectChat(chat.user), "onClick"),
                              fullWidth: true,
                              sx: {
                                justifyContent: "flex-start",
                                textAlign: "left",
                                p: 1.5,
                                borderRadius: 2,
                                borderColor: "rgba(124,179,66,0.6)",
                                bgcolor: "rgba(124,179,66,0.15)",
                                backdropFilter: "blur(10px)",
                                WebkitBackdropFilter: "blur(10px)",
                                color: "#CDDC39",
                                "&:hover": {
                                  bgcolor: "rgba(124,179,66,0.25)",
                                  borderColor: "rgba(124,179,66,0.8)"
                                }
                              },
                              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1.5, alignItems: "center", sx: { width: "100%" }, children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Badge,
                                  {
                                    badgeContent: chat.unread_count || 0,
                                    color: "error",
                                    sx: {
                                      "& .MuiBadge-badge": {
                                        bgcolor: "#FF5252",
                                        color: "#fff",
                                        fontWeight: 700
                                      }
                                    },
                                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { sx: { bgcolor: "rgba(124,179,66,0.5)", color: "#0c220f" }, children: (chat.user.username || "U").slice(0, 2).toUpperCase() })
                                  }
                                ),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { flex: 1, minWidth: 0 }, children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", sx: { fontWeight: 700, color: "#CDDC39" }, children: chat.user.display_name || chat.user.username || "User" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    Typography,
                                    {
                                      variant: "caption",
                                      sx: {
                                        color: "#9CCC65",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        display: "block"
                                      },
                                      children: chat.last_message?.content || "No messages yet"
                                    }
                                  )
                                ] })
                              ] })
                            },
                            chat.user.user_id
                          )) })
                        ] }),
                        dmFilter === "recent" && !loadingUsers && !usersError && filteredDirectChats.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#9CCC65" }, children: "No recent chats yet. Switch to “All Users” to start a new conversation." }),
                        dmFilter === "all" && !loadingUsers && !usersError && filteredUsers.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#9CCC65" }, children: "No other users found. Click Refresh to try again." }),
                        dmFilter === "all" && !loadingUsers && !usersError && filteredUsers.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", sx: { color: "#9CCC65", fontWeight: 700, mb: 1.5, display: "flex", alignItems: "center", gap: 1 }, children: "👥 All Users" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 1, children: filteredUsers.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Button,
                            {
                              variant: "outlined",
                              onClick: /* @__PURE__ */ __name(() => startDirectChat(user), "onClick"),
                              fullWidth: true,
                              sx: {
                                justifyContent: "flex-start",
                                textAlign: "left",
                                p: 1.5,
                                borderRadius: 2,
                                borderColor: "rgba(124,179,66,0.4)",
                                bgcolor: "rgba(255,255,255,0.05)",
                                backdropFilter: "blur(10px)",
                                WebkitBackdropFilter: "blur(10px)",
                                color: "#CDDC39",
                                "&:hover": {
                                  bgcolor: "rgba(124,179,66,0.2)",
                                  borderColor: "rgba(124,179,66,0.6)"
                                }
                              },
                              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1.5, alignItems: "center", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { sx: { bgcolor: "rgba(124,179,66,0.35)", color: "#0c220f" }, children: (user.display_name || user.username || "U").slice(0, 2).toUpperCase() }),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", sx: { fontWeight: 700, color: "#CDDC39" }, children: user.display_name || user.username || "User" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#9CCC65" }, children: "Click to chat" })
                                ] })
                              ] })
                            },
                            user.user_id
                          )) })
                        ] })
                      ] })
                    ] })
                  ] })
                ] })
              }
            )
          }
        ),
        groupDialogOpen && selectedGroup && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Box,
          {
            sx: {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1300,
              display: "flex",
              flexDirection: "column",
              bgcolor: "#0a0f0a",
              // Use same background as rest of app
              backdropFilter: "blur(20px)"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                GroupHeader,
                {
                  group: selectedGroup,
                  memberCount: members.length,
                  onBack: closeGroupDialog,
                  isMobile,
                  typingUsers: groupTypingHook.typingUsers
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }, children: [
                !guidelinesAccepted && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Alert,
                  {
                    severity: "warning",
                    icon: false,
                    sx: {
                      background: "rgba(255,193,7,0.25)",
                      color: "#CDDC39",
                      border: "1px solid rgba(255,193,7,0.5)",
                      flexShrink: 0,
                      m: 1,
                      mb: 0
                    },
                    children: [
                      "By participating, you agree to our",
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Link,
                        {
                          component: "button",
                          onClick: /* @__PURE__ */ __name(() => onNavigate && onNavigate("guidelines"), "onClick"),
                          sx: { fontWeight: 700, color: "#fff", textDecoration: "underline" },
                          children: "Community Guidelines"
                        }
                      ),
                      "."
                    ]
                  }
                ),
                groupMessagesHook.error ? /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { p: 2, textAlign: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", sx: { bgcolor: "rgba(124, 179, 66, 0.15)", color: "#fff", border: "1px solid rgba(124, 179, 66, 0.3)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#e0e0e0" }, children: "Chat is having trouble loading messages right now. You can still see groups and try again later." }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  GroupMessages,
                  {
                    messages: groupMessagesHook.messages,
                    pinnedMessages: groupMessagesHook.pinnedMessages,
                    isLoadingInitial: groupMessagesHook.isLoadingInitial,
                    isLoadingMore: groupMessagesHook.isLoadingMore,
                    hasMore: groupMessagesHook.hasMore,
                    onLoadMore: groupMessagesHook.loadMore,
                    scrollContainerRef: groupMessagesHook.scrollContainerRef,
                    scrollToBottomRef: groupMessagesHook.scrollToBottomRef,
                    onScroll: groupMessagesHook.handleScroll,
                    currentUserId: userId
                  }
                )
              ] }),
              isMember ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                ChatInput,
                {
                  value: input,
                  onChange: setInput,
                  onSend: /* @__PURE__ */ __name((text, attachments) => {
                    sendMessage(text, attachments);
                  }, "onSend"),
                  disabled: sending || !guidelinesAccepted,
                  sending,
                  placeholder: guidelinesAccepted ? "Type a message…" : "Accept guidelines to send messages",
                  replyToMessage: replyTo,
                  onCancelReply: /* @__PURE__ */ __name(() => setReplyTo(null), "onCancelReply"),
                  notifyTyping: groupTypingHook.notifyTyping,
                  scope: "group",
                  channelId: selectedGroup?.id || null
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { p: 2, textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.08)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "contained",
                  onClick: /* @__PURE__ */ __name(() => joinGroup(), "onClick"),
                  sx: {
                    bgcolor: "rgba(124,179,66,0.9)",
                    color: "#fff",
                    "&:hover": {
                      bgcolor: "rgba(156,204,101,1)"
                    }
                  },
                  children: "Join Group to Send Messages"
                }
              ) })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Dialog,
          {
            open: chatDialogOpen,
            onClose: /* @__PURE__ */ __name(() => setChatDialogOpen(false), "onClose"),
            fullWidth: true,
            fullScreen: true,
            PaperProps: {
              sx: {
                background: "rgba(0, 0, 0, 0.3)",
                backdropFilter: "blur(30px)",
                WebkitBackdropFilter: "blur(30px)",
                m: 0,
                maxHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                border: "1px solid rgba(124,179,66,0.3)"
              }
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { sx: {
                borderBottom: "2px solid rgba(124,179,66,0.4)",
                background: "rgba(124,179,66,0.1)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 1.5,
                pt: "calc(env(safe-area-inset-top, 0px) + 8px)",
                minHeight: 44,
                maxHeight: 44,
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
              }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1.5, alignItems: "center", sx: { flex: 1, minWidth: 0 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowBackIosNewIcon, { fontSize: "small" }),
                      onClick: /* @__PURE__ */ __name(() => setChatDialogOpen(false), "onClick"),
                      sx: {
                        color: "#CDDC39",
                        textTransform: "none",
                        fontWeight: 600,
                        "&:hover": { bgcolor: "rgba(124,179,66,0.2)" }
                      },
                      children: "Back"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { sx: { bgcolor: "rgba(124,179,66,0.35)", color: "#0c220f" }, children: (selectedChat?.username || selectedChat?.display_name || "U").slice(0, 2).toUpperCase() }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", noWrap: true, sx: { fontWeight: 700, color: "#CDDC39", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }, children: selectedChat?.display_name || selectedChat?.username || "User" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    size: "small",
                    onClick: /* @__PURE__ */ __name(() => setChatDialogOpen(false), "onClick"),
                    sx: {
                      color: "#CDDC39",
                      "&:hover": {
                        bgcolor: "rgba(124,179,66,0.2)"
                      }
                    },
                    children: "Close"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { sx: {
                flex: 1,
                minHeight: 0,
                p: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                background: "transparent"
              }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, sx: {
                p: 2,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0
              }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Alert,
                  {
                    severity: "info",
                    sx: {
                      flexShrink: 0,
                      bgcolor: "rgba(124,179,66,0.08)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      color: "#CDDC39",
                      border: "1px solid rgba(124,179,66,0.3)",
                      "& .MuiAlert-icon": {
                        color: "#CDDC39"
                      }
                    },
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { fontSize: "0.75rem" }, children: "💬 Only the most recent 500 messages are shown. Older messages are automatically archived." })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Box,
                  {
                    ref: dmMessagesHook.scrollContainerRef,
                    onScroll: dmMessagesHook.handleScroll,
                    sx: {
                      flex: 1,
                      minHeight: 0,
                      overflowY: "auto",
                      WebkitOverflowScrolling: "touch",
                      border: "2px solid rgba(124,179,66,0.4)",
                      borderRadius: 2,
                      p: 2,
                      background: "transparent",
                      backdropFilter: "blur(15px)",
                      WebkitBackdropFilter: "blur(15px)",
                      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.3)"
                    },
                    children: [
                      dmMessagesHook.hasMore && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mb: 2, display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          onClick: dmMessagesHook.loadMore,
                          disabled: dmMessagesHook.isLoadingMore,
                          variant: "outlined",
                          size: "small",
                          sx: {
                            color: "#9CCC65",
                            borderColor: "rgba(124,179,66,0.4)",
                            "&:hover": {
                              borderColor: "rgba(124,179,66,0.6)",
                              bgcolor: "rgba(124,179,66,0.1)"
                            }
                          },
                          children: dmMessagesHook.isLoadingMore ? "Loading…" : "Load earlier messages"
                        }
                      ) }),
                      dmMessagesHook.isLoadingInitial && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", py: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#9CCC65" }, children: "Loading messages..." }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(List, { sx: { p: 0 }, children: !dmMessagesHook.isLoadingInitial && dmMessagesHook.messages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(ListItem, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        ListItemText,
                        {
                          secondary: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#9CCC65" }, children: "Start a conversation! Say hello or ask a question." })
                        }
                      ) }) : dmMessagesHook.messages.map((m, idx) => {
                        const msg = m.raw || m;
                        const isCurrentUser = (msg.sender_id || msg.user_id) === userId;
                        const senderName = isCurrentUser ? "You" : m.sender?.display_name || m.sender?.username || selectedChat?.display_name || selectedChat?.username || "User";
                        const initials = senderName.slice(0, 2).toUpperCase();
                        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          ListItem,
                          {
                            sx: {
                              flexDirection: isCurrentUser ? "row-reverse" : "row",
                              alignItems: "flex-start",
                              gap: 1,
                              mb: 1.5
                            },
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(ListItemAvatar, { sx: { minWidth: "auto" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { sx: {
                                bgcolor: isCurrentUser ? "rgba(124,179,66,0.5)" : "rgba(124,179,66,0.35)",
                                color: "#0c220f",
                                width: 32,
                                height: 32,
                                fontSize: "0.875rem"
                              }, children: initials }) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
                                maxWidth: "70%",
                                bgcolor: isCurrentUser ? "rgba(124,179,66,0.2)" : "rgba(255,255,255,0.05)",
                                backdropFilter: "blur(10px)",
                                WebkitBackdropFilter: "blur(10px)",
                                border: `1px solid ${isCurrentUser ? "rgba(124,179,66,0.4)" : "rgba(124,179,66,0.3)"}`,
                                borderRadius: 2,
                                p: 1.5,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                              }, children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#CDDC39", wordBreak: "break-word" }, children: msg.body || msg.text || msg.content }),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { color: "#9CCC65", display: "block", mt: 0.5 }, children: [
                                  senderName,
                                  " • ",
                                  new Date(msg.created_at || msg.createdAt).toLocaleString(),
                                  msg.optimistic ? " • sending…" : ""
                                ] })
                              ] })
                            ]
                          },
                          msg.id || idx
                        );
                      }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: dmMessagesHook.scrollToBottomRef })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, sx: { flexShrink: 0 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    TextField,
                    {
                      fullWidth: true,
                      size: "small",
                      placeholder: "Type a message...",
                      value: input,
                      onChange: /* @__PURE__ */ __name((e) => setInput(e.target.value), "onChange"),
                      onKeyDown: /* @__PURE__ */ __name((e) => e.key === "Enter" && !e.shiftKey && sendDirectMessage(), "onKeyDown"),
                      multiline: true,
                      maxRows: 3,
                      sx: {
                        "& .MuiInputBase-root": {
                          bgcolor: "rgba(255,255,255,0.05)",
                          backdropFilter: "blur(10px)",
                          WebkitBackdropFilter: "blur(10px)",
                          border: "1px solid rgba(124,179,66,0.4)",
                          borderRadius: 2,
                          "&:hover": {
                            border: "1px solid rgba(124,179,66,0.6)"
                          },
                          "&.Mui-focused": {
                            border: "1px solid rgba(205,220,57,0.8)",
                            boxShadow: "0 0 8px rgba(124,179,66,0.4)"
                          }
                        },
                        "& .MuiInputBase-input": { color: "#CDDC39" },
                        "& .MuiInputBase-input::placeholder": { color: "#9CCC65", opacity: 0.7 }
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "contained",
                      onClick: sendDirectMessage,
                      sx: {
                        minWidth: "80px",
                        bgcolor: "rgba(124,179,66,0.9)",
                        color: "#fff",
                        fontWeight: 700,
                        boxShadow: "0 4px 12px rgba(124,179,66,0.4)",
                        "&:hover": {
                          bgcolor: "rgba(156,204,101,1)",
                          boxShadow: "0 6px 16px rgba(124,179,66,0.6)"
                        }
                      },
                      children: "Send"
                    }
                  )
                ] })
              ] }) })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: reportDialogOpen, onClose: /* @__PURE__ */ __name(() => setReportDialogOpen(false), "onClose"), maxWidth: "sm", fullWidth: true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { sx: {
            bgcolor: "rgba(255,255,255,0.7)",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
            backdropFilter: "blur(12px)",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.18)"
          }, children: "Report Message" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { sx: {
            bgcolor: "rgba(255,255,255,0.7)",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
            backdropFilter: "blur(12px)",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.18)"
          }, children: [
            reportingMessage && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 2 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Message:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { p: 1, bgcolor: "grey.100", borderRadius: 1 }, children: reportingMessage.content })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, sx: { mt: 2 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                TextField,
                {
                  select: true,
                  label: "Reason",
                  value: reportReason,
                  onChange: /* @__PURE__ */ __name((e) => setReportReason(e.target.value), "onChange"),
                  fullWidth: true,
                  SelectProps: { native: true },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "inappropriate", children: "Inappropriate content" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "harassment", children: "Harassment or bullying" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "spam", children: "Spam or advertising" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "hate", children: "Hate speech" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "threats", children: "Threats or violence" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "other", children: "Other" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Additional details (optional)",
                  multiline: true,
                  rows: 3,
                  fullWidth: true,
                  value: reportDetails,
                  onChange: /* @__PURE__ */ __name((e) => setReportDetails(e.target.value), "onChange"),
                  placeholder: "Provide any additional context..."
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogActions, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: /* @__PURE__ */ __name(() => setReportDialogOpen(false), "onClick"), children: "Cancel" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleReport, variant: "contained", color: "error", children: "Submit Report" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: guidelinesOpen, onClose: /* @__PURE__ */ __name(() => setGuidelinesOpen(false), "onClose"), maxWidth: "sm", fullWidth: true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Agree to Community Guidelines" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, sx: { mt: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", children: "To keep conversations helpful and safe, please agree to follow our community rules (no solicitations, no personal contact info, no harassment, obey local laws)." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { component: "button", onClick: /* @__PURE__ */ __name(() => onNavigate && onNavigate("guidelines"), "onClick"), sx: { alignSelf: "flex-start" }, children: "View full Community Guidelines" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormControlLabel,
              {
                control: /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { checked: guidelinesChecked, onChange: /* @__PURE__ */ __name((e) => setGuidelinesChecked(e.target.checked), "onChange") }),
                label: "I agree to follow the Community Guidelines"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogActions, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: /* @__PURE__ */ __name(() => setGuidelinesOpen(false), "onClick"), children: "Cancel" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                onClick: /* @__PURE__ */ __name(() => {
                  localStorage.setItem(guidelinesKey, "true");
                  setGuidelinesAccepted(true);
                  setGuidelinesOpen(false);
                }, "onClick"),
                variant: "contained",
                disabled: !guidelinesChecked,
                children: "Accept & Continue"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Snackbar,
          {
            open: snackbar.open,
            autoHideDuration: 4e3,
            onClose: handleSnackbarClose,
            anchorOrigin: { vertical: "bottom", horizontal: "center" },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Alert,
              {
                onClose: handleSnackbarClose,
                severity: snackbar.severity,
                sx: { width: "100%" },
                children: snackbar.message
              }
            )
          }
        )
      ]
    }
  );
}
__name(Groups, "Groups");
export {
  Groups as default
};
