import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";

export default function StripeConnectSuccessPage() {
  // If using React Router, use navigate. Otherwise, we'll use window.location
  // For now, using a simple redirect
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

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
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 10px 40px rgba(8, 24, 43, 0.3)",
    textAlign: "center",
  };

  const titleStyle = {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#08182b",
    marginBottom: "1rem",
  };

  const messageStyle = {
    color: "#124e66",
    fontSize: "1rem",
    marginBottom: "1.5rem",
  };

  const linkStyle = {
    color: "#1f6f78",
    textDecoration: "underline",
    cursor: "pointer",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>✓ Stripe Account Connected!</h1>
        <p style={messageStyle}>
          Your Stripe account has been successfully connected. You can now receive payments when people rent your machines.
        </p>
        <p style={{ color: "#124e66", fontSize: "0.9rem" }}>
          Redirecting to home page in 3 seconds...{" "}
          <a href="/" style={linkStyle}>
            Click here to go now
          </a>
        </p>
      </div>
    </div>
  );
}

