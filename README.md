# FreightLink AI - Academic Railway Logistics Scheduler

FreightLink AI is a modern web application designed for simulating railway freight scheduling, wagon allocation, and predicting transit delays using Machine Learning. It provides separate dashboard experiences for Shippers (Customers) and Control Room Officers (Administrators).

---

## 🚀 Key Features

* **Wagon Booking & Allocation**: Shippers can submit cargo requests with station routing, weight, and priority.
* **Simulated Real-Time Train Tracking**: Visual map simulation showing live transit along railway corridors using Leaflet Maps.
* **AI Delay Prediction**: Built-in Flask API running an XGBoost regression model (`freight_model.pkl`) to predict delay estimates based on distance, wagon counts, weight, weather, and congestion.
* **Two-Phase Password Reset**: Secure authentication flow with One-Time Password (OTP) verification emails.
* **Admin Control Room CRUDs**: Admin panel for managing stations, wagon fleet, pre-authorizing officer credentials, and monitoring system audit logs.
* **Responsive Sidebar & Navigation**: Premium Dark-themed dashboard with micro-animations and active profile session details.

---

## 🛠️ Technology Stack

* **Frontend**: React.js (Vite), Vanilla CSS, Leaflet Map (Mapbox tiles)
* **Backend**: Node.js (Express), MongoDB Atlas (Mongoose), Socket.io (Notifications), Nodemailer
* **Machine Learning API**: Python 3, Flask, Pandas, XGBoost, Joblib

---

## ⚙️ Local Development Setup

### 1. Backend Setup
1. Navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `Backend` directory and define your keys:
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=your_gmail@gmail.com
   SMTP_PASS=your_16_digit_gmail_app_password
   FLASK_API_URL=http://127.0.0.1:5000
   ```
4. Start the Node backend in development mode:
   ```bash
   npm run dev
   ```

### 2. Flask ML API Setup
1. Navigate to the `Backend/flask_api` directory:
   ```bash
   cd Backend/flask_api
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the Flask server:
   ```bash
   python app.py
   ```

### 3. Frontend Setup
1. Navigate to the `Frontend/Freight_App` directory:
   ```bash
   cd Frontend/Freight_App
   ```
2. Install packages:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```

---

## 🐳 Containerized Deployment (Docker)

To run the entire system (including MongoDB, Python Flask, Node.js Backend, and React Frontend) inside Docker containerization:

1. Open your terminal in the project root directory.
2. Run the build command:
   ```bash
   docker-compose up --build
   ```
3. Once completed, access the application globally in your local environment at **`http://localhost:8080`**.

---

## 🌐 Cloud Deployment (e.g. Render)

Refer to the project's global deployment steps to host the code publicly:
1. **Flask ML API**: Deploy `./Backend/flask_api` as a Web Service.
2. **Node Backend**: Deploy `./Backend` as a Web Service (configure `.env` variables in your dashboard settings).
3. **React Frontend**: Deploy `./Frontend/Freight_App` as a Static Site (set `VITE_API_URL` to point to your deployed backend URL).
