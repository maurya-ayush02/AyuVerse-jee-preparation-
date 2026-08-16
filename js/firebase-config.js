/* ==========================================================
   AyuVerse — Firebase project configuration
   ==========================================================
   1. Go to https://console.firebase.google.com → Add project
      (free "Spark" plan — no credit card, no cost).
   2. Inside the project: Build → Authentication → Get started.
      Enable these sign-in providers:
         - Google
         - Email/Password
         - Phone
   3. Build → Firestore Database → Create database → start in
      "production mode" → pick any region close to India. This is
      what makes the username option work (it stores a small
      username → email lookup table; still free). After it's
      created, open the "Rules" tab and paste the contents of
      firestore.rules (included in this project) in place of the
      default rules, then click Publish.
   4. Project settings (gear icon) → General → "Your apps" →
      click the </> (web) icon → register the app (any nickname)
      → Firebase gives you a config object exactly like the shape
      below. Copy your real values into this file.
   5. Project settings → Authentication → Settings → Authorized
      domains → add your GitHub Pages domain, e.g.
         maurya-ayush02.github.io
      (localhost is already allowed automatically for testing.)

   Nothing else in the codebase needs to change — every page reads
   this one file. This file only holds public identifiers (this is
   normal and safe for Firebase — access is enforced by Firebase's
   own security rules, not by hiding this config).
   ========================================================== */

window.AYU_FIREBASE_CONFIG = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID",
};
