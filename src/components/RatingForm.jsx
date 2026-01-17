import { useState } from "react";

const API_BASE = "http://localhost:8080/api";

/**
 * RatingForm component for submitting ratings
 * Supports both machine ratings and user ratings with half-star increments (0.5 to 5.0)
 */
export default function RatingForm({ bookingId, ratingType, ratedUserId, machineName, userName, token, onRatingSubmitted, onCancel }) {
  const [score, setScore] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hoveredStar, setHoveredStar] = useState(null);

  // Generate star values: [0.5, 1.0, 1.5, ..., 5.0]
  const starValues = [];
  for (let i = 0.5; i <= 5.0; i += 0.5) {
    starValues.push(i);
  }

  const handleStarClick = (value) => {
    setScore(value);
    setError("");
  };

  const handleStarHover = (value) => {
    setHoveredStar(value);
  };

  const handleStarLeave = () => {
    setHoveredStar(null);
  };

  const getStarFill = (value) => {
    const displayValue = hoveredStar !== null ? hoveredStar : score;
    if (displayValue === null) return 0;
    if (value <= displayValue) return 100;
    if (value - 0.5 <= displayValue) return 50; // Half star
    return 0;
  };

  async function submitRating(e) {
    e.preventDefault();
    
    if (score === null) {
      setError("Please select a rating");
      return;
    }

    if (ratingType === "USER_RATING" && !ratedUserId) {
      setError("Rated user ID is required for user ratings");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const ratingDTO = {
        machineId: null, // Will be filled by backend from booking
        bookingId: bookingId,
        raterId: null, // Will be filled by backend from authentication
        ratedUserId: ratingType === "USER_RATING" ? ratedUserId : null,
        type: ratingType,
        score: score,
        comment: comment.trim() || null,
        createdAt: null // Will be filled by backend
      };

      const res = await fetch(`${API_BASE}/ratings/booking/${bookingId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ratingDTO),
      });

      if (!res.ok) {
        const text = await res.text();
        setError("Failed to submit rating: " + text);
        return;
      }

      const data = await res.json();
      if (onRatingSubmitted) {
        onRatingSubmitted(data);
      }
    } catch (err) {
      console.error(err);
      setError("Error submitting rating: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const title = ratingType === "MACHINE_RATING" 
    ? `Rate the Machine: ${machineName || "Machine"}`
    : `Rate ${userName || "User"}`;

  const description = ratingType === "MACHINE_RATING"
    ? "How was the machine's condition and maintenance?"
    : "How was your experience with this user?";

  const containerStyle = {
    background: "rgba(255, 255, 255, 0.95)",
    padding: "2rem",
    borderRadius: "16px",
    boxShadow: "0 10px 40px rgba(8, 24, 43, 0.2)",
    maxWidth: "500px",
    margin: "0 auto",
  };

  const titleStyle = {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#08182b",
    marginBottom: "0.5rem",
  };

  const descStyle = {
    fontSize: "0.9rem",
    color: "#124e66",
    marginBottom: "1.5rem",
  };

  const starContainerStyle = {
    display: "flex",
    justifyContent: "center",
    gap: "0.25rem",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
  };

  const starButtonStyle = {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0.25rem",
    fontSize: "2rem",
    lineHeight: 1,
    transition: "transform 0.2s ease",
  };

  const starStyle = (fill) => ({
    display: "inline-block",
    color: fill >= 50 ? "#ffc107" : "#e0e0e0",
    textShadow: fill >= 50 ? "0 0 8px rgba(255, 193, 7, 0.5)" : "none",
    transition: "all 0.2s ease",
  });

  const halfStarStyle = {
    display: "inline-block",
    width: "1rem",
    overflow: "hidden",
  };

  const textareaStyle = {
    width: "100%",
    minHeight: "100px",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "2px solid rgba(73, 163, 166, 0.3)",
    fontSize: "1rem",
    fontFamily: "inherit",
    resize: "vertical",
    boxSizing: "border-box",
    marginBottom: "1rem",
  };

  const buttonContainerStyle = {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
  };

  const buttonStyle = {
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "all 0.3s ease",
    opacity: loading ? 0.6 : 1,
  };

  const submitButtonStyle = {
    ...buttonStyle,
    background: "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
    color: "#ffffff",
    boxShadow: "0 4px 15px rgba(31, 111, 120, 0.4)",
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    background: "rgba(200, 200, 200, 0.3)",
    color: "#08182b",
  };

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>{title}</h3>
      <p style={descStyle}>{description}</p>

      {error && (
        <div style={{
          background: "rgba(255, 200, 200, 0.8)",
          color: "#08182b",
          padding: "0.75rem",
          borderRadius: "8px",
          marginBottom: "1rem",
          border: "1px solid rgba(255, 150, 150, 0.5)",
        }}>
          {error}
        </div>
      )}

      <form onSubmit={submitRating}>
        <div style={starContainerStyle}>
          {starValues.map((value) => {
            const fill = getStarFill(value);
            const isHalf = value % 1 !== 0;
            
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleStarClick(value)}
                onMouseEnter={() => handleStarHover(value)}
                onMouseLeave={handleStarLeave}
                style={starButtonStyle}
                onMouseDown={(e) => e.preventDefault()}
              >
                {isHalf ? (
                  <span style={halfStarStyle}>
                    <span style={{ ...starStyle(fill >= 50 ? 100 : 0), width: "1rem", display: "inline-block", textAlign: "left" }}>⭐</span>
                  </span>
                ) : (
                  <span style={starStyle(fill)}>⭐</span>
                )}
              </button>
            );
          })}
        </div>
        {score !== null && (
          <p style={{ textAlign: "center", color: "#124e66", marginBottom: "1rem", fontWeight: "600" }}>
            Selected: {score.toFixed(1)} / 5.0
          </p>
        )}

        <textarea
          style={textareaStyle}
          placeholder="Optional: Add a comment about your experience..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          disabled={loading}
        />

        <div style={buttonContainerStyle}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={cancelButtonStyle}
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            style={submitButtonStyle}
            disabled={loading || score === null}
            onMouseEnter={(e) => {
              if (!loading && score !== null) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(31, 111, 120, 0.6)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(31, 111, 120, 0.4)";
            }}
          >
            {loading ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      </form>
    </div>
  );
}

