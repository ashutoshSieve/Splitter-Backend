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


---

## 🔐 Authentication Flow

1. User logs in using **OAuth (Google)** or normal login
2. Server generates a **JWT**
3. Token is stored on the client
4. JWT is verified for protected API routes

---
