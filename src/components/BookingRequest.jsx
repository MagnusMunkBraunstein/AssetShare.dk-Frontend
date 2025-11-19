import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const API_BASE = "http://localhost:8080/api";

export default function BookingRequest({ machine, token, onClose, onBookingSuccess }) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stripePublishableKey, setStripePublishableKey] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [paymentIntentData, setPaymentIntentData] = useState(null);

  // Load Stripe publishable key
  useEffect(() => {
    async function loadStripeConfig() {
      try {
        const res = await fetch(`${API_BASE}/payments/stripe/config`);
        if (res.ok) {
          const config = await res.json();
          if (config.configured && config.publishableKey) {
            setStripePublishableKey(config.publishableKey);
            setStripePromise(loadStripe(config.publishableKey));
          }
        }
      } catch (err) {
        console.error("Error loading Stripe config:", err);
      }
    }
    loadStripeConfig();
  }, []);

  // Set default times (1 hour from now, 2 hours from now)
  useEffect(() => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setStartTime(formatDateTime(oneHourLater));
    setEndTime(formatDateTime(twoHoursLater));
  }, []);

  async function handleBookingRequest(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!token) {
      setError("You must be logged in to request a booking");
      setLoading(false);
      return;
    }

    try {
      // Request booking from backend
      const bookingRequest = {
        machineId: machine.id,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      };

      console.log("Sending booking request with token:", token ? "Token present" : "No token");
      
      const res = await fetch(`${API_BASE}/bookings/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingRequest),
      });

      console.log("Booking request response status:", res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error("Booking request failed:", res.status, text);
        
        if (res.status === 403) {
          setError("Access denied. Your session may have expired. Please try logging out and logging back in.");
        } else {
          setError("Failed to create booking: " + text);
        }
        setLoading(false);
        return;
      }

      const paymentIntentResponse = await res.json();
      
      // Set payment intent data for Stripe Elements
      if (stripePublishableKey && paymentIntentResponse.clientSecret) {
        setPaymentIntentData({
          clientSecret: paymentIntentResponse.clientSecret,
          paymentIntentId: paymentIntentResponse.paymentIntentId,
        });
        setLoading(false);
      } else {
        setError("Stripe is not configured. Please contact support.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Error creating booking: " + err.message);
      setLoading(false);
    }
  }

  // Inner component that uses Stripe hooks
  function PaymentForm({ clientSecret, paymentIntentId, onSuccess, onError }) {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState("");

    async function handlePayment(e) {
      e.preventDefault();
      if (!stripe || !elements) {
        return;
      }

      setProcessing(true);
      setPaymentError("");

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setPaymentError("Card element not found");
        setProcessing(false);
        return;
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (stripeError) {
        setPaymentError("Payment failed: " + stripeError.message);
        setProcessing(false);
        if (onError) onError(stripeError.message);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        if (onSuccess) {
          onSuccess({
            paymentIntentId,
            message: "Booking requested and payment processed successfully!",
          });
        }
      }
    }

    const cardElementOptions = {
      style: {
        base: {
          fontSize: "16px",
          color: "#08182b",
          "::placeholder": {
            color: "#aab7c4",
          },
        },
        invalid: {
          color: "#fa755a",
        },
      },
    };

    return (
      <form onSubmit={handlePayment}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Card Details</label>
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "8px",
              border: "2px solid rgba(73, 163, 166, 0.3)",
              background: "rgba(255, 255, 255, 0.8)",
            }}
          >
            <CardElement options={cardElementOptions} />
          </div>
        </div>
        {paymentError && <div style={errorStyle}>{paymentError}</div>}
        <button
          type="submit"
          disabled={!stripe || processing}
          style={buttonStyle}
        >
          {processing ? "Processing Payment..." : "Complete Payment"}
        </button>
      </form>
    );
  }

  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem",
  };

  const modalStyle = {
    background: "white",
    borderRadius: "16px",
    padding: "2rem",
    maxWidth: "500px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 10px 40px rgba(8, 24, 43, 0.3)",
  };

  const titleStyle = {
    fontSize: "1.75rem",
    fontWeight: "700",
    color: "#08182b",
    marginBottom: "1rem",
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
    marginBottom: "1rem",
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
      ? "#49a3a6"
      : "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
    color: "#9adbd6",
    boxShadow: loading
      ? "none"
      : "0 4px 15px rgba(31, 111, 120, 0.4)",
    marginTop: "1rem",
    opacity: loading ? 0.6 : 1,
  };

  const closeButtonStyle = {
    ...buttonStyle,
    background: "#e0e0e0",
    color: "#08182b",
    marginTop: "0.5rem",
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

  const machineInfoStyle = {
    background: "rgba(73, 163, 166, 0.1)",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>Request Booking</h2>
        
        <div style={machineInfoStyle}>
          <div style={{ fontWeight: "600", color: "#08182b", marginBottom: "0.5rem" }}>
            {machine.name}
          </div>
          <div style={{ fontSize: "0.9rem", color: "#124e66" }}>
            {machine.location && `📍 ${machine.location}`}
            {machine.price && ` • 💰 $${machine.price.toFixed(2)}/hour`}
          </div>
        </div>

        <form onSubmit={handleBookingRequest}>
          <div>
            <label style={labelStyle}>Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={inputStyle}
              required
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div>
            <label style={labelStyle}>End Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={inputStyle}
              required
              min={startTime || new Date().toISOString().slice(0, 16)}
            />
          </div>

          {error && <div style={errorStyle}>{error}</div>}

          {!paymentIntentData ? (
            <button
              type="submit"
              disabled={loading || !stripePublishableKey}
              style={buttonStyle}
            >
              {loading ? "Creating Booking..." : "Request Booking & Pay"}
            </button>
          ) : null}
        </form>

        {paymentIntentData && stripePromise && (
          <Elements stripe={stripePromise}>
            <PaymentForm
              clientSecret={paymentIntentData.clientSecret}
              paymentIntentId={paymentIntentData.paymentIntentId}
              onSuccess={async (data) => {
                // For local development: automatically mark payment as paid
                // In production, this would be handled by Stripe webhooks
                try {
                  await fetch(`${API_BASE}/payments/test/mark-paid/${data.paymentIntentId}`, {
                    method: "POST",
                  });
                } catch (err) {
                  console.error("Error marking payment as paid:", err);
                  // Don't fail the booking if this fails - webhook will handle it in production
                }
                
                if (onBookingSuccess) {
                  onBookingSuccess(data);
                }
                if (onClose) {
                  onClose();
                }
              }}
              onError={(errorMsg) => {
                setError(errorMsg);
              }}
            />
          </Elements>
        )}

        <button onClick={onClose} style={closeButtonStyle}>
          Cancel
        </button>

        {!stripePublishableKey && (
          <div style={errorStyle}>
            Stripe is not configured. Payment processing is unavailable.
          </div>
        )}
      </div>
    </div>
  );
}

