# Bharat Bazaar Delivery Partner Panel (Delivery Rider App)

A complete, production-ready, professional Delivery Rider Mobile Application built for the Pan-India Multi-Vendor E-Commerce Platform.

---

## 🚀 Key Features

### 1. Delivery Partner Authentication & KYC
- **Email / Mobile + Password Login** with 1-click Quick Fill demo rider credentials.
- **Rider Registration** with full Pan-India KYC fields:
  - Personal details, driving license, vehicle type (Bike, Scooter, Electric, Van) and vehicle registration number.
  - Bank Account details (Account number, IFSC, Bank Name) and instant UPI ID (`@upi`).
  - Emergency contact details.
- **Dual Verification Options**: Password login and Mobile OTP verification (`4521`).

### 2. Live Availability & Real-Time Tracking
- **Online / Offline Toggle**: Instantly sets rider availability in database and notifies sellers.
- **Real-Time GPS Location Updates**: Periodically streams rider coordinates to backend and customer live tracking room.
- **Active Capacity Management**: Enforces max simultaneous orders (default 3) per rider to prevent overload.

### 3. Smart Order Dispatch & Assignment (Seller ➔ Rider)
- **Seller Panel Integration**: Sellers can view nearby, online, KYC-verified riders sorted by proximity, load, and rating.
- **Live Assignment Requests**:
  - Live countdown timer (120s response deadline) with audible/visual alert.
  - Merchant store pickup location, customer drop location, distance, package weight, and payout fee.
  - One-tap **Accept** or **Decline** with atomic database status transition.

### 4. Dual-OTP Verification Protocol
To prevent stolen packages and fake deliveries:
1. **Store Pickup OTP (`7821`)**: Merchant provides a 4-digit OTP that rider must verify at the store before marking status `picked_up`.
2. **Customer Doorstep OTP (`4521`)**: Recipient provides a 4-digit OTP that rider enters upon doorstep delivery.
   - Successful entry atomically marks delivery as `delivered`, updates customer order status, and instantly credits delivery earnings + surges to the rider's wallet.

### 5. Earnings & Instant Payouts
- **Comprehensive Earnings Hero**: Available balance, pending cash-to-deposit, today's earnings, and weekly totals.
- **Transparent Itemized Ledger**: Base fee, distance surge, peak incentive, and cash collection breakdown.
- **Instant Bank & UPI Payouts**: Request instant withdrawal to linked bank account or UPI ID with validation.

### 6. Order History & Issue Management
- **Searchable Delivery History**: Filter by delivered, failed, or date.
- **Issue Reporting Modal**: Report customer unavailable, address incorrect, phone unreachable, or package damage directly to support.

---

## 📁 Project Structure

```
delivery-frontend/
├── index.js
├── package.json
├── src/
│   ├── App.jsx
│   ├── constants/
│   │   ├── colors.js             # Indian logistics color palette
│   │   └── config.js             # API base URL & endpoints
│   ├── utils/
│   │   └── helpers.js            # ₹ INR formatting, phone masking, timers
│   ├── services/
│   │   ├── api.js                # Axios client with JWT interceptor
│   │   ├── deliveryService.js    # Full backend API integration
│   │   └── socketService.js     # Real-time WebSocket manager
│   ├── context/
│   │   ├── AuthContext.jsx       # Authentication & profile state
│   │   └── DeliveryContext.jsx   # Availability, requests & deliveries state
│   ├── components/
│   │   ├── common/
│   │   │   ├── AppIcon.jsx
│   │   │   ├── CustomButton.jsx
│   │   │   ├── CustomHeader.jsx
│   │   │   ├── CustomInput.jsx
│   │   │   └── StatusBadge.jsx
│   │   └── cards/
│   │       ├── DeliveryCard.jsx  # Active delivery workflow card
│   │       ├── RequestCard.jsx   # Incoming assignment card with timer
│   │       └── StatCard.jsx      # KPI statistics widget
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.jsx
│   │   │   ├── RegisterScreen.jsx
│   │   │   └── OtpVerificationScreen.jsx
│   │   ├── dashboard/
│   │   │   └── DashboardScreen.jsx (Home Tab)
│   │   ├── requests/
│   │   │   └── RequestsScreen.jsx (Requests Tab)
│   │   ├── deliveries/
│   │   │   └── ActiveDeliveriesScreen.jsx (Deliveries Tab)
│   │   ├── earnings/
│   │   │   └── EarningsScreen.jsx (Earnings Tab)
│   │   ├── payouts/
│   │   │   └── PayoutsScreen.jsx
│   │   ├── history/
│   │   │   └── HistoryScreen.jsx
│   │   ├── notifications/
│   │   │   └── NotificationsScreen.jsx
│   │   └── profile/
│   │       └── ProfileScreen.jsx (Profile Tab)
│   └── navigation/
│       ├── AppNavigator.jsx
│       └── BottomTabNavigator.jsx # 5 bottom tabs
```

---

## 🔑 Demo Rider Credentials

| Credential | Value |
|---|---|
| **Role** | Delivery Fleet Partner |
| **Email** | `delivery@appecom.in` |
| **Password** | `Delivery@12345` |
| **Mobile Number** | `9876501234` |
| **Vehicle** | Motorcycle (`DL-04-CK-8821`) |
| **Default Pickup OTP** | `7821` |
| **Default Delivery OTP** | `4521` |

---

## 🛠️ Backend API Endpoints

All endpoints are mounted under `/api/v1/delivery/` and `/api/delivery/`:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Partner login (email/phone + password) |
| `POST` | `/auth/register` | KYC onboarding registration |
| `POST` | `/auth/send-otp` | Request mobile verification OTP |
| `POST` | `/auth/verify-otp` | Verify OTP and authenticate |
| `GET` | `/profile` | Fetch partner KYC & bank details |
| `PUT` | `/profile` | Update rider details |
| `POST` | `/availability` | Toggle online/offline status |
| `GET` | `/dashboard` | Overall rider KPIs & wallet snapshot |
| `GET` | `/requests` | Fetch pending assignment requests |
| `POST` | `/requests/:id/accept` | Accept delivery assignment |
| `POST` | `/requests/:id/decline` | Decline delivery assignment |
| `GET` | `/deliveries/active` | Get current in-progress deliveries |
| `GET` | `/deliveries/history` | Get completed/failed delivery history |
| `POST` | `/deliveries/:id/reached-pickup` | Mark arrived at merchant store |
| `POST` | `/deliveries/:id/verify-pickup-otp` | Verify store pickup OTP |
| `POST` | `/deliveries/:id/out-for-delivery` | Mark transit to customer |
| `POST` | `/deliveries/:id/reached-customer` | Mark arrived at doorstep |
| `POST` | `/deliveries/:id/verify-delivery-otp` | Verify customer OTP & credit earnings |
| `POST` | `/deliveries/:id/report-failure` | Report delivery failure reason |
| `POST` | `/deliveries/:id/location` | Stream GPS coordinates |
| `GET` | `/earnings` | Get wallet balance and ledger |
| `GET` | `/payouts` | Get withdrawal transaction history |
| `POST` | `/payouts/request` | Submit bank/UPI withdrawal request |

