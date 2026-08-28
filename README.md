# MirrorSync 🪞

> **Persona-Adaptive Cognitive Journal & Executive Reflection Intelligence Engine**  
### 6. 🎧 Voice Audio Reader & Teleprompter ([JournalVoicePlayer.tsx](file:///c:/Users/User/Desktop/MirrorSyncJournal/src/components/JournalVoicePlayer.tsx))
In-browser speech synthesizer with natural voice detection, adjustable playback speed (0.9x to 1.5x), word-by-word teleprompter highlighting, and live audio visualizers.

### 7. 🛡️ 5-Zone Threat Model & Security Inspector ([ThreatModelModal.tsx](file:///c:/Users/User/Desktop/MirrorSyncJournal/src/components/ThreatModelModal.tsx))
Built-in security inspector verifying OWASP LLM Top 10 defenses, prompt boundary fencing, and Firestore database path isolation.

---

## ⚡ Automated Model Fallback Ladder

To ensure MirrorSync never goes down during high-traffic spikes or quota limits, API calls run through an automated fallback hierarchy:

```
[ Primary: gemini-3.7-flash ]
           │ (On 429 Quota / 503 Busy / Timeout)
           ▼
[ Tier 2: gemini-3.5-flash ]
           │ (On Rate Limit)
           ▼
[ Tier 3: gemini-3.5-flash-lite ]
           │ (On Rate Limit)
           ▼
[ Tier 4: gemini-2.5-flash-lite ]
           │ (Emergency Continuity)
           ▼
[ Graceful Deterministic Local Semantic Engine ]
```

---

## 🔒 Database Isolation & Security Rules

All user data in Firestore is partitioned under /users/{userId}. Multi-tenant cross-talk is prevented at the database kernel level through the following security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Health check and connection ping
    match /test/{docId} {
      allow read, write: if true;
    }

    // Authenticated user profile and isolated data subcollections
    match /users/{userId} {
      allow read, write: if isOwner(userId);

      match /entries/{entryId} {
        allow read, write: if isOwner(userId);
      }

      match /{document=**} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}
```

---

## 🚀 Continuous Deployment & Google Cloud Run Setup

### 1. Enable Required Google Cloud APIs

```bash
# Set your project ID
export PROJECT_ID=genaiacademy3
export REGION=us-central1
export SERVICE_NAME=mirrorsync

gcloud config set project $PROJECT_ID

# Enable Cloud Run, Secret Manager, Cloud Build, Artifact Registry, and Firestore
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com
```

### 2. Provision GEMINI_API_KEY in Secret Manager

```bash
# Create secret in Secret Manager
echo -n "YOUR_GEMINI_API_KEY_HERE" | gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --replication-policy=automatic

# Grant Cloud Run default compute service account access to Secret Manager
export PROJECT_NUMBER=217104786977
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member=serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

### 3. Continuous Deployment (CD) via Cloud Build Triggers

1. Connect your GitHub repository (`MirrorSyncJournal`) under **Cloud Build** ➔ **Repositories (1st gen)**.
2. Create a Cloud Build Trigger:
   - **Event**: Push to a branch (`^main$`)
   - **Configuration**: Inline Cloud Build configuration:

```yaml
steps:
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'mirrorsync'
      - '--source=.'
      - '--project=genaiacademy3'
      - '--region=us-central1'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest'
      - '--set-env-vars=NODE_ENV=production'
      - '--update-labels=dev-tutorial=cloud-run-ai-challenge'

options:
  logging: CLOUD_LOGGING_ONLY
```

---

## 📂 Project Structure

`
├── Dockerfile                # Production container specification for Cloud Run
├── firestore.rules           # Firestore security and isolation rules
├── metadata.json             # Applet capabilities and permissions
├── package.json              # App scripts and dependencies
├── server.ts                 # Full-stack Express backend with Gemini model ladder
├── src/
│   ├── components/           # UI Components (Header, Maps, Voice, Email, DynamicCards)
│   ├── firebase.ts           # Firebase Auth & Firestore client SDK
│   ├── services/             # API client services & endpoints
│   ├── utils/                # Date formatting, semantic clustering utilities
│   ├── types.ts              # Global TypeScript interfaces and domain schemas
│   ├── App.tsx               # Primary application container
│   ├── main.tsx              # React DOM entrypoint
│   └── index.css             # Tailwind CSS entrypoint
`

---

## 📄 License & Compliance

Built for the **Google Cloud Gen AI Academy APAC Edition / Cloud Run AI Challenge**. Open source under the Apache 2.0 License.
