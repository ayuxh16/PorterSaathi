# 🚉 PorterSaathi – Smart Railway Porter Booking Platform

PorterSaathi is a full-stack web application that allows users to **book railway porters in real-time**, eliminating manual hassle at stations. The platform connects travelers with verified porters, offering transparent pricing, live booking, and efficient coordination.

---

## 🌐 Tech Stack

### Frontend

* React.js (Vite)
* CSS (Custom + Responsive Design)
* React Router DOM

### Backend (In Progress)

* Node.js
* Express.js
* MongoDB *(planned)*
* Redis & Kafka *(planned for scalability)*

---

## ✨ Features

### 👤 For Customers

* Browse available porters near station
* View ratings and pricing
* Book porter instantly
* Track booking status

### 🧳 For Porters

* Register with government ID
* Set custom route pricing
* Accept/Reject booking requests
* Track earnings

### ⚡ Platform Features

* Real-time booking system
* Clean UI with modern design
* Role-based dashboard (Customer / Porter)
* Scalable backend architecture (planned)

---

## 📁 Project Structure

```
portersaathi/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   └── Toast.jsx
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── BookingPage.jsx
│   │   ├── LoginPage.jsx
│   │   └── ProfilePage.jsx
│   ├── styles/
│   └── App.jsx
│
├── backend/ (to be created)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── porters/
│   │   │   └── bookings/
│   │   ├── app.js
│   └── server.js
```

---

## 🚀 Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/portersaathi.git
cd portersaathi
```

---

### 2️⃣ Install frontend dependencies

```bash
npm install
```

---

### 3️⃣ Run frontend

```bash
npm run dev
```

App will run on:

```
http://localhost:5173
```

---

### 4️⃣ Setup Backend (Node.js)

```bash
mkdir backend
cd backend
npm init -y
npm install express cors
```

Run backend:

```bash
node server.js
```

Backend runs on:

```
http://localhost:5000
```

---

## 🔌 API Endpoints (Current)

### Porters

```
GET /api/porters
```

### Planned APIs

```
POST /api/auth/login
POST /api/auth/register

POST /api/bookings
GET  /api/bookings
PATCH /api/bookings/:id
```

---

## 📸 Screens

* Landing Page (Porter listing)
* Booking Dashboard
* Login System
* Profile Page

---

## 🎯 Future Improvements

* 🔐 JWT Authentication
* 📍 Live GPS Tracking
* 💳 Payment Integration
* ⚡ Redis Caching
* 📡 Kafka Event Streaming
* 📊 Admin Dashboard

---

## 🤝 Contributing

Contributions are welcome! Feel free to fork the repo and submit a PR.

---

## 📄 License

This project is for educational and development purposes.

---

## 👨‍💻 Author

**Ayush Singh**

* GitHub: https://github.com/ayuxh16
* LinkedIn: https://linkedin.com/in/ayush-singh-41395b2a2

---

## ⭐ If you like this project

Give it a star on GitHub ⭐
