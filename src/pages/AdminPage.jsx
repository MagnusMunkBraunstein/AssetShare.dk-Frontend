import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:8080/api";

export default function AdminPage({ token, userEmail, onLogout, onNavigateToLanding }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stripeSummary, setStripeSummary] = useState(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState("");
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState("");

  const normalizedRole = (userRole || "").toUpperCase();
  const isAdmin = normalizedRole === "ADMIN";

  // Load current user's name
  useEffect(() => {
    async function loadCurrentUserName() {
      if (!userEmail || !token) return;
      
      try {
        const res = await fetch(`${API_BASE}/users`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          const currentUser = data.find(u => u.email === userEmail);
          if (currentUser) {
            setUserName(currentUser.name);
            setUserRole(currentUser.role);
          } else {
            setUserRole(null);
          }
        }
      } catch (err) {
        console.error("Error loading current user:", err);
      }
    }

    loadCurrentUserName();
  }, [userEmail, token]);

  // Load all users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        setError("Failed to load users: " + text);
        return;
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError("Error loading users: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load Stripe status
  const loadStripeSummary = useCallback(async () => {
    if (!token) return;

    setStripeLoading(true);
    setStripeError("");
    setCleanupMessage("");

    try {
      const res = await fetch(`${API_BASE}/stripe/connect/admin-summary`, {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        if (res.status === 401 || res.status === 403) {
          setStripeError("Session expired. Please log back in.");
        } else {
          setStripeError(text || "Failed to load Stripe summary");
        }
        setStripeSummary(null);
        return;
      }

      const data = await res.json();
      setStripeSummary(data);
    } catch (err) {
      console.error("Error loading Stripe summary:", err);
      setStripeError("Error loading Stripe summary: " + err.message);
      setStripeSummary(null);
    } finally {
      setStripeLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadStripeSummary();
    }
  }, [token, loadStripeSummary]);

  async function handleCleanupAccounts() {
    if (!isAdmin) return;

    const confirmed = window.confirm(
      "This will delete all Stripe Connect accounts that are not fully enabled. Only use this for cleanup. Continue?"
    );
    if (!confirmed) return;

    setCleanupLoading(true);
    setCleanupMessage("");
    setStripeError("");

    try {
      const res = await fetch(`${API_BASE}/stripe/connect/cleanup-orphaned-accounts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.trim()}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        setStripeError(data.error || "Failed to cleanup Stripe accounts");
        return;
      }

      const data = await res.json();
      setCleanupMessage(
        `Cleanup completed. Deleted: ${data.deletedCount || 0}, Failed: ${data.failedCount || 0}, Kept: ${data.skippedCount || 0}`
      );
      loadStripeSummary();
    } catch (err) {
      console.error("Error cleaning up Stripe accounts:", err);
      setStripeError("Error cleaning up Stripe accounts: " + err.message);
    } finally {
      setCleanupLoading(false);
    }
  }

  // Load users on component mount
  useEffect(() => {
    if (token) {
      loadUsers();
    }
  }, [token, loadUsers]);

  // Handle user selection
  function handleUserClick(user) {
    setSelectedUser(user);
    setShowDeleteConfirm(false);
  }

  // Close modal
  function handleCloseModal() {
    setSelectedUser(null);
    setShowDeleteConfirm(false);
  }

  // Delete user
  async function handleDeleteUser() {
    if (!selectedUser) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        setError("Failed to delete user: " + text);
        setDeleting(false);
        return;
      }

      // Remove user from list
      setUsers(users.filter(u => u.id !== selectedUser.id));
      handleCloseModal();
    } catch (err) {
      console.error(err);
      setError("Error deleting user: " + err.message);
    } finally {
      setDeleting(false);
    }
  }

  const containerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #124e66 0%, #1f6f78 50%, #49a3a6 100%)",
    padding: "2rem 1rem",
  };

  const contentStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const headerCardStyle = {
    background: "white",
    borderRadius: "16px",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 10px 40px rgba(8, 24, 43, 0.3)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
  };

  const cardStyle = {
    background: "white",
    borderRadius: "16px",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 10px 40px rgba(8, 24, 43, 0.3)",
  };

  const titleStyle = {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#08182b",
    margin: "0 0 0.5rem 0",
  };

  const subtitleStyle = {
    fontSize: "1rem",
    color: "#124e66",
    margin: "0",
  };

  const buttonStyle = {
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    background: "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
    color: "#9adbd6",
    boxShadow: "0 4px 15px rgba(31, 111, 120, 0.4)",
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: "white",
    color: "#1f6f78",
    border: "2px solid #49a3a6",
    boxShadow: "0 4px 15px rgba(73, 163, 166, 0.3)",
  };

  const logoutButtonStyle = {
    ...buttonStyle,
    background: "linear-gradient(135deg, #124e66 0%, #1f6f78 100%)",
    color: "#ffffff",
    boxShadow: "0 4px 15px rgba(18, 78, 102, 0.4)",
  };

  const userCardStyle = {
    background: "rgba(255, 255, 255, 0.7)",
    padding: "1.25rem",
    marginBottom: "1rem",
    borderRadius: "12px",
    border: "1px solid rgba(73, 163, 166, 0.3)",
    transition: "all 0.2s ease",
    cursor: "pointer",
  };

  const userHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem",
    flexWrap: "wrap",
    gap: "0.5rem",
  };

  const userNameStyle = {
    fontWeight: "600",
    color: "#08182b",
    fontSize: "1.1rem",
    margin: "0",
  };

  const roleBadgeStyle = {
    display: "inline-block",
    background: "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
    color: "#ffffff",
    padding: "0.25rem 0.75rem",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "600",
  };

  const adminBadgeStyle = {
    ...roleBadgeStyle,
    background: "linear-gradient(135deg, #d32f2f 0%, #f44336 100%)",
    color: "#ffffff",
  };

  const userInfoStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "0.75rem",
    marginTop: "0.75rem",
  };

  const infoItemStyle = {
    fontSize: "0.9rem",
    color: "#124e66",
  };

  const infoLabelStyle = {
    fontWeight: "600",
    color: "#08182b",
    marginRight: "0.5rem",
  };

  const errorStyle = {
    color: "#08182b",
    background: "rgba(255, 200, 200, 0.8)",
    padding: "1rem",
    borderRadius: "8px",
    marginTop: "1rem",
    border: "1px solid rgba(255, 150, 150, 0.5)",
  };

  const statsStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "2rem",
  };

  const statCardStyle = {
    background: "rgba(255, 255, 255, 0.9)",
    padding: "1.5rem",
    borderRadius: "12px",
    border: "1px solid rgba(73, 163, 166, 0.3)",
    textAlign: "center",
  };

  const statValueStyle = {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#08182b",
    margin: "0 0 0.5rem 0",
  };

  const statLabelStyle = {
    fontSize: "0.9rem",
    color: "#124e66",
    margin: "0",
  };

  // Modal styles
  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem",
  };

  const modalStyle = {
    background: "white",
    borderRadius: "16px",
    padding: "2rem",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 10px 40px rgba(8, 24, 43, 0.3)",
    maxHeight: "90vh",
    overflowY: "auto",
  };

  const modalHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  };

  const modalTitleStyle = {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#08182b",
    margin: "0",
  };

  const closeButtonStyle = {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#124e66",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    transition: "all 0.2s ease",
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    background: "linear-gradient(135deg, #d32f2f 0%, #f44336 100%)",
    color: "#ffffff",
    boxShadow: "0 4px 15px rgba(211, 47, 47, 0.4)",
  };

  const confirmDeleteButtonStyle = {
    ...dangerButtonStyle,
    marginRight: "0.75rem",
  };

  const cancelButtonStyle = {
    ...secondaryButtonStyle,
  };

  const roleCounts = {
    LEJER: users.filter(u => u.role === "LEJER").length,
    UDLEJER: users.filter(u => u.role === "UDLEJER").length,
    BOTH: users.filter(u => u.role === "BOTH").length,
    ADMIN: users.filter(u => u.role === "ADMIN").length,
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        {/* Header Card */}
        <div style={headerCardStyle}>
          <div>
            <h1 style={titleStyle}>Admin Dashboard</h1>
            <p style={subtitleStyle}>
              Welcome, <strong style={{ color: "#1f6f78" }}>{userName || userEmail}</strong>
              {userRole && (
                <span style={{ ...roleBadgeStyle, marginLeft: "0.5rem" }}>
                  {userRole}
                </span>
              )}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {onNavigateToLanding && (
              <button
                onClick={onNavigateToLanding}
                style={secondaryButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(73, 163, 166, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(73, 163, 166, 0.3)";
                }}
              >
                🏠 Home
              </button>
            )}
            <button
              onClick={onLogout}
              style={logoutButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(18, 78, 102, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(18, 78, 102, 0.4)";
              }}
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div style={statsStyle}>
          <div style={statCardStyle}>
            <div style={statValueStyle}>{users.length}</div>
            <div style={statLabelStyle}>Total Users</div>
          </div>
          <div style={statCardStyle}>
            <div style={statValueStyle}>{roleCounts.LEJER}</div>
            <div style={statLabelStyle}>Renters (LEJER)</div>
          </div>
          <div style={statCardStyle}>
            <div style={statValueStyle}>{roleCounts.UDLEJER}</div>
            <div style={statLabelStyle}>Providers (UDLEJER)</div>
          </div>
          <div style={statCardStyle}>
            <div style={statValueStyle}>{roleCounts.BOTH}</div>
            <div style={statLabelStyle}>Both Roles</div>
          </div>
          <div style={statCardStyle}>
            <div style={statValueStyle}>{roleCounts.ADMIN}</div>
            <div style={statLabelStyle}>Admins</div>
          </div>
        </div>

        {/* Stripe Connect Overview */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#08182b" }}>Stripe Connect Status</h2>
              <p style={{ margin: "0.5rem 0 0 0", color: "#124e66", fontSize: "0.9rem" }}>
                Platform-wide overview of connected accounts and admin-only maintenance actions.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                onClick={loadStripeSummary}
                disabled={stripeLoading}
                style={{
                  ...secondaryButtonStyle,
                  background: stripeLoading
                    ? "#49a3a6"
                    : "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
                  color: "#ffffff",
                  border: "none",
                }}
              >
                {stripeLoading ? "Refreshing..." : "🔄 Refresh Status"}
              </button>
              {isAdmin && (
                <button
                  onClick={handleCleanupAccounts}
                  disabled={cleanupLoading}
                  style={{
                    ...buttonStyle,
                    background: "linear-gradient(135deg, #d32f2f 0%, #f44336 100%)",
                    color: "#fff",
                    opacity: cleanupLoading ? 0.7 : 1,
                  }}
                >
                  {cleanupLoading ? "Cleaning..." : "🧹 Cleanup Accounts"}
                </button>
              )}
            </div>
          </div>

          {stripeError && <div style={errorStyle}>{stripeError}</div>}
          {cleanupMessage && (
            <div
              style={{
                color: "#155724",
                background: "rgba(76, 175, 80, 0.15)",
                padding: "0.75rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                border: "1px solid rgba(76, 175, 80, 0.3)",
              }}
            >
              {cleanupMessage}
            </div>
          )}

          {stripeSummary ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Total Accounts</div>
                <div style={statValueStyle}>{stripeSummary.totalAccounts}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Charges Enabled</div>
                <div style={statValueStyle}>{stripeSummary.chargesEnabled}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Payouts Enabled</div>
                <div style={statValueStyle}>{stripeSummary.payoutsEnabled}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Details Submitted</div>
                <div style={statValueStyle}>{stripeSummary.detailsSubmitted}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Fully Enabled</div>
                <div style={statValueStyle}>{stripeSummary.fullyEnabled}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Pending Accounts</div>
                <div style={statValueStyle}>{stripeSummary.pendingAccounts}</div>
              </div>
            </div>
          ) : (
            !stripeLoading && (
              <p style={{ color: "#124e66", fontStyle: "italic" }}>
                Stripe summary not available. Click "Refresh Status" to load data.
              </p>
            )
          )}
        </div>

        {/* Users Overview */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#08182b" }}>
                All Users
              </h2>
              <p style={{ margin: "0.5rem 0 0 0", color: "#124e66", fontSize: "0.9rem" }}>
                Overview of all registered users in the system
              </p>
            </div>
            <button
              onClick={loadUsers}
              disabled={loading}
              style={{
                ...secondaryButtonStyle,
                background: loading
                  ? "#49a3a6"
                  : "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
                color: "#ffffff",
                border: "none",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(73, 163, 166, 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(73, 163, 166, 0.3)";
              }}
            >
              {loading ? "Loading..." : "🔄 Refresh"}
            </button>
          </div>

          {error && <div style={errorStyle}>{error}</div>}

          {users.length > 0 ? (
            <div>
              {users.map((user) => (
                <div 
                  key={user.id} 
                  style={userCardStyle}
                  onClick={() => handleUserClick(user)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(73, 163, 166, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.7)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={userHeaderStyle}>
                    <h3 style={userNameStyle}>{user.name}</h3>
                    <span style={user.role === "ADMIN" ? adminBadgeStyle : roleBadgeStyle}>
                      {user.role}
                    </span>
                  </div>
                  <div style={userInfoStyle}>
                    <div style={infoItemStyle}>
                      <span style={infoLabelStyle}>📧 Email:</span>
                      {user.email}
                    </div>
                    <div style={infoItemStyle}>
                      <span style={infoLabelStyle}>🆔 ID:</span>
                      {user.id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <p style={{ color: "#124e66", fontStyle: "italic", textAlign: "center", padding: "2rem" }}>
                No users found. Click "Refresh" to load users.
              </p>
            )
          )}

          {loading && (
            <p style={{ color: "#124e66", textAlign: "center", padding: "2rem" }}>
              Loading users...
            </p>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div style={modalOverlayStyle} onClick={handleCloseModal}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h2 style={modalTitleStyle}>User Details</h2>
              <button
                onClick={handleCloseModal}
                style={closeButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(73, 163, 166, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <div style={infoLabelStyle}>Name:</div>
                <div style={{ ...infoItemStyle, marginTop: "0.25rem" }}>{selectedUser.name}</div>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <div style={infoLabelStyle}>Email:</div>
                <div style={{ ...infoItemStyle, marginTop: "0.25rem" }}>{selectedUser.email}</div>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <div style={infoLabelStyle}>User ID:</div>
                <div style={{ ...infoItemStyle, marginTop: "0.25rem", fontSize: "0.85rem", fontFamily: "monospace" }}>{selectedUser.id}</div>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <div style={infoLabelStyle}>Role:</div>
                <div style={{ marginTop: "0.5rem" }}>
                  <span style={selectedUser.role === "ADMIN" ? adminBadgeStyle : roleBadgeStyle}>
                    {selectedUser.role}
                  </span>
                </div>
              </div>
            </div>

            {error && <div style={errorStyle}>{error}</div>}

            <div style={{ borderTop: "1px solid rgba(73, 163, 166, 0.3)", paddingTop: "1.5rem", marginTop: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", color: "#08182b", marginBottom: "1rem" }}>Actions</h3>
              
              {!showDeleteConfirm ? (
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <a
                    href={`mailto:${selectedUser.email}?subject=Contact from AssetShare Admin`}
                    style={{
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    <button
                      style={buttonStyle}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(31, 111, 120, 0.6)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(31, 111, 120, 0.4)";
                      }}
                    >
                      📧 Contact {selectedUser.name}
                    </button>
                  </a>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={dangerButtonStyle}
                    disabled={deleting}
                    onMouseEnter={(e) => {
                      if (!deleting) {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(211, 47, 47, 0.6)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 15px rgba(211, 47, 47, 0.4)";
                    }}
                  >
                    🗑️ Delete User
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ color: "#d32f2f", fontWeight: "600", marginBottom: "1rem" }}>
                    ⚠️ Are you sure you want to delete this user? This action cannot be undone.
                  </p>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button
                      onClick={handleDeleteUser}
                      style={confirmDeleteButtonStyle}
                      disabled={deleting}
                      onMouseEnter={(e) => {
                        if (!deleting) {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 6px 20px rgba(211, 47, 47, 0.6)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(211, 47, 47, 0.4)";
                      }}
                    >
                      {deleting ? "Deleting..." : "Yes, Delete"}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      style={cancelButtonStyle}
                      disabled={deleting}
                      onMouseEnter={(e) => {
                        if (!deleting) {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 6px 20px rgba(73, 163, 166, 0.5)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(73, 163, 166, 0.3)";
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

