# Deploy AI Mystery Room on Render

This deployment uses one Render web service for the React app and Express API, MongoDB Atlas for database storage, and a Render persistent disk for generated images. The client calls `/api` on the same origin, so no separate frontend host is needed.

## Costs and requirements

- Render Starter web service: currently listed at **$7/month**.
- Render disk: **$0.25 per GB per month**; this blueprint provisions 1 GB.
- MongoDB Atlas Free cluster: suitable for a small demo; review its storage and connection limits before production use.
- Gemini API: model usage is billed or quota-limited by Google. Image quota exhaustion produces playable placeholder cards.

Render persistent disks require a paid web service and preserve uploads across deploys. See [Render pricing](https://render.com/pricing) and [persistent disk documentation](https://render.com/docs/disks). Atlas offers a [Free cluster](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/).

## 1. Push the project to GitHub

Create an empty GitHub repository, then run these commands from the project root. Replace the remote URL with your repository URL:

```powershell
git init
git add .
git commit -m "Prepare AI Mystery Room deployment"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
git push -u origin main
```

The local `.env` files are ignored by `.gitignore`. Do not force-add them or put API keys in the repository.

## 2. Create a MongoDB Atlas database

1. Create an Atlas project and a **Free** cluster.
2. Create a database user with a unique, strong password and read/write access to the app database.
3. In **Network Access**, allow connections from the Render service. Prefer a fixed outbound IP and a narrow allowlist entry when your Render setup provides one. For a quick demo, Atlas can allow `0.0.0.0/0`; this exposes the database endpoint to connection attempts from any IP, so use a strong database password and never share the URI.
4. Choose **Connect → Drivers** and copy the `mongodb+srv://...` connection string. Replace its password placeholder, URL-encoding special characters in the password if needed.

Atlas requires both a database user and an IP access-list entry before the app can connect. See [Connect to an Atlas cluster](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/) and [Atlas IP access lists](https://www.mongodb.com/docs/atlas/security/ip-access-list/).

## 3. Create the Render service

1. In Render, choose **New → Blueprint** and connect the GitHub repository.
2. Render reads [`render.yaml`](render.yaml), builds the React client, starts Express, and provisions a 1 GB persistent disk mounted at `/var/data`.
3. When prompted for `MONGODB_URI`, paste the Atlas connection string. For `GEMINI_API_KEY`, enter the server-side key from Google AI Studio. Render generates `JWT_SECRET` automatically.
4. Apply the Blueprint and wait for the first deploy to finish.

The service uses the URL `https://ai-mystery-room.onrender.com`, matching `CLIENT_ORIGIN` in the Blueprint. If Render assigns a different URL, update `CLIENT_ORIGIN` in the service environment to the exact `https://...` origin and redeploy.

## 4. Verify the deployment

1. Open `https://ai-mystery-room.onrender.com/api/health`. It should return `{"ok":true,"database":"connected"}`.
2. Open the site, register a test account, log in, and create a small case.
3. If a case remains at “Creating case”, inspect the Render service logs. Gemini text calls use the configured fallback model. Image API quota errors are logged and use placeholders; they should not prevent a case from becoming playable.

## 5. Optional custom domain

Add the domain in Render, configure the DNS records Render provides, then change `CLIENT_ORIGIN` to the exact `https://your-domain` origin and redeploy. Keep the frontend and API on the same Render service unless you also update the client API URL and CORS configuration.

## Data migration

The deployed Atlas database starts empty. Local users and cases are not copied automatically; migrate the local MongoDB database separately if you need to keep them.
