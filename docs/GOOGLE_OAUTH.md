# Google OAuth Authentication

This document describes how to use Google OAuth (Gmail) authentication in the Nutri-AI application.

## Overview

The application supports authentication via Google OAuth ID tokens. Users can sign in with their Google account, and the system will automatically create or authenticate their account.

## Setup

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Configure the authorized redirect URIs for your application
6. Copy the Client ID

### 2. Configure Environment Variables

Add the Google Client ID to your `.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## API Endpoint

### POST `/auth/google`

Authenticates a user using a Google ID token.

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmU..."
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@gmail.com",
    "displayName": "John Doe",
    "authProvider": "google",
    "googleId": "1234567890",
    "timezone": null,
    "dailyKcalGoal": 0,
    "createdAt": "2025-12-21T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: An account with this email already exists (local auth)
- `401 Unauthorized`: Invalid or expired Google token

## Frontend Integration

### Using Google Sign-In JavaScript Library

1. **Include Google Sign-In Script:**
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

2. **Initialize Google Sign-In:**
```javascript
google.accounts.id.initialize({
  client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  callback: handleCredentialResponse
});

function handleCredentialResponse(response) {
  const idToken = response.credential;

  // Send to your backend
  fetch('/auth/google', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken })
  })
  .then(res => res.json())
  .then(data => {
    // Store JWT token
    localStorage.setItem('token', data.token);
    // Redirect or update UI
  });
}
```

3. **Render Sign-In Button:**
```html
<div id="g_id_onload"
     data-client_id="YOUR_CLIENT_ID.apps.googleusercontent.com"
     data-callback="handleCredentialResponse">
</div>
<div class="g_id_signin" data-type="standard"></div>
```

### Using @react-oauth/google (React)

1. **Install Package:**
```bash
npm install @react-oauth/google
```

2. **Wrap App with GoogleOAuthProvider:**
```jsx
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_CLIENT_ID.apps.googleusercontent.com">
      {/* Your app components */}
    </GoogleOAuthProvider>
  );
}
```

3. **Use GoogleLogin Component:**
```jsx
import { GoogleLogin } from '@react-oauth/google';

function LoginPage() {
  const handleSuccess = async (credentialResponse) => {
    const response = await fetch('/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: credentialResponse.credential
      })
    });

    const data = await response.json();
    localStorage.setItem('token', data.token);
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => console.log('Login Failed')}
    />
  );
}
```

## How It Works

1. **Frontend** obtains a Google ID token using Google Sign-In
2. **Frontend** sends the ID token to `POST /auth/google`
3. **Backend** verifies the token with Google's servers using `google-auth-library`
4. **Backend** extracts user information (email, name, Google ID) from the verified token
5. **Backend** checks if a user with this email exists:
   - If user exists and is a Google user → authenticates and returns JWT
   - If user exists but is a local user → returns error (account linking not implemented)
   - If user doesn't exist → creates a new Google user account
6. **Backend** returns a JWT token for API authentication

## User Schema Changes

The User entity now includes:

- `authProvider` (optional): `'local'` | `'google'` - indicates how the user signed up
- `googleId` (optional): Google user ID (unique identifier from Google)
- `passwordHash` (optional): Only required for local auth users

## Security Notes

1. **Token Verification**: All Google ID tokens are verified server-side using Google's official library
2. **Client ID Validation**: Tokens are validated against your configured `GOOGLE_CLIENT_ID`
3. **No Passwords for Google Users**: Users who sign up via Google don't have passwords
4. **Account Linking**: Currently, if a user signed up with email/password, they cannot link a Google account (returns an error)

## Testing

You can test the Google OAuth flow using:

1. **Postman/Insomnia:**
   - Get a valid Google ID token from frontend
   - Send POST request to `/auth/google` with the token

2. **Frontend Integration:**
   - Implement Google Sign-In button
   - Test the complete flow from sign-in to API calls

## Troubleshooting

### "Failed to verify Google token"
- Check that `GOOGLE_CLIENT_ID` is correctly set in `.env`
- Verify the ID token is not expired (tokens expire after 1 hour)
- Ensure the token was issued for your Client ID

### "An account with this email already exists"
- This occurs when a user with the same email exists but used local (email/password) auth
- Current implementation doesn't support linking accounts
- User should login with their original method

## Future Enhancements

Potential improvements:

1. **Account Linking**: Allow users to link Google account to existing local account
2. **Profile Picture**: Store and use Google profile picture URL
3. **Refresh Tokens**: Implement refresh token flow for longer sessions
4. **Multiple OAuth Providers**: Add support for other providers (Facebook, GitHub, etc.)
