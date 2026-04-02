# Personal Finance Management System

A full-stack personal finance management application built with Vue.js, Express.js, and MongoDB (Azure Cosmos DB). Features include transaction tracking, data visualizations, and AI-powered financial advice using the HKBU ChatGPT API.

## Features

### Core Features
- **User Authentication**: JWT-based authentication with registration and login
- **Transaction Management**: Full CRUD operations for income and expense tracking
- **Data Visualization**: Interactive charts showing spending by category and over time
- **AI Financial Advice**: Personalized financial advice using HKBU ChatGPT API
- **Responsive Design**: Modern UI with Bootstrap 5

### Extra Features
- **Data Visualizations**: 
  - Pie chart for spending by category
  - Line/area chart for daily spending trends
  - Summary cards with key metrics
- **AI Financial Advice**:
  - Chat-like interface for asking questions
  - Personalized advice based on user's financial data
  - Conversation history

## Tech Stack

### Backend
- **Node.js** + **Express.js** - REST API framework
- **MongoDB** (Azure Cosmos DB) - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **csv-parser** - CSV data import
- **axios** - HTTP client for AI API

### Frontend (Web)
- **Vue.js 3** - Frontend framework
- **Vue Router** - Client-side routing
- **Pinia** - State management
- **Bootstrap 5** - UI framework
- **ApexCharts** - Data visualization
- **Bootstrap Icons** - Icon library

### Mobile App
- **Ionic Vue** - Mobile app framework
- **Capacitor** - Native runtime
- Same state management and API layer as web app

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Azure Cosmos DB for MongoDB account (provided)
- HKBU ChatGPT API key (provided)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install web client dependencies
cd ../client
npm install

# Install mobile app dependencies
cd ../mobile
npm install
```

### 2. Configure Environment Variables

#### Backend (`server/.env`)
```bash
cd server
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your-mongodb-connection-string-here
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
HKBU_API_KEY=your-hkbu-api-key-here
HKBU_BASE_URL=https://genai.hkbu.edu.hk/api/v0/rest
HKBU_MODEL=gpt-5-mini
HKBU_API_VER=2024-12-01-preview
```

#### Web Client (`client/.env`)
```bash
cd client
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5001/api
```

#### Mobile App (`mobile/.env`)
```bash
cd mobile
```

Create `.env`:
```env
VITE_API_URL=http://localhost:5001/api
```

### 3. Seed the Database

```bash
cd server
npm run seed
```

This will import 51 users and 1200 transactions from the CSV files.

### 4. Start the Application

#### Start Backend Server
```bash
cd server
npm run dev
```
Server will run on http://localhost:5001

#### Start Web Client
```bash
cd client
npm run dev
```
Web app will run on http://localhost:5173

#### Start Mobile App
```bash
cd mobile
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/me` - Get profile
- `PUT /api/users/me` - Update profile
- `GET /api/users/me/transactions` - Get user with transactions (lookup)
- `GET /api/users/ranking` - Get user ranking by net balance (admin)

### Transactions
- `GET /api/transactions` - List all transactions (with filters)
- `GET /api/transactions/recent` - Get recent transactions
- `GET /api/transactions/:id` - Get single transaction
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Stats
- `GET /api/stats/summary` - Dashboard summary
- `GET /api/stats/category` - Spending by category
- `GET /api/stats/monthly` - Monthly spending
- `GET /api/stats/daily` - Daily spending

### AI
- `POST /api/ai/advice` - Get personalized financial advice
- `POST /api/ai/general` - Get general financial advice

## Sample Data

The application includes sample data for testing:

- **Users**: 51 users (2 admins, 49 regular users)
- **Transactions**: 1200 transactions across various categories

### Sample Login Credentials
You can log in with any user from `Mock_Users.csv`. For example:
- Email: `dgrigs0@blogger.com`
- Password: `jQ3%~p\+#XE`

Or create a new account through registration.

## Features Implementation

### Core Requirements
1. **Two MongoDB Collections**: `users` and `transactions` with `userId` reference
2. **Full CRUD**: All operations on transactions
3. **Lookup/Aggregation**: 
   - User with transactions using `$lookup`
   - Category spending aggregation
   - Monthly/daily spending trends
4. **JWT Authentication**: Secure token-based auth
5. **Vue.js 3 + Bootstrap 5**: Modern responsive UI
6. **Ionic Mobile App**: Cross-platform mobile experience

### Bonus Features
1. **Data Visualizations**:
   - Pie chart: Spending by category
   - Area chart: Daily spending over 30 days
   - Summary cards with key metrics
2. **AI Financial Advice**:
   - HKBU ChatGPT API integration
   - Personalized advice with user's financial context
   - Chat interface with conversation history

## Development Notes

### Database Connection
The application uses Azure Cosmos DB for MongoDB. The connection string is pre-configured in the `.env.example` file.

### AI Integration
The AI advice feature uses the HKBU ChatGPT API with the following configuration:
- Model: `gpt-5-mini`
- Base URL: `https://genai.hkbu.edu.hk/api/v0/rest`

### Error Handling
- Login failures show a modal with error message (no page refresh)
- API errors are handled gracefully with user-friendly messages
- Form validation on both client and server sides

## Scripts

### Server Scripts
```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm run seed     # Seed database with CSV data
```

### Client Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Mobile Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## License

MIT

## Author

COMP 7980 Project
