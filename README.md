# AI Mystery Room

AI Mystery Room turns a short scenario into a fictional detective case. Players review chats, generated photographs, and simulated CCTV, take notes, request hints, and submit one final accusation.

## Requirements

- Node.js 20 or newer
- MongoDB running locally or a MongoDB connection string
- A Gemini API key with access to the configured text and image models

## Setup

1. Install packages from the repository root with `npm install`.
2. Configure `server/.env` with `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `GEMINI_API_KEY`, `GEMINI_TEXT_MODEL`, `GEMINI_TEXT_FALLBACK_MODEL`, `GEMINI_IMAGE_MODEL`, `MAX_ACTIVE_CASES_PER_USER`, `STORAGE_DRIVER`, and `LOCAL_UPLOAD_DIR`. For S3 storage, also set `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.
3. Configure `client/.env` with `VITE_API_URL=http://localhost:5000/api`.
4. Start both apps with `npm run dev`.

The API is at `http://localhost:5000`; the Vite app is at `http://localhost:5173`. Generated media is saved under `server/uploads` with the local storage driver. Set `STORAGE_DRIVER=s3` and fill the AWS settings to use S3.

Gemini image generation runs for suspect portraits, photos, and CCTV frames. If an image request fails after retries, the app uses a caption card so the case remains playable. AI requests can incur usage charges.

## Checks

- `npm test` runs the server and client tests.
- `npm run lint` runs ESLint on both apps.
- `npm --prefix client run build` creates a production client build.

## Project map

- `server/src/models`: MongoDB user, case, and attempt schemas
- `server/src/services`: case generation, moderation, scoring, and file storage
- `server/src/routes`: authentication and case/gameplay APIs
- `client/src/pages`: landing, authentication, dashboard, investigation, and result screens
- `spec.md`: product and technical source of truth
