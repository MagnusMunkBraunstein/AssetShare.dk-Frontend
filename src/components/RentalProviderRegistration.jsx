import { useState } from "react";

const API_BASE = "http://localhost:8080/api";

export default function RentalProviderRegistration({ token, onRegistrationSuccess }) {
  const [cvr, setCvr] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searching, setSearching] = useState(false);
  const [foundCompany, setFoundCompany] = useState(null);

  async function submitRegistration(e) {
    e.preventDefault();
    setMsg("");
    setSuccess(false);
    setLoading(true);

    if (!token) {
      setMsg("You must be logged in to register as a rental provider. Please log in first.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/users/register-rental-provider`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cvr, companyName }),
      });

      if (!res.ok) {
        const text = await res.text();
        setMsg("Registration failed: " + text);
        return;
      }

      const data = await res.json();
      setSuccess(true);
      setCvr("");
      setCompanyName("");
      
      if (onRegistrationSuccess) {
        onRegistrationSuccess(data);
      }
    } catch (err) {
      console.error(err);
      setMsg("Network error during registration: " + err.message);
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

  const infoStyle = {
    color: "#124e66",
    fontSize: "0.85rem",
    marginTop: "-0.5rem",
    fontStyle: "italic",
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.3rem", color: "#08182b" }}>
        Register as Rental Provider
      </h3>
      <p style={{ margin: "0 0 1.5rem 0", color: "#124e66", fontSize: "0.9rem" }}>
        Enter your company CVR number and click "Search CVR" to automatically find your company name, then complete registration to start publishing machines.
      </p>

      {success && (
        <div style={successStyle}>
          ✅ Successfully registered as rental provider! You can now publish machines.
        </div>
      )}

      {msg && !success && <div style={errorStyle}>{msg}</div>}

      <form onSubmit={submitRegistration} style={formStyle}>
        <div>
          <label style={labelStyle}>CVR Number *</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              type="text"
              value={cvr}
              onChange={(e) => {
                setCvr(e.target.value);
                setFoundCompany(null); // Clear found company when CVR changes
                setCompanyName(""); // Clear company name when CVR changes
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#49a3a6";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(73, 163, 166, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(73, 163, 166, 0.3)";
                e.currentTarget.style.boxShadow = "none";
              }}
              placeholder="e.g., 12345678"
              pattern="[0-9]{8}"
              required
              disabled={loading || searching}
            />
            <button
              type="button"
              onClick={async () => {
                if (!cvr || !cvr.match(/^\d{8}$/)) {
                  setMsg("Please enter a valid 8-digit CVR number");
                  return;
                }
                setMsg("");
                setSearching(true);
                setFoundCompany(null);
                try {
                  const res = await fetch(`${API_BASE}/cvr/${cvr}`, {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    credentials: "omit", // Don't send cookies/credentials
                  });
                  if (!res.ok) {
                    const text = await res.text();
                    setMsg("CVR lookup failed: " + text);
                    return;
                  }
                  const data = await res.json();
                  if (data.name) {
                    setFoundCompany(data);
                    setCompanyName(data.name);
                    setMsg("");
                  } else {
                    setMsg("No company found for this CVR number");
                  }
                } catch (err) {
                  console.error(err);
                  setMsg("Error searching CVR: " + err.message);
                } finally {
                  setSearching(false);
                }
              }}
              disabled={loading || searching || !cvr || !cvr.match(/^\d{8}$/)}
              style={{
                ...buttonStyle,
                width: "auto",
                padding: "0.75rem 1.5rem",
                background: searching
                  ? "rgba(31, 111, 120, 0.5)"
                  : "linear-gradient(135deg, #49a3a6 0%, #1f6f78 100%)",
                opacity: (loading || searching || !cvr || !cvr.match(/^\d{8}$/)) ? 0.6 : 1,
                cursor: (loading || searching || !cvr || !cvr.match(/^\d{8}$/)) ? "not-allowed" : "pointer",
              }}
            >
              {searching ? "Searching..." : "Search CVR"}
            </button>
          </div>
          <p style={infoStyle}>Danish CVR numbers are 8 digits</p>
          {foundCompany && (
            <div style={{
              marginTop: "0.5rem",
              padding: "0.75rem",
              background: "rgba(200, 255, 200, 0.3)",
              borderRadius: "8px",
              border: "1px solid rgba(150, 255, 150, 0.5)",
            }}>
              <strong style={{ color: "#08182b" }}>✓ Found:</strong>{" "}
              <span style={{ color: "#124e66" }}>{foundCompany.name}</span>
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Company Name *</label>
          <input
            style={inputStyle}
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#49a3a6";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(73, 163, 166, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(73, 163, 166, 0.3)";
              e.currentTarget.style.boxShadow = "none";
            }}
            placeholder={foundCompany ? "Company name found from CVR" : "Enter your registered company name"}
            required
            disabled={loading || !!foundCompany}
          />
          <p style={infoStyle}>Must match the exact registered company name</p>
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
          {loading ? "Validating CVR..." : "Register as Rental Provider"}
        </button>
      </form>
    </div>
  );
}

