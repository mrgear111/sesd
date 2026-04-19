# Agile Project Management Dashboard

A full-stack web application for agile project management built with Node.js, TypeScript, Express.js, and PostgreSQL.

## Technology Stack

**Backend:**
- Node.js 18+ with TypeScript 5.0+
- Express.js 4.18+ for HTTP server
- PostgreSQL 15+ with pg driver
- JWT authentication with bcrypt password hashing
- Jest for testing

**Architecture:**
- Three-tier architecture (Controllers, Services, Repositories)
- Repository Pattern for data access
- Service Layer Pattern for business logic
- Factory Pattern for object creation
- Dependency Injection for loose coupling

## Project Structure

```
src/
├── controllers/      # HTTP request handlers
├── services/         # Business logic layer
├── repositories/     # Data access layer
├── models/           # Domain entities
├── dto/              # Data transfer objects
├── middleware/       # Express middleware
├── validators/       # Request validation schemas
├── config/           # Configuration management
├── utils/            # Utility functions
├── factories/        # Object creation factories
├── routes/           # API route definitions
├── migrations/       # Database migrations
└── app.ts            # Express app setup

tests/
├── unit/             # Unit tests
├── integration/      # Integration tests
└── property/         # Property-based tests
```

## Setup Instructions

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 15 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mrgear111/sesd.git
cd sesd
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agile_dashboard
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_secret_key_here
JWT_EXPIRATION=24h

# Server Configuration
PORT=3000
NODE_ENV=development
```

4. Run database migrations (coming in next task):
```bash
npm run migrate
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Testing

Run all tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## API Documentation

API documentation will be available at `/api-docs` once implemented.

## License

ISC
