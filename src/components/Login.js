import React from "react";

export default function Login({ onSignIn }) {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h1>Google Sheets Product Manager</h1>
      <p>Sign in to manage your Google Sheet data</p>
      <button
        style={{
          padding: "12px 24px",
          fontSize: 16,
          backgroundColor: "#4285F4",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
        onClick={onSignIn}
      >
        Sign in with Google
      </button>
    </div>
  );
}
