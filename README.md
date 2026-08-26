# MirrorSync 🪞

> **Persona-Adaptive Cognitive Journal & Executive Reflection Intelligence Engine**  
> *Built for the **Google Cloud GenAI Academy APAC Edition (Social Challenge / Ideathon)**.*  
> *Rapidly prototyped in **Google AI Studio**, iteratively architected & hardened with **Google Antigravity**, and continuously deployed to **Google Cloud Run** via **Cloud Build**.*

---

## 🌟 Executive Pitch & Project Overview

**MirrorSync** is an intelligent, privacy-hardened cognitive journal and reflection intelligence engine that transforms unstructured daily thoughts into structured personal growth, executive clarity, and actionable execution. 

While baseline journal templates merely summarize text, MirrorSync dynamically calibrates its cognitive feedback, tone, and action chips to the user\'s explicit **Executive Persona**, auto-categorizes reflections across dynamic life domains (**Work**, **Personal**, **Creative**, and **Email Drafting**), generates semantic topic clusters, grounds memories in physical space via Google Maps, synthesizes content-aware photorealistic artwork, and reads entries aloud with a natural text-to-speech engine.

---

## 🛠️ Technology Stack & AI Tooling Journey

### 1. AI Development & Agentic Engineering Journey
* **Google AI Studio**: 
  - Used for the **initial prototype**, system instruction design, and few-shot prompt calibration.
  - Defined the strict JSON schemas for persona extraction, cognitive metrics, multi-turn action chips, and domain routing.
  - Evaluated prompt resilience across Gemini models (gemini-3.7-flash, gemini-3.6-flash, and gemini-3.1-flash-lite).
* **Google Antigravity**:
  - Transitioned the prototype into a production-grade full-stack architecture using Antigravity agentic coding.
  - Implemented the automated 4-tier model fallback ladder, 5-zone threat modeling defenses, and OWASP LLM security mitigations.
  - Built full-stack TypeScript interfaces, React 19 UI, Firebase Auth & Firestore multi-tenant subcollections, and containerization.

### 2. Google Cloud Platform (GCP) Services
* **Google Cloud Run**: Serverless container hosting running the Node.js / Express backend + Vite SPA with auto-scaling and zero-downtime rolling updates.
* **Google Cloud Build**: Native Continuous Deployment (CD) pipeline automatically listening to GitHub push events on main to build and deploy containers without storing static JSON keys in GitHub.
* **Google Gemini API (@google/genai SDK)**: Gemini 3.7 Flash powering cognitive reflections, emotional sentiment calibration, and dynamic topic clustering.
* **Google Secret Manager**: Secure storage for GEMINI_API_KEY, granting access strictly via IAM service account bindings.
* **Cloud Firestore**: Multi-tenant database with subcollection path isolation (/users/{userId}/**) locked by Firestore Security Rules.
* **Firebase Authentication**: Google Single Sign-On (SSO) with JWT bearer token verification.
* **Google Maps Platform (@vis.gl/react-google-maps)**: Spatial memory grounding, interactive dark-mode maps, and place geocoding.

---

## 🏆 Challenge Compliance & Deliverables Matrix

This project addresses all **Gen AI Academy APAC / Cloud Run AI Challenge** criteria:

| Requirement / Criterion | Implementation in MirrorSync | Tech / Component Reference |
| :--- | :--- | :--- |
| **Cloud Run Production Deployment** | Full-stack containerized service (Dockerfile + Node 20 LTS + Express + Vite SPA) on Cloud Run with dev-tutorial=cloud-run-ai-challenge label. | **Cloud Run**, [Dockerfile](file:///c:/Users/User/Desktop/MirrorSyncJournal/Dockerfile), [server.ts](file:///c:/Users/User/Desktop/MirrorSyncJournal/server.ts) |
| **Continuous Deployment (CD)** | Automated Cloud Build trigger listening to GitHub push events on main for zero-touch deployment. | **Cloud Build**, [deploy-mirrorsync-on-push trigger] |
| **Firebase Authentication** | Single Sign-On (SSO) with Google Auth popup and session token verification across devices. | **Firebase Auth**, [src/firebase.ts](file:///c:/Users/User/Desktop/MirrorSyncJournal/src/firebase.ts), [Header.tsx](file:///c:/Users/User/Desktop/MirrorSyncJournal/src/components/Header.tsx) |
| **Firestore Security & Isolation** | Strict document-level ownership rules enforcing isolation under /users/{userId}/** matching equest.auth.uid. | **Cloud Firestore**, [firestore.rules](file:///c:/Users/User/Desktop/MirrorSyncJournal/firestore.rules) |
| **Google Gemini in AI Studio** | Multi-tier model ladder prioritizing gemini-3.7-flash, gemini-3.6-flash, gemini-3.1-flash-lite, and gemini-flash-latest with structured JSON schemas and zero client key exposure. | **Google AI Studio & GenAI SDK**, [server.ts:L34-L347](file:///c:/Users/User/Desktop/MirrorSyncJournal/server.ts#L34-L347) |
| **Social Challenge Hashtag** | Prepared for social demo sharing with required hashtag **#AccelerateAIwithCloudRun**. | See [Social Post & Submission Details](#-social-challenge-submission-kit) |

---

## 🚀 Baseline vs. Innovative GCP Add-Ons

MirrorSync goes far beyond a starter lab template:

`
┌──────────────────────────────────────┐     ┌────────────────────────────────────────────────────────┐
│   Starter / Baseline Gemini Lab      │     │            MirrorSync Innovative System                │
├──────────────────────────────────────┤     ├────────────────────────────────────────────────────────┤
│ • Basic raw text input               │     │ • 🧠 AI Persona Extraction & Dynamic Tone Calibration  │
│ • Generic single-turn summary        │ ──► │ • 💬 Multi-Turn Refinement with Context Memory         │
│ • No spatial context                 │     │ • 📍 Google Maps Platform Pinning & Spatial Recall     │
│ • Static categories                  │     │ • 🔮 Dynamic AI Topic Clustering & Unsupervised Tags   │
│ • Plain text cards                   │     │ • 🎨 AI Editorial Art & Photorealistic Banners         │
│ • Single model dependency (fails 429)│     │ • 🎧 Natural Voice Audio Reader & Speech Synthesizer   │
│ • No database rules hardening        │     │ • ⚡ 4-Tier Automated Gemini Model Fallback Ladder     │
│                                      │     │ • 🛡️ Live 5-Zone Threat Model & Security Inspector     │
└──────────────────────────────────────┘     └────────────────────────────────────────────────────────┘
`

### 1. 🧠 AI Persona Extraction & Adaptive Onboarding ([OnboardingModal.tsx](file:///c:/Users/User/Desktop/MirrorSyncJournal/src/components/OnboardingModal.tsx))
- Analyzes natural user check-in reflections via Gemini to extract occupation, department, communication style (*analytical*, *visionary*, *concise*), and coaching archetypes (*Strategic Advisor*, *Socratic Challenger*, *Mindful Mentor*).
- System prompts dynamically inject this persona to tailor empathy levels, executive takeaways, and action items.

### 2. 💬 Multi-Turn Cognitive Refinement & Context Memory ([ReflectionCard.tsx](file:///c:/Users/User/Desktop/MirrorSyncJournal/src/components/ReflectionCard.tsx))
- Users can converse with their reflection using structured action chips: Propose Enriched Writeup, Structure Notes (Headers & Bullets), Extract Action Checklist, Draft Executive Email, and Refine Tone.
- Merges feedback directly into original journal writeups while preserving session history.

### 3. 📍 Google Maps Presence & Spatial Pinning ([GoogleMapView.tsx](file:///c:/Users/User/Desktop/MirrorSyncJournal/src/components/GoogleMapView.tsx))
- Integrated with @vis.gl/react-google-maps and Google Maps Platform.
- Users pin physical places (GPS coords or place names), generating spatial memory cues, dark-mode pins, direction shortcuts, and contextual reflections.

### 4. 🔮 Dynamic AI Topic Clustering ([DynamicCategoryCards.tsx](file:///c:/Users/User/Desktop/MirrorSyncJournal/src/components/DynamicCategoryCards.tsx))
- Automatically clusters journal entries across life domains into human-friendly, high-level topic buckets (e.g. *Sports & Fitness*, *System Architecture*, *Leisure & Downtime*, *Shopping & Gear*).
- Features instant semantic categorization with background Gemini cluster refinement.

### 5. ✉️ Interactive Email Drafting Studio ([EmailDraftingStudio.tsx](file:///c:/Users/User/Desktop/MirrorSyncJournal/src/components/EmailDraftingStudio.tsx))
- Dedicated studio to transform unstructured rough thoughts or past correspondence threads into send-ready executive emails.
- Multi-turn quick length switchers (*Standard*, *Expanded*, *Concise*) and rapid copy to clipboard.

### 6. 🎧 Natural Voice Audio Reader & Teleprompter ([JournalVoicePlayer.tsx](file:///c:/Users/User/Desktop/MirrorSyncJournal/src/components/JournalVoicePlayer.tsx))
- In-browser voice synthesizer with natural voice detection, real-time speed tuning (0.9x to 1.5x), word-by-word teleprompter highlighting, scope filtering (*Full Reflection*, *Journal Only*, *Coaching Only*), and animated soundwave audio visualizers.

### 7. 🎨 AI Editorial Art & Photorealistic Banners ([EditorialArtCanvas.tsx](file:///c:/Users/User/Desktop/MirrorSyncJournal/src/components/EditorialArtCanvas.tsx))
- Generates 16:9 cinematic photorealistic banner prompts and visuals that match the emotional mood and environmental setting of each entry.

### 8. 🛡️ 5-Zone Threat Model & Transparency Inspector ([ThreatModelModal.tsx](file:///c:/Users/User/Desktop/MirrorSyncJournal/src/components/ThreatModelModal.tsx))
- Built-in live modal inspecting active security defenses across all 5 architectural zones, verifying OWASP LLM Top 10 mitigations.

---

## 🛡️ Security Architecture & Threat Model

MirrorSync enforces strict boundary separation across five designated threat zones, ensuring zero client-side credential exposure and guaranteed data isolation.

`
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MIRRORSYNC 5-ZONE ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────────────┘
  [ Client Browser (Zone 1: Client UI) ]
         │  • Zero client API keys (import.meta.env public config only)
         │  • HTTPS / Bearer Token auth with Firebase Auth UID
         ▼
  [ Cloud Run Edge / Express Backend (Zone 2: Transport & API Gateway) ]
         │  • 1MB body limit & schema validation
         │  • Origin verification & prompt injection delimiter boundaries
         ├──────────────────────────────────────────┐
         ▼                                          ▼
  [ Secret Manager / IAM (Zone 3) ]   [ Firestore Multi-Tenant DB (Zone 4) ]
   - Strict Least-Privilege IAM         - per-user path isolation (/users/{uid})
   - Server-only GEMINI_API_KEY         - Server-authoritative rules enforcement
         │
         ▼
  [ Google Gemini AI Engine (Zone 5: AI & Reasoning) ]
   - Prompt Injection Sanitizers
   - Automated 4-Tier Model Fallback Ladder
   - Strict JSON Schema Validation
`

### The 5 Threat Zones

| Threat Zone | Domain | Core Defense & Mitigation |
| :--- | :--- | :--- |
| **Zone 1: Client UI** | Browser & DOM | No secret keys in bundle (import.meta.env contains only public config); XSS sanitization; CSP compliance. |
| **Zone 2: Transport & API Gateway** | Express / Cloud Run API | Origin verification, input boundary limits, request timeouts, and structured error masks. |
| **Zone 3: Secret Store & IAM** | Google Secret Manager | Zero hardcoded keys; IAM binding grants oles/secretmanager.secretAccessor only to the Cloud Run service account. |
| **Zone 4: Persistence Store** | Cloud Firestore | Strict subcollection path isolation (/users/{userId}/**); rule-level ownership checks with equest.auth.uid. |
| **Zone 5: Model & AI Gateway** | Gemini API | System prompt encapsulation, delimiter boundaries preventing prompt injection, output schema validation. |

---

## ⚡ Model Resilience Ladder

To guarantee uninterrupted service even during peak traffic, quota limits, or regional outages, MirrorSync utilizes an automated **Adaptive Model Fallback Ladder**:

`
[ Primary: gemini-3.7-flash ]
           │ (On 429 Quota / 503 Busy / Timeout > 28s)
           ▼
[ Tier 2 Fallback: gemini-3.6-flash ]
           │ (On Error / Rate Limit)
           ▼
[ Tier 3 Fallback: gemini-3.1-flash-lite ]
           │ (On Error / Rate Limit)
           ▼
[ Tier 4 Fallback: gemini-flash-latest ]
           │ (Emergency Continuity)
           ▼
[ Graceful Deterministic Local Semantic Engine ]
`

---

## 🔒 Database Isolation & Security Rules

All user data in Firestore is partitioned under /users/{userId}. Multi-tenant cross-talk is prevented at the database kernel level through the following security rules:

`javascript
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
`

---

## 🚀 Continuous Deployment & Google Cloud Run Setup

### 1. Enable Required Google Cloud APIs

`ash
# Set your project ID
export PROJECT_ID= genaiacademy3
export REGION=us-central1
export SERVICE_NAME=mirrorsync

gcloud config set project 

# Enable Cloud Run, Secret Manager, Cloud Build, Artifact Registry, and Firestore
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com
`

### 2. Provision GEMINI_API_KEY in Secret Manager

`ash
# Create secret in Secret Manager
echo -n YOUR_GEMINI_API_KEY_HERE | gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --replication-policy=automatic

# Grant Cloud Run default compute service account access to Secret Manager
export PROJECT_NUMBER=217104786977
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member=serviceAccount:-compute@developer.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
`

### 3. Continuous Deployment (CD) via Cloud Build Triggers

1. Connect your GitHub repository (MirrorSyncJournal) under **Cloud Build** ➔ **Repositories (1st gen)**.
2. Create a Cloud Build Trigger:
   - **Event**: Push to a branch (^main$)
   - **Configuration**: Inline Cloud Build configuration:

`yaml
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
`

---

## 📋 Social Challenge Submission Kit

### Required Submission Fields

- **Project / Service Name**: MirrorSync
- **Cloud Run Deployed URL**: https://mirrorsync-217104786977.us-central1.run.app (or your live Cloud Run URL)
- **Public Repository Link**: https://github.com/bluechristopher/MirrorSyncJournal
- **Demo Social Post Link**: https://www.linkedin.com/posts/<YOUR_POST_ID> (or X / Medium post)
- **Required Hashtag**: #AccelerateAIwithCloudRun

### Ready-to-Use Social Post Template (LinkedIn / X)

> 🚀 Excited to showcase **MirrorSync** built for the Google Cloud GenAI Academy APAC Edition (#AccelerateAIwithCloudRun)!
>
> 🪞 **What is MirrorSync?**
> An executive cognitive reflection intelligence engine that transforms unstructured thoughts into high-leverage clarity, executive actions, and mindful growth.
>
> 🛠️ **GCP Tech Stack & AI Tooling:**
> • **AI Development Journey**: Initial system prompt & schema design prototyped in **Google AI Studio**, iteratively architected & security-hardened in **Google Antigravity**.
> • **Google Cloud Run**: Containerized serverless deployment with automated scaling.
> • **Google Cloud Build**: Native Continuous Deployment (CD) automatically listening to GitHub pushes.
> • **Google Gemini 3.7 Flash & Google GenAI SDK**: Multi-tier model fallback ladder with structured JSON schema reasoning.
> • **Cloud Firestore & Firebase Auth**: Strict per-user path isolation (/users/{uid}/**) ensuring multi-tenant privacy.
> • **Google Maps Platform**: Spatial memory grounding with interactive maps & pins.
>
> ✨ **Unique Features Beyond Starter Template:**
> 1. 🧠 Dynamic Persona Extraction & Tone Calibration
> 2. 💬 Multi-Turn Cognitive Refinement & Context Memory
> 3. 🔮 Dynamic AI Topic Clustering & Unsupervised Categorization
> 4. ✉️ Interactive Email Drafting Studio with Past Correspondence Analysis
> 5. 🎧 Natural Voice Audio Reader & Teleprompter
> 6. 🛡️ 5-Zone Threat Model & OWASP LLM Mitigation Inspector
>
> 🔗 Live Cloud Run App: [YOUR_DEPLOYMENT_URL]
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
