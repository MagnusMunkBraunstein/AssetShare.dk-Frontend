import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const API_BASE = "http://localhost:8080/api";

// Hjælper: tjek om en dato er booket
function isDateBooked(date, bookings) {
  return bookings.some((b) => {
    const start = new Date(b.startTime);
    const end = new Date(b.endTime);

    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    const busyStatuses = ["REQUESTED", "APPROVED", "COMPLETED"];
    return d >= s && d <= e && busyStatuses.includes(b.status);
  });
}

export default function MachineSearch({ token, renterId }) {
  const [machines, setMachines] = useState([]);
  const [location, setLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [selectedMachineId, setSelectedMachineId] = useState(null);
  const [availability, setAvailability] = useState({}); // { [machineId]: bookings[] }
  const [availabilityLoadingId, setAvailabilityLoadingId] = useState(null);
  const [showLoginPromptForMachine, setShowLoginPromptForMachine] =
    useState(null);

  // Booking form state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bookingStatusMsg, setBookingStatusMsg] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  async function loadMachines() {
    setLoading(true);
    setMsg("");

    try {
      const params = new URLSearchParams();
      if (location) params.append("location", location);
      if (maxPrice) params.append("maxPrice", maxPrice);

      const res = await fetch(`${API_BASE}/machines?` + params.toString(), {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const t = await res.text();
        setMsg("Failed to load machines: " + t);
        return;
      }

      const data = await res.json();
      setMachines(data);
    } catch (err) {
      console.error(err);
      setMsg("Error loading machines");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMachines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMachineClick = async (machineId) => {
    // klik på samme → luk igen
    if (selectedMachineId === machineId) {
      setSelectedMachineId(null);
      setShowLoginPromptForMachine(null);
      setBookingStatusMsg("");
      return;
    }

    setSelectedMachineId(machineId);
    setShowLoginPromptForMachine(null);
    setBookingStatusMsg("");
    setStartDate("");
    setEndDate("");

    if (availability[machineId]) {
      return;
    }

    try {
      setAvailabilityLoadingId(machineId);

      const res = await fetch(
        `${API_BASE}/machines/${machineId}/availability`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const t = await res.text();
        console.error("Failed to load availability:", t);
        return;
      }

      const data = await res.json();
      setAvailability((prev) => ({
        ...prev,
        [machineId]: data,
      }));
    } catch (err) {
      console.error("Error loading availability", err);
    } finally {
      setAvailabilityLoadingId(null);
    }
  };

  const handleBookClickNotLoggedIn = (e, machineId) => {
    e.stopPropagation();
    setShowLoginPromptForMachine(machineId);
  };

  const handleSubmitBooking = async (e, machineId) => {
    e.preventDefault();
    e.stopPropagation();
    setBookingStatusMsg("");

    if (!token || !renterId) {
      setBookingStatusMsg("Du skal være logget ind for at booke.");
      return;
    }

    if (!startDate || !endDate) {
      setBookingStatusMsg("Vælg både start- og slutdato.");
      return;
    }

    // Simpelt: sæt tidspunkter til 08:00 og 16:00
    const startTime = `${startDate}T08:00:00`;
    const endTime = `${endDate}T16:00:00`;

    setBookingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          id: null,
          machineId: machineId,
          renterId: renterId,
          startTime: startTime,
          endTime: endTime,
          status: "REQUESTED",
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        console.error("Failed to create booking:", t);
        setBookingStatusMsg("Kunne ikke oprette booking: " + t);
        return;
      }

      const created = await res.json();
      setBookingStatusMsg("Bookingforespørgsel sendt!");

      // Opdater availability lokalt, så kalenderen viser den nye booking
      setAvailability((prev) => {
        const existing = prev[machineId] || [];
        return {
          ...prev,
          [machineId]: [...existing, created],
        };
      });
    } catch (err) {
      console.error("Error creating booking:", err);
      setBookingStatusMsg("Der skete en fejl ved oprettelse af booking.");
    } finally {
      setBookingLoading(false);
    }
  };

  const cardStyle = {
    background: "rgba(255, 255, 255, 0.85)",
    padding: "1rem",
    borderRadius: "12px",
    marginBottom: "0.75rem",
    border: "1px solid rgba(73, 163, 166, 0.3)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const cardHoverStyle = {
    boxShadow: "0 6px 18px rgba(8, 24, 43, 0.2)",
    transform: "translateY(-2px)",
  };

  const expandedCardStyle = {
    marginTop: "0.75rem",
    paddingTop: "0.75rem",
    borderTop: "1px solid rgba(73, 163, 166, 0.3)",
  };

  const inputStyle = {
    padding: "0.5rem 0.75rem",
    borderRadius: "8px",
    border: "1px solid rgba(73, 163, 166, 0.6)",
    marginRight: "0.5rem",
    minWidth: "140px",
  };

  const buttonStyle = {
    padding: "0.6rem 1.2rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "0.95rem",
    fontWeight: "600",
    cursor: "pointer",
    background: "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
    color: "#9adbd6",
    boxShadow: "0 4px 12px rgba(31, 111, 120, 0.4)",
    transition: "all 0.3s ease",
  };

  return (
    <div>
      {/* Search form */}
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Location..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="Max price..."
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          style={inputStyle}
        />
        <button
          onClick={loadMachines}
          disabled={loading}
          style={buttonStyle}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 18px rgba(31, 111, 120, 0.6)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(31, 111, 120, 0.4)";
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {msg && (
        <div
          style={{
            color: "#08182b",
            background: "rgba(255, 200, 200, 0.8)",
            padding: "0.75rem",
            borderRadius: "8px",
            marginBottom: "1rem",
            border: "1px solid rgba(255, 150, 150, 0.5)",
          }}
        >
          {msg}
        </div>
      )}

      {/* Machine results */}
      {machines.length === 0 && !loading && !msg && (
        <p style={{ color: "#124e66", fontStyle: "italic" }}>
          No machines found. Try adjusting your search.
        </p>
      )}

      <div>
        {machines.map((m) => {
          const isSelected = m.id === selectedMachineId;
          const bookings = availability[m.id] || [];

          return (
            <div
              key={m.id}
              style={cardStyle}
              onClick={() => handleMachineClick(m.id)}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, cardHoverStyle);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Basic info */}
              <div
                style={{
                  fontWeight: "600",
                  color: "#08182b",
                  marginBottom: "0.25rem",
                }}
              >
                {m.name}
              </div>
              <div style={{ fontSize: "0.9rem", color: "#124e66" }}>
                📍 {m.location} | 💰 {m.price} kr./dag
              </div>
              {m.category && (
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#1f6f78",
                    marginTop: "0.25rem",
                  }}
                >
                  Kategori: {m.category}
                </div>
              )}

              {/* Expanded area med kalender + booking */}
              {isSelected && (
                <div
                  style={expandedCardStyle}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4
                    style={{
                      margin: "0 0 0.5rem 0",
                      fontSize: "1rem",
                      color: "#08182b",
                    }}
                  >
                    Tilgængelighed
                  </h4>
                  {availabilityLoadingId === m.id ? (
                    <p style={{ color: "#124e66" }}>Indlæser kalender...</p>
                  ) : (
                    <>
                      <p
                        style={{
                          margin: "0 0 0.75rem 0",
                          color: "#124e66",
                          fontSize: "0.85rem",
                        }}
                      >
                        Dage markeret med{" "}
                        <span style={{ color: "red", fontWeight: "bold" }}>
                          ●
                        </span>{" "}
                        er bookede/optagede. Øvrige dage er ledige.
                      </p>
                      <div
                        style={{
                          background: "rgba(255,255,255,0.9)",
                          padding: "0.5rem",
                          borderRadius: "10px",
                          boxShadow: "0 4px 14px rgba(8, 24, 43, 0.15)",
                          maxWidth: "360px",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Calendar
                          minDetail="month"
                          maxDetail="month"
                          tileContent={({ date, view }) => {
                            if (
                              view === "month" &&
                              isDateBooked(date, bookings)
                            ) {
                              return (
                                <span
                                  style={{
                                    display: "block",
                                    marginTop: 2,
                                    color: "red",
                                    fontWeight: "bold",
                                  }}
                                >
                                  ●
                                </span>
                              );
                            }
                            return null;
                          }}
                        />
                      </div>

                      {/* Booking del */}
                      {token && renterId ? (
                        <form
                          onSubmit={(e) => handleSubmitBooking(e, m.id)}
                          style={{
                            marginTop: "1rem",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                            alignItems: "center",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={inputStyle}
                          />
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={inputStyle}
                          />
                          <button
                            type="submit"
                            disabled={bookingLoading}
                            style={buttonStyle}
                          >
                            {bookingLoading
                              ? "Sender..."
                              : "Send bookingforespørgsel"}
                          </button>
                          {bookingStatusMsg && (
                            <div
                              style={{
                                width: "100%",
                                marginTop: "0.5rem",
                                fontSize: "0.85rem",
                                color: "#08182b",
                                background:
                                  "rgba(154, 219, 214, 0.6)",
                                padding: "0.5rem",
                                borderRadius: "6px",
                              }}
                            >
                              {bookingStatusMsg}
                            </div>
                          )}
                        </form>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) =>
                              handleBookClickNotLoggedIn(e, m.id)
                            }
                            style={{
                              marginTop: "1rem",
                              padding: "0.6rem 1.2rem",
                              borderRadius: "8px",
                              border: "none",
                              fontSize: "0.95rem",
                              fontWeight: "600",
                              cursor: "pointer",
                              background:
                                "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
                              color: "#9adbd6",
                              boxShadow:
                                "0 4px 12px rgba(31, 111, 120, 0.4)",
                              transition: "all 0.3s ease",
                            }}
                          >
                            Book maskine
                          </button>
                          {showLoginPromptForMachine === m.id && !token && (
                            <div
                              style={{
                                marginTop: "0.75rem",
                                padding: "0.75rem",
                                borderRadius: "8px",
                                border:
                                  "1px solid rgba(255, 150, 150, 0.5)",
                                background: "rgba(255, 200, 200, 0.8)",
                                color: "#08182b",
                                fontSize: "0.85rem",
                              }}
                            >
                              Du skal være logget ind for at lave en
                              lejekontrakt på denne maskine.
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
