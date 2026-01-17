/**
 * Simple component to display a star rating (0.5 to 5.0) with optional count
 * Shows only the exact rating - e.g., 4.0 shows 4 stars, 3.6 shows 3 full + 0.6 of next star
 */
export default function StarRating({ rating, count, showNumber = true, size = "1rem" }) {
  if (rating === null || rating === undefined) {
    return null;
  }

  // Parse and clamp rating between 0 and 5
  const numRating = typeof rating === 'string' ? parseFloat(rating) : Number(rating);
  const clampedRating = Math.max(0, Math.min(5, numRating));
  
  // Calculate star breakdown - show only the exact rating amount
  const fullStars = Math.floor(clampedRating);
  const decimalPart = clampedRating - fullStars; // Decimal part (0.0 to 0.999...)
  const hasPartialStar = decimalPart > 0.001; // Show partial if > 0.001

  const starStyle = {
    fontSize: size,
    color: "#ffc107",
    marginRight: "0.1rem",
    display: "inline-block",
    lineHeight: 1,
  };

  const emptyStarStyle = {
    ...starStyle,
    color: "#e0e0e0",
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
      {/* Full stars */}
      {Array.from({ length: fullStars }, (_, i) => (
        <span key={`full-${i}`} style={starStyle}>⭐</span>
      ))}
      
      {/* Partial star (shows exact fill percentage) */}
      {hasPartialStar && (
        <span 
          style={{ 
            position: "relative", 
            display: "inline-block", 
            width: size, 
            height: size, 
            marginRight: "0.1rem",
            fontSize: size,
            lineHeight: 1,
          }}
        >
          {/* Empty star background */}
          <span style={{ ...emptyStarStyle, position: "absolute", top: 0, left: 0 }}>⭐</span>
          {/* Filled portion of star */}
          <span
            style={{
              ...starStyle,
              position: "absolute",
              top: 0,
              left: 0,
              width: `${(decimalPart * 100).toFixed(1)}%`,
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            ⭐
          </span>
        </span>
      )}
      
      {showNumber && (
        <span style={{ marginLeft: "0.25rem", fontSize: size, color: "#124e66", fontWeight: "600" }}>
          {clampedRating.toFixed(1)}
          {count !== null && count !== undefined && count > 0 && (
            <span style={{ marginLeft: "0.25rem", fontSize: "0.85em", color: "#666", fontWeight: "400" }}>
              ({count})
            </span>
          )}
        </span>
      )}
    </span>
  );
}
