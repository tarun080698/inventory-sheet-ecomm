# Google Sheets CRUD React App

Quickly spin up a UI to manage data in a Google Sheet.

## Setup

1. Copy `.env.example` to `.env` and fill your:
   * `REACT_APP_GOOGLE_CLIENT_ID`
   * `REACT_APP_GOOGLE_API_KEY`
   * `REACT_APP_GOOGLE_SHEET_ID`

2. `npm install`

3. `npm start`

Open <http://localhost:3000>, sign in with Google, and manage your sheet.

## Deploy to Vercel

```bash
vercel --prod
```

Make sure to set the three env variables in the Vercel dashboard.
