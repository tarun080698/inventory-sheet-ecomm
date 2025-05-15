import React, { useEffect, useState, useCallback, useRef } from "react";
import { gapi } from "gapi-script";
import Login from "./components/Login";
import DataTable from "./components/DataTable";
import Controls from "./components/Controls";

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const SHEET_ID = process.env.REACT_APP_GOOGLE_SHEET_ID;

const DISCOVERY_DOCS = [
  "https://sheets.googleapis.com/$discovery/rest?version=v4",
];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";
const SHEET_NAME = "inventory"; // change if needed
const REFRESH_INTERVAL = 30000; // 30 seconds polling interval

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState([]);
  const [authError, setAuthError] = useState(null);
  const refreshTimerRef = useRef(null);
  const lastModifiedRef = useRef(null);

  const initClient = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load the auth2 library
      await new Promise((resolve) => gapi.load("client:auth2", resolve));

      // Initialize the client
      await gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES,
        ux_mode: "popup",
        redirect_uri: window.location.origin,
      });

      // Get the auth instance
      const authInstance = gapi.auth2.getAuthInstance();
      console.log(authInstance?.currentUser.le.wt.cu)

      // Set the initial sign-in state
      const signedIn = authInstance.isSignedIn.get();
      setIsSignedIn(signedIn);

      // Listen for sign-in state changes
      authInstance.isSignedIn.listen((isSignedIn) => {
        setIsSignedIn(isSignedIn);
        if (isSignedIn) {
          loadData();
          startAutoRefresh();
        } else {
          stopAutoRefresh();
        }
      });

      // If user is already signed in, load data
      if (signedIn) {
        loadData();
        startAutoRefresh();
      }

      setAuthError(null);
    } catch (error) {
      console.error("Error initializing Google API client", error);
      setAuthError(error.message || "Failed to initialize Google API");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initClient();

    // Cleanup on unmount
    return () => {
      stopAutoRefresh();
    };
  }, [initClient]);

  const startAutoRefresh = () => {
    // Clear any existing timer
    stopAutoRefresh();

    // Set up new timer
    refreshTimerRef.current = setInterval(() => {
      checkForUpdates();
    }, REFRESH_INTERVAL);

    console.log("Auto-refresh started with interval:", REFRESH_INTERVAL, "ms");
  };

  const stopAutoRefresh = () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
      console.log("Auto-refresh stopped");
    }
  };

  // Function to check if sheet has been modified
  const checkForUpdates = async () => {
    try {
      // Get the spreadsheet metadata
      const response = await gapi.client.sheets.spreadsheets.get({
        spreadsheetId: SHEET_ID,
      });

      // The modifiedTime is available at the top level in the response
      const currentModifiedTime = response.result.properties.modifiedTime;

      // If this is first check or the sheet has been modified
      if (
        !lastModifiedRef.current ||
        lastModifiedRef.current !== currentModifiedTime
      ) {
        console.log("Sheet changes detected, refreshing data");
        lastModifiedRef.current = currentModifiedTime;
        loadData();
      }
    } catch (error) {
      console.error("Error checking for updates:", error);

      // After a failed check, implement exponential backoff
      // Wait for a while before trying to refresh again
      const backoffTime = 60000; // 1 minute
      console.log(
        `Will try to check for updates again in ${backoffTime / 1000} seconds`
      );

      // Implement a one-time delayed check rather than stopping auto-refresh entirely
      setTimeout(() => {
        if (refreshTimerRef.current) {
          // Only if auto-refresh is still active
          checkForUpdates();
        }
      }, backoffTime);
    }
  };

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: SHEET_NAME,
      });
      setData(response.result.values || []);
      console.log("Data refreshed successfully");
    } catch (error) {
      console.error("Error loading sheet data:", error);
      alert("Failed to load data from Google Sheet. " + error.message);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  const signIn = useCallback(() => {
    try {
      gapi.auth2.getAuthInstance().signIn({
        prompt: "select_account",
      });
    } catch (error) {
      console.error("Error during sign in:", error);
      setAuthError(error.message || "Failed to sign in");
    }
  }, []);

  const signOut = useCallback(() => {
    try {
      stopAutoRefresh();
      gapi.auth2.getAuthInstance().signOut();
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  }, []);

  const addRow = async (row) => {
    try {
      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: SHEET_NAME,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: { values: [row] },
      });
      loadData();
    } catch (error) {
      console.error("Error adding row:", error);
      alert("Failed to add row. " + error.message);
    }
  };

  const updateRow = async (rowIndex, row) => {
    try {
      const range = `${SHEET_NAME}!A${rowIndex + 1}:Z${rowIndex + 1}`;
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range,
        valueInputOption: "RAW",
        resource: { values: [row] },
      });
      loadData();
    } catch (error) {
      console.error("Error updating row:", error);
      alert("Failed to update row. " + error.message);
    }
  };

  const deleteRow = async (rowIndex) => {
    try {
      // Get the current values
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: SHEET_NAME,
      });

      const values = response.result.values || [];

      // Filter out the row to be deleted
      const newValues = values.filter((_, index) => index !== rowIndex);

      // Clear the entire sheet first
      await gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: SHEET_ID,
        range: SHEET_NAME,
      });

      // Then update with the new values
      if (newValues.length > 0) {
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: SHEET_NAME,
          valueInputOption: "RAW",
          resource: { values: newValues },
        });
      }

      loadData();
    } catch (error) {
      console.error("Error deleting row:", error);
      alert("Failed to delete row. " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <p>Loading application...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
          padding: 24,
          textAlign: "center",
        }}
      >
        <h1>Authentication Error</h1>
        <p style={{ color: "red" }}>{authError}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 20px",
            background: "#4285F4",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Login onSignIn={signIn} />;
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          borderBottom: "1px solid #ccc",
          background: "#f9f9f9",
          padding: "0 10px",
        }}
      >
        <h1>Product Manager</h1>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            style={{
              padding: "8px 16px",
              marginRight: 10,
              background: isRefreshing ? "#cccccc" : "#4285F4",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isRefreshing ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              height: 36,
            }}
          >
            {isRefreshing ? (
              "Refreshing..."
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: 5, height: 36 }}
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                Refresh Data
              </>
            )}
          </button>
          <button
            onClick={signOut}
            style={{
              padding: "8px 16px",
              background: "#f1f1f1",
              border: "none",
              borderRadius: "4px",
              height: 36,
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <small style={{ color: "#777" }}>
          {isRefreshing
            ? "Refreshing data..."
            : `Last refresh: ${new Date().toLocaleTimeString()}`}
          {refreshTimerRef.current ? " • Auto-refresh active" : ""}
        </small>
      </div>
      <Controls onAdd={addRow} />
      <DataTable data={data} onUpdate={updateRow} onDelete={deleteRow} />
    </div>
  );
}
