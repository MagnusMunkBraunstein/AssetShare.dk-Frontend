import { useState } from "react";

const API_BASE = "http://localhost:8080/api";

export default function AddMachine({ token, onMachineAdded }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [instantBookingEnabled, setInstantBookingEnabled] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submitMachine(e) {
    e.preventDefault();
    setMsg("");
    setSuccess(false);
    setLoading(true);

    if (!token) {
      setMsg("You must be logged in to add machines.");
      setLoading(false);
      return;
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setMsg("Please enter a valid price (greater than 0)");
      setLoading(false);
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
          name,
          category,
          location,
          price: parseFloat(price),
          instantBookingEnabled,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        setMsg("Failed to add machine: " + text);
        return;
      }

      const data = await res.json();
      setSuccess(true);
      setName("");
      setCategory("");
      setLocation("");
      setPrice("");
      setInstantBookingEnabled(false);

      if (onMachineAdded) {
        onMachineAdded(data);
      }
    } catch (err) {
      console.error(err);
      setMsg("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const formStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: "600",
    color: "#08182b",
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
    width: "100%",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "all 0.3s ease",
    background: loading
      ? "rgba(31, 111, 120, 0.5)"
      : "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
    color: "#9adbd6",
    boxShadow: loading ? "none" : "0 4px 15px rgba(31, 111, 120, 0.4)",
    opacity: loading ? 0.6 : 1,
  };

  const errorStyle = {
    color: "#08182b",
    background: "rgba(255, 200, 200, 0.8)",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid rgba(255, 150, 150, 0.5)",
    fontSize: "0.9rem",
  };

  const successStyle = {
    color: "#08182b",
    background: "rgba(200, 255, 200, 0.8)",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid rgba(150, 255, 150, 0.5)",
    fontSize: "0.9rem",
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.3rem", color: "#08182b" }}>
        Add New Machine
      </h3>
      <p style={{ margin: "0 0 1.5rem 0", color: "#124e66", fontSize: "0.9rem" }}>
        List a new machine for rent. Fill in the details below to publish your machine.
      </p>

      {success && (
        <div style={successStyle}>
          ✅ Machine added successfully! It's now available for rent.
        </div>
      )}

      {msg && !success && <div style={errorStyle}>{msg}</div>}

      <form onSubmit={submitMachine} style={formStyle}>
        <div>
          <label style={labelStyle}>Machine Name *</label>
          <input
            style={inputStyle}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#49a3a6";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(73, 163, 166, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(73, 163, 166, 0.3)";
              e.currentTarget.style.boxShadow = "none";
            }}
            placeholder="e.g., Excavator CAT 320"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label style={labelStyle}>Category</label>
          <input
            style={inputStyle}
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#49a3a6";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(73, 163, 166, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(73, 163, 166, 0.3)";
              e.currentTarget.style.boxShadow = "none";
            }}
            placeholder="e.g., Construction Equipment"
            disabled={loading}
          />
        </div>

        <div>
          <label style={labelStyle}>Location *</label>
          <input
            style={inputStyle}
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#49a3a6";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(73, 163, 166, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(73, 163, 166, 0.3)";
              e.currentTarget.style.boxShadow = "none";
            }}
            placeholder="e.g., Copenhagen, Denmark"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label style={labelStyle}>Price per Hour (DKK) *</label>
          <input
            style={inputStyle}
            type="number"
            step="0.01"
            min="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#49a3a6";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(73, 163, 166, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(73, 163, 166, 0.3)";
              e.currentTarget.style.boxShadow = "none";
            }}
            placeholder="e.g., 5000"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label style={labelStyle}>Instant Booking</label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#124e66", fontSize: "0.9rem" }}>
            <input
              type="checkbox"
              checked={instantBookingEnabled}
              onChange={(e) => setInstantBookingEnabled(e.target.checked)}
              disabled={loading}
              style={{ width: "1rem", height: "1rem" }}
            />
            <span>Allow renters to auto-confirm bookings once payment succeeds.</span>
          </div>
        </div>

        <button
          style={buttonStyle}
          type="submit"
          disabled={loading}
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
          {loading ? "Adding Machine..." : "Add Machine"}
        </button>
      </form>
    </div>
  );
}

