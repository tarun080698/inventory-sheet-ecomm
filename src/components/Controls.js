import React, { useState } from "react";

export default function Controls({ onAdd, email="email" }) {
  const [draft, setDraft] = useState({
    style: { value: "", placeholder: "Select Style Code" },
    quantity: { value: "", placeholder: "Select Quantity" },
    color: { value: "", placeholder: "Select Color" },
    size: { value: "", placeholder: "Select Size" },
    boxNumber: { value: "", placeholder: "Box Number" },
  });

  const handleChange = (field, value) => {
    setDraft({
      ...draft,
      [field]: {
        ...draft[field],
        value,
      },
    });
  };

  const add = () => {
    // Check if at least one field has a value
    const hasValue = Object.values(draft).some((field) => field.value !== "");

    if (hasValue) {
      // Create array from object values in the correct order
      const rowValues = [
        new Date().toISOString(), // Timestamp 
        email, // Required metadata
        draft.style.value,
        draft.quantity.value,
        draft.color.value,
        draft.size.value,
        draft.boxNumber.value,
      ];

      onAdd(rowValues);

      // Reset form after adding
      setDraft({
        style: { ...draft.style, value: "" },
        quantity: { ...draft.quantity, value: "" },
        color: { ...draft.color, value: "" },
        size: { ...draft.size, value: "" },
        boxNumber: { ...draft.boxNumber, value: "" },
      });
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {Object.entries(draft).map(([field, { value, placeholder }]) => (
        <input
          key={field}
          value={value}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={placeholder}
          style={{
            marginRight: 8,
            padding: 6,
            width: "150px",
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />
      ))}
      <button
        onClick={add}
        style={{
          padding: "6px 12px",
          backgroundColor: "#4285F4",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        Add Row
      </button>
    </div>
  );
}
