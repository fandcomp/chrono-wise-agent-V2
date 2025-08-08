# Google Calendar Integration Setup Guide

## Langkah 1: Setup Google Cloud Project

1. **Buka Google Cloud Console**
   - Pergi ke: https://console.cloud.google.com/
   - Login dengan akun Google yang ingin digunakan untuk kalender

2. **Buat atau Pilih Project**
   - Klik "Select a project" di bagian atas
   - Buat project baru dengan nama: "ChronoWise Calendar Integration"
   - Atau gunakan project yang sudah ada

3. **Enable Google Calendar API**
   - Pergi ke: "APIs & Services" > "Library"
   - Cari "Google Calendar API"
   - Klik "Enable"

4. **Buat OAuth 2.0 Credentials**
   - Pergi ke: "APIs & Services" > "Credentials"
   - Klik "Create Credentials" > "OAuth client ID"
   - Pilih "Web application"
   - Nama: "ChronoWise Web Client"
   - Authorized JavaScript origins: 
     - http://localhost:8081
     - http://localhost:8080
     - http://127.0.0.1:8081
     - http://127.0.0.1:8080
   - Authorized redirect URIs (optional untuk implicit flow):
     - http://localhost:8081/oauth/callback
     - http://localhost:8080/oauth/callback

5. **Copy Client ID**
   - Setelah dibuat, copy "Client ID" yang dihasilkan
   - Format seperti: `123456789-abc123def456.apps.googleusercontent.com`

## Langkah 2: Configure OAuth Consent Screen

1. **Setup OAuth Consent**
   - Pergi ke: "APIs & Services" > "OAuth consent screen"
   - Pilih "External" (untuk testing)
   - Isi informasi aplikasi:
     - App name: "ChronoWise"
     - User support email: (email Anda)
     - Developer contact: (email Anda)

2. **Add Scopes**
   - Tambah scope: `https://www.googleapis.com/auth/calendar`
   - Tambah scope: `https://www.googleapis.com/auth/calendar.events`

3. **Add Test Users** (untuk External apps)
   - Tambahkan email yang akan digunakan untuk testing

## Langkah 3: Update Environment Variables

Tambahkan Client ID ke file .env:

```env
# Google Calendar Integration
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
```

## Langkah 4: Testing Checklist

- [ ] Google Cloud Project created
- [ ] Calendar API enabled
- [ ] OAuth 2.0 credentials created
- [ ] Consent screen configured
- [ ] Client ID added to .env
- [ ] Test users added (if using External consent)
- [ ] Local URLs added to authorized origins

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch"**
   - Make sure localhost URLs are added to authorized origins
   - Check exact port numbers match

2. **"access_blocked"**
   - Add your email to test users
   - Make sure consent screen is properly configured

3. **"unauthorized_client"**
   - Check Client ID is correct in .env
   - Verify API is enabled

### Security Notes:

- Client ID can be public (used for OAuth flow)
- Never expose Client Secret in frontend code
- Use environment variables for configuration
- Restrict authorized origins in production

## Next Steps

After setup:
1. Restart development server
2. Test connection in QuickCalendarTest component
3. Verify real Google Calendar events appear
4. Test creating events from tasks
