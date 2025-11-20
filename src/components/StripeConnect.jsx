import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8080/api";

export default function StripeConnect({ token }) {
  const [accountStatus, setAccountStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token) {
      checkAccountStatus();
    }
  }, [token]);

  // Refresh status when window regains focus (user returns from Stripe)
  useEffect(() => {
    const handleFocus = () => {
      if (token) {
        checkAccountStatus();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [token]);

  // Check URL parameters for success indicator
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("stripe_success") === "true" || window.location.hash === "#stripe-success") {
      setMessage("Onboarding completed! Checking status...");
      setTimeout(() => {
        checkAccountStatus();
      }, 1000);
    }
  }, []);

  async function checkAccountStatus() {
    if (!token) {
      setError("You must be logged in to check account status");
      return;
    }

    try {
      const trimmedToken = token.trim();
      const res = await fetch(`${API_BASE}/stripe/connect/account-status`, {
        headers: {
          Authorization: `Bearer ${trimmedToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setAccountStatus(data);
      } else {
        const text = await res.text();
        if (res.status === 403 || res.status === 401) {
          setError("Your session has expired. Please log out and log back in.");
        } else {
          setError("Failed to check account status: " + text);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Error checking account status");
    }
  }

  async function createAccount() {
    if (!token) {
      setError("You must be logged in to create a Stripe account");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const trimmedToken = token.trim();
      const res = await fetch(`${API_BASE}/stripe/connect/create-account`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${trimmedToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 403 || res.status === 401) {
          setError("Your session has expired. Please log out and log back in.");
        } else {
          setError(data.error || "Failed to create Stripe account");
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      setMessage("Stripe account created! Now you need to complete onboarding.");
      // Refresh account status
      await checkAccountStatus();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Error creating Stripe account");
      setLoading(false);
    }
  }

  async function createAccountLink() {
    if (!token) {
      setError("You must be logged in to create an account link");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const trimmedToken = token.trim();
      // Redirect back to home page after onboarding with success parameter
      const returnUrl = window.location.origin + "?stripe_success=true";
      const res = await fetch(
        `${API_BASE}/stripe/connect/create-account-link?returnUrl=${encodeURIComponent(returnUrl)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${trimmedToken}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 403 || res.status === 401) {
          setError("Your session has expired. Please log out and log back in.");
        } else {
          setError(data.error || "Failed to create account link");
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      // Open Stripe onboarding in a new window to avoid CSP issues
      const stripeWindow = window.open(data.url, '_blank', 'noopener,noreferrer');
      
      // Poll for window closure to check status
      const checkClosed = setInterval(() => {
        if (stripeWindow.closed) {
          clearInterval(checkClosed);
          setMessage("Onboarding window closed. Checking status...");
          setTimeout(() => {
            checkAccountStatus();
          }, 1000);
        }
      }, 1000);
      
      // Fallback: if user doesn't close window, check status after 30 seconds
      setTimeout(() => {
        clearInterval(checkClosed);
        if (!stripeWindow.closed) {
          setMessage("Please complete the onboarding in the new window, then close it.");
        }
      }, 30000);
    } catch (err) {
      console.error(err);
      setError("Error creating account link");
      setLoading(false);
    }
  }

  async function deleteAccount() {
    if (!token) {
      setError("You must be logged in to delete your Stripe account");
      return;
    }

    if (!confirm("Are you sure you want to delete your Stripe account? This will permanently remove the connection and you'll need to create a new account to receive payments.")) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const trimmedToken = token.trim();
      const res = await fetch(`${API_BASE}/stripe/connect/delete-account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${trimmedToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 403 || res.status === 401) {
          setError("Your session has expired. Please log out and log back in.");
        } else {
          setError(data.error || "Failed to delete Stripe account");
        }
        setLoading(false);
        return;
      }

      setMessage("Stripe account deleted successfully. Refreshing status...");
      setTimeout(() => {
        checkAccountStatus();
      }, 1000);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Error deleting Stripe account");
      setLoading(false);
    }
  }

  async function cleanupOrphanedAccounts() {
    if (!token) {
      setError("You must be logged in to cleanup accounts");
      return;
    }

    if (!confirm("This will delete all Stripe Connect accounts that don't have both charges and payouts enabled. Only fully enabled accounts will be kept. Continue?")) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("Cleaning up accounts...");

    try {
      const trimmedToken = token.trim();
      const res = await fetch(`${API_BASE}/stripe/connect/cleanup-orphaned-accounts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${trimmedToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 403 || res.status === 401) {
          setError("Your session has expired. Please log out and log back in.");
        } else {
          setError(data.error || "Failed to cleanup accounts");
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      const deletedCount = data.deletedCount || 0;
      const failedCount = data.failedCount || 0;
      const skippedCount = data.skippedCount || 0;
      
      setMessage(`Cleanup completed! Deleted: ${deletedCount}, Failed: ${failedCount}, Kept (fully enabled): ${skippedCount}`);
      
      // Refresh account status after cleanup
      setTimeout(() => {
        checkAccountStatus();
      }, 1000);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Error cleaning up accounts");
      setLoading(false);
    }
  }

  const containerStyle = {
    background: "white",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "2rem",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  };

  const titleStyle = {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#08182b",
    marginBottom: "1rem",
  };

  const statusStyle = {
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.95rem",
  };

  const successStatusStyle = {
    ...statusStyle,
    background: "rgba(73, 163, 166, 0.1)",
    border: "2px solid rgba(73, 163, 166, 0.3)",
    color: "#124e66",
  };

  const warningStatusStyle = {
    ...statusStyle,
    background: "rgba(255, 193, 7, 0.1)",
    border: "2px solid rgba(255, 193, 7, 0.3)",
    color: "#856404",
  };

  const errorStyle = {
    color: "#dc3545",
    background: "rgba(220, 53, 69, 0.1)",
    padding: "0.75rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.9rem",
  };

  const messageStyle = {
    color: "#28a745",
    background: "rgba(40, 167, 69, 0.1)",
    padding: "0.75rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.9rem",
  };

  const buttonStyle = {
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "all 0.3s ease",
    background: "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
    color: "white",
    marginRight: "0.5rem",
    opacity: loading ? 0.6 : 1,
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: "rgba(73, 163, 166, 0.2)",
    color: "#124e66",
  };

  if (!token) {
    return (
      <div style={containerStyle}>
        <h2 style={titleStyle}>Stripe Payment Setup</h2>
        <div style={errorStyle}>
          You must be logged in to set up Stripe payments. Please log in first.
        </div>
      </div>
    );
  }

  if (!accountStatus) {
    return (
      <div style={containerStyle}>
        <h2 style={titleStyle}>Stripe Payment Setup</h2>
        <p>Loading...</p>
      </div>
    );
  }

  const isConnected = accountStatus.connected;
  const isReady = accountStatus.chargesEnabled && accountStatus.payoutsEnabled;

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Stripe Payment Setup</h2>
      <p style={{ color: "#124e66", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
        Connect your Stripe account to receive payments when people rent your machines.
      </p>

      {/* Cleanup button for admin/testing - always visible */}
      <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "rgba(255, 193, 7, 0.1)", borderRadius: "8px", border: "1px solid rgba(255, 193, 7, 0.3)" }}>
        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#856404" }}>
          <strong>Admin Tools:</strong> Clean up test accounts that aren't fully enabled
        </p>
        <button
          onClick={cleanupOrphanedAccounts}
          disabled={loading}
          style={{
            ...buttonStyle,
            background: "rgba(255, 193, 7, 0.3)",
            color: "#856404",
            fontSize: "0.9rem",
            padding: "0.5rem 1rem",
            marginRight: "0",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = "rgba(255, 193, 7, 0.5)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 193, 7, 0.3)";
          }}
        >
          {loading ? "Cleaning up..." : "Cleanup Accounts"}
        </button>
      </div>

      {error && <div style={errorStyle}>{error}</div>}
      {message && <div style={messageStyle}>{message}</div>}

      {!isConnected ? (
        <div style={warningStatusStyle}>
          <strong>No Stripe account connected</strong>
          <p style={{ margin: "0.5rem 0 0 0" }}>
            You need to create and connect a Stripe account to receive payments.
          </p>
          <button
            onClick={createAccount}
            disabled={loading}
            style={buttonStyle}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(31, 111, 120, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {loading ? "Creating..." : "Create Stripe Account"}
          </button>
        </div>
      ) : !isReady ? (
        <div style={warningStatusStyle}>
          <strong>Account created, but not fully set up</strong>
          <p style={{ margin: "0.5rem 0 0 0" }}>
            Complete the Stripe onboarding process to start receiving payments.
          </p>
          <button
            onClick={createAccountLink}
            disabled={loading}
            style={buttonStyle}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(31, 111, 120, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {loading ? "Loading..." : "Complete Onboarding"}
          </button>
        </div>
      ) : (
        <div style={successStatusStyle}>
          <strong>✓ Stripe account connected and ready!</strong>
          <p style={{ margin: "0.5rem 0 0 0" }}>
            You can now receive payments when people rent your machines.
          </p>
          <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#124e66" }}>
            <p style={{ margin: "0.25rem 0" }}>
              Charges enabled: {accountStatus.chargesEnabled ? "✓ Yes" : "✗ No"}
            </p>
            <p style={{ margin: "0.25rem 0" }}>
              Payouts enabled: {accountStatus.payoutsEnabled ? "✓ Yes" : "✗ No"}
            </p>
          </div>
          <button
            onClick={checkAccountStatus}
            disabled={loading}
            style={secondaryButtonStyle}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "rgba(73, 163, 166, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(73, 163, 166, 0.2)";
            }}
          >
            Refresh Status
          </button>
          <button
            onClick={deleteAccount}
            disabled={loading}
            style={{
              ...secondaryButtonStyle,
              background: "rgba(220, 53, 69, 0.2)",
              color: "#dc3545",
              marginTop: "0.5rem",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "rgba(220, 53, 69, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(220, 53, 69, 0.2)";
            }}
          >
            {loading ? "Deleting..." : "Delete Stripe Account"}
          </button>
        </div>
      )}
    </div>
  );
}

