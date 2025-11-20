# How to Build the APK for Pixel 9 Pro XL

Since this is a React Web Application, we use **Capacitor** to wrap it into a native Android APK.

## Prerequisites
1. **Node.js** installed on your computer.
2. **Android Studio** installed (required to compile the APK).

## Steps

### 1. Install Dependencies
Open your terminal in the project folder and run:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### 2. Build the Web Project
This compiles your React code into static HTML/JS/CSS:
```bash
npm run build
```

### 3. Initialize Android Project
```bash
npx cap add android
```

### 4. Sync Assets
This copies your build folder into the Android project:
```bash
npx cap sync
```

### 5. Open in Android Studio
```bash
npx cap open android
```

### 6. Build the APK
1. In Android Studio, go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
2. Once finished, click **locate** to find your `app-debug.apk`.
3. Transfer this file to your Pixel 9 Pro XL and install it!

## Alternative: "No-Code" Install (PWA)
You don't actually *need* an APK. This app is a **Progressive Web App (PWA)**.
1. Host the app (e.g., on Vercel).
2. Open the URL in Chrome on your Pixel.
3. Tap **Menu (⋮)** -> **Install App**.
This provides the exact same full-screen experience without needing to compile anything.
