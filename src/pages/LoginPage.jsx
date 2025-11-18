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

  const containerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #124e66 0%, #1f6f78 50%, #49a3a6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1rem",
  };

  const cardStyle = {
    background: "white",
    borderRadius: "16px",
    padding: "2.5rem",
    maxWidth: "450px",
    width: "100%",
    boxShadow: "0 10px 40px rgba(8, 24, 43, 0.3)",
  };

  const titleStyle = {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#08182b",
    margin: "0 0 0.5rem 0",
    textAlign: "center",
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
    width: "100%",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    background: "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
    color: "#9adbd6",
    boxShadow: "0 4px 15px rgba(31, 111, 120, 0.4)",
    marginTop: "1rem",
  };

  const linkButtonStyle = {
    background: "none",
    border: "none",
    color: "#1f6f78",
    cursor: "pointer",
    fontWeight: "600",
    textDecoration: "underline",
    padding: "0.25rem 0.5rem",
    fontSize: "0.9rem",
  };

  const errorStyle = {
    color: "#08182b",
    background: "rgba(255, 200, 200, 0.8)",
    padding: "1rem",
    borderRadius: "8px",
    marginTop: "1rem",
    border: "1px solid rgba(255, 150, 150, 0.5)",
    fontSize: "0.9rem",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Welcome to AssetShare</h1>
        <p style={{ textAlign: "center", color: "#124e66", marginBottom: "2rem", fontSize: "0.95rem" }}>
          Sign in to your account
        </p>

        <form onSubmit={submitLogin}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#49a3a6";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(73, 163, 166, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(73, 163, 166, 0.3)";
                e.currentTarget.style.boxShadow = "none";
              }}
              required
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={labelStyle}>Password</label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#49a3a6";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(73, 163, 166, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(73, 163, 166, 0.3)";
                e.currentTarget.style.boxShadow = "none";
              }}
              required
            />
          </div>

          <button
            type="submit"
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(31, 111, 120, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(31, 111, 120, 0.4)";
            }}
          >
            Login
          </button>
        </form>

        {msg && <div style={errorStyle}>{msg}</div>}

        <p style={{ marginTop: "1.5rem", textAlign: "center", color: "#124e66", fontSize: "0.9rem" }}>
          No account?{" "}
          <button
            onClick={onSwitchToRegister}
            style={linkButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#49a3a6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#1f6f78";
            }}
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}
