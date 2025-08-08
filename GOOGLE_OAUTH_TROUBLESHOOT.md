# Google OAuth Setup Fix untuk ChronoWise

## Problem: Aplikasi tampak tersambung tapi tidak benar-benar terhubung ke Google Calendar

## Solution: Update Google Cloud Console Settings

### 1. Buka Google Cloud Console
- Pergi ke [Google Cloud Console](https://console.cloud.google.com/)
- Pilih project: `fluted-oasis-462504-e8`

### 2. Update OAuth 2.0 Client Settings
- Pergi ke **APIs & Services** > **Credentials**
- Klik pada OAuth 2.0 Client ID yang sudah ada
- Update **Authorized JavaScript origins**:
  ```
  http://localhost:8080
  http://localhost:8083
  http://localhost:5173
  http://localhost:3000
  ```

### 3. ⚠️ PENTING: Update Authorized Redirect URIs
- **HAPUS**: `http://localhost:8083/auth/callback`
- **TAMBAHKAN**: `http://localhost:8083` (tanpa /auth/callback)
- **ATAU KOSONGKAN** bagian redirect URIs (untuk browser-native app)

### 4. Enable Google Calendar API
- Pergi ke **APIs & Services** > **Library**
- Cari "Google Calendar API"
- Pastikan sudah **ENABLED**

### 5. Test dengan Debug Tool
- Buka aplikasi di `http://localhost:8083`
- Klik menu "Debug Google Auth" di sidebar
- Klik "Test GAPI Load" untuk test basic connection
- Klik "Test Direct Sign In" untuk test real authentication

### 6. Common Issues & Fixes:

#### Issue 1: "redirect_uri_mismatch"
**Fix**: Pastikan authorized origins di Google Cloud Console match dengan URL aplikasi

#### Issue 2: "invalid_client"
**Fix**: Pastikan Client ID di .env file benar dan tidak ada extra spaces

#### Issue 3: "access_blocked"
**Fix**: Pastikan aplikasi tidak dalam testing mode, atau tambahkan email Anda sebagai test user

#### Issue 4: "popup_blocked"
**Fix**: Allow popups untuk localhost di browser settings

## Technical Details:

### Current Credentials:
- ✅ Client ID: `553931157924-lk00d4cajf0qepano6l8qdqaec8rfl3o.apps.googleusercontent.com`
- ✅ Project ID: `fluted-oasis-462504-e8`
- ⚠️ Redirect URI: Perlu disesuaikan untuk browser app

### Browser vs Server Implementation:
- Browser apps menggunakan **Implicit Flow** dengan `gapi` library
- Server apps menggunakan **Authorization Code Flow** dengan redirect URIs
- ChronoWise menggunakan browser implementation

### Expected OAuth Flow:
1. User clicks "Connect to Calendar"
2. Popup window opens with Google OAuth
3. User selects account and grants permissions
4. Popup closes, main app receives access token
5. App can now make Calendar API calls

### Debugging Steps:
1. Open Browser DevTools (F12)
2. Go to Console tab
3. Use Debug Tool in app
4. Check for error messages
5. Verify network requests in Network tab

## Quick Links:
- [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials?project=fluted-oasis-462504-e8)
- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Client-side Applications](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)

## Expected Result:
Setelah setup yang benar:
- ✅ Popup Google login akan muncul
- ✅ User bisa pilih account dan grant permissions
- ✅ Real calendar events akan ter-sync
- ✅ Statistics akan menampilkan data real dari Google Calendar
- ✅ Test events bisa dibuat langsung ke Google Calendar

## Status Updates:
- ✅ Client ID configured in .env
- ✅ Debug tool available for troubleshooting
- ⏳ Waiting for Google Cloud Console updates
- ⏳ Waiting for real authentication test
