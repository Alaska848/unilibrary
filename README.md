# 📚 University Library — React Native App

A full-featured mobile library application built with **React Native + Expo**, connected to the existing **Firebase** backend (Auth, Firestore, Storage).

---

## 🗂 Project Structure

```
LibraryApp/
├── App.js                          ← Root entry point
├── app.json                        ← Expo config
├── babel.config.js
├── package.json
│
└── src/
    ├── context/
    │   └── AuthContext.js          ← Global auth state (replaces sessionStorage)
    │
    ├── navigation/
    │   └── AppNavigator.js         ← Stack + Tab navigation, role-based routing
    │
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.js
    │   │   ├── RegisterScreen.js
    │   │   └── ForgotPasswordScreen.js
    │   │
    │   ├── main/
    │   │   ├── HomeScreen.js       ← Featured books, stats, search
    │   │   ├── CatalogScreen.js    ← Full book list with category filter
    │   │   ├── BookDetailScreen.js ← Book info + borrow request modal
    │   │   ├── MyBooksScreen.js    ← User's loans (Active/Pending/Overdue/Returned)
    │   │   ├── ProfileScreen.js    ← Profile view/edit + password change
    │   │   └── SubmitBookScreen.js ← Faculty book submission form
    │   │
    │   └── admin/
    │       ├── AdminBooksScreen.js           ← CRUD books
    │       ├── AdminBorrowingLogScreen.js    ← Approve/reject/return loans
    │       ├── AdminUsersScreen.js           ← Suspend/restore users
    │       └── AdminFacultyRequestsScreen.js ← Review faculty submissions
    │
    ├── components/
    │   └── ui/
    │       ├── Button.js           ← Reusable button (primary/outline/ghost/danger)
    │       ├── Input.js            ← Form input with label, error, password toggle
    │       ├── Card.js             ← Surface card with shadow
    │       ├── Badge.js            ← Status badge (auto-colors loan statuses)
    │       ├── BookCard.js         ← Book list item with cover, wishlist, availability
    │       ├── Avatar.js           ← Initials avatar with uid-based color hash
    │       ├── LoadingSpinner.js   ← Full-screen or inline loader
    │       ├── EmptyState.js       ← Empty state with icon + message
    │       └── index.js            ← Barrel export
    │
    ├── services/
    │   ├── firebase.js             ← Firebase init (Auth with AsyncStorage persistence)
    │   └── firestoreService.js     ← All Firestore queries (mirrors web app logic)
    │
    └── utils/
        └── theme.js                ← Colors, fonts, spacing, shadows, border radii
```

---

## ⚡ Setup Steps

### 1. Prerequisites

```bash
node --version   # v18+ required
npm --version    # v9+ required
```

Install Expo CLI globally (if not already installed):

```bash
npm install -g expo-cli
```

### 2. Install Dependencies

```bash
cd LibraryApp
npm install
```

### 3. Install Expo Go (for testing)

- **iOS**: [App Store — Expo Go](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Play Store — Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

### 4. Start the Development Server

```bash
npx expo start
```

Then scan the QR code in your terminal with Expo Go.

---

## 🔥 Firebase Configuration

The Firebase config in `src/services/firebase.js` already points to your existing project:

```js
const firebaseConfig = {
  apiKey: "AIzaSyCc4-s-zKa74iTauana6Y5uG3DPsdnjJN4",
  authDomain: "elibraryll.firebaseapp.com",
  projectId: "elibraryll",
  storageBucket: "elibraryll.appspot.com",
  messagingSenderId: "250468753439",
  appId: "1:250468753439:web:3e6e2c49cb25c636b6352a",
};
```

> **Important difference from web:** React Native uses `initializeAuth` with
> `getReactNativePersistence(AsyncStorage)` instead of the browser-based
> `getAuth()`. This is already handled — no `sessionStorage` is used anywhere.

### Firestore Collections Used (unchanged from web)

| Collection      | Purpose                              |
|-----------------|--------------------------------------|
| `admins`        | Admin user profiles                  |
| `students`      | Student profiles                     |
| `doctors`       | Faculty/Doctor profiles              |
| `books`         | Book catalog                         |
| `loans`         | Borrow requests and active loans     |
| `wishlist`      | Per-user wishlisted books            |
| `book_requests` | Faculty book submission requests     |

---

## 🧭 Navigation Architecture

```
AppNavigator
├── AuthStack (when not logged in)
│   ├── LoginScreen
│   ├── RegisterScreen
│   └── ForgotPasswordScreen
│
└── RootStack (when logged in)
    ├── UserTabs (role: 'user' or 'doctor')
    │   ├── Home
    │   ├── Catalog
    │   ├── MyBooks
    │   ├── Submit (Faculty only — shows lock screen for students)
    │   └── Profile
    │
    ├── AdminTabs (role: 'admin')
    │   ├── Dashboard (Home)
    │   ├── Books (CRUD)
    │   ├── Loans (Borrowing Log)
    │   ├── Users
    │   └── Requests (Faculty)
    │
    └── BookDetail (modal, accessible from Home + Catalog)
```

---

## 🔐 Authentication Flow

Mirrors the web app exactly:

1. User logs in → Firebase Auth
2. Check `admins/{uid}` → role = `'admin'`
3. Check `students/{uid}` → role = `'user'`, check for suspension
4. Check `doctors/{uid}` → role = `'doctor'`
5. Role stored in **React Context** (not sessionStorage — that's web-only)
6. Navigation switches automatically based on auth state via `onAuthStateChanged`

---

## 🎨 Design System

All design tokens live in `src/utils/theme.js`:

- **Primary**: Deep brown `#6B3A2A` (matches web)
- **Accent**: Warm amber `#D97706`
- **Background**: Warm off-white `#FDF8F3`
- **Status colors**: Active (blue), Pending (amber), Overdue (red), Returned (green)

---

## 📦 Key Dependencies Explained

| Package | Purpose |
|---------|---------|
| `expo` | Build tooling + native APIs |
| `firebase` v10 | Same SDK as web — Auth, Firestore, Storage |
| `@react-native-async-storage/async-storage` | Replaces localStorage for auth persistence |
| `@react-navigation/native` | Navigation container |
| `@react-navigation/native-stack` | Stack navigator (push/pop) |
| `@react-navigation/bottom-tabs` | Bottom tab bar |
| `react-native-screens` | Native screen optimization |
| `react-native-safe-area-context` | Handle notches and home indicators |
| `react-native-gesture-handler` | Required by React Navigation |
| `expo-linear-gradient` | Gradient headers |
| `@expo/vector-icons` | Ionicons icon set |

---

## 🚀 Build for Production

### Android APK

```bash
npx expo build:android
# or with EAS (recommended):
npm install -g eas-cli
eas build --platform android
```

### iOS IPA

```bash
eas build --platform ios
```

> You need an Apple Developer account for iOS builds.

---

## ⚠️ Assumptions Made

1. **No backend changes**: The Firestore structure, collection names, and field names are preserved exactly as they are in the web app.

2. **Auth persistence**: React Native cannot use `sessionStorage`. Auth state is persisted via `AsyncStorage`, which means users stay logged in across app restarts (better UX than the web app).

3. **Date picker**: The borrow date modal uses `@react-native-community/datetimepicker`. You may need to install it separately: `npx expo install @react-native-community/datetimepicker`.

4. **Image upload**: The admin book cover field accepts a URL string (same as web). For native camera/gallery upload, you would add `expo-image-picker` as a follow-up.

5. **Role detection**: Done via Firestore document lookup in `AuthContext`, exactly mirroring the web login flow.

6. **Admin dashboard**: The home screen shows quick-action cards for admin (replicating the AdminDashboard.jsx), since a full analytics dashboard with charts would require additional charting libraries.

---

## 🔧 Optional Enhancements (Next Steps)

- [ ] Add `expo-image-picker` for book cover upload from device
- [ ] Add `expo-notifications` for overdue loan reminders  
- [ ] Add `react-native-charts-wrapper` for admin dashboard analytics
- [ ] Add offline support via Firestore `enableNetwork`/`disableNetwork`
- [ ] Add `expo-barcode-scanner` for ISBN scanning when adding books
