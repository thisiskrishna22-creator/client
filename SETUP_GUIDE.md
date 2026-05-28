# Taskify - Firebase Task Manager Setup Guide

## ✅ What's Been Created

Your complete Firebase-based Task Manager app is ready! Here's what was built:

### Core Files
- **firebase.js** - Firebase initialization with Auth and Firestore
- **App.js** - Main component with auth state management and routing
- **Login.js** - Email/Password login form
- **Signup.js** - Account creation form with password confirmation
- **TaskPage.js** - Task management interface with real-time Firestore updates
- **Auth.css** - Styling for login/signup pages
- **TaskPage.css** - Styling for task manager interface

### Features Implemented
✅ Email/Password authentication (no OTP/phone)  
✅ User account signup with validation  
✅ Real-time task management with Firestore listeners  
✅ Add/complete/delete tasks  
✅ Per-user task isolation (via userId)  
✅ Automatic session restoration on page reload  
✅ Clean UI with gradient design  
✅ Error handling throughout  

---

## 🚀 Getting Started

### Step 1: Get Firebase Credentials
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable **Authentication** → **Email/Password** provider
4. Enable **Firestore Database** (Start in test mode for development)
5. Copy your Firebase config from Project Settings

Your config will look like:
```
apiKey: "AIza..."
authDomain: "your-project.firebaseapp.com"
projectId: "your-project-id"
storageBucket: "your-project.appspot.com"
messagingSenderId: "123456789"
appId: "1:123456789:web:abc123def456"
```

### Step 2: Update .env
Edit `client/.env` and replace the placeholder values:
```
REACT_APP_FIREBASE_API_KEY=YOUR_API_KEY_HERE
REACT_APP_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN_HERE
REACT_APP_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID_HERE
REACT_APP_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET_HERE
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID_HERE
REACT_APP_FIREBASE_APP_ID=YOUR_APP_ID_HERE
```

### Step 3: Install Dependencies
```bash
cd client
npm install
```

### Step 4: Setup Firestore Rules (Test Mode)
For development, Firestore is in test mode. For production, replace with:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{document=**} {
      allow read, write: if request.auth.uid != null && 
                           request.resource.data.userId == request.auth.uid;
    }
  }
}
```

### Step 5: Run the App
```bash
npm start
```
App will open at `http://localhost:3000`

---

## 📝 How It Works

### Authentication Flow
1. **Signup** → Creates Firebase account with email/password
2. **Login** → Signs in existing users
3. **Session** → Automatically restored on page reload
4. **Logout** → Signs out and returns to login

### Task Management
- **Add Task** → Stored in Firestore with userId, title, completed status
- **Real-time Updates** → Firestore listener automatically refreshes task list
- **Complete Task** → Checkbox toggles completed status
- **Delete Task** → Removes task from Firestore

### Database Structure
```
tasks/
├── {docId}
│   ├── userId: "user123"
│   ├── title: "Buy groceries"
│   ├── completed: false
│   └── createdAt: timestamp
```

---

## 🐛 Troubleshooting

**"Could not find firebaseConfig"**
- Make sure .env file has all 6 Firebase variables
- Restart dev server after updating .env

**Tasks not appearing**
- Check Firestore Database → tasks collection exists
- Verify Firestore rules allow reads/writes for authenticated users
- Open browser console for error messages

**Can't sign up with "Password too short"**
- Firebase requires minimum 6 characters
- App validates this on signup form

**Authentication not persisting**
- Clear browser cookies and try again
- Check localStorage is enabled in browser

---

## 📚 File Structure
```
client/
├── src/
│   ├── firebase.js         (Firebase config)
│   ├── App.js              (Main component)
│   ├── Login.js            (Login form)
│   ├── Signup.js           (Signup form)
│   ├── TaskPage.js         (Task manager)
│   ├── Auth.css            (Auth styles)
│   ├── TaskPage.css        (Task styles)
│   ├── App.css             (App styles)
│   └── index.js            (Entry point)
├── .env                    (Firebase config)
├── package.json            (Dependencies)
└── public/
    └── index.html          (HTML entry)
```

---

## 🎉 Next Steps
1. Get Firebase credentials ✓
2. Update .env with your config
3. Run `npm install` and `npm start`
4. Create account and start managing tasks!

**Questions?** Check your Firebase Console for Firestore database and authentication settings.
