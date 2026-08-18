/* ==========================================================
   AyuVerse — Practice & Points data model
   ==========================================================
   This file is the single source of truth for collection
   names, field names, and constants used by the practice
   question bank, the points engine, and the dashboard's
   Earn Points / Revise sections (Parts 5-8).

   FIRESTORE SCHEMA
   -----------------------------------------------------------
   questions/{questionId}                (admin-only writes)
     subject       "physics" | "chemistry" | "maths"
     chapter       string   e.g. "Kinematics"
     topic         string   optional subtopic
     difficulty    "easy" | "medium" | "hard"
     type          "mcq" | "numerical"
     questionText  string
     options       array<string>   (mcq only, length 4)
     correctOption number          (mcq only, 0-3 index)
     correctValue  number|string   (numerical only)
     explanation   string   optional, shown after answering
     points        number   awarded on first correct answer
     active        boolean  false = hidden from practice
     createdAt     timestamp

   users/{uid}/attempts/{questionId}     (owner-only)
     questionId       string  (redundant, for convenience)
     subject          string  (denormalized, for filtering)
     chapter          string  (denormalized, for filtering)
     status           "correct" | "wrong" | "skipped"
     selectedOption   number|string   what they answered last
     attemptsCount    number
     correctCount     number
     pointsEarned     number  cumulative points from this question
     firstAttemptAt   timestamp
     lastAttemptAt    timestamp

   users/{uid}                            (owner-only, existing doc)
     ...existing profile fields (name, classLevel, etc.)...
     totalPoints          number
     questionsAttempted   number  (unique questions attempted)
     questionsCorrect     number
     questionsWrong       number
     questionsSkipped     number
     lastPracticedAt      timestamp
   ========================================================== */

window.AyuPractice = {
  COLLECTIONS: {
    questions: "questions",
    attempts: (uid) => `users/${uid}/attempts`,
  },
  SUBJECTS: ["physics", "chemistry", "maths"],
  DIFFICULTIES: ["easy", "medium", "hard"],
  STATUS: {
    CORRECT: "correct",
    WRONG: "wrong",
    SKIPPED: "skipped",
  },
  DEFAULT_POINTS: 10,
  // Must match the UID in firestore.rules — used client-side only
  // to decide whether to show the "Add question" admin form. The
  // rules are what actually enforce this; this is just UI gating.
  ADMIN_UID: "XVOuUxVyNvMcqaYyDyYChPPiQLx1",
};
