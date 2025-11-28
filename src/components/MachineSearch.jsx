import { useState } from "react";
import BookingRequest from "./BookingRequest";

const API_BASE = "http://localhost:8080/api";

export default function MachineSearch({ token, renterId }) {
  const [machines, setMachines] = useState([]);
  const [location, setLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  async function searchMachines() {
    setLoading(true);
    setError("");
    
    try {
      const params = new URLSearchParams();
      if (location.trim()) {
        params.append("location", location.trim());
      }
      if (maxPrice.trim()) {
        params.append("maxPrice", maxPrice.trim());
      }

      const url = `${API_BASE}/machines${params.toString() ? `?${params.toString()}` : ""}`;
      
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        setError("Failed to search machines: " + text);
        setMachines([]);
        return;
      }

      const data = await res.json();
      setMachines(data);
    } catch (err) {
      console.error(err);
      setError("Error searching machines: " + err.message);
      setMachines([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadAllMachines() {
    setLocation("");
    setMaxPrice("");
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(`${API_BASE}/machines`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        setError("Failed to load machines: " + text);
        setMachines([]);
        return;
      }

      const data = await res.json();
      setMachines(data);
    } catch (err) {
      console.error(err);
      setError("Error loading machines: " + err.message);
      setMachines([]);
    } finally {
      setLoading(false);
    }
  }

  const inputGroupStyle = {
    marginBottom: "1.5rem",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: "600",
    color: "#124e66",
    fontSize: "0.9rem",
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "2px solid rgba(73, 163, 166, 0.3)",
    fontSize: "1rem",
    transition: "all 0.3s ease",
    boxSizing: "border-box",
    background: "rgba(255, 255, 255, 0.8)",
    color: "#08182b",
  };

  const buttonStyle = {
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "all 0.3s ease",
    background: loading
      ? "#49a3a6"
      : "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
    color: "#ffffff",
    boxShadow: loading
      ? "none"
      : "0 4px 15px rgba(31, 111, 120, 0.4)",
    marginRight: "0.75rem",
    marginBottom: "0.75rem",
    opacity: loading ? 0.6 : 1,
  };

  const errorStyle = {
    color: "#08182b",
    background: "rgba(255, 200, 200, 0.8)",
    padding: "1rem",
    borderRadius: "8px",
    marginTop: "1rem",
    border: "1px solid rgba(255, 150, 150, 0.5)",
  };

  const machineCardStyle = {
    background: "rgba(255, 255, 255, 0.7)",
    padding: "1.25rem",
    marginBottom: "1rem",
    borderRadius: "12px",
    border: "1px solid rgba(73, 163, 166, 0.3)",
    transition: "all 0.2s ease",
  };

  const machineNameStyle = {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#08182b",
    marginBottom: "0.75rem",
    background: "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  const machineInfoStyle = {
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

  const bookButtonStyle = {
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
    marginTop: "0.75rem",
  };

  const successMessageStyle = {
    background: "rgba(100, 200, 100, 0.8)",
    color: "#08182b",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    border: "1px solid rgba(100, 200, 100, 0.5)",
  };

  return (
    <div>
      {selectedMachine && (
        <BookingRequest
          machine={selectedMachine}
          token={token}
          onClose={() => {
            setSelectedMachine(null);
            setBookingSuccess(null);
          }}
          onBookingSuccess={(data) => {
            setBookingSuccess(data);
            setSelectedMachine(null);
            // Optionally reload machines
            setTimeout(() => {
              setBookingSuccess(null);
            }, 5000);
          }}
        />
      )}

      {bookingSuccess && (
        <div style={successMessageStyle}>
          ✅ {bookingSuccess.message}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>📍 Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Copenhagen"
            style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#49a3a6";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(73, 163, 166, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(73, 163, 166, 0.3)";
                e.currentTarget.style.boxShadow = "none";
              }}
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>💰 Max Price</label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Enter max price"
            min="0"
            step="0.01"
            style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#49a3a6";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(73, 163, 166, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(73, 163, 166, 0.3)";
                e.currentTarget.style.boxShadow = "none";
              }}
          />
        </div>
      </div>

      <div style={{ marginBottom: "1rem", display: "flex", flexWrap: "wrap" }}>
        <button
          onClick={searchMachines}
          disabled={loading}
          style={buttonStyle}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(31, 111, 120, 0.6)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = loading
                ? "none"
                : "0 4px 15px rgba(31, 111, 120, 0.4)";
            }}
        >
          {loading ? "Searching..." : "🔍 Search"}
        </button>
        <button
          onClick={loadAllMachines}
          disabled={loading}
          style={buttonStyle}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(73, 163, 166, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = loading
                ? "none"
                : "0 4px 15px rgba(73, 163, 166, 0.3)";
            }}
        >
          {loading ? "Loading..." : "📋 Load All Machines"}
        </button>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={{ marginTop: "2rem" }}>
        <h3 style={{ fontSize: "1.25rem", color: "#08182b", marginBottom: "1rem" }}>
          Results <span style={{ color: "#1f6f78", fontWeight: "600" }}>({machines.length})</span>
        </h3>
        {machines.length === 0 ? (
          <p style={{ color: "#124e66", fontStyle: "italic", textAlign: "center", padding: "2rem" }}>
            No machines found. Try adjusting your search criteria.
          </p>
        ) : (
          <div>
            {machines.map((machine) => (
              <div key={machine.id} style={machineCardStyle}>
                <div style={machineNameStyle}>{machine.name}</div>
                <div style={machineInfoStyle}>
                  <div style={infoItemStyle}>
                    <span style={infoLabelStyle}>Category:</span>
                    {machine.category || "N/A"}
                  </div>
                  <div style={infoItemStyle}>
                    <span style={infoLabelStyle}>📍 Location:</span>
                    {machine.location || "N/A"}
                  </div>
                  <div style={infoItemStyle}>
                    <span style={infoLabelStyle}>💰 Price:</span>
                    {machine.price ? `$${machine.price.toFixed(2)}` : "N/A"}
                  </div>
                  {machine.ownerName && (
                    <div style={infoItemStyle}>
                      <span style={infoLabelStyle}>👤 Owner:</span>
                      {machine.ownerName}
                    </div>
                  )}
                </div>
                {machine.instantBookingEnabled && (
                  <div style={{ marginTop: "0.5rem", color: "#1f6f78", fontWeight: "600" }}>
                    ⚡ Instant booking available — no manual approval needed.
                  </div>
                )}
                {token && (
                  <button
                    onClick={() => setSelectedMachine(machine)}
                    style={bookButtonStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(31, 111, 120, 0.6)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 15px rgba(31, 111, 120, 0.4)";
                    }}
                  >
                    {machine.instantBookingEnabled ? "⚡ Instant Book" : "📅 Book This Machine"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
