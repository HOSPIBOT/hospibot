# HospiBot Mobile App

React Native mobile app for HospiBot — doctor and admin interface.

## Prerequisites

- Node.js 18+
- React Native CLI: `npm install -g @react-native/cli`
- For iOS: Xcode 14+ (macOS only)
- For Android: Android Studio + SDK

## Setup

```bash
cd apps/mobile
npm install

# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

## Architecture

```
apps/mobile/
├── src/
│   ├── screens/         # Screen components
│   │   ├── DashboardScreen.tsx    ← Live KPIs, notifications
│   │   ├── PatientsScreen.tsx     ← Patient search and list
│   │   ├── PatientDetailScreen.tsx← Full patient 360
│   │   ├── AppointmentsScreen.tsx ← Today's queue + booking
│   │   ├── WhatsAppScreen.tsx     ← Messaging inbox
│   │   ├── AnalyticsScreen.tsx    ← Revenue + analytics
│   │   └── ProfileScreen.tsx      ← User profile + logout
│   ├── navigation/
│   │   └── AppNavigator.tsx       ← Tab + Stack navigator
│   ├── services/
│   │   └── api.ts                 ← Axios client + all API methods
│   ├── components/                ← Shared UI components
│   └── hooks/                     ← Custom React hooks
└── package.json
```

## Key Features (Phase 1)

- ✅ Dashboard with live KPIs + action alerts
- ✅ Patient search, view and edit
- ✅ Appointment queue + status updates
- ✅ WhatsApp inbox with send
- ✅ Revenue analytics
- ✅ Auto JWT token refresh
- ✅ Pull-to-refresh everywhere

## API Base URL

Configured in `src/services/api.ts`:
- Dev: `http://localhost:4000/api/v1`
- Prod: `https://api.hospibot.ai/api/v1`

## Build for Production

```bash
# Android APK
cd android
./gradlew assembleRelease

# iOS Archive
xcodebuild archive -workspace ios/hospibot.xcworkspace -scheme hospibot
```
