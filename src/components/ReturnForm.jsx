import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8080/api";

export default function ReturnForm({ bookingId, machineName, onClose, onSuccess, token }) {
  const [language, setLanguage] = useState("da"); // "da" for Danish, "en" for English
  const [machineCondition, setMachineCondition] = useState("");
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, textDa: "Maskinen er ren og tør", textEn: "Machine is clean and dry", checked: false },
    { id: 2, textDa: "Alle dele er til stede", textEn: "All parts are present", checked: false },
    { id: 3, textDa: "Ingen synlige skader", textEn: "No visible damage", checked: false },
    { id: 4, textDa: "Alle funktioner virker korrekt", textEn: "All functions work correctly", checked: false },
    { id: 5, textDa: "Brændstof/tanke er tømt (hvis relevant)", textEn: "Fuel/tank is emptied (if applicable)", checked: false },
  ]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  
  // Rating states
  const [machineRating, setMachineRating] = useState(null);
  const [machineRatingComment, setMachineRatingComment] = useState("");
  const [ownerRating, setOwnerRating] = useState(null);
  const [ownerRatingComment, setOwnerRatingComment] = useState("");
  // Track existing ratings - state is set by loadExistingRatings and used for tracking
  const [existingRatings, setExistingRatings] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [submittingRatings, setSubmittingRatings] = useState(false);
  const [error, setError] = useState("");
  const [machine, setMachine] = useState(null);
  const [currentStep, setCurrentStep] = useState("returnForm"); // "returnForm", "ratings", "complete"

  // Load booking and machine details
  useEffect(() => {
    async function loadBookingDetails() {
      if (!token || !bookingId) return;
      
      try {
        // Load booking
        const bookingRes = await fetch(`${API_BASE}/bookings/${bookingId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (bookingRes.ok) {
          const bookingData = await bookingRes.json();
          
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
        }
      } catch (err) {
        console.error("Error loading booking details:", err);
      }
    }
    
    loadBookingDetails();
  }, [bookingId, token]);

  const handleChecklistChange = (id) => {
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    const maxPhotos = language === "da" ? "Maksimalt 10 billeder tilladt" : "Maximum 10 images allowed";
    if (files.length + photoFiles.length > 10) {
      setError(maxPhotos);
      return;
    }

    const newFiles = [...photoFiles, ...files];
    setPhotoFiles(newFiles);

    // Create previews
    const newPreviews = [];
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === newFiles.length) {
          setPhotoPreviews([...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    const newFiles = photoFiles.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotoFiles(newFiles);
    setPhotoPreviews(newPreviews);
  };

  const uploadPhotos = async () => {
    const photoUrls = [];
    
    for (const file of photoFiles) {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      photoUrls.push(base64);
    }
    
    return photoUrls;
  };

  const loadExistingRatings = async () => {
    if (!token || !bookingId) return [];
    
    try {
      const res = await fetch(`${API_BASE}/ratings/booking/${bookingId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (res.ok) {
        const ratings = await res.json();
        setExistingRatings(ratings);
        
        // Pre-fill ratings if they already exist
        const machineRating = ratings.find(r => r.type === "MACHINE_RATING");
        const ownerRating = ratings.find(r => r.type === "USER_RATING");
        
        if (machineRating) {
          setMachineRating(parseFloat(machineRating.score));
          setMachineRatingComment(machineRating.comment || "");
        }
        if (ownerRating) {
          setOwnerRating(parseFloat(ownerRating.score));
          setOwnerRatingComment(ownerRating.comment || "");
        }
        
        return ratings; // Return the ratings for immediate use
      }
    } catch (err) {
      console.error("Error loading existing ratings:", err);
    }
    return []; // Return empty array if failed
  };

  const submitRatings = async () => {
    setSubmittingRatings(true);
    setError("");

    try {
      // Reload existing ratings first to ensure we have the latest state
      const currentExistingRatings = await loadExistingRatings() || existingRatings || [];
      
      const errors = [];
      
      // Check if machine rating already exists (by type and booking)
      const hasMachineRating = currentExistingRatings.some(r => r.type === "MACHINE_RATING" && r.bookingId === bookingId);
      
      // Submit machine rating if provided and doesn't already exist
      if (machineRating !== null && !hasMachineRating) {
        try {
          const machineRatingDTO = {
            machineId: null,
            bookingId: bookingId,
            raterId: null,
            ratedUserId: null,
            type: "MACHINE_RATING",
            score: machineRating,
            comment: machineRatingComment.trim() || null,
            createdAt: null
          };

          const machineRes = await fetch(`${API_BASE}/ratings/booking/${bookingId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(machineRatingDTO),
          });

          if (!machineRes.ok) {
            // Check if rating already exists (409 CONFLICT) - treat as success
            if (machineRes.status === 409) {
              // Rating already exists, that's fine - update existing ratings list
              console.log("Machine rating already exists, treating as success");
              await loadExistingRatings(); // Refresh existing ratings
            } else if (machineRes.status === 403) {
              // 403 Forbidden - authentication issue
              await machineRes.text(); // Consume response body
              errors.push(language === "da" 
                ? `Adgang nægtet. Tjek at du er logget ind korrekt.`
                : `Access denied. Please check that you are logged in correctly.`);
            } else {
              const text = await machineRes.text();
              errors.push(language === "da" 
                ? `Kunne ikke indsende maskinevurdering: ${text}`
                : `Failed to submit machine rating: ${text}`);
            }
          }
        } catch (err) {
          errors.push(language === "da"
            ? `Fejl ved indsendelse af maskinevurdering: ${err.message}`
            : `Error submitting machine rating: ${err.message}`);
        }
      }

      // Check if owner rating already exists (by type and booking)
      const hasOwnerRating = currentExistingRatings.some(r => r.type === "USER_RATING" && r.bookingId === bookingId);
      
      // Submit owner rating if provided and doesn't already exist
      if (ownerRating !== null && machine?.ownerId && !hasOwnerRating) {
        try {
          const ownerRatingDTO = {
            machineId: null,
            bookingId: bookingId,
            raterId: null,
            ratedUserId: machine.ownerId,
            type: "USER_RATING",
            score: ownerRating,
            comment: ownerRatingComment.trim() || null,
            createdAt: null
          };

          const ownerRes = await fetch(`${API_BASE}/ratings/booking/${bookingId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(ownerRatingDTO),
          });

          if (!ownerRes.ok) {
            // Check if rating already exists (409 CONFLICT) - treat as success
            if (ownerRes.status === 409) {
              // Rating already exists, that's fine - update existing ratings list
              console.log("Owner rating already exists, treating as success");
              await loadExistingRatings(); // Refresh existing ratings
            } else if (ownerRes.status === 403) {
              // 403 Forbidden - authentication issue
              await ownerRes.text(); // Consume response body
              errors.push(language === "da"
                ? `Adgang nægtet. Tjek at du er logget ind korrekt.`
                : `Access denied. Please check that you are logged in correctly.`);
            } else {
              const text = await ownerRes.text();
              errors.push(language === "da"
                ? `Kunne ikke indsende ejervurdering: ${text}`
                : `Failed to submit owner rating: ${text}`);
            }
          }
        } catch (err) {
          errors.push(language === "da"
            ? `Fejl ved indsendelse af ejervurdering: ${err.message}`
            : `Error submitting owner rating: ${err.message}`);
        }
      }

      if (errors.length > 0) {
        setError(errors.join("\n"));
        setSubmittingRatings(false);
        return;
      }

      // If all ratings were skipped (already exist) or all submitted successfully, proceed to complete
      setCurrentStep("complete");
      setSubmittingRatings(false);
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);
    } catch (err) {
      console.error("Error submitting ratings:", err);
      setError(language === "da"
        ? `Fejl ved indsendelse af vurderinger: ${err.message}`
        : `Error submitting ratings: ${err.message}`);
      setSubmittingRatings(false);
    }
  };

  const handleReturnFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Upload photos
      const photoUrls = await uploadPhotos();

      // Get checked checklist items
      const checkedItems = checklistItems
        .filter((item) => item.checked)
        .map((item) => language === "da" ? item.textDa : item.textEn);

      const requestData = {
        machineCondition: machineCondition || null,
        checklistItems: checkedItems,
        photoUrls: photoUrls,
        additionalNotes: additionalNotes || null,
      };

      const res = await fetch(`${API_BASE}/bookings/${bookingId}/return-form`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || (language === "da" ? "Kunne ikke indsende afleveringsformular" : "Could not submit return form"));
      }

      // Return form submitted successfully, load existing ratings and move to ratings step
      await loadExistingRatings();
      setCurrentStep("ratings");
      setLoading(false);
    } catch (err) {
      console.error("Error submitting return form:", err);
      setError(err.message || (language === "da" ? "Der opstod en fejl ved indsendelse af formularen" : "An error occurred while submitting the form"));
      setLoading(false);
    }
  };

  // Translations
  const t = {
    da: {
      title: "Digital Afleveringsformular",
      subtitle: "Udfyld formularen for at aflevere",
      machineCondition: "Maskinens tilstand",
      machineConditionPlaceholder: "Beskriv maskinens generelle tilstand...",
      checklist: "Checkliste",
      photos: "Fotodokumentation (valgfrit)",
      maxPhotos: "Maksimalt 10 billeder",
      additionalNotes: "Yderligere noter (valgfrit)",
      additionalNotesPlaceholder: "Tilføj eventuelle yderligere noter...",
      cancel: "Annuller",
      submitReturnForm: "Indsend afleveringsformular",
      submitting: "Indsender...",
      ratingsTitle: "Vurder din oplevelse",
      machineRating: "Vurder maskinen",
      machineRatingDesc: "Hvordan var maskinens tilstand og vedligeholdelse?",
      ownerRating: "Vurder ejeren",
      ownerRatingDesc: "Hvordan var din oplevelse med ejeren?",
      optional: "(valgfrit)",
      skipRatings: "Spring over vurderinger",
      submitRatings: "Indsend vurderinger",
      submittingRatings: "Indsender vurderinger...",
      complete: "Tak! Afleveringsformularen er blevet indsendt.",
      language: "Sprog",
    },
    en: {
      title: "Digital Return Form",
      subtitle: "Fill out the form to return",
      machineCondition: "Machine Condition",
      machineConditionPlaceholder: "Describe the general condition of the machine...",
      checklist: "Checklist",
      photos: "Photo Documentation (optional)",
      maxPhotos: "Maximum 10 images",
      additionalNotes: "Additional Notes (optional)",
      additionalNotesPlaceholder: "Add any additional notes...",
      cancel: "Cancel",
      submitReturnForm: "Submit Return Form",
      submitting: "Submitting...",
      ratingsTitle: "Rate Your Experience",
      machineRating: "Rate the Machine",
      machineRatingDesc: "How was the machine's condition and maintenance?",
      ownerRating: "Rate the Owner",
      ownerRatingDesc: "How was your experience with the owner?",
      optional: "(optional)",
      skipRatings: "Skip Ratings",
      submitRatings: "Submit Ratings",
      submittingRatings: "Submitting ratings...",
      complete: "Thank you! The return form has been submitted.",
      language: "Language",
    },
  };

  const texts = t[language];

  const modalStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "1rem",
  };

  const contentStyle = {
    background: "white",
    borderRadius: "12px",
    padding: "2rem",
    maxWidth: "700px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "1rem",
    marginTop: "0.5rem",
    fontFamily: "inherit",
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: "100px",
    resize: "vertical",
  };

  const buttonStyle = {
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };

  // Rating form components
  const StarRatingInput = ({ rating, setRating, comment, setComment, title, description }) => {
    const [hoverRating, setHoverRating] = useState(null);

    const handleStarClick = (starIndex, isLeftHalf) => {
      const newRating = starIndex + (isLeftHalf ? 0.5 : 1.0);
      setRating(newRating);
    };

    const handleStarHover = (starIndex, isLeftHalf) => {
      const previewRating = starIndex + (isLeftHalf ? 0.5 : 1.0);
      setHoverRating(previewRating);
    };

    const handleMouseLeave = () => {
      setHoverRating(null);
    };

    // Use hoverRating for display if hovering, otherwise use actual rating
    const displayRating = hoverRating !== null ? hoverRating : rating;

    const getStarFill = (starIndex) => {
      if (displayRating === null) return 0;
      const starValue = starIndex + 1;
      if (starValue <= displayRating) return 100; // Fully filled
      if (starValue - 0.5 <= displayRating) return 50; // Half filled
      return 0; // Empty
    };

    return (
      <div style={{ marginBottom: "2rem", padding: "1.5rem", background: "#f9f9f9", borderRadius: "8px" }}>
        <h3 style={{ margin: "0 0 0.5rem 0", color: "#08182b", fontSize: "1.1rem" }}>{title} {texts.optional}</h3>
        <p style={{ margin: "0 0 1rem 0", color: "#666", fontSize: "0.9rem" }}>{description}</p>
        
        <div 
          style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1rem", alignItems: "center" }}
          onMouseLeave={handleMouseLeave}
        >
          {[0, 1, 2, 3, 4].map((starIndex) => {
            const fill = getStarFill(starIndex);
            
            return (
              <div
                key={starIndex}
                style={{
                  position: "relative",
                  width: "40px",
                  height: "40px",
                  cursor: "pointer",
                  transition: "transform 0.2s ease",
                }}
                title={`${language === "da" ? "Klik venstre halvdel: " : "Click left half: "}${starIndex + 0.5} ${language === "da" ? "stjerner" : "stars"} | ${language === "da" ? "Klik højre halvdel: " : "Click right half: "}${starIndex + 1} ${language === "da" ? "stjerner" : "stars"}`}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const isLeftHalf = clickX < rect.width / 2;
                  handleStarClick(starIndex, isLeftHalf);
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mouseX = e.clientX - rect.left;
                  const isLeftHalf = mouseX < rect.width / 2;
                  handleStarHover(starIndex, isLeftHalf);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mouseX = e.clientX - rect.left;
                  const isLeftHalf = mouseX < rect.width / 2;
                  handleStarHover(starIndex, isLeftHalf);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  // Don't clear hoverRating here - let the parent container handle it
                }}
              >
                {/* Empty star outline (always visible) */}
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth="1.5"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    transition: "all 0.2s ease",
                  }}
                >
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                
                {/* Filled star overlay */}
                {fill > 0 && (
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill={hoverRating !== null ? "#ffd54f" : "#ffc107"}
                    stroke={hoverRating !== null ? "#ffd54f" : "#ffc107"}
                    strokeWidth="1.5"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      transition: "all 0.2s ease",
                      clipPath: fill === 100 
                        ? "inset(0)" 
                        : "inset(0 50% 0 0)", // Half star - clip right half
                      opacity: hoverRating !== null ? 0.9 : 1,
                    }}
                  >
                    <path
                      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
        
        {(displayRating !== null || rating !== null) && (
          <p style={{ 
            textAlign: "center", 
            color: hoverRating !== null ? "#1f6f78" : "#124e66", 
            marginBottom: "1rem", 
            fontWeight: "600", 
            fontSize: "1.1rem",
            transition: "color 0.2s ease"
          }}>
            {(displayRating !== null ? displayRating : rating).toFixed(1)} / 5.0
          </p>
        )}
        
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={language === "da" ? "Tilføj en kommentar (valgfrit)..." : "Add a comment (optional)..."}
          style={{ ...textareaStyle, minHeight: "80px", marginTop: "0.5rem" }}
          maxLength={1000}
        />
      </div>
    );
  };

  // Complete step
  if (currentStep === "complete") {
    return (
      <div style={modalStyle} onClick={onClose}>
        <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✅</div>
            <h2 style={{ margin: "0 0 1rem 0", color: "#08182b" }}>{texts.complete}</h2>
            <p style={{ color: "#124e66" }}>
              {language === "da" ? "Vinduet lukkes automatisk..." : "Window will close automatically..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Ratings step
  if (currentStep === "ratings") {
    return (
      <div style={modalStyle} onClick={onClose}>
        <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ margin: 0, color: "#08182b" }}>{texts.ratingsTitle}</h2>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button
                onClick={() => setLanguage(language === "da" ? "en" : "da")}
                style={{
                  ...buttonStyle,
                  background: "transparent",
                  color: "#666",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.9rem",
                }}
              >
                {language === "da" ? "🇬🇧 EN" : "🇩🇰 DA"}
              </button>
              <button
                onClick={onClose}
                style={{
                  ...buttonStyle,
                  background: "transparent",
                  color: "#666",
                  padding: "0.5rem",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: "#fee",
                color: "#c33",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                whiteSpace: "pre-line",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); submitRatings(); }}>
            <StarRatingInput
              rating={machineRating}
              setRating={setMachineRating}
              comment={machineRatingComment}
              setComment={setMachineRatingComment}
              title={texts.machineRating}
              description={texts.machineRatingDesc}
            />

            <StarRatingInput
              rating={ownerRating}
              setRating={setOwnerRating}
              comment={ownerRatingComment}
              setComment={setOwnerRatingComment}
              title={texts.ownerRating}
              description={texts.ownerRatingDesc}
            />

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  // Skip ratings and go to complete step since return form is already submitted
                  setCurrentStep("complete");
                  if (onSuccess) {
                    onSuccess();
                  }
                  setTimeout(() => {
                    if (onClose) {
                      onClose();
                    }
                  }, 2000);
                }}
                style={{
                  ...buttonStyle,
                  background: "#e0e0e0",
                  color: "#333",
                }}
                disabled={submittingRatings}
              >
                {texts.skipRatings}
              </button>
              <button
                type="submit"
                disabled={submittingRatings}
                style={{
                  ...buttonStyle,
                  background: submittingRatings
                    ? "#49a3a6"
                    : "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
                  color: "white",
                  opacity: submittingRatings ? 0.6 : 1,
                  cursor: submittingRatings ? "not-allowed" : "pointer",
                }}
              >
                {submittingRatings ? texts.submittingRatings : texts.submitRatings}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Return form step (default)
  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, color: "#08182b" }}>{texts.title}</h2>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              onClick={() => setLanguage(language === "da" ? "en" : "da")}
              style={{
                ...buttonStyle,
                background: "transparent",
                color: "#666",
                padding: "0.5rem 0.75rem",
                fontSize: "0.9rem",
              }}
            >
              {language === "da" ? "🇬🇧 EN" : "🇩🇰 DA"}
            </button>
            <button
              onClick={onClose}
              style={{
                ...buttonStyle,
                background: "transparent",
                color: "#666",
                padding: "0.5rem",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <p style={{ color: "#124e66", marginBottom: "1.5rem" }}>
          {texts.subtitle} <strong>{machineName}</strong>
        </p>

        {error && (
          <div
            style={{
              background: "#fee",
              color: "#c33",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleReturnFormSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: "600", color: "#08182b", marginBottom: "0.5rem" }}>
              {texts.machineCondition}
            </label>
            <textarea
              value={machineCondition}
              onChange={(e) => setMachineCondition(e.target.value)}
              placeholder={texts.machineConditionPlaceholder}
              style={textareaStyle}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: "600", color: "#08182b", marginBottom: "0.75rem" }}>
              {texts.checklist}
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {checklistItems.map((item) => (
                <label
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    cursor: "pointer",
                    padding: "0.5rem",
                    borderRadius: "6px",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleChecklistChange(item.id)}
                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                  />
                  <span style={{ color: "#124e66" }}>{language === "da" ? item.textDa : item.textEn}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: "600", color: "#08182b", marginBottom: "0.5rem" }}>
              {texts.photos}
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              style={{ ...inputStyle, padding: "0.5rem" }}
            />
            {photoPreviews.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "0.5rem", marginTop: "1rem" }}>
                {photoPreviews.map((preview, index) => (
                  <div key={index} style={{ position: "relative" }}>
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100px",
                        objectFit: "cover",
                        borderRadius: "6px",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        background: "rgba(0, 0, 0, 0.7)",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "24px",
                        height: "24px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.5rem" }}>
              {texts.maxPhotos}
            </p>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: "600", color: "#08182b", marginBottom: "0.5rem" }}>
              {texts.additionalNotes}
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder={texts.additionalNotesPlaceholder}
              style={textareaStyle}
            />
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                ...buttonStyle,
                background: "#e0e0e0",
                color: "#333",
              }}
            >
              {texts.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonStyle,
                background: loading
                  ? "#49a3a6"
                  : "linear-gradient(135deg, #1f6f78 0%, #49a3a6 100%)",
                color: "white",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? texts.submitting : texts.submitReturnForm}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
