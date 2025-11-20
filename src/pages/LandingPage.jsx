import { useState, useEffect } from "react";
import MachineSearch from "../components/MachineSearch";

const API_BASE = "http://localhost:8080/api";

export default function LandingPage({ token, userEmail, onNavigateToLogin, onNavigateToRegister, onNavigateToHome }) {
  const [userName, setUserName] = useState("");

  // Load current user's name when component mounts
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
          const currentUser = data.find(u => u.email === userEmail);
          if (currentUser) {
            setUserName(currentUser.name);
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

  const heroSectionStyle = {
    textAlign: "center",
    marginBottom: "3rem",
  };

  const titleStyle = {
    fontSize: "3rem",
    fontWeight: "700",
    color: "#ffffff",
    margin: "0 0 1rem 0",
    textShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
  };

  const subtitleStyle = {
    fontSize: "1.25rem",
    color: "#f9fdff",
    margin: "0 0 2rem 0",
    lineHeight: "1.6",
    textShadow: "0 1px 5px rgba(0, 0, 0, 0.2)",
  };

  const buttonGroupStyle = {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    flexWrap: "wrap",
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

  const cardStyle = {
    background: "white",
    borderRadius: "16px",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 10px 40px rgba(8, 24, 43, 0.3)",
  };

  const featuresSectionStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1.5rem",
    marginBottom: "3rem",
  };

  const featureCardStyle = {
    background: "rgba(255, 255, 255, 0.9)",
    padding: "1.5rem",
    borderRadius: "12px",
    border: "1px solid rgba(73, 163, 166, 0.3)",
    textAlign: "center",
  };

  const featureTitleStyle = {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#08182b",
    margin: "0 0 0.5rem 0",
  };

  const featureTextStyle = {
    fontSize: "0.9rem",
    color: "#124e66",
    margin: "0",
    lineHeight: "1.5",
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        {/* Header with Navigation */}
        <div style={headerCardStyle}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#08182b", margin: "0" }}>
              AssetShare.dk
            </h1>
            <p style={{ fontSize: "0.9rem", color: "#124e66", margin: "0.25rem 0 0 0" }}>
              Your platform for sharing and renting equipment
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {token ? (
              <>
                <span style={{ 
                  padding: "0.5rem 1rem", 
                  color: "#124e66", 
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center"
                }}>
                  👤 {userName || userEmail}
                </span>
                <button
                  onClick={onNavigateToHome}
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
                  Dashboard
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onNavigateToLogin}
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
                  Login
                </button>
                <button
                  onClick={onNavigateToRegister}
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
                  Register
                </button>
              </>
            )}
          </div>
        </div>

        {/* Hero Section */}
        <div style={heroSectionStyle}>
          <h1 style={titleStyle}>Welcome to AssetShare</h1>
          <p style={subtitleStyle}>
            Discover and rent construction equipment, machinery, and tools from verified providers.
            <br />
            Browse our catalog, find the perfect machine for your project, and get started today.
          </p>
          {!token && (
            <div style={buttonGroupStyle}>
              <button
                onClick={onNavigateToRegister}
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
                Get Started
              </button>
              <button
                onClick={onNavigateToLogin}
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
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div style={featuresSectionStyle}>
          <div style={featureCardStyle}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔍</div>
            <h3 style={featureTitleStyle}>Browse Machines</h3>
            <p style={featureTextStyle}>
              Search through our extensive catalog of construction equipment and machinery
            </p>
          </div>
          <div style={featureCardStyle}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📍</div>
            <h3 style={featureTitleStyle}>Location-Based</h3>
            <p style={featureTextStyle}>
              Find equipment near you with our location-based search functionality
            </p>
          </div>
          <div style={featureCardStyle}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>💰</div>
            <h3 style={featureTitleStyle}>Affordable Rates</h3>
            <p style={featureTextStyle}>
              Compare prices and find the best deals for your rental needs
            </p>
          </div>
          <div style={featureCardStyle}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✅</div>
            <h3 style={featureTitleStyle}>Verified Providers</h3>
            <p style={featureTextStyle}>
              All equipment providers are verified and trusted members of our platform
            </p>
          </div>
        </div>

        {/* Machine Search Section */}
        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.75rem", color: "#08182b" }}>
            Browse Available Machines
          </h2>
          <p style={{ margin: "0 0 1.5rem 0", color: "#124e66", fontSize: "1rem" }}>
            Search and explore our catalog of available equipment. {!token && "Sign up to book machines and start renting!"}
          </p>
          <MachineSearch token={token} />
        </div>
      </div>
    </div>
  );
}

