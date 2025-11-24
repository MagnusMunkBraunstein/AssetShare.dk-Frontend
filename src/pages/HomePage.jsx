import { useState, useEffect } from "react";
import MachineSearch from "../components/MachineSearch";
import RentalProviderRegistration from "../components/RentalProviderRegistration";
import AddMachine from "../components/AddMachine";
import MyBookings from "../components/MyBookings";
import TenantBookings from "../components/TenantBookings";
import StripeConnect from "../components/StripeConnect";

const API_BASE = "http://localhost:8080/api";

export default function HomePage({ token, userEmail, onLogout }) {
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState(null);

  async function loadUsers() {
    setMsg("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        const t = await res.text();
        setMsg("Failed to load users: " + t);
        return;
      }

      const data = await res.json();
      setUsers(data);
      
      // Find current user's name and role
      if (userEmail) {
        const currentUser = data.find(u => u.email === userEmail);
        if (currentUser) {
          setUserName(currentUser.name);
          setUserRole(currentUser.role);
        }
      }
    } catch (err) {
      console.error(err);
      setMsg("Error loading users");
    } finally {
      setLoading(false);
    }
  }

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
          }
        }
      } catch (err) {
        console.error("Error loading current user:", err);
      }
    }

    loadCurrentUserName();
  }, [userEmail, token]);

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
    color: "#9adbd6",
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

  const badgeStyle = {
    display: "inline-block",
    background: "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
    color: "#9adbd6",
    padding: "0.25rem 0.75rem",
    borderRadius: "20px",
    fontSize: "0.875rem",
    fontWeight: "600",
    marginLeft: "0.5rem",
  };

  const roleBadgeStyle = {
    ...badgeStyle,
    background: "#49a3a6",
    color: "#f9fdff",
    fontSize: "0.85rem",
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        {/* Header Card */}
        <div style={headerCardStyle}>
          <div>
            <h1 style={titleStyle}>Welcome to AssetShare</h1>
            <p style={subtitleStyle}>
              Logged in as <strong style={{ color: "#1f6f78" }}>{userName || userEmail}</strong>
              {userRole && <span style={roleBadgeStyle}>{userRole}</span>}
            </p>
          </div>
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

        {/* Users Section */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#08182b" }}>
                Users
                <span style={badgeStyle}>Protected</span>
              </h2>
              <p style={{ margin: "0.5rem 0 0 0", color: "#124e66", fontSize: "0.9rem" }}>
                View all registered users in the system
              </p>
            </div>
            <button
              onClick={loadUsers}
              disabled={loading}
              style={secondaryButtonStyle}
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
              {loading ? "Loading..." : "Load Users"}
            </button>
          </div>

          {msg && <div style={errorStyle}>{msg}</div>}

          {users.length > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", color: "#08182b", marginBottom: "1rem" }}>
                Found {users.length} user{users.length !== 1 ? "s" : ""}
              </h3>
              <div>
                {users.map((u) => (
                  <div key={u.id} style={userCardStyle}>
                    <div style={{ fontWeight: "600", color: "#08182b", marginBottom: "0.25rem" }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#124e66" }}>
                      📧 {u.email}
                    </div>
                    {u.role && (
                      <div style={{ fontSize: "0.85rem", color: "#1f6f78", marginTop: "0.25rem" }}>
                        Role: {u.role}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {users.length === 0 && !loading && !msg && (
            <p style={{ color: "#124e66", fontStyle: "italic", textAlign: "center", padding: "2rem" }}>
              Click "Load Users" to view all registered users
            </p>
          )}
        </div>

        {/* Rental Provider Registration Section */}
        <div style={cardStyle}>
          <RentalProviderRegistration
            token={token}
            onRegistrationSuccess={async (userData) => {
              console.log("User registered as rental provider:", userData);
              // Reload users to show updated role
              await loadUsers();
              // Also reload current user info to update role immediately
              if (userEmail && token) {
                try {
                  const res = await fetch(`${API_BASE}/users`, {
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                  });
                  if (res.ok) {
                    const data = await res.json();
                    const currentUser = data.find(u => u.email === userEmail);
                    if (currentUser) {
                      setUserRole(currentUser.role);
                    }
                  }
                } catch (err) {
                  console.error("Error reloading user role:", err);
                }
              }
            }}
          />
        </div>

        {/* Add Machine Section - Only show for BOTH, UDLEJER, or ADMIN */}
        {(userRole === "BOTH" || userRole === "UDLEJER" || userRole === "ADMIN") && (
          <div style={cardStyle}>
            <AddMachine
              token={token}
              onMachineAdded={(machineData) => {
                console.log("Machine added:", machineData);
              }}
            />
          </div>
        )}

        {/* Stripe Connect Section - Only show for BOTH, UDLEJER, or ADMIN */}
        {(userRole === "BOTH" || userRole === "UDLEJER" || userRole === "ADMIN") && (
          <div style={cardStyle}>
            <StripeConnect token={token} />
          </div>
        )}

        {/* My Bookings Section - Only show for BOTH, UDLEJER, or ADMIN */}
        {(userRole === "BOTH" || userRole === "UDLEJER" || userRole === "ADMIN") && (
          <div style={cardStyle}>
            <MyBookings token={token} />
          </div>
        )}

        {/* Tenant Bookings Section - Show for LEJER, BOTH, or ADMIN */}
        {(userRole === "LEJER" || userRole === "BOTH" || userRole === "ADMIN") && (
          <div style={cardStyle}>
            <TenantBookings token={token} />
          </div>
        )}

        {/* Machine Search Section */}
        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.5rem", color: "#08182b" }}>
            Machine Search
          </h2>
          <p style={{ margin: "0 0 1.5rem 0", color: "#124e66", fontSize: "0.9rem" }}>
            Search and browse available machines by location and price
          </p>
          <MachineSearch token={token} />
        </div>
      </div>
    </div>
  );
}
