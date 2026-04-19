# Agile Project Dashboard - Frontend

Next.js 14 frontend for the Agile Project Management Dashboard.

## Features

- ✅ User authentication (login/register)
- ✅ Project listing and creation
- ✅ Responsive design with Tailwind CSS
- ✅ TypeScript for type safety
- ✅ API integration with backend

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **API Client**: Custom fetch wrapper

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Create .env.local file
NEXT_PUBLIC_API_URL=http://localhost:3000
```

3. Start development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001)

## Pages

- `/` - Landing page
- `/login` - User login
- `/register` - User registration
- `/projects` - Project dashboard (protected)

## API Integration

The frontend connects to the backend API at `http://localhost:3000` by default.

Make sure the backend server is running before starting the frontend.

## Build

```bash
npm run build
npm start
```
