import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8080/api";

export default function TotpSetup({ token }) {
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | setup | enabled | error
  const [error, setError] = useState("");

  // Check on backend if TOTP is already enabled (e.g., if role changes after setup)
  useEffect(() => {
    if (!token) return;

    async function loadStatus() {
      try {
        const res = await fetch(`${API_BASE}/auth/totp/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (data.enabled) {
          setStatus("enabled");
        }
      } catch {
        // Ignore errors here – we just don't want to crash the UI
      }
    }

    loadStatus();
  }, [token]);

  if (!token) {
    return null;
  }

  // When 2-factor is set up, hide the box
  if (status === "enabled") {
    return null;
  }

  async function startSetup() {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/totp/setup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || "Could not start 2-factor setup.");
        return;
      }
      const data = await res.json();
      setSecret(data.secret);
      setOtpauthUrl(data.otpauthUrl);
      setStatus("setup");
    } catch (err) {
      setError("Error during setup: " + err.message);
    }
  }

  async function enableTotp(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/totp/enable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || "The code was incorrect. Please try again.");
        return;
      }
      setStatus("enabled");
    } catch (err) {
      setError("Error during activation: " + err.message);
    }
  }

  const cardStyle = {
    background: "rgba(255, 255, 255, 0.85)",
    borderRadius: "12px",
    padding: "1.25rem",
    marginBottom: "1.5rem",
    border: "1px solid rgba(73, 163, 166, 0.25)",
  };

  const buttonStyle = {
    padding: "0.6rem 1.4rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "0.95rem",
    fontWeight: "600",
    cursor: "pointer",
    background: "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
    color: "#ffffff",
    boxShadow: "0 4px 12px rgba(31, 111, 120, 0.35)",
  };

  const inputStyle = {
    width: "100%",
    padding: "0.6rem 0.75rem",
    borderRadius: "8px",
    border: "2px solid rgba(73, 163, 166, 0.3)",
    fontSize: "0.95rem",
    marginTop: "0.4rem",
  };

  const errorStyle = {
    marginTop: "0.75rem",
    padding: "0.6rem 0.75rem",
    borderRadius: "8px",
    background: "rgba(255, 200, 200, 0.8)",
    border: "1px solid rgba(255, 150, 150, 0.5)",
    color: "#721c24",
    fontSize: "0.9rem",
  };

  const infoStyle = {
    fontSize: "0.9rem",
    color: "#124e66",
  };

  return (
    <div style={cardStyle}>
      <h3
        style={{
          marginTop: 0,
          marginBottom: "0.5rem",
          color: status === "idle" ? "#c62828" : "#08182b",
        }}
      >
        {status === "idle"
          ? "Setup Google Authenticator to Get Started"
          : "Google Authenticator (Required)"}
      </h3>
      <p style={infoStyle}>
        To create and approve bookings, you must enable 2-factor authentication via Google
        Authenticator.
      </p>

      {status === "idle" && (
        <button style={buttonStyle} onClick={startSetup}>
          Start Setup
        </button>
      )}

      {status === "setup" && (
        <div style={{ marginTop: "0.75rem" }}>
          <p style={infoStyle}>
            1. Open Google Authenticator on your phone.<br />
            2. Scan this QR code, or enter the secret key manually.
          </p>

          {otpauthUrl && (
            <div style={{ margin: "0.75rem 0", textAlign: "center" }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  otpauthUrl
                )}`}
                alt="Google Authenticator QR"
                style={{
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                  background: "white",
                  padding: "0.5rem",
                }}
              />
            </div>
          )}

          <p style={infoStyle}>
            Secret key (for manual entry if QR doesn't work):
          </p>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "0.9rem",
              background: "rgba(18, 78, 102, 0.05)",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              wordBreak: "break-all",
            }}
          >
            {secret}
          </p>
          <form onSubmit={enableTotp} style={{ marginTop: "0.75rem" }}>
            <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "#08182b" }}>
              Enter 6-digit code from Google Authenticator
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(value);
              }}
              placeholder="123456"
              style={inputStyle}
              required
            />
            <div style={{ marginTop: "0.75rem" }}>
              <button type="submit" style={buttonStyle}>
                Enable 2-Factor
              </button>
            </div>
          </form>
        </div>
      )}

      {status === "enabled" && (
        <p style={{ ...infoStyle, marginTop: "0.75rem", color: "#155724" }}>
          ✅ 2-factor authentication is enabled. You must now use Google Authenticator when booking and
          approving bookings.
        </p>
      )}

      {error && <div style={errorStyle}>{error}</div>}
    </div>
  );
}


