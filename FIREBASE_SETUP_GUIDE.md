# Firebase Setup Guide for CollabCanvas

This guide will walk you through configuring Firebase Authentication and Firestore for the CollabCanvas application.

## Prerequisites

- A Google account
- Access to the [Firebase Console](https://console.firebase.google.com/)

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** or **"Add project"**
3. Enter your project name (e.g., "collabcanvas")
4. Choose whether to enable Google Analytics (recommended: Yes)
5. Select or create a Google Analytics account
6. Click **"Create project"**

## Step 2: Enable Authentication

### 2.1 Navigate to Authentication
1. In your Firebase project dashboard, click **"Authentication"** in the left sidebar
2. Click **"Get started"** if this is your first time

### 2.2 Enable Sign-in Methods
1. Click on the **"Sign-in method"** tab
2. Enable the following providers:

#### Google Authentication
1. Click on **"Google"**
2. Toggle **"Enable"**
3. Set a **Project support email** (required)
4. Click **"Save"**

#### Email/Password Authentication
1. Click on **"Email/Password"**
2. Toggle **"Enable"** for the first option (Email/Password)
3. Optionally enable **"Email link (passwordless sign-in)"** if desired
4. Click **"Save"**

## Step 3: Configure Firestore Database

### 3.1 Create Firestore Database
1. In the Firebase Console, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** for development (you can secure it later)
4. Select a location for your database (choose the closest to your users)
5. Click **"Done"**

### 3.2 Set Up Security Rules (Optional but Recommended)
1. In Firestore Database, click on the **"Rules"** tab
2. Replace the default rules with these more secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own presence data
    match /presence/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write shapes
    match /shapes/{shapeId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read/write cursors
    match /cursors/{cursorId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"**

## Step 4: Get Firebase Configuration

### 4.1 Get Web App Configuration
1. In the Firebase Console, click the gear icon (⚙️) next to **"Project Overview"**
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **"</>"** icon to add a web app
5. Enter an app nickname (e.g., "CollabCanvas Web")
6. Optionally check **"Also set up Firebase Hosting"** if you plan to use it
7. Click **"Register app"**
8. Copy the Firebase configuration object

### 4.2 Configure Environment Variables
1. In your project root, create a `.env` file (if it doesn't exist)
2. Add the following environment variables with your Firebase config values:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Important:** Replace the placeholder values with your actual Firebase configuration values.

## Step 5: Set Up Firestore Indexes

### 5.1 Create Required Indexes
1. In Firestore Database, click on the **"Indexes"** tab
2. Click **"Create index"**
3. Add the following indexes:

#### For shapes collection:
- **Collection ID:** `shapes`
- **Fields:**
  - `createdBy` (Ascending)
  - `createdAt` (Ascending)

#### For cursors collection:
- **Collection ID:** `cursors`
- **Fields:**
  - `userId` (Ascending)
  - `lastSeen` (Ascending)

4. Click **"Create"** for each index

## Step 6: Test Your Configuration

### 6.1 Start the Development Server
```bash
npm run dev
```

### 6.2 Test Authentication
1. Open your application in the browser
2. Try signing in with Google
3. Try creating an account with email/password
4. Try signing in with email/password

### 6.3 Test Firestore Integration
1. Create some shapes on the canvas
2. Check the Firestore Console to see if data is being written
3. Test real-time collaboration by opening multiple browser tabs

## Step 7: Production Considerations

### 7.1 Update Security Rules
Before going to production, update your Firestore security rules to be more restrictive:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow users to read/write their own presence data
    match /presence/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write shapes they created
    match /shapes/{shapeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource == null || resource.data.createdBy == request.auth.uid);
    }
    
    // Allow authenticated users to read/write their own cursors
    match /cursors/{cursorId} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid);
    }
  }
}
```

### 7.2 Configure Domain Restrictions
1. In Authentication > Settings > Authorized domains
2. Add your production domain
3. Remove `localhost` for production

### 7.3 Set Up Monitoring
1. Enable Firebase Performance Monitoring
2. Set up Firebase Crashlytics
3. Configure Firebase Analytics events

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/configuration-not-found)"**
   - Check that your environment variables are correctly set
   - Ensure the `.env` file is in the project root
   - Restart your development server after adding environment variables

2. **"Firebase: Error (auth/unauthorized-domain)"**
   - Add your domain to the authorized domains in Firebase Console
   - For development, `localhost` should be automatically added

3. **"Firebase: Error (auth/invalid-api-key)"**
   - Verify your API key in the environment variables
   - Check that you're using the correct project configuration

4. **Firestore permission denied errors**
   - Check your Firestore security rules
   - Ensure the user is authenticated
   - Verify the user has the correct permissions

### Getting Help:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Support](https://firebase.google.com/support)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)

## Next Steps

Once Firebase is configured:

1. **Test all authentication methods** (Google and Email)
2. **Verify real-time collaboration** works between multiple users
3. **Set up proper error handling** for production
4. **Configure backup strategies** for your Firestore data
5. **Set up monitoring and alerts** for your Firebase usage

Your CollabCanvas application should now be fully integrated with Firebase Authentication and Firestore! 🎉
