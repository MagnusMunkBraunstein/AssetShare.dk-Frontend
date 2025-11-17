import { useState } from "react";

const API_BASE = "http://localhost:8080/api";

export default function LoginPage({ onLoginSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submitLogin(e) {
    e.preventDefault();
    setMsg("");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const t = await res.text();
        setMsg("Login failed: " + t);
        return;
      }

      const data = await res.json();
      onLoginSuccess(data.token, email);
    } catch (err) {
      console.error(err);
      setMsg("Network error during login");
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
      <h2>Login</h2>

      <form onSubmit={submitLogin}>
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
          Login
        </button>
      </form>

      {msg && <p style={{ color: "red" }}>{msg}</p>}

      <p style={{ marginTop: 15 }}>
        No account?{" "}
        <button onClick={onSwitchToRegister} style={{ padding: 4 }}>
          Register
        </button>
      </p>
    </div>
  );
}
