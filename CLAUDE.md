# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nutri-AI is a NestJS application built with TypeScript and MongoDB. The application uses a modular architecture with domain-driven design principles.

## Common Commands

### Development
```bash
yarn install              # Install dependencies
yarn start:dev           # Run in watch mode
yarn start:debug         # Run with debugger attached
yarn build               # Build for production
yarn start:prod          # Run production build
```

### Testing
```bash
yarn test                # Run unit tests
yarn test:watch          # Run tests in watch mode
yarn test:cov            # Run tests with coverage report
yarn test:e2e            # Run e2e tests
yarn test:debug          # Run tests with debugger
```

### Code Quality
```bash
yarn lint                # Run ESLint with auto-fix
yarn format              # Format code with Prettier
```

## Architecture

### Layered Architecture

The application follows a strict layered architecture within each module:

1. **API Layer** (`api/`): Controllers and DTOs for HTTP handling
   - Controllers handle HTTP requests/responses
   - Input models define request payloads
   - Output models define response structures
   - Input DTOs handle query parameters and validation

2. **Application Layer** (`application/`): Services containing business logic
   - Services orchestrate domain operations
   - Handle use cases and workflows

3. **Domain Layer** (`domain/`): Entities and domain models
   - Mongoose schemas and entity definitions
   - Domain logic and validation rules

4. **Infrastructure Layer** (`infrastructure/`): Data access
   - Repositories for write operations
   - Query repositories for read operations
   - Database-specific implementations

### Module Structure

Modules are organized under `src/modules/`. Each module is self-contained with:
- Module definition file (`*.module.ts`)
- All layers (api, application, domain, infrastructure)
- MongooseModule.forFeature() registration for entities

Example: `user-accounts` module demonstrates the standard structure.

### Core Module

The `src/core/` directory contains shared infrastructure:

- **Exception Handling**: Custom domain exceptions with error codes
  - `DomainException`: Base exception class with code and extensions
  - `DomainExceptionCode`: Enum of application error codes
  - `DomainHttpExceptionsFilter`: Maps domain exceptions to HTTP responses
  - `AllHttpExceptionsFilter`: Catches all unhandled exceptions
  - Exception filters return standardized error responses with timestamp, path, message, code, and extensions

- **Base DTOs**: Pagination and query parameter handling
  - `PaginatedViewDto`: Base class for paginated responses
  - `Pagination`: Base pagination with sorting
  - `PaginationWithSearchLoginAndEmailTerm`: Extended pagination with search
  - `PaginationOutput`: Output model for paginated data

### Configuration

- `src/setup/app-settings.ts`: Centralized configuration using environment variables
  - `EnvironmentSettings`: Environment type management (DEVELOPMENT, STAGING, PRODUCTION, TESTING)
  - `APISettings`: Application settings (port, database URI, hash rounds)
  - Uses dotenv for environment variable loading
  - Provides defaults for missing environment variables

- `src/setup/app.setup.ts`: Application initialization
- `src/setup/swagger.setup.ts`: Swagger/OpenAPI configuration

### Database

- Uses MongoDB with Mongoose ODM
- Connection URI configured via `MONGO_CONNECTION_URI` environment variable
- Entity schemas use `@Schema()` decorator and `SchemaFactory.createForClass()`
- Type safety through `HydratedDocument` and custom model types

### API Documentation

- Swagger UI available at `/swagger`
- Configured with Bearer Auth and Basic Auth support
- Auto-generated from decorators and DTOs

### Exception Handling Pattern

When throwing domain exceptions:
```typescript
throw new DomainException({
  code: DomainExceptionCode.NotFound,
  message: 'user not found',
});
```

The exception filters automatically map domain codes to HTTP status codes:
- `NotFound` → 404
- `BadRequest`, `ValidationError` → 400
- `Unauthorized` → 401
- `Forbidden` → 403
- `InternalServerError` → 500

### Repository Pattern

- **Repository**: Write operations (create, update, delete)
- **QueryRepository**: Read operations (get, getAll with filtering/pagination)
- Injected with `@InjectModel()` decorator
- Return domain models or primitive types, not Mongoose documents directly

### Authentication & Authorization

The application uses JWT (JSON Web Token) based authentication with NestJS Passport:

#### Components

- **AuthService** (`src/modules/auth/application/auth.service.ts`): JWT token generation/validation, password hashing
- **JwtStrategy** (`src/modules/auth/application/strategies/jwt.strategy.ts`): Passport JWT strategy
- **JwtAuthGuard** (`src/modules/auth/api/guards/jwt-auth.guard.ts`): Route protection guard
- **CurrentUser Decorator** (`src/modules/auth/api/decorators/current-user.decorator.ts`): Extract authenticated user

#### Protecting Routes

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/api/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserType } from '../auth/api/decorators/current-user.decorator';

@Get('protected')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
async protectedRoute(@CurrentUser() user: CurrentUserType) {
  // user.userId - authenticated user's ID
  // user.email - authenticated user's email
}
```

#### Authentication Endpoints

- `POST /auth/signup` - Register new user and receive JWT token
- `POST /auth/login` - Authenticate user and receive JWT token
- `GET /auth/me` - Get current authenticated user info (protected)

For detailed JWT documentation, see `docs/JWT_AUTHENTICATION.md`

## Environment Variables

Required environment variables (defaults shown):
- `APP_PORT`: Application port (default: 7840)
- `MONGO_CONNECTION_URI`: MongoDB connection string (default: mongodb://localhost/nest)
- `HASH_ROUNDS`: Bcrypt hash rounds for passwords (default: 10)
- `JWT_SECRET`: Secret key for JWT signing (default: 'your-secret-key-change-in-production')
- `JWT_EXPIRES_IN`: JWT token expiration time (default: '7d')
- `ENV`: Environment type - DEVELOPMENT, STAGING, PRODUCTION, or TESTING (default: DEVELOPMENT)

## Key Dependencies

- **NestJS**: Core framework with decorators and dependency injection
- **Mongoose**: MongoDB ODM with schema validation
- **Swagger**: API documentation generation
- **bcrypt**: Password hashing (via AuthService)
- **class-validator/class-transformer**: DTO validation and transformation
- **@nestjs/jwt**: JWT token generation and validation
- **@nestjs/passport**: Passport integration for authentication strategies
- **passport-jwt**: JWT authentication strategy for Passport
