# RiverGuard AI

A responsive informational website for RiverGuard AI, a smart river-monitoring and floating-waste-collection project. Includes an AI assistant powered by Google's Gemini API.

## Run locally

1. Install Node.js 20 or newer.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and add a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey). Keep the key private; do not commit `.env`.
4. Start the server:
   ```bash
   npm start
   ```
5. Visit `http://localhost:3000`.

## Configuration

- `PORT` – server port (Cloud Run supplies this automatically).
- `GEMINI_API_KEY` – Google Gemini API key (required for AI chat).
- `GEMINI_MODEL` – Gemini model ID; defaults to `gemini-2.5-flash`.

The chat API is served from `POST /api/chat`; the key remains on the server and is never sent to the browser. `/api/health` provides a basic health check. The site does not fabricate live sensor measurements.

## Publish on Google Cloud Run

You need a Google Cloud account with billing enabled, a Google Cloud project, and the Google Cloud CLI installed and authenticated. In the repository directory:

1. Choose your project and enable the required services:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com
   ```
2. Create a Secret Manager secret for the Gemini key (paste the key when prompted):
   ```bash
   gcloud secrets create gemini-api-key --replication-policy=automatic
   printf '%s' 'YOUR_GEMINI_API_KEY' | gcloud secrets versions add gemini-api-key --data-file=-
   ```
3. Allow the Cloud Run service identity to read that secret. Find the project number with `gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)'`, then run:
   ```bash
   gcloud secrets add-iam-policy-binding gemini-api-key \
     --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```
4. Deploy the site:
   ```bash
   gcloud run deploy riverguard-ai \
     --source . \
     --region YOUR_REGION \
     --allow-unauthenticated \
     --set-secrets=GEMINI_API_KEY=gemini-api-key:latest \
     --set-env-vars=GEMINI_MODEL=gemini-2.5-flash
   ```

Replace `YOUR_PROJECT_ID`, `PROJECT_NUMBER`, and `YOUR_REGION` with your own values. Cloud Run prints the public HTTPS URL after a successful deployment. The API key is stored in Secret Manager rather than in the source code. Verify the currently supported Gemini model in Google AI Studio if the default model is unavailable to your account.

## Project structure

- `server.js` – Express server and Gemini API route
- `public/index.html` – website structure
- `public/styles.css` – responsive styling
- `public/script.js` – website interactions and chat interface
