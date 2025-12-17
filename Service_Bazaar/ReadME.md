# Service Bazaar - Cross-Platform Service Marketplace

## Overview
Service Bazaar is a comprehensive cross-platform mobile application developed using React Native, designed to connect users with service providers (workers) for various services and to manage supply purchases. The platform includes real-time booking, location-based provider filtering, and a full e-commerce module for supplies.

## Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Mobile Frontend** | **React Native, Expo** | Cross-platform mobile development (iOS/Android). |
| **Frontend Libraries** | React Navigation, React Native WebView, Expo AV | Navigation, map integration, and audio handling. |
| **Backend API** | **Node.js, Express.js** | Robust, scalable API server handling business logic. |
| **Real-time** | **Socket.IO** | Enables instant, bi-directional chat between users and providers. |
| **Database** | Firebase | Data persistence for users, providers, bookings, and inventory. |
| **Geolocation** | Expo Location, Nominatim (OpenStreetMap) | User location fetching, reverse geocoding, and provider filtering. |
| **Management** | Python | Used for internal tools like data backup and supply inventory management. |

## Key Features

### 1. Booking & Service Module
* **Location-Based Filtering:** Providers are filtered based on the user's selected location, utilizing coordinates for availability checks.
* **Dynamic Booking Flow:** A multi-step modal guides users through selecting date, time, and custom duration, dynamically calculating cost and checking provider availability.
* **Secure Service Lifecycle:** Features OTP verification for service commencement (`BookingScreen.js`) and a post-completion rating/review system (`RatingModal.js`).

### 2. Real-Time Communication
* **Live Chat:** Users and providers can communicate instantly within the app using text and voice messages, managed by Socket.IO.

### 3. E-commerce & Supplies Module
* **Cart Management:** Local persistence of cart items (`AsyncStorage`) with quantity controls and dynamic totals.
* **Checkout:** Handles order placement with support for Cash on Delivery (COD), including GST calculation.
* **Order History:** Users can track the status of their product orders and submit product ratings after delivery.

### 4. User & Provider Roles
* **Dual Role Support:** A single user can operate in customer mode (booking services, asking queries) or provider mode (managing requests, viewing stats, ordering supplies).
* **Provider Tools:** Providers have screens to manage incoming requests, update service status, and a detailed screen for viewing and purchasing supplies.

## Setup and Installation
1. **Navigate to the project root directory**
   ```bash
   cd code
   ```
3.  **Frontend Setup (React Native/Expo):**
    ```bash
    cd frontend
    npm install
    npx expo start
    ```
4.  **Backend Setup (Node.js/Express):**
    ```bash
    cd backend
    node server.js
    ```
5.  **Python Management Tools:**
    ```bash
    # Run tools for administrator-level management
    python SupplyManager.py
    python "applications viewer.py"
    python "backup data.py"
    ```
