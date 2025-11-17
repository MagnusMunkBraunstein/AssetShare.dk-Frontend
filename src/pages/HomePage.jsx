import { useState } from "react";

const API_BASE = "http://localhost:8080/api";

export default function HomePage({ token, userEmail, onLogout }) {
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState("");

  async function loadUsers() {
    setMsg("");
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
    } catch (err) {
      console.error(err);
      setMsg("Error loading users");
    }
  }

  const box = {
    maxWidth: 700,
    margin: "20px auto",
    padding: 20,
    border: "1px solid #ddd",
    borderRadius: 8,
  };

  return (
    <div style={box}>
      <h2>Home</h2>

      <p>Logged in as: <strong>{userEmail}</strong></p>

      <button onClick={onLogout} style={{ padding: 8, marginBottom: 20 }}>
        Log out
      </button>

      <hr />

      <h3>Users (Protected)</h3>
      <button onClick={loadUsers} style={{ padding: 8, marginBottom: 10 }}>
        Load users
      </button>

      {msg && <p style={{ color: "red" }}>{msg}</p>}

      <ul>
        {users.map((u) => (
          <li key={u.id}>{u.name} ({u.email})</li>
        ))}
      </ul>
    </div>
  );
}
