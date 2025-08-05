import { google } from "googleapis";

export interface GoogleCalendarCredentials {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  refresh_token: string;
}

// Simpan credentials di env atau db, contoh hardcode untuk demo
const credentials: GoogleCalendarCredentials = {
  client_id: process.env.GCAL_CLIENT_ID!,
  client_secret: process.env.GCAL_CLIENT_SECRET!,
  redirect_uri: process.env.GCAL_REDIRECT_URI!,
  refresh_token: process.env.GCAL_REFRESH_TOKEN!,
};

function getOAuth2Client() {
  const { client_id, client_secret, redirect_uri, refresh_token } = credentials;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
  oAuth2Client.setCredentials({ refresh_token });
  return oAuth2Client;
}

export const GoogleCalendarAPI = {
  async listEvents() {
    const auth = getOAuth2Client();
    const calendar = google.calendar({ version: "v3", auth });
    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: "startTime",
    });
    return res.data.items || [];
  },

  async createEvent(event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    location?: string;
  }) {
    const auth = getOAuth2Client();
    const calendar = google.calendar({ version: "v3", auth });
    return await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });
  },
};