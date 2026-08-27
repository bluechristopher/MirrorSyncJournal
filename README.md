# MirrorSync 🪞

> **Persona-Adaptive Cognitive Journal & Executive Reflection Intelligence Engine**  
> *Built for the **Google Cloud GenAI Academy APAC Edition (Social Challenge / Ideathon)**.*  
> *Prototyped in **Google AI Studio**, iteratively architected & hardened with **Google Antigravity**, and deployed to **Google Cloud Run** with **Cloud Build**.*

---

## 🌟 The Story & Vision Behind MirrorSync

Most journaling apps operate like digital scratchpads: you dump your thoughts, and at best, an AI gives back a generic summary. But real growth happens through **meaningful dialogue, inquisitive questions, and personalized perspectives**.

**MirrorSync** is a privacy-first, cognitive journaling companion that adapts dynamically to who you are. Whether you're an educator debugging classroom pedagogy, an engineer navigating sprint deadlines, or someone learning pickleball on the weekend, MirrorSync tailors its tone, reflections, and leading questions to your unique life context.

Instead of generic summaries, MirrorSync:
1. **Understands Your Persona**: Extracts communication styles, pedagogical/strategic archetypes, and tone preferences.
2. **Categorizes Across Real Life**: Routes thoughts into **Work**, **Personal**, **Creative**, and **Email Drafting**.
3. **Asks Hyper-Tailored Inquisitive Questions**: Pushes your thinking with context-specific prompts rather than cliché advice.
4. **Bridges Physical Space**: Grounds memories in physical locations using Google Maps Platform.
5. **Generates Context Visuals**: Uses Google's native Gemini Lite image capabilities for 16:9 contextual banner illustrations with graceful standby states.
6. **Speaks Your Thoughts**: Built-in voice synthesizer and teleprompter for auditory review.

---

## 🛠️ Google Cloud Platform (GCP) Architecture & Services

MirrorSync is built from the ground up on Google Cloud Platform, combining serverless compute, AI reasoning, database security, and spatial mapping:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               MIRRORSYNC GCP ARCHITECTURE                               │
└─────────────────────────────────────────────────────────────────────────────────────────┘
   [ Client Browser ]
          │  • React 19 + TypeScript + Vite SPA + Tailwind CSS
          │  • Firebase Google Auth & Interactive Google Maps Platform
          ▼
   [ Google Cloud Run ] (Node.js 20 LTS + Express API Gateway)
          │  • Serverless container auto-scaling (0 to N instances)
          │  • 1MB payload limits, CORS guards & prompt injection fencing
          ├─────────────────────────────────────────┬─────────────────────────────────────┐
          ▼                                         ▼                                     ▼
   [ Secret Manager ]                     [ Cloud Firestore ]                   [ Google Gemini API ]
    • GEMINI_API_KEY isolation             • Multi-tenant user subcollections    • gemini-3.7-flash (Primary)
    • Least-privilege IAM bindings         • Document rules: /users/{uid}/**     • gemini-3.5-flash-lite / 2.5
                                                                                 • gemini-3.1-flash-lite-image
```

### Core GCP Services Utilized:
* **Google Cloud Run**: Hosts the full-stack containerized service (`Dockerfile` + Node.js 20 LTS + Express backend + Vite SPA) with instant auto-scaling and zero-downtime rolling deploys.
* **Google Cloud Build**: Native CI/CD pipeline triggered automatically on every push to `main` for hands-free continuous delivery.
* **Google Gemini API (`@google/genai` SDK)**:
  - **`gemini-3.7-flash`**: Primary multimodal cognitive reflection engine, emotional sentiment calibration, and dynamic topic clustering.
  - **`gemini-3.5-flash-lite` & `gemini-2.5-flash-lite`**: High-speed, low-latency fallback models in our automated resilience ladder.
  - **`gemini-3.1-flash-lite-image`**: Native Gemini image generation for 16:9 banner illustrations.
* **Google Secret Manager**: Secure storage for `GEMINI_API_KEY`, accessed strictly at runtime via IAM service account bindings (never exposed to client-side bundles).
* **Cloud Firestore**: Multi-tenant database enforcing strict subcollection path isolation (`/users/{userId}/**`) locked by server-authoritative Firestore Security Rules.
* **Firebase Authentication**: Google Single Sign-On (SSO) with popup auth and JWT session verification.
* **Google Maps Platform (`@vis.gl/react-google-maps`)**: Spatial memory grounding, place search, and interactive dark-mode map snippet previews.

---

## 🏆 Ideathon & Challenge Criteria Checklist

| Challenge Requirement | How MirrorSync Solves It | Technical Component |
| :--- | :--- | :--- |
| **Cloud Run Production Deployment** | Containerized full-stack application deployed on Cloud Run with `dev-tutorial=cloud-run-ai-challenge` labels and auto-scaling. | [Dockerfile](file:///c:/Users/User/Desktop/MirrorSyncJournal/Dockerfile), [server.ts](file:///c:/Users/User/Desktop/MirrorSyncJournal/server.ts) |
| **Continuous Deployment (CD)** | Cloud Build trigger automatically building and deploying new commits pushed to the `main` branch. | [deploy-mirrorsync-on-push trigger] |
| **Google Gemini in AI Studio** | Structured prompts, few-shot calibration, and JSON schema outputs designed in AI Studio, invoked via `@google/genai`. | [server.ts](file:///c:/Users/User/Desktop/MirrorSyncJournal/server.ts) |
| **Firebase Auth & Firestore** | Multi-tenant user login with Google SSO, automatic local-to-cloud sync, and strict subcollection ownership rules. | [src/firebase.ts](file:///c:/Users/User/Desktop/MirrorSyncJournal/src/firebase.ts), [firestore.rules](file:///c:/Users/User/Desktop/MirrorSyncJournal/firestore.rules) |
| **Multi-Tier Model Resilience** | 4-tier fallback ladder (`gemini-3.7-flash` → `gemini-3.5-flash` → `gemini-3.5-flash-lite` → `gemini-2.5-flash-lite`) handling 429 quota and transient spikes gracefully. | [server.ts](file:///c:/Users/User/Desktop/MirrorSyncJournal/server.ts) |
| **Social Challenge Hashtag** | Prepared for social demo sharing with **#AccelerateAIwithCloudRun**. | See [Social Post Template](#-social-challenge-submission-kit) |

---

## 🚀 Key Features Beyond the Baseline Template

```
┌──────────────────────────────────────┐     ┌────────────────────────────────────────────────────────┐
│     Typical AI Starter Notebook      │     │              MirrorSync Production System              │
├──────────────────────────────────────┤     ├────────────────────────────────────────────────────────┤
│ • Basic raw text box                 │     │ • 🧠 AI Persona Extraction & Tone Calibration          │
│ • Generic single-turn summary        │ ──► │ • 📖 Dual-View Mode (Book Flip Journal vs. Feed View) │
│ • No location or spatial context     │     │ • 📍 Double-Height Google Maps Spatial Grounding       │
│ • Fragile single-model API calls    │     │ • ⚡ 4-Tier Automated Gemini Fallback Ladder          │
│ • Open or unauthenticated database   │     │ • 🔒 Strict Document-Level Firestore Security Rules   │
│ • Plain text readouts                │     │ • 🎧 Natural Voice Audio Reader & Teleprompter         │
│ • Disconnected from real workflows   │     │ • ✉️ Executive Email Drafting Studio                  │
└──────────────────────────────────────┘     └────────────────────────────────────────────────────────┘
```

### 1. 🧠 Dynamic Persona Calibration ([OnboardingModal.tsx](file:///c:/Users/User/Desktop/MirrorSyncJournal/src/components/OnboardingModal.tsx))
Analyzes check-in reflections to extract occupation, department, communication style (*pedagogical*, *analytical*, *concise*), and coaching archetypes (*Strategic Advisor*, *Socratic Challenger*, *Mindful Mentor*). System instructions adapt empathy and feedback depth to match the persona.

### 2. 📖 Dual-View Journal: Book Flip vs. Card Feed ([BookJournalView.tsx](file:///c:/Users/User/Desktop/MirrorSyncJournal/src/components/BookJournalView.tsx))
Switch between an immersive **Book Journal Flip View** (with paper textures, corner ribbon bookmarks, and chapter navigation) and a clean **Vertical Feed View**. All cards default to a clean collapsed state with instant expand toggles.

### 3. 📍 Double-Height Google Maps Spatial Grounding ([ReflectionCard.tsx](file:///c:/Users/User/Desktop/MirrorSyncJournal/src/components/ReflectionCard.tsx))
Entries can be tagged with physical locations (e.g. *Kallang Tennis Centre, Singapore*). Features a prominent silver-gray location badge and an interactive double-height Google Map preview with dark-mode styling.

### 4. 🎨 Gemini Lite Context Illustrations ([EditorialArtCanvas.tsx](file:///c:/Users/User/Desktop/MirrorSyncJournal/src/components/EditorialArtCanvas.tsx))
Uses `gemini-3.1-flash-lite-image` to generate 16:9 banner visuals capturing the essence of each reflection. Includes a clean standby state and custom prompt editor allowing users to regenerate artwork anytime.

### 5. ✉️ Executive Email Drafting Studio ([EmailDraftingStudio.tsx](file:///c:/Users/User/Desktop/MirrorSyncJournal/src/components/EmailDraftingStudio.tsx))
Transforms unstructured draft thoughts or meeting notes into structured, professional emails with length controls (*Standard*, *Expanded*, *Concise*) and 1-click clipboard copying.

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

## 📋 Social Challenge Submission Kit

### Required Submission Fields

- **Project / Service Name**: MirrorSync
- **Cloud Run Deployed URL**: `https://mirrorsync-217104786977.us-central1.run.app` (or your live Cloud Run URL)
- **Public Repository Link**: `https://github.com/bluechristopher/MirrorSyncJournal`
- **Demo Social Post Link**: `https://www.linkedin.com/posts/<YOUR_POST_ID>` (or X / Medium post)
- **Required Hashtag**: `#AccelerateAIwithCloudRun`

### Ready-to-Use Social Post Template (LinkedIn / X)

> 🚀 Excited to showcase **MirrorSync** built for the Google Cloud GenAI Academy APAC Edition (#AccelerateAIwithCloudRun)!
>
> 🪞 **What is MirrorSync?**
> A persona-adaptive cognitive reflection intelligence engine that transforms unstructured thoughts into high-leverage clarity, executive actions, and mindful growth.
>
> 🛠️ **GCP Tech Stack & AI Tooling:**
> • **AI Development Journey**: Initial system prompt & schema design prototyped in **Google AI Studio**, iteratively architected & security-hardened in **Google Antigravity**.
> • **Google Cloud Run**: Containerized serverless deployment with automated scaling.
> • **Google Cloud Build**: Native Continuous Deployment (CD) automatically listening to GitHub pushes.
> • **Google Gemini 3.7 Flash & Google GenAI SDK**: Multi-tier model fallback ladder with structured JSON schema reasoning.
> • **Cloud Firestore & Firebase Auth**: Strict per-user path isolation (`/users/{uid}/**`) ensuring multi-tenant privacy.
> • **Google Maps Platform**: Spatial memory grounding with interactive maps & pins.
>
> ✨ **Unique Features Beyond Starter Template:**
> 1. 🧠 Dynamic Persona Extraction & Tone Calibration
> 2. 📖 Dual-View Mode (Book Flip Journal vs. Feed View)
> 3. 📍 Double-Height Google Maps Spatial Grounding
> 4. 🔮 Dynamic AI Topic Clustering & Unsupervised Categorization
> 5. ✉️ Interactive Email Drafting Studio
> 6. 🎧 Natural Voice Audio Reader & Teleprompter
> 7. 🛡️ 5-Zone Threat Model & OWASP LLM Mitigation Inspector
>
> 🔗 Live Cloud Run App: https://mirrorsync-217104786977.us-central1.run.app
> 📂 GitHub Repo: https://github.com/bluechristopher/MirrorSyncJournal
>
> #AccelerateAIwithCloudRun #GoogleCloud #Gemini #CloudRun #Firebase #GoogleAIStudio #Antigravity #BuildWithAI

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
