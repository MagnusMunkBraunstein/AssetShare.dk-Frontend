import { useState, useEffect } from "react";
import BookingRatingPrompt from "./BookingRatingPrompt";

const API_BASE = "http://localhost:8080/api";

export default function MyBookings({ token, userRole }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [machines, setMachines] = useState({}); // Cache machine details
  const [downloadingContractId, setDownloadingContractId] = useState(null);

  async function loadBookings() {
    setLoading(true);
    setError("");
    
    if (!token) {
      setError("You must be logged in to view bookings");
      setLoading(false);
      return;
    }
    
    try {
      console.log("Loading bookings with token:", token ? "Token present" : "No token");
      
      const res = await fetch(`${API_BASE}/bookings/my-machines`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Bookings response status:", res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to load bookings:", res.status, text);
        
        if (res.status === 403) {
          setError("Access denied. Your session may have expired. Please try logging out and logging back in.");
        } else {
          setError("Failed to load bookings: " + text);
        }
        setBookings([]);
        return;
      }

      const data = await res.json();
      setBookings(data);
      
      // Load machine details for each booking
      const machineIds = [...new Set(data.map(b => b.machineId).filter(Boolean))];
      await loadMachineDetails(machineIds);
    } catch (err) {
      console.error(err);
      setError("Error loading bookings: " + err.message);
      setBookings([]);
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

  async function approveBooking(bookingId) {
    if (!token) {
      setError("You must be logged in to approve bookings");
      return;
    }

    try {
      console.log("Approving booking:", bookingId, "with token:", token ? "Token present" : "No token");
      
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Approve booking response status:", res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to approve booking:", res.status, text);
        
        if (res.status === 403) {
          setError("Access denied. Your session may have expired. Please try logging out and logging back in.");
        } else if (res.status === 401) {
          setError("Authentication failed. Please log in again.");
        } else {
          setError("Failed to approve booking: " + text);
        }
        return;
      }

      // Reload bookings
      await loadBookings();
    } catch (err) {
      console.error(err);
      setError("Error approving booking: " + err.message);
    }
  }

  async function rejectBooking(bookingId) {
    if (!confirm("Are you sure you want to reject this booking?")) {
      return;
    }

    if (!token) {
      setError("You must be logged in to reject bookings");
      return;
    }

    try {
      console.log("Rejecting booking:", bookingId);
      
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Reject booking response status:", res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to reject booking:", res.status, text);
        
        if (res.status === 403) {
          setError("Access denied. Your session may have expired. Please try logging out and logging back in.");
        } else if (res.status === 401) {
          setError("Authentication failed. Please log in again.");
        } else {
          setError("Failed to reject booking: " + text);
        }
        return;
      }

      // Reload bookings
      await loadBookings();
    } catch (err) {
      console.error(err);
      setError("Error rejecting booking: " + err.message);
    }
  }

  useEffect(() => {
    if (token) {
      loadBookings();
    }
  }, [token]);

  const downloadContract = async (booking) => {
    if (!booking.contractId) {
      setError("The contract is not ready yet for this booking.");
      return;
    }

    if (!token) {
      setError("You must be logged in to download the contract.");
      return;
    }

    try {
      setError("");
      setDownloadingContractId(booking.id);

      const res = await fetch(`${API_BASE}/contracts/${booking.contractId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to download contract PDF:", res.status, text);
        setError("Could not download the contract. Please try again, or contact support.");
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
      setError("An error occurred while downloading the contract.");
    } finally {
      setDownloadingContractId(null);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
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

  const buttonStyle = {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginRight: "0.5rem",
  };

  const approveButtonStyle = {
    ...buttonStyle,
    background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
    color: "white",
    boxShadow: "0 4px 15px rgba(40, 167, 69, 0.4)",
  };

  const rejectButtonStyle = {
    ...buttonStyle,
    background: "linear-gradient(135deg, #dc3545 0%, #c82333 100%)",
    color: "white",
    boxShadow: "0 4px 15px rgba(220, 53, 69, 0.4)",
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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#08182b" }}>
            My Machine Bookings
          </h2>
          <p style={{ margin: "0.5rem 0 0 0", color: "#124e66", fontSize: "0.9rem" }}>
            View and manage bookings for your machines
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

      {bookings.length === 0 && !loading && !error && (
        <p style={{ color: "#124e66", fontStyle: "italic", textAlign: "center", padding: "2rem" }}>
          No bookings found for your machines.
        </p>
      )}

      {bookings.length > 0 && (
        <div>
          {bookings.map((booking) => {
            const machine = machines[booking.machineId];
            const statusStyle = getStatusColor(booking.status);
            
            return (
              <div key={booking.id} style={bookingCardStyle}>
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
                  
                  {booking.status === "REQUESTED" && (
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button
                        onClick={() => approveBooking(booking.id)}
                        style={approveButtonStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 6px 20px rgba(40, 167, 69, 0.6)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 4px 15px rgba(40, 167, 69, 0.4)";
                        }}
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => rejectBooking(booking.id)}
                        style={rejectButtonStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 6px 20px rgba(220, 53, 69, 0.6)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 4px 15px rgba(220, 53, 69, 0.4)";
                        }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}

                  {booking.status === "APPROVED" && booking.contractId && (
                    <div style={{ marginTop: "0.75rem" }}>
                      <button
                        onClick={() => downloadContract(booking)}
                        style={{
                          ...buttonStyle,
                          background: "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
                          color: "#ffffff",
                          boxShadow: "0 4px 12px rgba(31, 111, 120, 0.35)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 6px 18px rgba(31, 111, 120, 0.5)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(31, 111, 120, 0.35)";
                        }}
                        disabled={downloadingContractId === booking.id}
                      >
                        {downloadingContractId === booking.id
                          ? "Downloading contract (provider)..."
                          : "Download Contract as Provider"}
                      </button>
                    </div>
                  )}

                  {booking.status === "COMPLETED" && (
                    <div style={{ marginTop: "1rem" }}>
                      <BookingRatingPrompt
                        bookingId={booking.id}
                        userRole={userRole || "UDLEJER"}
                        token={token}
                        onComplete={() => loadBookings()}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

