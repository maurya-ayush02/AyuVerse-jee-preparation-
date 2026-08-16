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
    apiKey: "AIzaSyBRojUfpYvOa4XjIRQXfwnHX-cM9jwsj_c",
  authDomain: "ayuverse-e50af.firebaseapp.com",
  projectId: "ayuverse-e50af",
  storageBucket: "ayuverse-e50af.firebasestorage.app",
  messagingSenderId: "969478078786",
  appId: "1:969478078786:web:c3e01f760240c0ff6208db",
  measurementId: "G-8SB0Y24KDY"
};
