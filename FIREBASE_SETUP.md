# Firebase Setup Instructions

## 1. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Create a project"
3. Enter project name (e.g., "patent-management")
4. Enable Google Analytics (optional)
5. Create project

## 2. Enable Firestore Database
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select location (closest to your users)

## 3. Enable Storage
1. Go to "Storage" in Firebase Console
2. Click "Get started"
3. Choose "Start in test mode"
4. Select location

## 4. Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>)
4. Register app with name "patent-management-react"
5. Copy the firebaseConfig object

## 5. Update Configuration
Replace the config in `src/firebase/config.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.firebasestorage.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id"
};
```

## 6. Security Rules (Optional - for production)

### Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Change this for production
    }
  }
}
```

### Storage Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true; // Change this for production
    }
  }
}
```

## 7. Build and Deploy
```bash
npm run build
firebase deploy
```

## Features Enabled:
✅ Patent data stored in Firestore
✅ Signature images stored in Firebase Storage
✅ Real-time search functionality
✅ Responsive design
✅ Author details with image upload