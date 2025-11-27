import { useState, useEffect } from "react";
import ReturnForm from "./ReturnForm";

const API_BASE = "http://localhost:8080/api";

export default function TenantBookings({ token }) {
  const [ongoingBookings, setOngoingBookings] = useState([]);
  const [previousBookings, setPreviousBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [machines, setMachines] = useState({}); // Cache machine details
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  async function loadBookings() {
    setLoading(true);
    setError("");
    
    if (!token) {
      setError("You must be logged in to view bookings");
      setLoading(false);
      return;
    }
    
    try {
      console.log("Loading tenant bookings with token:", token ? "Token present" : "No token");
      
      const res = await fetch(`${API_BASE}/bookings/my-bookings`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Tenant bookings response status:", res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to load tenant bookings:", res.status, text);
        
        if (res.status === 403) {
          setError("Access denied. Your session may have expired. Please try logging out and logging back in.");
        } else {
          setError("Failed to load bookings: " + text);
        }
        setOngoingBookings([]);
        setPreviousBookings([]);
        return;
      }

      const data = await res.json();
      setOngoingBookings(data.ongoing || []);
      setPreviousBookings(data.previous || []);
      
      // Load machine details for all bookings
      const allMachineIds = [
        ...new Set([
          ...(data.ongoing || []).map(b => b.machineId).filter(Boolean),
          ...(data.previous || []).map(b => b.machineId).filter(Boolean)
        ])
      ];
      await loadMachineDetails(allMachineIds);
    } catch (err) {
      console.error(err);
      setError("Error loading bookings: " + err.message);
      setOngoingBookings([]);
      setPreviousBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadMachineDetails(machineIds) {
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
    setMachines(machineMap);
  }

  useEffect(() => {
    if (token) {
      loadBookings();
    }
  }, [token]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
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
  };

  const bookingCardStyle = {
    background: "rgba(255, 255, 255, 0.7)",
    padding: "1.25rem",
    marginBottom: "1rem",
    borderRadius: "12px",
    border: "1px solid rgba(73, 163, 166, 0.3)",
    transition: "all 0.2s ease",
  };

  const errorStyle = {
    color: "#08182b",
    background: "rgba(255, 200, 200, 0.8)",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    border: "1px solid rgba(255, 150, 150, 0.5)",
  };

  const columnStyle = {
    flex: 1,
    minWidth: "300px",
  };

  const columnHeaderStyle = {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#08182b",
    marginBottom: "1rem",
    paddingBottom: "0.5rem",
    borderBottom: "2px solid rgba(73, 163, 166, 0.3)",
  };

  const isBookingEnded = (endTime) => {
    if (!endTime) return false;
    return new Date(endTime) <= new Date();
  };

  const canSubmitReturnForm = (booking) => {
    return (
      booking.status === "APPROVED" &&
      isBookingEnded(booking.endTime) &&
      !(booking.hasReturnForm === true)
    );
  };

  const handleOpenReturnForm = (booking) => {
    setSelectedBooking(booking);
    setShowReturnForm(true);
  };

  const handleReturnFormSuccess = () => {
    setShowReturnForm(false);
    setSelectedBooking(null);
    loadBookings(); // Reload bookings to update status
  };

  const renderBookingCard = (booking) => {
    const machine = machines[booking.machineId];
    const statusStyle = getStatusColor(booking.status);
    const needsReturnForm = canSubmitReturnForm(booking);
    
    return (
      <div key={booking.id} style={bookingCardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#08182b", flex: 1 }}>
            {machine ? machine.name : `Machine ${booking.machineId?.substring(0, 8)}...`}
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
            {machine.price && ` • 💰 DKK ${machine.price.toFixed(2)}/day`}
          </div>
        )}
        
        <div style={{ fontSize: "0.9rem", color: "#124e66", marginBottom: needsReturnForm ? "1rem" : "0" }}>
          <div>
            <strong>Start:</strong> {formatDateTime(booking.startTime)}
          </div>
          <div>
            <strong>End:</strong> {formatDateTime(booking.endTime)}
          </div>
        </div>

        {needsReturnForm && (
          <div
            style={{
              background: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
              color: "white",
              padding: "1rem",
              borderRadius: "8px",
              marginTop: "1rem",
            }}
          >
            <div style={{ marginBottom: "0.5rem", fontWeight: "600" }}>
              ⚠️ Booking complete – return form required
            </div>
            <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem" }}>
              Your booking has ended. Please submit the return form to hand back the machine digitally.
            </p>
            <button
              onClick={() => handleOpenReturnForm(booking)}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "none",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                background: "white",
                color: "#ff9800",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Submit return form
            </button>
          </div>
        )}

        {booking.hasReturnForm === true && (
          <div
            style={{
              background: "#d4edda",
              color: "#155724",
              padding: "0.75rem",
              borderRadius: "8px",
              marginTop: "1rem",
              fontSize: "0.9rem",
            }}
          >
            ✅ Return form submitted
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#08182b" }}>
            My Bookings
          </h2>
          <p style={{ margin: "0.5rem 0 0 0", color: "#124e66", fontSize: "0.9rem" }}>
            View your active and past bookings
          </p>
        </div>
        <button
          onClick={loadBookings}
          disabled={loading}
          style={{
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
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Loading..." : "🔄 Refresh"}
        </button>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      {(ongoingBookings.length === 0 && previousBookings.length === 0 && !loading && !error) && (
        <p style={{ color: "#124e66", fontStyle: "italic", textAlign: "center", padding: "2rem" }}>
          No bookings found.
        </p>
      )}

      {(ongoingBookings.length > 0 || previousBookings.length > 0) && (
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          {/* Ongoing Bookings Column */}
          <div style={columnStyle}>
            <h3 style={columnHeaderStyle}>
              Ongoing Bookings
              {ongoingBookings.length > 0 && (
                <span style={{ fontSize: "0.9rem", fontWeight: "400", color: "#124e66", marginLeft: "0.5rem" }}>
                  ({ongoingBookings.length})
                </span>
              )}
            </h3>
            {ongoingBookings.length === 0 ? (
              <p style={{ color: "#124e66", fontStyle: "italic", textAlign: "center", padding: "1rem" }}>
                No ongoing bookings
              </p>
            ) : (
              ongoingBookings.map(renderBookingCard)
            )}
          </div>

          {/* Previous Bookings Column */}
          <div style={columnStyle}>
            <h3 style={columnHeaderStyle}>
              Previous Bookings
              {previousBookings.length > 0 && (
                <span style={{ fontSize: "0.9rem", fontWeight: "400", color: "#124e66", marginLeft: "0.5rem" }}>
                  ({previousBookings.length})
                </span>
              )}
            </h3>
            {previousBookings.length === 0 ? (
              <p style={{ color: "#124e66", fontStyle: "italic", textAlign: "center", padding: "1rem" }}>
                No previous bookings
              </p>
            ) : (
              previousBookings.map(renderBookingCard)
            )}
          </div>
        </div>
      )}

      {showReturnForm && selectedBooking && (
        <ReturnForm
          bookingId={selectedBooking.id}
          machineName={machines[selectedBooking.machineId]?.name || "Machine"}
          onClose={() => {
            setShowReturnForm(false);
            setSelectedBooking(null);
          }}
          onSuccess={handleReturnFormSuccess}
          token={token}
        />
      )}
    </div>
  );
}


