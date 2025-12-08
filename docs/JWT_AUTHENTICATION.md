# JWT Authentication Documentation

## Overview

This application implements JWT (JSON Web Token) authentication using NestJS best practices with `@nestjs/jwt` and `@nestjs/passport`.

## Architecture

### Components

1. **AuthService** (`src/modules/auth/application/auth.service.ts`)
   - Handles JWT token generation and validation
   - Password hashing and comparison using bcrypt
   - Methods:
     - `generateAccessToken(userId, email)` - Creates JWT token
     - `verifyToken(token)` - Validates JWT token
     - `comparePasswords(plain, hashed)` - Compares passwords
     - `generatePasswordHash(password)` - Hashes passwords

2. **JwtStrategy** (`src/modules/auth/application/strategies/jwt.strategy.ts`)
   - Passport strategy for JWT validation
   - Extracts token from Authorization header (Bearer token)
   - Validates user existence
   - Attaches user info to request object

3. **JwtAuthGuard** (`src/modules/auth/api/guards/jwt-auth.guard.ts`)
   - NestJS guard for protecting routes
   - Uses JWT strategy for authentication

4. **CurrentUser Decorator** (`src/modules/auth/api/decorators/current-user.decorator.ts`)
   - Custom parameter decorator
   - Extracts authenticated user from request

## Configuration

### Environment Variables

Add to your `.env` file:

```env
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

**Important**: Use a strong, random secret in production!

### Settings

JWT settings are configured in `src/setup/app-settings.ts`:

```typescript
public readonly JWT_SECRET: string;
public readonly JWT_EXPIRES_IN: string;
```

## API Endpoints

### 1. Sign Up - POST `/auth/signup`

Register a new user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "displayName": "John Doe",
  "timezone": "UTC"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "displayName": "John Doe",
    "timezone": "UTC",
    "dailyKcalGoal": 0,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Login - POST `/auth/login`

Authenticate existing user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "displayName": "John Doe",
    "timezone": "UTC",
    "dailyKcalGoal": 2000,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Get Current User - GET `/auth/me`

Get authenticated user's information (protected route).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "displayName": "John Doe",
  "timezone": "UTC",
  "dailyKcalGoal": 2000,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Usage in Controllers

### Protecting Routes

Use `@UseGuards(JwtAuthGuard)` to protect routes:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/api/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserType } from '../auth/api/decorators/current-user.decorator';

@Controller('protected')
export class ProtectedController {
  @Get('data')
  @UseGuards(JwtAuthGuard)
  async getProtectedData(@CurrentUser() user: CurrentUserType) {
    // user.userId - authenticated user's ID
    // user.email - authenticated user's email
    return { message: `Hello ${user.email}` };
  }
}
```

### Global Guard (Optional)

To protect all routes by default:

```typescript
// In main.ts or app.module.ts
import { JwtAuthGuard } from './modules/auth/api/guards/jwt-auth.guard';

app.useGlobalGuards(new JwtAuthGuard());
```

Then use `@Public()` decorator for public routes (requires custom implementation).

## JWT Payload Structure

```typescript
interface JwtPayload {
  sub: string;      // User ID
  email: string;    // User email
  iat?: number;     // Issued at (timestamp)
  exp?: number;     // Expiration time (timestamp)
}
```

## Security Best Practices

1. **Secret Key**
   - Use a strong, random secret (minimum 256 bits)
   - Store in environment variables, never commit to repository
   - Rotate secrets periodically

2. **Token Expiration**
   - Set appropriate expiration time (default: 7 days)
   - Consider shorter expiration for sensitive operations
   - Implement refresh token mechanism for better UX

3. **HTTPS Only**
   - Always use HTTPS in production
   - Prevents token interception

4. **Token Storage (Client-side)**
   - Store in httpOnly cookies (best) or secure storage
   - Never store in localStorage for sensitive apps

5. **Password Security**
   - Minimum password requirements enforced
   - Bcrypt with configurable rounds (default: 10)

## Error Handling

The authentication system throws `DomainException` with appropriate codes:

- `BadRequest` - User already exists (signup)
- `Unauthorized` - Invalid credentials (login)
- `Unauthorized` - Invalid/expired token (protected routes)
- `NotFound` - User not found

## Testing

Run authentication tests:

```bash
yarn test auth.controller.spec
```

All authentication flows are covered:
- Signup with valid/invalid data
- Login with valid/invalid credentials
- Protected route access
- Token generation and validation

## Future Enhancements

Consider implementing:

1. **Refresh Tokens**
   - Longer-lived tokens for seamless user experience
   - Separate refresh endpoint

2. **Token Revocation**
   - Blacklist tokens on logout
   - Redis for token management

3. **Rate Limiting**
   - Prevent brute force attacks
   - Throttle login attempts

4. **2FA (Two-Factor Authentication)**
   - Additional security layer
   - TOTP or SMS-based

5. **Password Reset Flow**
   - Email-based password reset
   - Temporary reset tokens

## Swagger Documentation

The API is documented with Swagger. Access at `/swagger` when running the application.

All protected endpoints are marked with `@ApiBearerAuth()` decorator.
