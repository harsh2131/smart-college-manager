# 🎓 Smart College Manager

A comprehensive college management system for managing attendance, marks, subjects, and deadlines. Built with **Angular** (frontend) and **Node.js/Express** (backend) with **MongoDB** database.

## ✨ Features

- **Authentication**: Secure login for teachers and students
- **Subject Management**: Create and manage subjects/courses
- **Attendance Tracking**: Record and view attendance records
- **Marks Management**: Enter and view student marks
- **Deadline Management**: Create and track assignment deadlines
- **Analytics Dashboard**: Visual insights and statistics

## 🛠️ Tech Stack

### Frontend
- Angular 17+
- TypeScript
- SCSS

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd projecr
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run seed  # Optional: seed sample data
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:5001

## 📁 Project Structure

```
projecr/
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/      # Auth middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── seeds/           # Database seeding
│   └── server.js        # Entry point
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── components/  # Reusable components
│       │   ├── pages/       # Page components
│       │   ├── services/    # API services
│       │   └── guards/      # Route guards
│       └── environments/    # Environment config
└── README.md
```

## 🔧 Environment Variables

Copy `.env.example` to `.env` in the backend folder and configure:

| Variable | Description |
|----------|-------------|
| `PORT` | Backend server port (default: 5001) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `JWT_EXPIRES_IN` | JWT token expiry (default: 24h) |
| `FRONTEND_URL` | Frontend URL for CORS |

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/subjects` | Get all subjects |
| GET | `/api/attendance` | Get attendance records |
| GET | `/api/marks` | Get marks |
| GET | `/api/deadlines` | Get deadlines |
| GET | `/api/analytics` | Get analytics data |

## 👥 Default Users (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Teacher | teacher@college.edu | password123 |
| Student | student@college.edu | password123 |

## 📄 License

This project is licensed under the ISC License.

---

Made with ❤️ for educational purposes
