import { useState } from "react";

const API_BASE = "http://localhost:8080/api";

export default function MachineSearch({ token }) {
  const [machines, setMachines] = useState([]);
  const [location, setLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div style={{ marginTop: 20, padding: 20, border: "1px solid #ddd", borderRadius: 8 }}>
      <h3>Search Machines</h3>
      
      <div style={{ marginBottom: 15 }}>
        <label style={{ display: "block", marginBottom: 5 }}>
          Location:
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location (e.g., Copenhagen)"
            style={{ marginLeft: 10, padding: 5, width: 200 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 15 }}>
        <label style={{ display: "block", marginBottom: 5 }}>
          Max Price:
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Enter max price"
            min="0"
            step="0.01"
            style={{ marginLeft: 10, padding: 5, width: 200 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 15 }}>
        <button
          onClick={searchMachines}
          disabled={loading}
          style={{ padding: 8, marginRight: 10 }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
        <button
          onClick={loadAllMachines}
          disabled={loading}
          style={{ padding: 8 }}
        >
          {loading ? "Loading..." : "Load All Machines"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginTop: 20 }}>
        <h4>Results ({machines.length}):</h4>
        {machines.length === 0 ? (
          <p>No machines found</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {machines.map((machine) => (
              <li
                key={machine.id}
                style={{
                  padding: 10,
                  marginBottom: 10,
                  border: "1px solid #ccc",
                  borderRadius: 4,
                }}
              >
                <strong>{machine.name}</strong>
                <br />
                Category: {machine.category || "N/A"}
                <br />
                Location: {machine.location || "N/A"}
                <br />
                Price: {machine.price ? `$${machine.price.toFixed(2)}` : "N/A"}
                <br />
                Owner ID: {machine.ownerId || "N/A"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

