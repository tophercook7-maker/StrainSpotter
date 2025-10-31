export default function GroupsChat({ onNavigate }) {
  return (
        <div className="groups-chat-root" style={{ color: 'white', padding: 32 }}>
          <button
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 100,
              background: "rgba(34, 139, 34, 0.25)",
              border: "1px solid #228B22",
              borderRadius: 12,
              boxShadow: "0 2px 12px rgba(34,139,34,0.15)",
              backdropFilter: "blur(8px)",
              color: "#228B22",
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              fontWeight: 600,
              fontSize: 18,
            }}
            onClick={() => onNavigate('home')}
          >
            <CannabisLeafIcon style={{ marginRight: 8, height: 24 }} />
            Home
          </button>
      <h2>Groups & Chat</h2>
      <p>Feature coming soon! Here you will be able to join groups, chat, and connect with other users.</p>
      <button onClick={() => onNavigate('home')}>Back to Home</button>
    </div>
  );
}
