import { useState, useEffect } from "react";
import MachineSearch from "../components/MachineSearch";
import RentalProviderRegistration from "../components/RentalProviderRegistration";
import TenantBookings from "../components/TenantBookings";

const API_BASE = "http://localhost:8080/api";

export default function RenterPage({ token, userEmail, onLogout, onNavigateToLanding, onSwitchToProvider }) {
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState(null);
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
    if (userData?.role && ["BOTH", "UDLEJER"].includes(userData.role) && onSwitchToProvider) {
      onSwitchToProvider();
    }
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
          <TenantBookings token={token} />
        </div>
      </div>
    </div>
  );
}

