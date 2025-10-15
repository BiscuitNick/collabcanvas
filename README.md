# CollabCanvas MVP

> **Real-time collaborative canvas application built with React, Konva.js, and Firebase**

A multiplayer drawing canvas that enables real-time collaboration with persistent shapes, live cursors, and user presence awareness.

## 🚀 Live Demo

**Deployed on Vercel:** [https://collabcanvas-neon.vercel.app/canvas](https://collabcanvas-neon.vercel.app/canvas)

Try it out! Open the link in multiple browser windows to see real-time collaboration in action.

## ✨ Features

- **🎨 Interactive Canvas** - Smooth pan, zoom, and shape manipulation using Konva.js
- **👥 Real-time Collaboration** - See other users' cursors and changes instantly
- **🔥 Firebase Integration** - Authentication, Firestore persistence, and real-time sync
- **📱 Modern UI** - Beautiful, responsive design with Tailwind CSS
- **⚡ Fast Development** - Vite build tool with Hot Module Replacement
- **🧪 Type Safety** - Full TypeScript support throughout
- **🔒 User Authentication** - Google and email/password login
- **💾 Persistent State** - All changes saved and synced across sessions
- **👀 Live Cursors** - See where other users are working in real-time
- **👥 User Presence** - Know who's online and collaborating

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Canvas**: Konva.js + react-konva
- **Styling**: Tailwind CSS v4
- **Backend**: Firebase (Auth + Firestore + Realtime Database)
- **State**: Zustand
- **Routing**: React Router v7
- **Deployment**: Vercel
- **Testing**: Vitest + Testing Library

## 🏗️ Project Structure

```
collabcanvas/
├── src/
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── canvas/         # Canvas and shape components
│   │   ├── multiplayer/    # Cursor and presence components
│   │   └── layout/         # Layout components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and Firebase config
│   ├── pages/              # Page components
│   ├── store/              # Zustand state management
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
└── firebase/               # Firebase configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase account

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd collabcanvas
npm install
```

### 2. Firebase Setup

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create new project named "collabcanvas"
   - Disable Google Analytics (optional)

2. **Enable Services:**
   - **Authentication** → Email/Password
   - **Firestore Database** → Start in test mode
   - **Realtime Database** → Start in test mode

3. **Add Web App:**
   - Project Overview → Add app → Web
   - Register app and copy config

### 3. Environment Variables

Create `.env.local` in project root:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` and verify:
- ✅ **Authentication** - Login/register works
- ✅ **Canvas** - Pan and zoom work smoothly
- ✅ **Shapes** - Can create and manipulate rectangles
- ✅ **Real-time sync** - Open multiple windows to test collaboration

## 🎮 How to Use

1. **Sign In**: Use Google OAuth or create an account with email/password
2. **Navigate**: Pan by dragging the canvas background, zoom with mouse wheel
3. **Create Shapes**: Click "Add Rectangle" to create rectangles at the viewport center
4. **Edit Shapes**: Click to select, drag to move, use the properties panel to edit
5. **Collaborate**: Open multiple browser windows to see real-time collaboration
6. **View Others**: See other users' cursors and presence in the left sidebar

## 🎯 MVP Features (Completed)

### ✅ Authentication System
- [x] Google OAuth login
- [x] Email/password authentication
- [x] User session management
- [x] Protected routes

### ✅ Interactive Canvas
- [x] Konva.js canvas with 64,000px workspace
- [x] Smooth pan and zoom functionality
- [x] 60 FPS performance optimization
- [x] Keyboard shortcuts and controls

### ✅ Shape Management
- [x] Rectangle creation and manipulation
- [x] Real-time shape synchronization
- [x] Shape selection and properties editing
- [x] Delete and reset functionality

### ✅ Real-time Collaboration
- [x] Live cursor tracking across users
- [x] User presence awareness
- [x] Real-time shape synchronization
- [x] Conflict resolution (last write wins)

### ✅ Data Persistence
- [x] Firestore integration for shape storage
- [x] Firebase Realtime Database for cursors
- [x] Persistent state across sessions
- [x] Automatic data synchronization

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## 🚢 Deployment

**Automatic deployment via Vercel:**
- Push to main branch triggers automatic deployment
- Environment variables configured in Vercel dashboard
- Custom domain available through Vercel

**Manual deployment:**
```bash
npm run build
# Deploy dist/ folder to your hosting platform
```

## 🔧 Firebase Rules

The app currently uses Firebase test mode rules for rapid development. For production, implement proper security rules:

```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shapes/{shapeId} {
      allow read, write: if request.auth != null;
    }
  }
}

// Realtime Database Rules
{
  "rules": {
    "cursors": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "presence": {
      ".read": "auth != null", 
      ".write": "auth != null"
    }
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Troubleshooting

### Common Issues

**Canvas not loading:**
- Check Firebase configuration in `.env.local`
- Verify all environment variables are set correctly
- Check browser console for errors

**Real-time sync not working:**
- Ensure you're logged in with a valid account
- Check Firestore security rules are deployed
- Verify Firebase project has Firestore and Realtime Database enabled

**Performance issues:**
- Try reducing the number of shapes on canvas
- Check browser dev tools for memory leaks
- Ensure you're using a modern browser (Chrome, Firefox, Safari)

### Getting Help

- Check the [Firebase Setup Guide](FIREBASE_SETUP_GUIDE.md) for detailed configuration
- Review browser console for error messages
- Ensure all dependencies are installed with `npm install`

## 🎯 MVP Goals

- **24-hour development sprint** from setup to deployment ✅
- **Real-time multiplayer** canvas with persistent state ✅
- **Production-ready** architecture scalable to 100+ concurrent users ✅
- **Modern development** practices with TypeScript and testing ✅

---

**Built with ❤️ for real-time collaboration**

**Live Demo:** [https://collabcanvas-neon.vercel.app/canvas](https://collabcanvas-neon.vercel.app/canvas)
