import { useState } from "react";

const API_BASE = "http://localhost:8080/api";

export default function ReturnForm({ bookingId, machineName, onClose, onSuccess, token }) {
  const [machineCondition, setMachineCondition] = useState("");
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, text: "Maskinen er ren og tør", checked: false },
    { id: 2, text: "Alle dele er til stede", checked: false },
    { id: 3, text: "Ingen synlige skader", checked: false },
    { id: 4, text: "Alle funktioner virker korrekt", checked: false },
    { id: 5, text: "Brændstof/tanke er tømt (hvis relevant)", checked: false },
  ]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChecklistChange = (id) => {
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photoFiles.length > 10) {
      setError("Maksimalt 10 billeder tilladt");
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
    // For now, we'll convert photos to base64 and send as URLs
    // In production, you'd upload to a file storage service (S3, Cloudinary, etc.)
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Upload photos (for now as base64, in production use proper file storage)
      const photoUrls = await uploadPhotos();

      // Get checked checklist items
      const checkedItems = checklistItems
        .filter((item) => item.checked)
        .map((item) => item.text);

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
        throw new Error(text || "Kunne ikke indsende afleveringsformular");
      }

      if (onSuccess) {
        onSuccess();
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Error submitting return form:", err);
      setError(err.message || "Der opstod en fejl ved indsendelse af formularen");
    } finally {
      setLoading(false);
    }
  };

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
    maxWidth: "600px",
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

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, color: "#08182b" }}>Digital Afleveringsformular</h2>
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

        <p style={{ color: "#124e66", marginBottom: "1.5rem" }}>
          Udfyld formularen for at aflevere <strong>{machineName}</strong>
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: "600", color: "#08182b", marginBottom: "0.5rem" }}>
              Maskinens tilstand
            </label>
            <textarea
              value={machineCondition}
              onChange={(e) => setMachineCondition(e.target.value)}
              placeholder="Beskriv maskinens generelle tilstand..."
              style={textareaStyle}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: "600", color: "#08182b", marginBottom: "0.75rem" }}>
              Checkliste
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
                  <span style={{ color: "#124e66" }}>{item.text}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: "600", color: "#08182b", marginBottom: "0.5rem" }}>
              Fotodokumentation (valgfrit)
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
              Maksimalt 10 billeder
            </p>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: "600", color: "#08182b", marginBottom: "0.5rem" }}>
              Yderligere noter (valgfrit)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Tilføj eventuelle yderligere noter..."
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
              Annuller
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
              {loading ? "Indsender..." : "Indsend afleveringsformular"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

