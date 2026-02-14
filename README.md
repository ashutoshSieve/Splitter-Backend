# 💸 SplitWise – MERN Stack Expense Sharing App

A full-stack MERN web application designed to **split expenses among friends, family, or groups** by creating multiple communities.  
Users can easily **share an invite link**, track payments, and maintain all expense records **in one centralized place**.

---

## 🚀 Features

- 👥 **Community-Based Expense Splitting**
  - Create multiple communities (friends, family, trips, etc.)
  - Invite users via shareable links

- 💰 **Expense Management**
  - Add, update, and delete expenses
  - Track who paid and how much
  - Maintain date-wise payment records

- 🔐 **Authentication & Authorization**
  - JWT-based authentication
  - OAuth login (Google)
  - Secure protected routes

- 📊 **Centralized Record Keeping**
  - All expenses stored and accessible at one place
  - Easy review of past payments

- ⚡ **Responsive UI**
  - Built with React for smooth user experience

---

## 🛠️ Tech Stack

### Frontend
- React.js
- JavaScript (ES6+)
- HTML5 & CSS3

### Backend
- Node.js
- Express.js
- RESTful APIs

### Database
- MongoDB
- Mongoose ODM

### Authentication
- JSON Web Tokens (JWT)
- OAuth (Google Authentication)

---

### Project Architecture 

backend/
├─ config/
│  └─ index.js                 # App-level config: env loading, constants, passport/jwt configs, etc.
│
├─ controllers/
│  ├─ auth.controller.js       # Login/Signup/Token refresh/Logout handlers
│  ├─ community.controller.js  # Create community, add/remove members, split logic
│  └─ user.controller.js       # User profile & preferences handlers
│
├─ db/
│  └─ connect.js               # DB connection (e.g., Mongoose connect & lifecycle hooks)
│
├─ middlewares/
│  ├─ errorHandler.middleware.js # Centralized error handling (maps errors → consistent responses)
│  ├─ jwt.middleware.js          # JWT verify/extract user; guards protected routes
│  └─ passport.middleware.js     # Passport strategy setup (e.g., JWT/local)
│
├─ models/
│  ├─ community.js             # Community schema/model (members, balances, metadata)
│  └─ user.js                  # User schema/model (auth, profile, roles)
│
├─ routes/
│  ├─ auth.routes.js           # /api/auth/* routes (login, signup, refresh)
│  ├─ community.routes.js      # /api/communities/* routes (CRUD, split, settle)
│  └─ user.routes.js           # /api/users/* routes (me, update, list)
│
├─ utils/
│  └─ date.util.js             # Date/time helpers (formatting, ranges)
│
├─ .env                        # Environment variables (NOT committed)
├─ .gitignore                  # Git ignore rules
├─ app.js                      # Express app bootstrap (middlewares, routes, 404)
└─ server.js                   # Server entry (port, DB init, start/stop)
---

## 🔐 Authentication Flow

1. User logs in using **OAuth (Google)** or normal login
2. Server generates a **JWT**
3. Token is stored on the client
4. JWT is verified for protected API routes

---
