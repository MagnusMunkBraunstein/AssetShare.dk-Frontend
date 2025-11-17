import { useState } from "react";

const API_BASE = "http://localhost:8080/api";

export default function RegisterPage({ onRegisterSuccess, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submitRegister(e) {
    e.preventDefault();
    setMsg("");

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const t = await res.text();
        setMsg("Register failed: " + t);
        return;
      }

      onRegisterSuccess();
    } catch (err) {
      console.error(err);
      setMsg("Network error during register");
    }
  }

  const box = {
    maxWidth: 400,
    margin: "0 auto",
    padding: 20,
    border: "1px solid #ddd",
    borderRadius: 8,
  };

  return (
    <div style={box}>
      <h2>Register</h2>

      <form onSubmit={submitRegister}>
        <div style={{ marginBottom: 10 }}>
          <label>Name</label><br />
          <input
            style={{ width: "100%", padding: 8 }}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Email</label><br />
          <input
            style={{ width: "100%", padding: 8 }}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Password</label><br />
          <input
            style={{ width: "100%", padding: 8 }}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button style={{ width: "100%", padding: 8 }} type="submit">
          Register
        </button>
      </form>

      {msg && <p style={{ color: "red" }}>{msg}</p>}

      <p style={{ marginTop: 15 }}>
        Already have an account?{" "}
        <button onClick={onSwitchToLogin} style={{ padding: 4 }}>
          Login
        </button>
      </p>
    </div>
  );
}
