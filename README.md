# Safe_Link

This project is a **wearable monitoring and alerting system** for dementia patients.
The system integrates **ESP32-based IoT sensors** with a **real-time frontend dashboard** to track vital signs, detect falls, and provide geofencing alerts for patient safety.

---

## 🚀 Features

* 📡 **Real-time Monitoring**

  * Body temperature
  * Heart rate
  * Accelerometer readings (for activity/fall detection)
  * GPS location tracking

* ⚠️ **Alerts & Notifications**

  * Fall detection alerts
  * Geofencing alerts (when the patient moves outside a predefined safe zone)

* 🖥 **Frontend Dashboard**

  * Displays live data from sensors
  * Visualizes patient’s location on a map
  * Alerts caregivers in real-time

* 🛠 **Sensor Data Integration**

  * An ESP32 device streams real sensor data to a backend server for processing and visualization.
  * A separate **simulation server** using Node.js + Socket.IO can generate fake sensor data for testing.

---

## 🏗 Tech Stack

* **Hardware:** ESP32 microcontroller with sensors (Temperature, Heart Rate, Accelerometer, GPS)
* **Backend:** Node.js, Express, Socket.IO (receives real sensor data and supports simulation)
* **Frontend:** React (with charts & maps for visualization)

---

## ⚡ Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/dementia-monitoring-system.git
cd Wear_guard
cd wear_guard_v2
```

### 2️⃣ Setup Backend (Real Sensor Data)

```bash
cd server
npm install
npm start
```

This will start a **server that receives data from the ESP32 sensors** and streams it to connected clients.

### 3️⃣ Setup Backend (Simulation Mode, optional)

```bash
cd server
npm run simulate
```

This will start a **Socket.IO server** streaming fake sensor data every second for testing purposes.

### 4️⃣ Setup Frontend

```bash
cd frontend
npm install
npm start
```

The frontend will connect to the backend server and display **real-time patient data**.

---

## 👥 Team

* **Sampriti Saha**
* **Kshitij Kota**

---

## 📜 License

This project is licensed under the **MIT License**.

---
