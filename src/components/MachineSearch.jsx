import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8080/api";

export default function MachineSearch({ token, onSelectMachine }) {
  const [machines, setMachines] = useState([]);
  const [location, setLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

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
          // ingen Authorization her → ikke-logget bruger må gerne se katalog
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

  // Evt. automatisk load ved mount
  useEffect(() => {
    loadMachines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {machines.map((m) => (
          <div
            key={m.id}
            style={cardStyle}
            onClick={() => onSelectMachine && onSelectMachine(m.id)}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, cardHoverStyle);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
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
          </div>
        ))}
      </div>
    </div>
  );
}
