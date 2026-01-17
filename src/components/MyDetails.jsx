import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8080/api";

export default function MyDetails({ token, onAccountDeleted, onClose }) {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    async function loadUserDetails() {
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/users/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          setError("Failed to load user details: " + text);
          return;
        }

        const data = await res.json();
        setUserDetails(data);
      } catch (err) {
        console.error("Error loading user details:", err);
        setError("Network error: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    loadUserDetails();
  }, [token]);

  async function handleDeleteAccount() {
    if (!userDetails || !token) return;

    setDeleteError("");
    setDeleteLoading(true);

    try {
      const res = await fetch(`${API_BASE}/users/${userDetails.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        setDeleteError("Failed to delete account: " + text);
        setDeleteLoading(false);
        return;
      }

      // Account deleted successfully
      if (onAccountDeleted) {
        onAccountDeleted();
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      setDeleteError("Network error: " + err.message);
      setDeleteLoading(false);
    }
  }

  const containerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #124e66 0%, #1f6f78 50%, #49a3a6 100%)",
    padding: "2rem 1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const cardStyle = {
    background: "white",
    borderRadius: "16px",
    padding: "2rem",
    maxWidth: "600px",
    width: "100%",
    boxShadow: "0 10px 40px rgba(8, 24, 43, 0.3)",
  };

  const titleStyle = {
    fontSize: "1.75rem",
    fontWeight: "700",
    color: "#08182b",
    margin: "0 0 1rem 0",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: "600",
    color: "#124e66",
    fontSize: "0.9rem",
  };

  const valueStyle = {
    fontSize: "1rem",
    color: "#08182b",
    marginBottom: "1rem",
    padding: "0.75rem",
    background: "rgba(73, 163, 166, 0.1)",
    borderRadius: "8px",
    border: "1px solid rgba(73, 163, 166, 0.2)",
  };

  const buttonStyle = {
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginTop: "1rem",
  };

  const deleteButtonStyle = {
    ...buttonStyle,
    background: "#dc3545",
    color: "#ffffff",
    boxShadow: "0 4px 15px rgba(220, 53, 69, 0.4)",
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    background: "white",
    color: "#1f6f78",
    border: "2px solid #49a3a6",
    marginRight: "0.5rem",
  };

  const confirmButtonStyle = {
    ...buttonStyle,
    background: "#dc3545",
    color: "#ffffff",
  };

  const errorStyle = {
    color: "#721c24",
    background: "rgba(248, 215, 218, 0.8)",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    border: "1px solid rgba(220, 53, 69, 0.5)",
  };

  const warningStyle = {
    color: "#856404",
    background: "rgba(255, 243, 205, 0.8)",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    border: "1px solid rgba(255, 193, 7, 0.5)",
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>Loading...</h2>
          <p style={{ color: "#124e66" }}>Please wait while we load your details.</p>
        </div>
      </div>
    );
  }

  if (error && !userDetails) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>Error</h2>
          <div style={errorStyle}>{error}</div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                ...buttonStyle,
                background: "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
                color: "#ffffff",
              }}
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={titleStyle}>My Details</h2>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "#124e66",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        {userDetails && (
          <>
            <div>
              <label style={labelStyle}>Name</label>
              <div style={valueStyle}>{userDetails.name || "N/A"}</div>
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <div style={valueStyle}>{userDetails.email || "N/A"}</div>
            </div>

            <div>
              <label style={labelStyle}>Role</label>
              <div style={valueStyle}>{userDetails.role || "N/A"}</div>
            </div>

            {userDetails.averageRating !== null && userDetails.averageRating !== undefined && (
              <div>
                <label style={labelStyle}>Average Rating</label>
                <div style={valueStyle}>
                  {typeof userDetails.averageRating === 'number' 
                    ? userDetails.averageRating.toFixed(1) 
                    : parseFloat(userDetails.averageRating).toFixed(1)} 
                  {userDetails.ratingCount !== null && userDetails.ratingCount !== undefined && (
                    <span style={{ color: "#124e66", fontSize: "0.9rem", marginLeft: "0.5rem" }}>
                      ({userDetails.ratingCount} {userDetails.ratingCount === 1 ? 'rating' : 'ratings'})
                    </span>
                  )}
                </div>
              </div>
            )}

            <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "2px solid rgba(73, 163, 166, 0.2)" }}>
              <h3 style={{ fontSize: "1.25rem", color: "#08182b", marginBottom: "1rem" }}>Account Management</h3>
              
              <div style={warningStyle}>
                <strong>⚠️ Warning:</strong> Deleting your account will permanently anonymize your personal data. 
                However, contracts and legal documentation will be preserved for compliance purposes as required by GDPR.
              </div>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={deleteButtonStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(220, 53, 69, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(220, 53, 69, 0.4)";
                  }}
                >
                  Delete My Account
                </button>
              ) : (
                <div>
                  <div style={errorStyle}>
                    <strong>Are you sure you want to delete your account?</strong>
                    <br />
                    This action cannot be undone. Your personal data will be anonymized, but contracts will be preserved.
                  </div>
                  
                  {deleteError && <div style={errorStyle}>{deleteError}</div>}
                  
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteError("");
                      }}
                      style={cancelButtonStyle}
                      disabled={deleteLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      style={confirmButtonStyle}
                      disabled={deleteLoading}
                      onMouseEnter={(e) => {
                        if (!deleteLoading) {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 6px 20px rgba(220, 53, 69, 0.6)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(220, 53, 69, 0.4)";
                      }}
                    >
                      {deleteLoading ? "Deleting..." : "Yes, Delete My Account"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

