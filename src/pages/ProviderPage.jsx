import { useState, useEffect, useCallback } from "react";
import StripeConnect from "../components/StripeConnect";
import TotpSetup from "../components/TotpSetup";
import StarRating from "../components/StarRating";
import MyDetails from "../components/MyDetails";

const API_BASE = "http://localhost:8080/api";

export default function ProviderPage({ token, userEmail, onLogout, onNavigateToLanding }) {
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRating, setUserRating] = useState(null);
  const [userRatingCount, setUserRatingCount] = useState(null);
  const [ownMachines, setOwnMachines] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [machinesMap, setMachinesMap] = useState({}); // Cache machine details
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", category: "", location: "", price: "", status: "ACTIVE", instantBookingEnabled: false });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [addFormData, setAddFormData] = useState({ name: "", category: "", location: "", price: "", status: "ACTIVE", instantBookingEnabled: false });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [activeBookingTab, setActiveBookingTab] = useState("requested"); // "requested", "approved", "completed"
  const [showMyDetails, setShowMyDetails] = useState(false);
  const isProviderRole = userRole === "BOTH" || userRole === "UDLEJER";


  // Load current user's name when component mounts
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
            setUserId(currentUser.id);
            // Convert rating to number if it's a string, preserve null if not present
            const rating = currentUser.averageRating != null && currentUser.averageRating !== undefined 
              ? (typeof currentUser.averageRating === 'string' ? parseFloat(currentUser.averageRating) : Number(currentUser.averageRating))
              : null;
            const count = currentUser.ratingCount != null && currentUser.ratingCount !== undefined
              ? (typeof currentUser.ratingCount === 'string' ? parseInt(currentUser.ratingCount) : Number(currentUser.ratingCount))
              : null;
            setUserRating(rating);
            setUserRatingCount(count);
          }
        }
      } catch (err) {
        console.error("Error loading current user:", err);
      }
    }

    loadCurrentUserName();
  }, [userEmail, token]);

  // Load own machines when user is BOTH or UDLEJER
  useEffect(() => {
    async function loadOwnMachines() {
      if (!userId || !token || !isProviderRole) return;
      
      setLoadingMachines(true);
      try {
        const res = await fetch(`${API_BASE}/machines/my-machines`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const myMachines = await res.json();
          setOwnMachines(myMachines);
        }
      } catch (err) {
        console.error("Error loading own machines:", err);
      } finally {
        setLoadingMachines(false);
      }
    }

    loadOwnMachines();
  }, [userId, token, isProviderRole]);

  // Load machine details for bookings
  const loadMachineDetails = useCallback(async (machineIds) => {
    const machineMap = {};
    for (const machineId of machineIds) {
      try {
        const res = await fetch(`${API_BASE}/machines/${machineId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const machine = await res.json();
          machineMap[machineId] = machine;
        }
      } catch (err) {
        console.error("Error loading machine:", err);
      }
    }
    setMachinesMap(machineMap);
  }, [token]);

  const loadDashboardStats = useCallback(async () => {
    if (!token || !isProviderRole) {
      setDashboardStats(null);
      return;
    }

    setLoadingStats(true);
    setStatsError("");

    try {
      const res = await fetch(`${API_BASE}/dashboard/provider`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        setStatsError(text || "Failed to load dashboard stats");
        setDashboardStats(null);
        return;
      }

      const stats = await res.json();
      setDashboardStats(stats);
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
      setStatsError("Error loading stats: " + err.message);
      setDashboardStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, [token, isProviderRole]);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  // Load all bookings for user's machines
  useEffect(() => {
    async function loadAllBookings() {
      if (!token || !isProviderRole) return;
      
      setLoadingBookings(true);
      try {
        const res = await fetch(`${API_BASE}/bookings/my-machines`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const bookings = await res.json();
          setAllBookings(bookings);
          
          // Load machine details for each booking
          const machineIds = [...new Set(bookings.map(b => b.machineId).filter(Boolean))];
          await loadMachineDetails(machineIds);
        }
      } catch (err) {
        console.error("Error loading bookings:", err);
      } finally {
        setLoadingBookings(false);
      }
    }

    loadAllBookings();
  }, [token, isProviderRole, loadMachineDetails]);

  // Format date time
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

  // Get status color
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

  function formatCurrency(amount) {
    if (amount === null || amount === undefined) {
      return "DKK 0.00";
    }
    const value = typeof amount === "number" ? amount : parseFloat(amount);
    if (Number.isNaN(value)) {
      return "DKK 0.00";
    }
    return `DKK ${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
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
    background: "#49a3a6",
    color: "#08182b",
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
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "0.75rem",
    border: "1px solid rgba(73, 163, 166, 0.3)",
    transition: "all 0.2s ease",
  };

  const errorStyle = {
    color: "#08182b",
    background: "rgba(255, 200, 200, 0.8)",
    padding: "1rem",
    borderRadius: "8px",
    marginTop: "1rem",
    border: "1px solid rgba(255, 150, 150, 0.5)",
  };

  const statsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "1rem",
  };

  const statCardStyle = {
    background: "rgba(73, 163, 166, 0.1)",
    border: "1px solid rgba(73, 163, 166, 0.2)",
    borderRadius: "12px",
    padding: "1rem",
    boxShadow: "0 2px 8px rgba(8, 24, 43, 0.08)",
  };

  const statLabelStyle = {
    fontSize: "0.85rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#124e66",
    marginBottom: "0.35rem",
  };

  const statValueStyle = {
    fontSize: "1.75rem",
    fontWeight: "700",
    color: "#08182b",
  };

  const statSubtextStyle = {
    fontSize: "0.85rem",
    color: "#4d6071",
    marginTop: "0.25rem",
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

  async function downloadContract(booking) {
    if (!booking.contractId) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/contracts/${booking.contractId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to download contract PDF:", res.status, text);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contract-${booking.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading contract PDF:", err);
    }
  }

  // If no token, show message
  if (!token) {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={cardStyle}>
            <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#08182b" }}>Authentication Required</h2>
            <p style={{ margin: "0.5rem 0 0 0", color: "#124e66", fontSize: "0.9rem" }}>
              Please log in to access the dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        {/* Header Card */}
        <div style={headerCardStyle}>
          <div>
            <h1 style={titleStyle}>
              {(userRole === "BOTH" || userRole === "UDLEJER") ? "Rental Provider Dashboard" : "Welcome to AssetShare"}
            </h1>
            <p style={{ ...subtitleStyle, display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              Logged in as <strong style={{ color: "#1f6f78" }}>{userName || userEmail}</strong>
              {userRole && userRole !== "ADMIN" && <span style={roleBadgeStyle}>{userRole}</span>}
              {userRole && userRole !== "ADMIN" && (
                userRating !== null && userRating !== undefined && !isNaN(userRating) ? (
                  <StarRating rating={userRating} count={userRatingCount} size="0.9rem" />
                ) : (
                  <span style={{ fontSize: "0.9rem", color: "#999", fontStyle: "italic" }}>No rating received</span>
                )
              )}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {onNavigateToLanding && (
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
                  boxShadow: "0 4px 15px rgba(73, 163, 166, 0.3)",
                }}
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
            {userRole && userRole !== "ADMIN" && (
              <button
                onClick={() => setShowMyDetails(true)}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  border: "2px solid #49a3a6",
                  background: "white",
                  color: "#1f6f78",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(73, 163, 166, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(73, 163, 166, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(73, 163, 166, 0.3)";
                }}
              >
                My Details
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

        {/* Loading state while user role is being fetched */}
        {!userRole && token && (
          <div style={cardStyle}>
            <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.5rem", color: "#08182b" }}>Loading Dashboard...</h2>
            <p style={{ color: "#124e66", textAlign: "center", padding: "1rem 0" }}>
              Please wait while we load your dashboard...
            </p>
          </div>
        )}

        {/* Show message if user is not a provider */}
        {userRole && userRole !== "BOTH" && userRole !== "UDLEJER" && (
          <div style={cardStyle}>
            <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.5rem", color: "#08182b" }}>Access Restricted</h2>
            <p style={{ color: "#124e66", textAlign: "center", padding: "1rem 0" }}>
              This dashboard is only available for rental providers. Your current role is: <strong>{userRole}</strong>
            </p>
          </div>
        )}

        {/* Rental Provider Dashboard - Show for BOTH and UDLEJER */}
        {isProviderRole && (
          <>
            <TotpSetup token={token} />

            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#08182b" }}>Business Overview</h2>
                  <p style={{ margin: "0.5rem 0 0 0", color: "#124e66", fontSize: "0.9rem" }}>
                    Snapshot of your fleet utilisation and earnings
                  </p>
                </div>
                <button
                  onClick={loadDashboardStats}
                  disabled={loadingStats}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: loadingStats ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                    background: loadingStats
                      ? "#49a3a6"
                      : "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
                    color: "#ffffff",
                    boxShadow: loadingStats ? "none" : "0 4px 15px rgba(31, 111, 120, 0.4)",
                    opacity: loadingStats ? 0.6 : 1,
                  }}
                >
                  {loadingStats ? "Loading..." : "🔄 Refresh"}
                </button>
              </div>

              {statsError && <div style={errorStyle}>{statsError}</div>}

              <div style={statsGridStyle}>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Machines Listed</div>
                  <div style={statValueStyle}>
                    {dashboardStats ? dashboardStats.totalMachines : loadingStats ? "…" : "0"}
                  </div>
                  <div style={statSubtextStyle}>Total machines on AssetShare</div>
                </div>

                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Machines Booked Now</div>
                  <div style={statValueStyle}>
                    {dashboardStats ? dashboardStats.machinesCurrentlyBooked : loadingStats ? "…" : "0"}
                  </div>
                  <div style={statSubtextStyle}>Currently engaged rentals</div>
                </div>

                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Active Requests</div>
                  <div style={statValueStyle}>
                    {dashboardStats ? dashboardStats.activeBookings : loadingStats ? "…" : "0"}
                  </div>
                  <div style={statSubtextStyle}>Pending or ongoing bookings</div>
                </div>

                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Total Revenue</div>
                  <div style={statValueStyle}>
                    {dashboardStats ? formatCurrency(dashboardStats.totalRevenue) : loadingStats ? "…" : "DKK 0.00"}
                  </div>
                  <div style={statSubtextStyle}>All-time payouts</div>
                </div>

                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Revenue (This Month)</div>
                  <div style={statValueStyle}>
                    {dashboardStats ? formatCurrency(dashboardStats.revenueThisMonth) : loadingStats ? "…" : "DKK 0.00"}
                  </div>
                  <div style={statSubtextStyle}>Paid since month start</div>
                </div>
              </div>
            </div>

            {/* My Machines Section */}
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#08182b" }}>
                    My Machines
                  </h2>
                  <p style={{ margin: "0.5rem 0 0 0", color: "#124e66", fontSize: "0.9rem" }}>
                    Overview of all machines you own and have listed
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddMachine(true);
                    setAddFormData({ name: "", category: "", location: "", price: "", status: "ACTIVE", instantBookingEnabled: false });
                    setAddError("");
                    setAddSuccess(false);
                  }}
                  style={{ ...buttonStyle, color: "#ffffff" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(31, 111, 120, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(31, 111, 120, 0.4)";
                  }}
                >
                  ➕ Add Machine
                </button>
              </div>

              {loadingMachines ? (
                <p style={{ color: "#124e66", textAlign: "center", padding: "2rem" }}>
                  Loading machines...
                </p>
              ) : ownMachines.length > 0 ? (
                <div>
                  {ownMachines.map((machine) => {
                    // Parse machine rating values
                    const machineRating = machine.averageMachineRating != null && machine.averageMachineRating !== undefined
                      ? (typeof machine.averageMachineRating === 'string' ? parseFloat(machine.averageMachineRating) : Number(machine.averageMachineRating))
                      : null;
                    const machineRatingCount = machine.machineRatingCount != null && machine.machineRatingCount !== undefined
                      ? (typeof machine.machineRatingCount === 'string' ? parseInt(machine.machineRatingCount) : Number(machine.machineRatingCount))
                      : null;
                    
                    return (
                    <div key={machine.id} style={userCardStyle}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "600", color: "#08182b", fontSize: "1.1rem", marginBottom: "0.25rem" }}>
                            {machine.name}
                          </div>
                          {machineRating !== null && machineRating !== undefined && !isNaN(machineRating) && machineRatingCount !== null && machineRatingCount > 0 ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <StarRating rating={machineRating} count={machineRatingCount} size="0.9rem" />
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.85rem", color: "#999", fontStyle: "italic" }}>No ratings yet</span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setEditingMachine(machine);
                            setEditFormData({
                              name: machine.name || "",
                              category: machine.category || "",
                              location: machine.location || "",
                              price: machine.price ? machine.price.toString() : "",
                              status: machine.status || "ACTIVE",
                              instantBookingEnabled: Boolean(machine.instantBookingEnabled),
                            });
                            setEditError("");
                          }}
                          style={{
                            padding: "0.5rem 1rem",
                            borderRadius: "8px",
                            border: "none",
                            fontSize: "0.9rem",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            background: "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
                            color: "#ffffff",
                            boxShadow: "0 4px 15px rgba(31, 111, 120, 0.4)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 6px 20px rgba(73, 163, 166, 0.5)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 4px 15px rgba(31, 111, 120, 0.4)";
                          }}
                        >
                          ✏️ Edit
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.5rem", fontSize: "0.9rem", color: "#124e66" }}>
                        <div>
                          <strong>Category:</strong> {machine.category || "N/A"}
                        </div>
                        <div>
                          <strong>Location:</strong> {machine.location || "N/A"}
                        </div>
                        <div>
                          <strong>Price:</strong> {machine.price ? `DKK ${machine.price.toFixed(2)}` : "N/A"}
                        </div>
                        <div>
                          <strong>Status:</strong>{" "}
                          <span style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            background: machine.status === "ACTIVE" ? "#d4edda" : "#f8d7da",
                            color: machine.status === "ACTIVE" ? "#155724" : "#721c24",
                            border: machine.status === "ACTIVE" ? "1px solid #28a745" : "1px solid #dc3545"
                          }}>
                            {machine.status || "ACTIVE"}
                          </span>
                        </div>
                        <div>
                          <strong>Instant Booking:</strong>{" "}
                          {machine.instantBookingEnabled ? "Enabled ⚡" : "Disabled"}
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              ) : (
                <p style={{ color: "#124e66", fontStyle: "italic", textAlign: "center", padding: "2rem" }}>
                  You haven't listed any machines yet. Add a machine to get started!
                </p>
              )}
            </div>

            {/* Booking Requests Section */}
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#08182b" }}>
                    Booking Requests
                  </h2>
                  <p style={{ margin: "0.5rem 0 0 0", color: "#124e66", fontSize: "0.9rem" }}>
                    View and manage all bookings for your machines
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setLoadingBookings(true);
                    try {
                      const res = await fetch(`${API_BASE}/bookings/my-machines`, {
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                      });
                      if (res.ok) {
                        const bookings = await res.json();
                        setAllBookings(bookings);
                        const machineIds = [...new Set(bookings.map(b => b.machineId).filter(Boolean))];
                        await loadMachineDetails(machineIds);
                      }
                    } catch (err) {
                      console.error("Error reloading bookings:", err);
                    } finally {
                      setLoadingBookings(false);
                    }
                  }}
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
                  onMouseEnter={(e) => {
                    if (!loadingBookings) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(73, 163, 166, 0.5)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(73, 163, 166, 0.3)";
                  }}
                >
                  {loadingBookings ? "Loading..." : "🔄 Refresh"}
                </button>
              </div>

              {/* Tab Navigation */}
              <div style={{ 
                display: "flex", 
                gap: "0.5rem", 
                marginBottom: "1.5rem", 
                borderBottom: "2px solid rgba(73, 163, 166, 0.2)",
                overflowX: "auto"
              }}>
                <button
                  onClick={() => setActiveBookingTab("requested")}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px 8px 0 0",
                    border: "none",
                    borderBottom: activeBookingTab === "requested" ? "3px solid #1f6f78" : "3px solid transparent",
                    fontSize: "0.95rem",
                    fontWeight: activeBookingTab === "requested" ? "600" : "500",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    background: activeBookingTab === "requested" 
                      ? "linear-gradient(135deg, rgba(31, 111, 120, 0.1) 0%, rgba(73, 163, 166, 0.1) 100%)"
                      : "transparent",
                    color: activeBookingTab === "requested" ? "#08182b" : "#124e66",
                    whiteSpace: "nowrap"
                  }}
                  onMouseEnter={(e) => {
                    if (activeBookingTab !== "requested") {
                      e.currentTarget.style.background = "rgba(73, 163, 166, 0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeBookingTab !== "requested") {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  Requested ({allBookings.filter(b => b.status === "REQUESTED").length})
                </button>
                <button
                  onClick={() => setActiveBookingTab("approved")}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px 8px 0 0",
                    border: "none",
                    borderBottom: activeBookingTab === "approved" ? "3px solid #1f6f78" : "3px solid transparent",
                    fontSize: "0.95rem",
                    fontWeight: activeBookingTab === "approved" ? "600" : "500",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    background: activeBookingTab === "approved" 
                      ? "linear-gradient(135deg, rgba(31, 111, 120, 0.1) 0%, rgba(73, 163, 166, 0.1) 100%)"
                      : "transparent",
                    color: activeBookingTab === "approved" ? "#08182b" : "#124e66",
                    whiteSpace: "nowrap"
                  }}
                  onMouseEnter={(e) => {
                    if (activeBookingTab !== "approved") {
                      e.currentTarget.style.background = "rgba(73, 163, 166, 0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeBookingTab !== "approved") {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  Approved / On-going ({allBookings.filter(b => b.status === "APPROVED").length})
                </button>
                <button
                  onClick={() => setActiveBookingTab("completed")}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px 8px 0 0",
                    border: "none",
                    borderBottom: activeBookingTab === "completed" ? "3px solid #1f6f78" : "3px solid transparent",
                    fontSize: "0.95rem",
                    fontWeight: activeBookingTab === "completed" ? "600" : "500",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    background: activeBookingTab === "completed" 
                      ? "linear-gradient(135deg, rgba(31, 111, 120, 0.1) 0%, rgba(73, 163, 166, 0.1) 100%)"
                      : "transparent",
                    color: activeBookingTab === "completed" ? "#08182b" : "#124e66",
                    whiteSpace: "nowrap"
                  }}
                  onMouseEnter={(e) => {
                    if (activeBookingTab !== "completed") {
                      e.currentTarget.style.background = "rgba(73, 163, 166, 0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeBookingTab !== "completed") {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  Completed ({allBookings.filter(b => b.status === "COMPLETED").length})
                </button>
              </div>

              {loadingBookings ? (
                <p style={{ color: "#124e66", textAlign: "center", padding: "2rem" }}>
                  Loading bookings...
                </p>
              ) : (() => {
                // Filter bookings based on active tab
                const filteredBookings = allBookings.filter((booking) => {
                  if (activeBookingTab === "requested") {
                    return booking.status === "REQUESTED";
                  } else if (activeBookingTab === "approved") {
                    return booking.status === "APPROVED";
                  } else if (activeBookingTab === "completed") {
                    return booking.status === "COMPLETED";
                  }
                  return false;
                });

                return filteredBookings.length > 0 ? (
                  <div>
                    {filteredBookings.map((booking) => {
                    const machine = machinesMap[booking.machineId];
                    const statusStyle = getStatusColor(booking.status);
                    const instantBookingEnabled = machine?.instantBookingEnabled;
                    
                    return (
                      <div key={booking.id} style={userCardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
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
                            
                            {machine && (
                              <div style={{ fontSize: "0.9rem", color: "#124e66", marginBottom: "0.5rem" }}>
                                📍 {machine.location || "N/A"}
                                {machine.price && ` • 💰 DKK ${machine.price.toFixed(2)}/hour`}
                              </div>
                            )}
                            
                            <div style={{ fontSize: "0.9rem", color: "#124e66", marginBottom: "0.5rem" }}>
                              <div>
                                <strong>Start:</strong> {formatDateTime(booking.startTime)}
                              </div>
                              <div>
                                <strong>End:</strong> {formatDateTime(booking.endTime)}
                              </div>
                              <div>
                                <strong>Renter:</strong> {booking.renterName || "Unknown renter"}
                              </div>
                            </div>
                          </div>
                          
                          {instantBookingEnabled && booking.status === "REQUESTED" && (
                            <div style={{ fontSize: "0.85rem", color: "#124e66", fontStyle: "italic" }}>
                              Instant booking is enabled for this machine. Approval happens automatically after payment.
                            </div>
                          )}

                          {booking.status === "REQUESTED" && !instantBookingEnabled && (
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                              <button
                                onClick={async () => {
                                  const code = window.prompt("Confirm approval with Google Authenticator (6 digits):");
                                  if (code === null) {
                                    return;
                                  }
                                  try {
                                    const res = await fetch(`${API_BASE}/bookings/${booking.id}/approve`, {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`,
                                      },
                                      body: JSON.stringify({
                                        totpCode: code,
                                      }),
                                    });
                                    if (res.ok) {
                                      // Reload bookings
                                      const bookingsRes = await fetch(`${API_BASE}/bookings/my-machines`, {
                                        headers: {
                                          "Content-Type": "application/json",
                                          Authorization: `Bearer ${token}`,
                                        },
                                      });
                                      if (bookingsRes.ok) {
                                        const bookings = await bookingsRes.json();
                                        setAllBookings(bookings);
                                        const machineIds = [...new Set(bookings.map(b => b.machineId).filter(Boolean))];
                                        await loadMachineDetails(machineIds);
                                      }
                                    }
                                  } catch (err) {
                                    console.error("Error approving booking:", err);
                                  }
                                }}
                                style={{
                                  ...secondaryButtonStyle,
                                  background: "#4caf50",
                                  color: "white",
                                  fontSize: "0.9rem",
                                  padding: "0.5rem 1rem",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-2px)";
                                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(76, 175, 80, 0.6)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(76, 175, 80, 0.4)";
                                }}
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm("Are you sure you want to reject this booking?")) {
                                    return;
                                  }
                                  try {
                                    const res = await fetch(`${API_BASE}/bookings/${booking.id}/reject`, {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`,
                                      },
                                    });
                                    if (res.ok) {
                                      // Reload bookings
                                      const bookingsRes = await fetch(`${API_BASE}/bookings/my-machines`, {
                                        headers: {
                                          "Content-Type": "application/json",
                                          Authorization: `Bearer ${token}`,
                                        },
                                      });
                                      if (bookingsRes.ok) {
                                        const bookings = await bookingsRes.json();
                                        setAllBookings(bookings);
                                        const machineIds = [...new Set(bookings.map(b => b.machineId).filter(Boolean))];
                                        await loadMachineDetails(machineIds);
                                      }
                                    }
                                  } catch (err) {
                                    console.error("Error rejecting booking:", err);
                                  }
                                }}
                                style={{
                                  ...secondaryButtonStyle,
                                  background: "#f44336",
                                  color: "white",
                                  fontSize: "0.9rem",
                                  padding: "0.5rem 1rem",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-2px)";
                                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(244, 67, 54, 0.6)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(244, 67, 54, 0.4)";
                                }}
                              >
                                ✗ Reject
                              </button>
                            </div>
                          )}

                          {booking.status === "APPROVED" && booking.contractId && (
                            <div style={{ marginTop: "0.75rem" }}>
                              <button
                                onClick={() => downloadContract(booking)}
                                style={{
                                  ...secondaryButtonStyle,
                                  background: "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
                                  color: "#ffffff",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-2px)";
                                  e.currentTarget.style.boxShadow = "0 6px 18px rgba(31, 111, 120, 0.5)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(31, 111, 120, 0.35)";
                                }}
                              >
                                Download Contract as Provider
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                ) : (
                  <p style={{ color: "#124e66", fontStyle: "italic", textAlign: "center", padding: "2rem" }}>
                    {activeBookingTab === "requested" && "No requested bookings found."}
                    {activeBookingTab === "approved" && "No approved or ongoing bookings found."}
                    {activeBookingTab === "completed" && "No completed bookings found."}
                  </p>
                );
              })()}
            </div>
          </>
        )}

        {/* Stripe Connect Section - Only show for BOTH, UDLEJER, or ADMIN */}
        {(userRole === "BOTH" || userRole === "UDLEJER" || userRole === "ADMIN") && (
          <div style={cardStyle}>
            <StripeConnect token={token} />
          </div>
        )}

      </div>

      {/* Edit Machine Modal */}
      {editingMachine && (
        <div style={{
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
        }} onClick={() => {
          setEditingMachine(null);
          setEditError("");
          setShowDeleteConfirm(false);
        }}>
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "2rem",
            maxWidth: "500px",
            width: "100%",
            boxShadow: "0 10px 40px rgba(8, 24, 43, 0.3)",
            maxHeight: "90vh",
            overflowY: "auto",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#08182b" }}>
                Edit Machine
              </h2>
              <button
                onClick={() => {
                  setEditingMachine(null);
                  setEditError("");
                  setShowDeleteConfirm(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#124e66",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                  transition: "all 0.2s ease",
                }}
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

            {editError && <div style={errorStyle}>{editError}</div>}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setEditError("");
              setEditLoading(true);

              if (!editFormData.price || isNaN(parseFloat(editFormData.price)) || parseFloat(editFormData.price) <= 0) {
                setEditError("Please enter a valid price (greater than 0)");
                setEditLoading(false);
                return;
              }

              try {
                const res = await fetch(`${API_BASE}/machines/${editingMachine.id}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    name: editFormData.name,
                    category: editFormData.category,
                    location: editFormData.location,
                    price: parseFloat(editFormData.price),
                    ownerId: editingMachine.ownerId,
                    status: editFormData.status,
                    instantBookingEnabled: editFormData.instantBookingEnabled,
                  }),
                });

                if (!res.ok) {
                  const text = await res.text();
                  setEditError("Failed to update machine: " + text);
                  return;
                }

                // Reload machines
                const machinesRes = await fetch(`${API_BASE}/machines/my-machines`, {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                });
                if (machinesRes.ok) {
                  const myMachines = await machinesRes.json();
                  setOwnMachines(myMachines);
                }

                setEditingMachine(null);
              } catch (err) {
                console.error(err);
                setEditError("Network error: " + err.message);
              } finally {
                setEditLoading(false);
              }
            }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#08182b", fontSize: "0.9rem" }}>
                  Machine Name *
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid rgba(73, 163, 166, 0.3)",
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    background: "rgba(255, 255, 255, 0.8)",
                    color: "#08182b",
                  }}
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                  disabled={editLoading}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#08182b", fontSize: "0.9rem" }}>
                  Category
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid rgba(73, 163, 166, 0.3)",
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    background: "rgba(255, 255, 255, 0.8)",
                    color: "#08182b",
                  }}
                  type="text"
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  disabled={editLoading}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#08182b", fontSize: "0.9rem" }}>
                  Location *
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid rgba(73, 163, 166, 0.3)",
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    background: "rgba(255, 255, 255, 0.8)",
                    color: "#08182b",
                  }}
                  type="text"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  required
                  disabled={editLoading}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#08182b", fontSize: "0.9rem" }}>
                  Price per Hour (DKK) *
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid rgba(73, 163, 166, 0.3)",
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    background: "rgba(255, 255, 255, 0.8)",
                    color: "#08182b",
                  }}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editFormData.price}
                  onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                  required
                  disabled={editLoading}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#08182b", fontSize: "0.9rem" }}>
                  Status *
                </label>
                <select
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid rgba(73, 163, 166, 0.3)",
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    background: "rgba(255, 255, 255, 0.8)",
                    color: "#08182b",
                    cursor: "pointer",
                  }}
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  required
                  disabled={editLoading}
                >
                  <option value="ACTIVE">Active (Publicly listed)</option>
                  <option value="INACTIVE">Inactive (Not publicly displayed)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#08182b", fontSize: "0.9rem" }}>
                  Instant Booking
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#124e66", fontSize: "0.9rem" }}>
                  <input
                    type="checkbox"
                    checked={editFormData.instantBookingEnabled}
                    onChange={(e) => setEditFormData({ ...editFormData, instantBookingEnabled: e.target.checked })}
                    disabled={editLoading}
                    style={{ width: "1rem", height: "1rem" }}
                  />
                  <span>Auto-approve bookings after payment for this machine.</span>
                </div>
              </div>

              {showDeleteConfirm ? (
                <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(255, 200, 200, 0.2)", borderRadius: "8px", border: "1px solid rgba(244, 67, 54, 0.3)" }}>
                  <p style={{ margin: "0 0 1rem 0", color: "#721c24", fontWeight: "600" }}>
                    ⚠️ Are you sure you want to delete this machine? This action cannot be undone.
                  </p>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!editingMachine) return;
                        
                        setDeleteLoading(true);
                        setEditError("");
                        
                        try {
                          const res = await fetch(`${API_BASE}/machines/${editingMachine.id}`, {
                            method: "DELETE",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                          });

                          if (!res.ok) {
                            const text = await res.text();
                            setEditError("Failed to delete machine: " + text);
                            setDeleteLoading(false);
                            return;
                          }

                          // Reload machines
                          const machinesRes = await fetch(`${API_BASE}/machines/my-machines`, {
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                          });
                          if (machinesRes.ok) {
                            const myMachines = await machinesRes.json();
                            setOwnMachines(myMachines);
                          }

                          setEditingMachine(null);
                          setShowDeleteConfirm(false);
                          setEditError("");
                        } catch (err) {
                          console.error(err);
                          setEditError("Network error: " + err.message);
                          setDeleteLoading(false);
                        }
                      }}
                      style={{
                        padding: "0.75rem 1.5rem",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "1rem",
                        fontWeight: "600",
                        cursor: deleteLoading ? "not-allowed" : "pointer",
                        transition: "all 0.3s ease",
                        background: deleteLoading
                          ? "rgba(244, 67, 54, 0.5)"
                          : "linear-gradient(135deg, #d32f2f 0%, #f44336 100%)",
                        color: "#ffffff",
                        boxShadow: deleteLoading ? "none" : "0 4px 15px rgba(211, 47, 47, 0.4)",
                        opacity: deleteLoading ? 0.6 : 1,
                      }}
                      disabled={deleteLoading || editLoading}
                    >
                      {deleteLoading ? "Deleting..." : "Yes, Delete Machine"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setEditError("");
                      }}
                      style={{
                        padding: "0.75rem 1.5rem",
                        borderRadius: "8px",
                        border: "2px solid #49a3a6",
                        fontSize: "1rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        background: "white",
                        color: "#1f6f78",
                        boxShadow: "0 4px 15px rgba(73, 163, 166, 0.3)",
                      }}
                      disabled={deleteLoading || editLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                    <button
                      type="submit"
                      style={{
                        flex: 1,
                        padding: "0.75rem 1.5rem",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "1rem",
                        fontWeight: "600",
                        cursor: editLoading ? "not-allowed" : "pointer",
                        transition: "all 0.3s ease",
                        background: editLoading
                          ? "rgba(31, 111, 120, 0.5)"
                          : "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
                        color: "#ffffff",
                        boxShadow: editLoading ? "none" : "0 4px 15px rgba(31, 111, 120, 0.4)",
                        opacity: editLoading ? 0.6 : 1,
                      }}
                      disabled={editLoading}
                    >
                      {editLoading ? "Updating..." : "Update Machine"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMachine(null);
                        setEditError("");
                        setShowDeleteConfirm(false);
                      }}
                      style={{
                        padding: "0.75rem 1.5rem",
                        borderRadius: "8px",
                        border: "2px solid #49a3a6",
                        fontSize: "1rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        background: "white",
                        color: "#1f6f78",
                        boxShadow: "0 4px 15px rgba(73, 163, 166, 0.3)",
                      }}
                      disabled={editLoading}
                    >
                      Cancel
                    </button>
                  </div>
                  {userRole === "BOTH" && (
                    <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(73, 163, 166, 0.3)" }}>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        style={{
                          width: "100%",
                          padding: "0.75rem 1.5rem",
                          borderRadius: "8px",
                          border: "2px solid #f44336",
                          fontSize: "1rem",
                          fontWeight: "600",
                          cursor: editLoading ? "not-allowed" : "pointer",
                          transition: "all 0.3s ease",
                          background: "white",
                          color: "#d32f2f",
                          boxShadow: "0 4px 15px rgba(244, 67, 54, 0.3)",
                        }}
                        disabled={editLoading}
                        onMouseEnter={(e) => {
                          if (!editLoading) {
                            e.currentTarget.style.background = "rgba(244, 67, 54, 0.1)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "white";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        🗑️ Delete Machine
                      </button>
                    </div>
                  )}
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Add Machine Modal */}
      {showAddMachine && (
        <div style={{
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
        }} onClick={() => {
          setShowAddMachine(false);
          setAddError("");
          setAddSuccess(false);
        }}>
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "2rem",
            maxWidth: "500px",
            width: "100%",
            boxShadow: "0 10px 40px rgba(8, 24, 43, 0.3)",
            maxHeight: "90vh",
            overflowY: "auto",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#08182b" }}>
                Add New Machine
              </h2>
              <button
                onClick={() => {
                  setShowAddMachine(false);
                  setAddError("");
                  setAddSuccess(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#124e66",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                  transition: "all 0.2s ease",
                }}
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

            {addSuccess && (
              <div style={{
                color: "#08182b",
                background: "rgba(200, 255, 200, 0.8)",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                border: "1px solid rgba(150, 255, 150, 0.5)",
                fontSize: "0.9rem",
              }}>
                ✅ Machine added successfully! It's now available for rent.
              </div>
            )}

            {addError && <div style={errorStyle}>{addError}</div>}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setAddError("");
              setAddSuccess(false);
              setAddLoading(true);

              if (!addFormData.price || isNaN(parseFloat(addFormData.price)) || parseFloat(addFormData.price) <= 0) {
                setAddError("Please enter a valid price (greater than 0)");
                setAddLoading(false);
                return;
              }

              try {
                const res = await fetch(`${API_BASE}/machines`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    name: addFormData.name,
                    category: addFormData.category,
                    location: addFormData.location,
                    price: parseFloat(addFormData.price),
                    status: addFormData.status,
                    instantBookingEnabled: addFormData.instantBookingEnabled,
                  }),
                });

                if (!res.ok) {
                  const text = await res.text();
                  setAddError("Failed to add machine: " + text);
                  return;
                }

                await res.json();
                setAddSuccess(true);
                setAddFormData({ name: "", category: "", location: "", price: "", status: "ACTIVE", instantBookingEnabled: false });

                // Reload machines
                if (userId && token) {
                  try {
                    const machinesRes = await fetch(`${API_BASE}/machines`, {
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                    });
                    if (machinesRes.ok) {
                      const allMachines = await machinesRes.json();
                      setOwnMachines(allMachines.filter(m => m.ownerId === userId));
                    }
                  } catch (err) {
                    console.error("Error reloading machines:", err);
                  }
                }

                // Close modal after 1.5 seconds
                setTimeout(() => {
                  setShowAddMachine(false);
                  setAddSuccess(false);
                }, 1500);
              } catch (err) {
                console.error(err);
                setAddError("Network error: " + err.message);
              } finally {
                setAddLoading(false);
              }
            }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#08182b", fontSize: "0.9rem" }}>
                  Machine Name *
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid rgba(73, 163, 166, 0.3)",
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    background: "rgba(255, 255, 255, 0.8)",
                    color: "#08182b",
                  }}
                  type="text"
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                  placeholder="e.g., Excavator CAT 320"
                  required
                  disabled={addLoading}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#08182b", fontSize: "0.9rem" }}>
                  Category
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid rgba(73, 163, 166, 0.3)",
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    background: "rgba(255, 255, 255, 0.8)",
                    color: "#08182b",
                  }}
                  type="text"
                  value={addFormData.category}
                  onChange={(e) => setAddFormData({ ...addFormData, category: e.target.value })}
                  placeholder="e.g., Construction Equipment"
                  disabled={addLoading}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#08182b", fontSize: "0.9rem" }}>
                  Location *
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid rgba(73, 163, 166, 0.3)",
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    background: "rgba(255, 255, 255, 0.8)",
                    color: "#08182b",
                  }}
                  type="text"
                  value={addFormData.location}
                  onChange={(e) => setAddFormData({ ...addFormData, location: e.target.value })}
                  placeholder="e.g., Copenhagen, Denmark"
                  required
                  disabled={addLoading}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#08182b", fontSize: "0.9rem" }}>
                  Price per Hour (DKK) *
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid rgba(73, 163, 166, 0.3)",
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    background: "rgba(255, 255, 255, 0.8)",
                    color: "#08182b",
                  }}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={addFormData.price}
                  onChange={(e) => setAddFormData({ ...addFormData, price: e.target.value })}
                  placeholder="e.g., 5000"
                  required
                  disabled={addLoading}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#08182b", fontSize: "0.9rem" }}>
                  Status *
                </label>
                <select
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid rgba(73, 163, 166, 0.3)",
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    background: "rgba(255, 255, 255, 0.8)",
                    color: "#08182b",
                    cursor: "pointer",
                  }}
                  value={addFormData.status}
                  onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value })}
                  required
                  disabled={addLoading}
                >
                  <option value="ACTIVE">Active (Publicly listed)</option>
                  <option value="INACTIVE">Inactive (Not publicly displayed)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: addLoading ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                    background: addLoading
                      ? "rgba(31, 111, 120, 0.5)"
                      : "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
                    color: "#ffffff",
                    boxShadow: addLoading ? "none" : "0 4px 15px rgba(31, 111, 120, 0.4)",
                    opacity: addLoading ? 0.6 : 1,
                  }}
                  disabled={addLoading}
                >
                  {addLoading ? "Adding..." : "Add Machine"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMachine(false);
                    setAddError("");
                    setAddSuccess(false);
                  }}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px",
                    border: "2px solid #49a3a6",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    background: "white",
                    color: "#1f6f78",
                    boxShadow: "0 4px 15px rgba(73, 163, 166, 0.3)",
                  }}
                  disabled={addLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* My Details Modal */}
      {showMyDetails && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
        }}>
          <MyDetails
            token={token}
            onAccountDeleted={() => {
              setShowMyDetails(false);
              if (onLogout) {
                onLogout();
              }
            }}
            onClose={() => setShowMyDetails(false)}
          />
        </div>
      )}
    </div>
  );
}
