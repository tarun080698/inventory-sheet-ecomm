import React, { useState } from "react";

export default function DataTable({
  data,
  onUpdate,
  onDelete,
  selectedColumns = null, // New prop to specify which columns to display
}) {
  const [editIdx, setEditIdx] = useState(null);
  const [draft, setDraft] = useState([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(selectedColumns || []);
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  const headers = data[0] || [];
  const rows = data.slice(1);

  // Initialize visible columns if not provided and we have headers
  React.useEffect(() => {
    if (!selectedColumns && headers.length > 0 && visibleColumns.length === 0) {
      // By default show all columns except Timestamp and Email Address
      const filteredColumnIndexes = headers
        .map((header, index) => {
          // Only return the index for columns we want to show
          return header !== "Timestamp" && header !== "Email Address"
            ? index
            : null;
        })
        .filter((index) => index !== null); // Remove null values

      setVisibleColumns(filteredColumnIndexes);
    } else if (selectedColumns) {
      setVisibleColumns(selectedColumns);
    }
  }, [headers, selectedColumns, visibleColumns.length]);

  const handleChange = (val, col) => {
    const next = [...draft];
    next[col] = val;
    setDraft(next);
  };

  const save = () => {
    // When saving, make sure we maintain all the original values
    // that might not be visible in the current view
    const updatedRow = [...rows[editIdx - 1]];
    visibleColumns.forEach((colIndex) => {
      updatedRow[colIndex] = draft[colIndex];
    });

    onUpdate(editIdx, updatedRow);
    setEditIdx(null);
  };

  const toggleColumnVisibility = (colIndex) => {
    setVisibleColumns((prev) => {
      if (prev.includes(colIndex)) {
        return prev.filter((idx) => idx !== colIndex);
      } else {
        return [...prev, colIndex].sort((a, b) => a - b);
      }
    });
  };

  const handleDelete = (rowIndex) => {
    setConfirmingDelete(null);
    onDelete(rowIndex);
  };

  if (!headers.length) {
    return <p>No data available</p>;
  }

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3>Data Table</h3>
        <button
          onClick={() => setShowColumnSelector(!showColumnSelector)}
          style={{
            padding: "6px 12px",
            backgroundColor: "#4285F4",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            height: 36,
          }}
        >
          {showColumnSelector ? "Hide Column Selector" : "Show Column Selector"}
        </button>
      </div>

      {showColumnSelector && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: "#f5f5f5",
            borderRadius: 4,
          }}
        >
          <p style={{ marginBottom: 8 }}>Select columns to display:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {headers.map((header, index) => (
              <label
                key={index}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(index)}
                  onChange={() => toggleColumnVisibility(index)}
                  style={{ marginRight: 4 }}
                />
                {header}
              </label>
            ))}
          </div>
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {visibleColumns.map((colIndex) => (
              <th
                key={colIndex}
                style={{ border: "1px solid #ccc", padding: 8 }}
              >
                {headers[colIndex]}
              </th>
            ))}
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => {
            const rowIndex = r + 1;
            const isEditing = editIdx === rowIndex;
            const isConfirmingDelete = confirmingDelete === rowIndex;

            return (
              <tr key={rowIndex}>
                {visibleColumns.map((colIndex) => (
                  <td
                    key={colIndex}
                    style={{ border: "1px solid #ccc", padding: 6 }}
                  >
                    {isEditing ? (
                      <input
                        value={draft[colIndex] || ""}
                        onChange={(e) => handleChange(e.target.value, colIndex)}
                        style={{ width: "100%" }}
                      />
                    ) : (
                      row[colIndex]
                    )}
                  </td>
                ))}
                <td style={{ border: "1px solid #ccc", padding: 6 }}>
                  {isEditing ? (
                    <button onClick={save}>Save</button>
                  ) : isConfirmingDelete ? (
                    <div>
                      <span style={{ color: "red" }}>Confirm delete?</span>
                      <button
                        onClick={() => handleDelete(rowIndex)}
                        style={{ marginLeft: 8 }}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(null)}
                        style={{ marginLeft: 8 }}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditIdx(rowIndex);
                          setDraft([...row]);
                        }}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#4285F4",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "red",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          marginLeft: 8,
                          cursor: "pointer",
                        }}
                        onClick={() => setConfirmingDelete(rowIndex)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
