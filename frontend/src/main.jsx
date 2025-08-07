// src/main.jsx (Updated)

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Routing and Context
import { BrowserRouter } from 'react-router-dom'
import { RoleProvider } from './components/RoleContext'

// Import Clerk
import { ClerkProvider } from '@clerk/clerk-react'

// Import your publishable key from the .env file
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key from .env.local")
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Wrap your entire application in ClerkProvider.
        The afterSignInUrl and afterSignUpUrl props handle the redirect
        to your /login page after successful authentication.
      */}
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY}
        afterSignInUrl="/login"
        afterSignUpUrl="/login"
      >
        <RoleProvider>
          <App />
        </RoleProvider>
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>
)