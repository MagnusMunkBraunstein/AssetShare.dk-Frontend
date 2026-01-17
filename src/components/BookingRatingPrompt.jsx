import { useState, useEffect } from "react";
import RatingForm from "./RatingForm";

const API_BASE = "http://localhost:8080/api";

/**
 * Component that prompts users to rate a completed booking
 * Shows machine rating prompt for renters, user rating prompts for both parties
 */
export default function BookingRatingPrompt({ bookingId, userRole, token, onComplete }) {
  const [step, setStep] = useState(0); // 0: machine rating, 1: owner rating, 2: done
  const [booking, setBooking] = useState(null);
  const [machine, setMachine] = useState(null);
  const [existingRatings, setExistingRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId, token]);

  async function loadBookingDetails() {
    if (!token || !bookingId) return;

    setLoading(true);
    setError("");

    try {
      // Load booking
      const bookingRes = await fetch(`${API_BASE}/bookings/${bookingId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!bookingRes.ok) {
        throw new Error("Failed to load booking");
      }

      const bookingData = await bookingRes.json();
      setBooking(bookingData);

      // Load machine details
      if (bookingData.machineId) {
        const machineRes = await fetch(`${API_BASE}/machines/${bookingData.machineId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (machineRes.ok) {
          const machineData = await machineRes.json();
          setMachine(machineData);
        }
      }

      // Load existing ratings
      const ratingsRes = await fetch(`${API_BASE}/ratings/booking/${bookingId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (ratingsRes.ok) {
        const ratingsData = await ratingsRes.json();
        setExistingRatings(ratingsData);
        
        // Determine which step to show
        const hasMachineRating = ratingsData.some(r => r.type === "MACHINE_RATING");
        const hasUserRating = ratingsData.some(r => r.type === "USER_RATING");
        
        if (!hasMachineRating && userRole === "LEJER" || userRole === "BOTH") {
          setStep(0); // Show machine rating
        } else if (!hasUserRating) {
          setStep(1); // Show user rating
        } else {
          setStep(2); // All done
        }
      }
    } catch (err) {
      console.error(err);
      setError("Error loading booking details: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleRatingSubmitted() {
    // Reload ratings to check what's next
    loadBookingDetails();
    
    // Move to next step or complete
    if (step === 0) {
      setStep(1); // Move to user rating
    } else {
      setStep(2); // All done
      if (onComplete) {
        setTimeout(() => onComplete(), 1000);
      }
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#124e66" }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: "rgba(255, 200, 200, 0.8)",
        color: "#08182b",
        padding: "1rem",
        borderRadius: "8px",
        border: "1px solid rgba(255, 150, 150, 0.5)",
      }}>
        {error}
      </div>
    );
  }

  if (!booking || booking.status !== "COMPLETED") {
    return null;
  }

  const hasMachineRating = existingRatings.some(r => r.type === "MACHINE_RATING");
  const hasUserRating = existingRatings.some(r => r.type === "USER_RATING");

  // Determine what the user can rate
  const isRenter = userRole === "LEJER" || userRole === "BOTH";
  const needsMachineRating = isRenter && !hasMachineRating;
  const needsUserRating = !hasUserRating;

  if (step === 2 || (!needsMachineRating && !needsUserRating)) {
    return (
      <div style={{
        background: "rgba(200, 255, 200, 0.8)",
        padding: "1rem",
        borderRadius: "8px",
        border: "1px solid rgba(150, 255, 150, 0.5)",
        textAlign: "center",
      }}>
        ✅ All ratings submitted! Thank you for your feedback.
      </div>
    );
  }

  if (step === 0 && needsMachineRating) {
    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <RatingForm
          bookingId={bookingId}
          ratingType="MACHINE_RATING"
          machineName={machine?.name}
          token={token}
          onRatingSubmitted={handleRatingSubmitted}
          onCancel={() => setStep(2)}
        />
      </div>
    );
  }

  if ((step === 1 || !needsMachineRating) && needsUserRating) {
    // Determine who to rate
    const ownerId = machine?.ownerId;
    const renterId = booking?.renterId;
    
    // Get the other party's ID
    // If user is renter, rate the owner; if user is owner, rate the renter
    const ratedUserId = isRenter ? ownerId : renterId;
    
    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <RatingForm
          bookingId={bookingId}
          ratingType="USER_RATING"
          ratedUserId={ratedUserId}
          userName={isRenter ? "the machine owner" : "the renter"}
          token={token}
          onRatingSubmitted={handleRatingSubmitted}
          onCancel={() => setStep(2)}
        />
      </div>
    );
  }

  return null;
}

