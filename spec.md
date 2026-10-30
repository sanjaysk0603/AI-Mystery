

AI Mystery Room — Product & Technical Spec (v1.0).docx
Document
give this as plain text format to paste it in spec.md

I converted your AI Mystery Room — Product & Technical Spec (v1.0) into Markdown format, ready to use as spec.md.


How to use it
Download the file.

Open your project in VS Code.

Copy SPEC.md into your project's root folder.

If you specifically want the filename spec.md, rename it from SPEC.md to spec.md.

The file preserves the specification's sections, requirements, technical stack, API endpoints, data models, security rules, acceptance criteria, and development milestones.

Note: The content is converted into Markdown, suitable for Codex and other AI coding assistants.



Library
/
SPEC.md



AI Mystery Room — Product & Technical Spec (v1.0)
Single source of truth for Codex. Build exactly what is written here. If something is ambiguous, choose the simplest option that satisfies the acceptance criteria and note the decision in DECISIONS.md. Do not add features outside this spec.

0. How Codex Must Use This Spec
Treat this document as authoritative. If code and spec disagree, the spec wins.

Build in the milestone order in Section 15. Finish and verify each milestone before the next.

Every feature has an ID (e.g. FR-12). Reference IDs in commit messages and tests.

Never expose secrets, the culprit, or the solution to the browser before a verdict is submitted (see Section 9).

All Gemini model names, limits and keys come from environment variables, never hard-coded.

Write tests for every acceptance criterion in Section 14.

1. Product Overview
AI Mystery Room is a web app where a user types a short scenario or story (e.g. "A necklace disappeared from a birthday party at a college hostel"). The backend uses Gemini to invent a complete fictional investigation around it: a cast of suspects, one hidden culprit, a timeline, and a set of evidence (WhatsApp chats, photos, CCTV-style footage). The user studies the evidence in an "investigation room" UI, then accuses one suspect. The server reveals whether they were right, along with a full explanation of how the case was solved.

Core loop: Enter scenario → AI builds case → Study evidence → Accuse a suspect → Reveal result and explanation.

Target users: Casual players who enjoy detective games and puzzles. Single-player only.

Tone: Fictional, clever, slightly noir. All people, places and events in generated cases are fictional.

2. Goals and Non-Goals
Goals (v1)

Generate a fair, solvable mystery from any short user scenario.

Present evidence in realistic, believable formats.

Server-side verdict so the answer cannot be found by inspecting the network.

Account system with a history of cases and scores.

Non-goals (v1)

Multiplayer or real-time collaboration.

Real video generation (see Section 7.4: CCTV is simulated).

Payments, subscriptions, or a mobile app.

Using real people's names, photos or real incidents.

User-uploaded evidence.

3. Tech Stack (fixed)
Layer	Choice
Database	MongoDB (Mongoose ODM)
Backend	Node.js 20+, Express 4, ES modules
Frontend	React 18 + Vite, React Router, Tailwind CSS
State/data fetching	TanStack Query (React Query)
Auth	JWT (access token in httpOnly cookie), bcrypt for passwords
Validation	Zod (shared shapes for API input and Gemini JSON output)
AI	Google Gemini via the official @google/genai SDK
File storage	Storage adapter: local disk in dev, AWS S3 in production
Testing	Vitest (frontend), Jest + Supertest (backend)
Lint/format	ESLint + Prettier
4. Repository Structure
ai-mystery-room/
├── SPEC.md # this document
├── DECISIONS.md # log of any judgment calls
├── server/
│ ├── src/
│ │ ├── index.js
│ │ ├── config/env.js # validates env vars with Zod
│ │ ├── models/ # User, Case, Attempt
│ │ ├── routes/ # auth, cases, attempts
│ │ ├── controllers/
│ │ ├── services/
│ │ │ ├── gemini.js # SDK wrapper, retries, JSON mode
│ │ │ ├── caseGenerator.js # pipeline (Section 7)
│ │ │ ├── caseValidator.js # solvability check
│ │ │ ├── moderation.js
│ │ │ └── storage/ # local.js, s3.js, index.js
│ │ ├── middleware/ # auth, rateLimit, error, validate
│ │ └── prompts/ # prompt templates as .js files
│ └── tests/
└── client/
├── src/
│ ├── pages/
│ ├── components/
│ ├── hooks/
│ ├── api/
│ └── styles/
└── tests/

5. User Roles and Auth
Guest: can view the landing page only.

Player (registered): can create cases, play, accuse, view history.

No admin UI in v1.

FR-1 Register with name, email, password (min 8 chars). FR-2 Login/logout. FR-3 JWT in httpOnly, SameSite=Lax cookie, 7-day expiry. FR-4 Passwords hashed with bcrypt (cost 10+). FR-5 Protected routes return 401 when unauthenticated.

6. Functional Requirements
6.1 Case creation
FR-10 Player submits a scenario (20–1000 characters) and optional settings: difficulty (easy | medium | hard, default medium), number of suspects (3–6, default 4), language (en, default).

FR-11 Scenario passes moderation (Section 11) before any generation starts.

FR-12 Server creates a Case with status generating and returns its id immediately (202 Accepted). Generation runs asynchronously.

FR-13 Client polls GET /api/cases/ every 3 seconds and shows progress stages: Building the suspects → Planting clues → Writing the chats → Developing the photos → Reviewing the footage → Ready.

FR-14 If generation fails after retries, status becomes failed with a friendly message and the player can retry.

FR-15 Player may have at most 3 cases generating or unsolved-active at once (configurable).

6.2 Investigation room
FR-20 Shows case title, a short briefing (what happened, when, where, what is missing or what crime occurred), and the list of suspects (name, age, role, short public bio, portrait).

FR-21 Evidence is shown in tabs: Chats, Photos, CCTV, plus a Notebook tab.

FR-22 Chats: WhatsApp-style conversation viewer. Each evidence chat is a one-to-one or group conversation with timestamps, sender names, read ticks, and occasional images/voice-note placeholders. Dark and light green bubble styling inspired by messaging apps, but without copying any trademarked assets or logos.

FR-23 Photos: gallery with caption, claimed timestamp and location tag. Click opens a lightbox.

FR-24 CCTV: player that simulates camera footage as a timed frame sequence (Section 7.4) with a timestamp overlay, camera name, play/pause and scrub controls.

FR-25 Notebook: player-private free text notes, auto-saved to the attempt record.

FR-26 Player can "pin" any evidence item to a Clue Board list for quick reference.

FR-27 Player can request up to 3 hints per case. Each hint is a pre-generated nudge (never names the culprit) stored in the case, revealed one at a time; using hints lowers the final score.

6.3 Accusation
FR-30 Player selects one suspect and must write a short justification (10–500 chars) before submitting.

FR-31 Submitting is final. One accusation per case attempt. The server computes correctness and score.

FR-32 Result screen shows: correct or wrong, the real culprit, motive, method, the full timeline, and a "how to solve it" walkthrough that references the specific evidence items that proved it.

FR-33 Player's justification is stored, and shown next to the official explanation.

6.4 History and scoring
FR-40 Dashboard lists the player's cases: title, difficulty, status (in_progress, solved, failed_accusation), date, score.

FR-41 Score (0–1000): correct ? 1000 : 0, minus 100 per hint used, minus a time penalty of 1 point per minute after the first 10 minutes, floor of 100 if correct. Wrong accusation scores 0.

FR-42 Player can replay a finished case read-only.

FR-43 Player can delete their own cases.

7. AI Generation Pipeline (Gemini)
All Gemini calls go through services/gemini.js, which provides: structured JSON output with a response schema, automatic retry (max 3, exponential backoff), timeout (60 s text / 120 s image), and token/cost logging per call.

7.1 Stage 1 — Case Bible (text)
Input: scenario, difficulty, suspect count. Output (JSON, validated by Zod):

{
"title": "string",
"briefing": "string (150-250 words)",
"setting": { "place": "string", "date": "ISO date", "timeWindow": "HH:mm-HH" },
"suspects": [
{ "id": "s1", "name": "string", "age": 0, "role": "string",
"publicBio": "string", "secret": "string", "alibi": "string",
"alibiIsTrue": true, "portraitPrompt": "string" }
],
"culpritId": "s2",
"motive": "string",
"method": "string",
"timeline": [ { "time": "HH", "event": "string", "truth": true } ],
"keyClues": [ { "id": "k1", "description": "string", "points": "s2", "type": "chat|photo|cctv" } ],
"redHerrings": [ { "id": "r1", "description": "string", "misdirectsTo": "s3" } ],
"hints": [ "string", "string", "string" ]
}

Rules baked into the prompt: exactly one culprit; every non-culprit has a verifiable true alibi or a clear innocent explanation; at least 3 key clues that together (not alone) identify the culprit; at least 2 red herrings; the culprit must not be the most obviously suspicious person on easy; names and places are fictional; scenario theme is respected.

7.2 Stage 2 — Evidence Text
From the Case Bible, generate:

Chats (3–6 conversations): array of messages { sender, text, timestamp, type: 'text'|'image'|'voice_note' , imageRef? }. Must contain the key clues of type chat, plus noise (small talk, irrelevant banter) so clues are not obvious. Timestamps must be consistent with the timeline.

Photo specs (4–8): { id, caption, timestamp, location, imagePrompt, relatedClueId? }.

CCTV specs (2–4 cameras): { id, cameraName, location, frames: [ { offsetSeconds, timestamp, imagePrompt, caption } ] } with 4–8 frames each.

7.3 Stage 3 — Images
Generate portraits, photos and CCTV frames with a Gemini image model (GEMINI_IMAGE_MODEL).

Prompt guidance: photorealistic, ordinary phone-photo or low-quality CCTV look; faces must be incidental or non-identifying, no real-person likeness, no text that should have been a clue unless explicitly intended (AI image text is unreliable, so clues must never depend on legible text inside images).

Image-clue rule: any clue that matters must also be stated in the photo caption or a chat message, so a poor image can never make the case unsolvable.

Generate with concurrency limit of 3. If an image fails after retries, replace with a generated placeholder card showing the caption, and mark imageStatus: 'placeholder'.

Store through the storage adapter; save only URLs/keys in MongoDB.

7.4 CCTV Footage (v1 = simulated)
The "recording" is a sequence of generated frames played back as a timed slideshow with: grain/scanline CSS overlay, timestamp and camera ID overlay, and a progress bar. Real AI video generation is explicitly out of scope for v1; keep the frames[] data model so a videoUrl field can be added later without schema change.

7.5 Stage 4 — Solvability Validation
Send only the player-visible data (briefing, suspects' public info, all evidence) to Gemini with a different prompt: "Who is the culprit and why? Cite evidence ids." Compare with culpritId.

If it matches and cites at least 2 key clues, case passes.

If it fails, regenerate Stage 2 once, then Stage 1 once. After that, mark failed.

7.6 Stage 5 — Solution Walkthrough
Generate the explanation text shown on the result screen, referencing evidence ids so the UI can link to them.

8. Data Models (Mongoose)
User

{ _id, name: String, email: String (unique, lowercase), passwordHash: String,
createdAt, updatedAt }

Case

{ _id, ownerId: ObjectId(User), scenario: String,
settings: { difficulty, suspectCount, language },
status: 'generating' | 'ready' | 'failed',
progress: { stage: String, percent: Number },
failureReason: String?,
public: { // safe to send to client
title, briefing, setting,
suspects: [ { id, name, age, role, publicBio, portraitUrl } ],
chats: [ { id, title, participants: [String], messages: [...] } ],
photos: [ { id, caption, timestamp, location, imageUrl, imageStatus } ],
cctv: [ { id, cameraName, location, frames: [ { offsetSeconds, timestamp, imageUrl, caption } ] } ]
},
secret: { // NEVER sent before verdict
culpritId, motive, method, timeline, keyClues, redHerrings,
hints: [String], walkthrough: String,
suspectSecrets: [ { id, secret, alibi, alibiIsTrue } ]
},
createdAt, updatedAt }

Attempt

{ _id, caseId, playerId, startedAt, notebook: String,
pinnedEvidenceIds: [String], hintsUsed: Number,
accusation: { suspectId, justification, submittedAt }?,
result: { correct: Boolean, score: Number }?,
status: 'in_progress' | 'completed' }

Indexes: Case.ownerId + createdAt, User.email (unique), Attempt.caseId + playerId (unique).

9. Security and Anti-Cheat
SEC-1 Case.secret is excluded by default (select: false) and only returned by the result endpoint after Attempt.status === 'completed'.

SEC-2 Hints are fetched one at a time from POST /api/cases//hint; the server increments hintsUsed.

SEC-3 Case-bible fields such as the culprit must never appear in any public object, image prompt echoed to client, error message, or log sent to client.

SEC-4 Rate limits: auth 10 req/min per IP; case creation 5 per hour per user; general API 100 req/min per IP.

SEC-5 Helmet, CORS limited to CLIENT_ORIGIN, request body size limit 100 KB, express-mongo-sanitize.

SEC-6 Gemini API key lives only on the server.

SEC-7 Users can only read, modify or delete their own cases and attempts (ownership check in every controller).

10. REST API
Base path /api. JSON in/out. Errors use { "error": { "code": "string", "message": "string" } }.

Method	Path	Auth	Purpose
POST	/auth/register	no	Create account
POST	/auth/login	no	Login, sets cookie
POST	/auth/logout	yes	Clear cookie
GET	/auth/me	yes	Current user
POST	/cases	yes	Create case from scenario; returns 202 { id }
GET	/cases	yes	List own cases (summary only)
GET	/cases/	yes	Case status + public data when ready
POST	/cases//retry	yes	Retry a failed generation
DELETE	/cases/	yes	Delete case and its stored files
GET	/cases//attempt	yes	Get or create attempt (notebook, pins, hints used)
PATCH	/cases//attempt	yes	Save notebook and pinned evidence
POST	/cases//hint	yes	Reveal next hint (max 3)
POST	/cases//accuse	yes	Body { suspectId, justification }; returns result and secret data
GET	/cases//result	yes	Result and solution (only after completed)
GET	/health	no	Liveness check
11. Content Safety and Moderation
SAF-1 Before generation, run the scenario through a Gemini moderation prompt returning { allowed: boolean, reason }. Block: sexual content, sexual violence, graphic gore, content involving minors in harm, terrorism or instructions for real-world crimes, hate content, and scenarios naming real, identifiable people (public figures or private individuals).

SAF-2 Mysteries are "cozy to noir" level: crimes like theft, fraud, sabotage, disappearances, cheating. Violence may be implied, never graphic. Never include actionable real-world crime instructions in evidence.

SAF-3 Rejected scenarios show a friendly message suggesting a rewrite, never the raw moderation output.

SAF-4 Also check Gemini's built-in safety response; treat a blocked response as a generation failure with retry using a softened prompt.

SAF-5 Footer disclaimer on all case pages: "This is a work of fiction generated by AI. Any resemblance to real people or events is coincidental."

12. Frontend Specification
Routes

Path	Page	Access
/	Landing: pitch, example case teaser, CTA	public
/login, /register	Auth forms	public
/dashboard	Case history + "New Case"	player
/new	Scenario form	player
/cases//generating	Progress screen (auto-redirects when ready)	player
/cases/	Investigation room	player
/cases//result	Verdict and walkthrough	player
Design direction: dark, moody detective-office aesthetic (deep charcoal and warm amber accents, subtle paper/corkboard textures), monospace for timestamps, a serif display face for titles. Fully responsive (mobile-first; the evidence viewer must work at 360 px width). Include a visible loading skeleton and empty states on every list.

Key components: ScenarioForm, ProgressStepper, SuspectCard, EvidenceTabs, ChatViewer, PhotoGallery, Lightbox, CctvPlayer, Notebook, ClueBoard, AccuseModal, ResultReveal, ScoreBadge.

UX rules: accusing requires a confirm dialog ("This is final"); the result screen reveals the culprit with a short dramatic animation (respect prefers-reduced-motion); all images have alt text from captions; keyboard accessible; WCAG AA contrast.

13. Environment Variables
server/.env
PORT=5000
MONGODB_URI=
JWT_SECRET=
CLIENT_ORIGIN=http://localhost:5173
GEMINI_API_KEY=
GEMINI_TEXT_MODEL=
GEMINI_IMAGE_MODEL=
MAX_ACTIVE_CASES_PER_USER=3
STORAGE_DRIVER=local # local | s3
LOCAL_UPLOAD_DIR=./uploads
AWS_REGION=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

client/.env
VITE_API_URL=http://localhost:5000/api

The server must fail fast at startup with a clear message if a required variable is missing. Provide .env.example files. Never commit real keys.

14. Acceptance Criteria
A new user can register, log in, and see an empty dashboard.

Submitting a valid scenario returns 202 immediately and the progress screen advances through all stages without a page refresh.

A ready case contains: a briefing, 3–6 suspects with portraits, 3–6 chats, 4–8 photos, 2–4 CCTV cameras, 3 hints.

The JSON returned by any pre-verdict endpoint contains no secret fields (automated test scans the response for culpritId, motive, method).

Every case passes the solvability check (Section 7.5) before reaching ready.

Accusing a suspect returns the correct result, and a second accusation on the same attempt returns 409.

Score follows FR-41 exactly (unit tested).

A blocked scenario (e.g. one naming a real celebrity) is rejected with a friendly message and no Case is created.

A user cannot read another user's case (403/404).

If an image fails to generate, the UI still shows the item with a placeholder and the case remains playable.

The app is usable on a 360 px wide screen and passes basic keyboard navigation.

npm test passes on server and client; npm run lint is clean.

15. Milestones (build in this order)
M1 Foundation: repo structure, env validation, Express + Mongo connection, React + Vite + Tailwind shell, ESLint/Prettier, health endpoint.

M2 Auth: User model, register/login/logout/me, protected routes, auth pages.

M3 Case Bible: Gemini wrapper, Stage 1 generation with Zod validation, moderation, Case model, create/list/get endpoints (text only, no images).

M4 Evidence text + viewers: Stage 2, ChatViewer, suspect cards, investigation room with mocked images.

M5 Images: Stage 3, storage adapter (local then S3), PhotoGallery, CctvPlayer, placeholder fallback.

M6 Validation + async flow: Stage 4 solvability check, progress stages, polling UI, retry.

M7 Gameplay: attempt model, notebook, pins, hints, accuse endpoint, scoring, result page with walkthrough.

M8 Polish + hardening: rate limits, security middleware, accessibility pass, empty/error states, tests to meet Section 14, README with run instructions.

16. Quality Bar and Conventions
ES modules, async/await, no callbacks. Small functions, JSDoc on services.

Controllers are thin; business logic lives in services/.

All request bodies validated with Zod in a validate middleware.

Prompts live in server/src/prompts/ as versioned template functions, never inline in controllers.

Log Gemini latency and token usage per stage; never log user passwords, tokens, or the secret object.

Conventional commits (feat:, fix:, test:), one milestone per branch.

17. Open Questions (decide before v1.1)
Real AI video for CCTV (when a suitable video model and budget are available).

Shareable public case links and a leaderboard.

Voice-note audio generation with text-to-speech.

Daily "featured mystery" generated for everyone.

Multi-language cases beyond English.

