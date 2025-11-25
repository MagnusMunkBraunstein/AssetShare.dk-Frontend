import { useState, useEffect, useCallback } from "react";
import MachineSearch from "../components/MachineSearch";
import RentalProviderRegistration from "../components/RentalProviderRegistration";

const API_BASE = "http://localhost:8080/api";

export default function RenterPage({ token, userEmail, onLogout, onNavigateToLanding }) {
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [machines, setMachines] = useState({});
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState("");
  const [showProviderForm, setShowProviderForm] = useState(false);

  useEffect(() => {
    async function loadCurrentUserName() {
      if (!userEmail || !token) {
        setUserName("");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/users`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          const currentUser = data.find((u) => u.email === userEmail);
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

  const loadMachineDetails = useCallback(
    async (ids) => {
      const map = {};
      for (const machineId of ids) {
        try {
          const res = await fetch(`${API_BASE}/machines/${machineId}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            map[machineId] = await res.json();
          }
        } catch (err) {
          console.error("Error loading machine", err);
        }
      }
      setMachines(map);
    },
    [token]
  );

  const refreshBookings = useCallback(async () => {
    if (!token) {
      setBookings([]);
      return;
    }

    setLoadingBookings(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/bookings/my-bookings`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || "Failed to load bookings");
        setBookings([]);
        return;
      }

      const data = await res.json();
      setBookings(data);
      const machineIds = [...new Set(data.map((b) => b.machineId).filter(Boolean))];
      await loadMachineDetails(machineIds);
    } catch (err) {
      console.error("Error loading bookings:", err);
      setError("Error loading bookings: " + err.message);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [token, loadMachineDetails]);

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  function formatDateTime(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusColor(status) {
    switch (status) {
      case "REQUESTED":
        return { background: "#fff3cd", color: "#856404", border: "1px solid #ffc107" };
      case "APPROVED":
        return { background: "#d4edda", color: "#155724", border: "1px solid #28a745" };
      case "REJECTED":
        return { background: "#f8d7da", color: "#721c24", border: "1px solid #dc3545" };
      case "CANCELLED":
        return { background: "#e2e3e5", color: "#383d41", border: "1px solid #6c757d" };
      case "COMPLETED":
        return { background: "#cce5ff", color: "#004085", border: "1px solid #007bff" };
      default:
        return { background: "#f0f0f0", color: "#333", border: "1px solid #ccc" };
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

  const cardStyle = {
    background: "white",
    borderRadius: "16px",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 10px 40px rgba(8, 24, 43, 0.3)",
  };

  const headerCardStyle = {
    ...cardStyle,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
  };

  const roleBadgeStyle = {
    display: "inline-block",
    background: "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
    color: "#ffffff",
    padding: "0.25rem 0.75rem",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "600",
    marginLeft: "0.5rem",
  };

  const bookingCardStyle = {
    background: "rgba(255, 255, 255, 0.7)",
    padding: "1.25rem",
    marginBottom: "1rem",
    borderRadius: "12px",
    border: "1px solid rgba(73, 163, 166, 0.3)",
  };

  const errorStyle = {
    color: "#08182b",
    background: "rgba(255, 200, 200, 0.8)",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    border: "1px solid rgba(255, 150, 150, 0.5)",
  };

  const providerCtaStyle = {
    padding: "0.9rem 1.5rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    background: "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
    color: "#ffffff",
    boxShadow: "0 4px 15px rgba(31, 111, 120, 0.4)",
  };

  const handleRentalProviderSuccess = (userData) => {
    if (userData?.name) {
      setUserName(userData.name);
    }
    if (userData?.role) {
      setUserRole(userData.role);
    }
    setShowProviderForm(false);
  };

  if (!token) {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={cardStyle}>
            <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#08182b" }}>Authentication Required</h2>
            <p style={{ margin: "0.5rem 0 0 0", color: "#124e66", fontSize: "0.9rem" }}>
              Please log in to access your renter dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={headerCardStyle}>
          <div>
            <h1 style={{ fontSize: "1.75rem", color: "#08182b", margin: 0 }}>Renter Dashboard</h1>
            <p style={{ margin: "0.5rem 0 0 0", color: "#124e66" }}>
              Logged in as <strong>{userName || userEmail}</strong>
              {userRole && <span style={roleBadgeStyle}>{userRole}</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={onNavigateToLanding}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "2px solid #49a3a6",
                background: "white",
                color: "#1f6f78",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Home
            </button>
            <button
              onClick={onLogout}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #124e66 0%, #1f6f78 100%)",
                color: "#ffffff",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(18, 78, 102, 0.4)",
              }}
            >
              Log Out
            </button>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 1rem 0", color: "#08182b" }}>Find Machines</h2>
          <p style={{ margin: "0 0 1.5rem 0", color: "#124e66" }}>
            Search for available machines and send booking requests instantly.
          </p>
          <MachineSearch token={token} />
        </div>

        {userRole === "LEJER" && (
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <h2 style={{ margin: 0, color: "#08182b" }}>Ready to rent out your machines?</h2>
                <p style={{ margin: "0.5rem 0 0 0", color: "#124e66" }}>
                  Upgrade your LEJER account to a rental provider by validating your CVR number.
                </p>
              </div>
              {!showProviderForm && (
                <button style={providerCtaStyle} onClick={() => setShowProviderForm(true)}>
                  Become a Rental Provider
                </button>
              )}
            </div>

            {showProviderForm && (
              <RentalProviderRegistration
                token={token}
                onRegistrationSuccess={handleRentalProviderSuccess}
              />
            )}
          </div>
        )}

        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#08182b" }}>My Rentals</h2>
              <p style={{ margin: "0.5rem 0 0 0", color: "#124e66", fontSize: "0.9rem" }}>
                Track the status of your booking requests and completed rentals.
              </p>
            </div>
            <button
              onClick={refreshBookings}
              disabled={loadingBookings}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "none",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: loadingBookings ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                background: loadingBookings
                  ? "#49a3a6"
                  : "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
                color: "#ffffff",
                boxShadow: loadingBookings ? "none" : "0 4px 15px rgba(31, 111, 120, 0.4)",
                opacity: loadingBookings ? 0.6 : 1,
              }}
            >
              {loadingBookings ? "Loading..." : "🔄 Refresh"}
            </button>
          </div>

          {error && <div style={errorStyle}>{error}</div>}

          {!loadingBookings && bookings.length === 0 && !error && (
            <p style={{ color: "#124e66", fontStyle: "italic", textAlign: "center", padding: "2rem" }}>
              You haven't made any bookings yet.
            </p>
          )}

          {bookings.length > 0 && (
            <div>
              {bookings.map((booking) => {
                const machine = machines[booking.machineId];
                const statusStyle = getStatusColor(booking.status);

                return (
                  <div key={booking.id} style={bookingCardStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "1rem",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            marginBottom: "0.75rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#08182b" }}>
                            {machine ? machine.name : booking.machineName || "Unknown machine"}
                          </h3>
                          <span
                            style={{
                              ...statusStyle,
                              padding: "0.25rem 0.75rem",
                              borderRadius: "20px",
                              fontSize: "0.875rem",
                              fontWeight: "600",
                            }}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "#124e66", marginBottom: "0.5rem" }}>
                          <div>
                            <strong>Start:</strong> {formatDateTime(booking.startTime)}
                          </div>
                          <div>
                            <strong>End:</strong> {formatDateTime(booking.endTime)}
                          </div>
                        </div>
                        {machine && (
                          <div style={{ fontSize: "0.9rem", color: "#124e66" }}>
                            📍 {machine.location || "N/A"}
                            {machine.price && ` • 💰 $${machine.price.toFixed(2)}/hour`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

