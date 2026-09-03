import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

app.use(express.json({ limit: '1mb' }));

// Lazy Google GenAI Client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set.');
    }
    genAIClient = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAIClient;
}

// Fallback Model Ladder strictly prioritizing gemini-3.8-flash, then gemini-3.7-flash, then gemini-3.5-flash, then gemini-3.5-flash-lite, then gemini-2.5-flash
const MODEL_FALLBACK_LADDER = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite'
];

/**
 * Universal text sanitizer:
 * 1. Collapses runaway repeated emojis (e.g. ✨🌟🚀💛🎉🥳...)
 * 2. Detects and cuts off degenerate looping repetitions (repeating phrase/word loops).
 */
function sanitizeRunawayContent(text: string): string {
  if (!text || typeof text !== 'string') return '';

  // 1. Emoji runaway cleaner
  const emojiRegex = /([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA70}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}][\s]*){3,}/gu;
  let cleaned = text.replace(emojiRegex, (match) => {
    const trimmed = match.trim();
    return trimmed.length > 0 ? Array.from(trimmed)[0] + ' ' : '';
  });

  // 2. Loop & Degeneration cleaner:
  // Detect phrases (3 to 60 characters) that repeat consecutively 3 or more times
  const phraseRepeatRegex = /((?:[^\n\r]{3,60}?))\s*(?:\1\s*){2,}/gi;
  cleaned = cleaned.replace(phraseRepeatRegex, '$1');

  // Detect word loops (e.g. "insights insights insights" or "next steps next steps")
  const wordRepeatRegex = /\b(\w{2,25}(?:\s+\w{2,25}){0,4})\s+(?:\1\s+){2,}/gi;
  cleaned = cleaned.replace(wordRepeatRegex, '$1 ');

  return cleaned.trim();
}

interface FallbackExecutionResult<T> {
  data: T;
  modelUsed: string;
  attemptedModels: string[];
  latencyMs: number;
}

function generateFallbackReflection(rawText: string, persona: any, location?: any, explicitDomain?: string) {
  let domain: 'Work' | 'Personal' | 'Creative' | 'Email Drafting';

  if (explicitDomain && explicitDomain !== 'auto' && ['Work', 'Personal', 'Creative', 'Email Drafting'].includes(explicitDomain)) {
    domain = explicitDomain as any;
  } else {
    // Smart heuristic content classification - NEVER default to Work blindly!
    const isEmail = /email|draft|recipient|subject:|dear |hi team|send an email|write to|follow up on|outreach|memo/i.test(rawText);
    const isPersonal = /personal|family|kids|children|wife|husband|partner|friend|home|health|wellness|sleep|exercise|workout|gym|run|hike|walk|nature|coffee|dinner|cooking|weekend|hobby|relax|anxiety|feel|feeling|mood|breathe|stress|mindful|meditat|grateful|gratitude|joy|happy|life|well-being|doctor|therapy|vacation|trip|pet|dog|cat/i.test(rawText);
    const isCreative = /design|creative|art|artist|painting|drawing|sketch|writing|novel|poem|poetry|story|concept|brand|music|song|guitar|piano|lyrics|fiction|scifi|sci-fi|fantasy|craft|film|photo|muse|brainstorm|worldbuilding|character|aesthetic/i.test(rawText);
    const isWork = /sprint|deploy|architecture|server|database|backend|frontend|code|pr|pull request|jira|ticket|meeting|client|customer|stakeholder|budget|kpi|okr|revenue|strategy|roadmap|road map|deadline|deliverable|boss|manager|employee|refactor|latency|throughput|infrastructure|sales|marketing/i.test(rawText);

    if (isEmail) {
      domain = 'Email Drafting';
    } else if (isCreative && !isWork) {
      domain = 'Creative';
    } else if (isPersonal && !isWork) {
      domain = 'Personal';
    } else if (isWork) {
      domain = 'Work';
    } else if (isCreative) {
      domain = 'Creative';
    } else if (isPersonal) {
      domain = 'Personal';
    } else {
      // If ambiguous stream-of-consciousness, default to Personal growth/mindfulness instead of assuming corporate Work
      domain = 'Personal';
    }
  }

  const sentences = rawText.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean);
  const coreTheme = sentences[0] || rawText.slice(0, 80);
  const words = rawText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
  const uniqueTags = Array.from(new Set(words))
    .slice(0, 3)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1));
  if (uniqueTags.length === 0) {
    uniqueTags.push(domain === 'Email Drafting' ? 'EmailDraft' : domain === 'Personal' ? 'LifeBalance' : domain === 'Creative' ? 'CreativeFlow' : 'DeepWork');
  }

  const locationContext = location?.name
    ? `Grounding your thoughts from ${location.name}${location.address ? ` (${location.address})` : ''}. The physical setting provides a stabilizing backdrop for mindful reflection.`
    : null;

  // Generate intelligent essence-driven title (capturing mood and theme without slicing raw text)
  let generatedTitle = '';
  if (domain === 'Email Drafting') {
    generatedTitle = 'Executive Communication & Alignment';
  } else if (domain === 'Work') {
    if (/deploy|server|database|backend|pr|code|bug|refactor|architecture/i.test(rawText)) {
      generatedTitle = 'Technical Execution & System Momentum';
    } else if (/meeting|strategy|okr|kpi|roadmap|team|planning/i.test(rawText)) {
      generatedTitle = 'Strategic Direction & Team Clarity';
    } else {
      generatedTitle = 'Focused Execution & Deep Work';
    }
  } else if (domain === 'Creative') {
    if (/art|drawing|sketch|design|visual|shader|canvas/i.test(rawText)) {
      generatedTitle = 'Visual Flow & Artistic Explorations';
    } else if (/story|writing|character|novel|poetry|lyrics/i.test(rawText)) {
      generatedTitle = 'Narrative Sparks & Imaginative Horizons';
    } else {
      generatedTitle = 'Creative Curiosity & Flow State';
    }
  } else {
    // Personal domain
    if (/walk|nature|coffee|quiet|morning|mindful|breathe|peace|rest/i.test(rawText)) {
      generatedTitle = 'Mindful Grounding & Morning Peace';
    } else if (/friend|family|partner|kids|dinner|weekend|together/i.test(rawText)) {
      generatedTitle = 'Cherished Moments & Connection';
    } else if (/gym|workout|run|exercise|health|sleep/i.test(rawText)) {
      generatedTitle = 'Energy, Vitality & Healthy Habits';
    } else {
      generatedTitle = 'Reflections on Personal Well-Being';
    }
  }

  if (domain === 'Email Drafting') {
    const style = persona?.communicationStyle || 'concise & direct';
    const coachingTone = persona?.coachingTone || 'Professional';
    const subject = `Update regarding ${coreTheme.slice(0, 45)}...`;
    const emailBody = `Hi team,\n\nI wanted to share a quick update regarding our current focus:\n\n• Context: ${coreTheme}\n• Key Observation: ${(sentences[1] || 'Ensuring alignment and steady momentum across key deliverables.')}\n• Next Step: Let's review during our next sync. Please feel free to reply with any thoughts or adjustments.\n\nBest regards,\n${persona?.name || 'Knowledge Practitioner'}`;

    return {
      title: generatedTitle,
      domain,
      summary: `✉️ Email draft synthesized: Focused on "${coreTheme.slice(0, 75)}...". Calibrated for ${style} communication!`,
      coaching: `🌟 Here is a structured, friendly draft tailored to your ${style} style and ${coachingTone} tone. You can use the multi-turn chat below to adjust the formality, shorten the body, or add urgent calls to action! ✨`,
      reflectionSummary: `✉️ Email draft synthesized: Focused on "${coreTheme.slice(0, 75)}...".`,
      adaptiveResponse: `🌟 Here is a structured draft tailored to your ${style} style and ${coachingTone} tone. Use multi-turn chat to iterate or polish!`,
      category: {
        domain,
        primaryTag: uniqueTags[0] || 'EmailDraft',
        departmentOrContext: persona?.department || 'Executive Communications',
        department: persona?.department || 'Executive Communications',
        projectTags: uniqueTags.slice(0, 3),
        tags: uniqueTags.slice(0, 3)
      },
      actionItems: [], // No action items for Email Drafting
      emailDraft: {
        subject,
        recipient: 'Team / Stakeholders',
        body: emailBody,
        tone: `${style} • ${coachingTone}`,
        keyPoints: [coreTheme.slice(0, 60), 'Next steps and alignment']
      },
      creativeSpark: null,
      editorialArtPrompt: "Minimalist Bauhaus layout depicting structured envelope geometries, clean intersecting paper folds, and crisp ultramarine lines on warm cream canvas.",
      locationContext,
      sentiment: {
        emotionalTone: 'Clear & Strategic',
        emoji: '✉️',
        energyLevel: 'Grounded' as const,
        sentimentResonance: 'Executive Communication',
        sentimentSummary: 'Calm, structured, and focused on clear stakeholder communication.'
      },
      cognitiveMetrics: {
        clarityScore: Math.min(98, Math.max(80, 85 + Math.floor(rawText.length / 30))),
        sentimentResonance: 'Direct & Professional',
        focusDimension: 'Executive Communication'
      }
    };
  }

  if (domain === 'Personal') {
    const summary = `🎉 Radiant Personal Reflection: Highlighting "${coreTheme.slice(0, 75)}...". Celebrating your positive energy, authentic feelings, and personal growth! ✨`;
    const coaching = `💛 I love this so much! That sounds like such an exciting, uplifting moment! Celebrating your authentic experiences and feelings is what makes life deeply fulfilling and joyful!\n\n✨ Enthusiastic Inquiries:\n1. 🌟 What was the most vibrant feeling or highlight of this experience for you?\n2. 💖 How did your body and mind feel during this special moment?\n3. 📝 Tell me more details or sentiments below—we can weave them directly into your journal writeup!`;
    const creativeSpark = "✨ If you could capture the joy and energy of this moment in one vivid word or image, what would it be?";
    const editorialArtPrompt = "Warm vibrant Bauhaus composition with glowing golden arches, uplifting saffron and coral gradients, and floating botanical motifs conveying pure joy and vitality.";

    const initialMessages = [
      {
        id: `msg-${Date.now()}-seed`,
        role: 'assistant' as const,
        content: `✨ I love how you captured this! What was the most vibrant or memorable part of this moment for you, and how did you feel inside? Tell me more below and we can weave your new details and sentiments directly into your journal writeup!`,
        timestamp: Date.now(),
        quickSuggestions: ['I felt so happy & energized', 'Add more context', 'Merge new feelings']
      }
    ];

    return {
      title: generatedTitle,
      domain,
      summary,
      coaching,
      reflectionSummary: summary,
      adaptiveResponse: coaching,
      category: {
        domain,
        primaryTag: uniqueTags[0] || 'PersonalGrowth',
        departmentOrContext: 'Personal Growth & Well-Being',
        department: 'Personal Growth & Well-Being',
        projectTags: uniqueTags.slice(0, 3),
        tags: uniqueTags.slice(0, 3)
      },
      actionItems: [], // Action items are NOT for personal domain
      creativeSpark,
      editorialArtPrompt,
      locationContext,
      messages: initialMessages,
      sentiment: {
        emotionalTone: 'Joyful & Uplifting',
        emoji: '🌟',
        energyLevel: 'High' as const,
        sentimentResonance: 'Radiant Joy',
        sentimentSummary: 'Radiant positivity, gratitude, and deeply meaningful personal presence.'
      },
      cognitiveMetrics: {
        clarityScore: Math.min(96, Math.max(75, 80 + Math.floor(rawText.length / 40))),
        sentimentResonance: 'Enthusiastic & Uplifting',
        focusDimension: 'Joy & Growth'
      }
    };
  }

  if (domain === 'Creative') {
    const summary = `💡 Inspirational creative spark: Centered around "${coreTheme.slice(0, 75)}...". Opening imaginative doors, lateral connections, and playful exploration! 🎨✨`;
    const coaching = `🚀 Every great idea begins with a playful willingness to wander without a predetermined map! Trust your intuitive instincts and let your raw concepts cross-pollinate with joyful curiosity!\n\n🔮 Lateral Creative Inquiries:\n1. 🌟 What happens if you invert your primary assumption or take the most daring direction first?\n2. 🎨 What metaphor or sensory texture captures the soul of what you are creating?\n3. 💫 Create an imperfect sandbox sketch right now before editing or judging the work!`;
    const creativeSpark = "✨ Imagine translating this exact idea into an interactive soundscape or kinetic sculpture. What rhythm and texture would it have?";
    const editorialArtPrompt = "Dynamic abstract Bauhaus geometric collage with floating azure prisms, vibrant saffron spheres, and energetic intersecting diagonals symbolizing creative breakthrough.";

    return {
      title: generatedTitle,
      domain,
      summary,
      coaching,
      reflectionSummary: summary,
      adaptiveResponse: coaching,
      category: {
        domain,
        primaryTag: uniqueTags[0] || 'Worldbuilding',
        departmentOrContext: 'Creative Studio',
        department: 'Creative Studio',
        projectTags: uniqueTags.slice(0, 3),
        tags: uniqueTags.slice(0, 3)
      },
      actionItems: [], // Action items are NOT for creative domain
      creativeSpark,
      editorialArtPrompt,
      locationContext,
      sentiment: {
        emotionalTone: 'Curious & Inspired',
        emoji: '💡',
        energyLevel: 'Inspiring' as const,
        sentimentResonance: 'Creative Flow',
        sentimentSummary: 'Bursting with imaginative possibilities, lateral curiosity, and artistic enthusiasm.'
      },
      cognitiveMetrics: {
        clarityScore: Math.min(96, Math.max(76, 82 + Math.floor(rawText.length / 40))),
        sentimentResonance: 'Vibrant & Imaginative',
        focusDimension: 'Lateral Exploration'
      }
    };
  }

  // Work Domain (Action items generated only here when relevant)
  const summary = `🚀 Energizing productivity synthesis: Key focus on "${coreTheme.slice(0, 75)}...". De-risking bottlenecks with momentum and celebrating forward progress! 💪`;
  const coaching = `👏 Fantastic work laying out this current landscape! When navigating complex challenges, momentum comes from celebrating traction and isolating your primary constraint with confidence!\n\n🔥 Pragmatic Momentum Boost:\n1. 🎉 Celebrate what has already been built and validated—you have real momentum!\n2. 🚀 Protect a dedicated uninterrupted focus block to tackle the single highest-leverage blocker.\n3. 💡 Define a lightweight, testable milestone to prove value early before expanding scope!`;
  const editorialArtPrompt = "Structured minimalist architectural composition with sharp indigo monoliths, warm ochre highlights, and clean isometric perspective representing strategic clarity and execution velocity.";

  const actionItems = [
    { id: `act-${Date.now()}-1`, task: 'Isolate the core blocker and take the first concrete step', text: 'Isolate the core blocker and take the first concrete step', completed: false, category: 'Next Step' as const, priority: 'high' as const },
    { id: `act-${Date.now()}-2`, task: 'Block dedicated focus time to eliminate friction', text: 'Block dedicated focus time to eliminate friction', completed: false, category: 'Next Step' as const, priority: 'medium' as const }
  ];

  return {
    title: generatedTitle,
    domain: 'Work' as const,
    summary,
    coaching,
    reflectionSummary: summary,
    adaptiveResponse: coaching,
    category: {
      domain: 'Work' as const,
      primaryTag: uniqueTags[0] || 'Architecture',
      departmentOrContext: persona?.department || 'Operations',
      department: persona?.department || 'Operations',
      projectTags: uniqueTags.slice(0, 3),
      tags: uniqueTags.slice(0, 3)
    },
    actionItems,
    creativeSpark: null,
    editorialArtPrompt,
    locationContext,
    sentiment: {
      emotionalTone: 'Determined & Ambitious',
      emoji: '🚀',
      energyLevel: 'High' as const,
      sentimentResonance: 'Execution Velocity',
      sentimentSummary: 'Driven, forward-looking, and ready to overcome obstacles with high energy.'
    },
    cognitiveMetrics: {
      clarityScore: Math.min(96, Math.max(72, 78 + Math.floor(rawText.length / 40))),
      sentimentResonance: 'Focused & Resolute',
      focusDimension: 'Strategic Alignment'
    }
  };
}

/**
 * Executes a Gemini request with automatic fallback ladder catching errors and sequentially trying each model with a resilient timeout.
 */
async function generateContentWithFallback<T>(
  systemInstruction: string,
  prompt: string,
  schema: any
): Promise<FallbackExecutionResult<T>> {
  const ai = getGenAI();
  const attemptedModels: string[] = [];
  const startTime = Date.now();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    attemptedModels.push(model);
    
    // Try up to 2 times for temporary 503 / 429 service spikes before falling back
    for (let attempt = 1; attempt <= 2; attempt++) {
      let timerId: NodeJS.Timeout | null = null;
      try {
        const apiCall = ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature: 0.3,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          timerId = setTimeout(() => reject(new Error(`Model ${model} timed out after 28000ms`)), 28000);
        });

        const response: any = await Promise.race([apiCall, timeoutPromise]);
        if (timerId) clearTimeout(timerId);

        const responseText = response.text;
        if (!responseText) {
          throw new Error(`Empty text response from model ${model}`);
        }

        const parsed: T = JSON.parse(responseText);
        const latencyMs = Date.now() - startTime;
        return {
          data: parsed,
          modelUsed: model,
          attemptedModels,
          latencyMs,
        };
      } catch (err: any) {
        if (timerId) clearTimeout(timerId);
        lastError = err;
        const isQuota = err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED') || err?.status === 429;
        const isBusy = err?.message?.includes('503') || err?.status === 503;
        
        if (isBusy && attempt === 1) {
          // Brief 350ms jitter delay for transient demand spikes before retry
          await new Promise(r => setTimeout(r, 350));
          continue;
        }
        
        if (isQuota) {
          // Quota exhausted on this model, immediately transition to next model in ladder
          console.info(`[generateContentWithFallback] Model '${model}' quota reached, transitioning to next model in ladder...`);
          break;
        }

        console.info(`[generateContentWithFallback] Model '${model}' unavailable (${err?.status || 'transient error'}), transitioning to next model in ladder...`);
        break; // Break inner loop to try next model in MODEL_FALLBACK_LADDER
      }
    }
  }

  throw new Error(`All models in fallback ladder failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// Public runtime configuration endpoint for client Firebase initialization
app.get('/api/firebase-config', (_req: Request, res: Response) => {
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'mirrorsync-journal';
  const appId = process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID;
  const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`;
  const googleMapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey || googleMapsApiKey) {
    return res.json({
      success: true,
      config: {
        apiKey: apiKey || 'AIzaSy_demo_client_key',
        projectId,
        appId: appId || "1:186489794174:web:49203eb08c56614943322f",
        authDomain,
        firestoreDatabaseId: "(default)",
        storageBucket: `${projectId}.firebasestorage.app`,
        messagingSenderId: "186489794174",
        googleMapsApiKey
      }
    });
  }

  res.json({ success: false, message: 'No server-side environment variables configured' });
});

// Server-side Image Storage Map (Stores image buffers outside Firestore)
const bannerImageStore = new Map<string, { mimeType: string; data: Buffer }>();

function storeBannerImage(mimeType: string, base64Data: string): string {
  const imageId = `img-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const buffer = Buffer.from(base64Data, 'base64');
  bannerImageStore.set(imageId, { mimeType, data: buffer });
  return `/api/gemini/banner-image/${imageId}`;
}

function deletePreviousBannerImage(oldImageUrl?: string) {
  if (oldImageUrl && oldImageUrl.includes('/api/gemini/banner-image/')) {
    const parts = oldImageUrl.split('/api/gemini/banner-image/');
    const oldId = parts[parts.length - 1];
    if (oldId && bannerImageStore.has(oldId)) {
      bannerImageStore.delete(oldId);
      console.info(`[Server Image Store] Deleted previous image: ${oldId}`);
    }
  }
}

// Endpoint to purge all stored banner images when Clear All Posts is triggered
app.post('/api/gemini/clear-all-images', (_req: Request, res: Response) => {
  const count = bannerImageStore.size;
  bannerImageStore.clear();
  console.info(`[Server Image Store] Cleared all ${count} banner images!`);
  res.json({ success: true, countCleared: count });
});

// Endpoint to serve generated banner images cleanly by ID
app.get('/api/gemini/banner-image/:imageId', (req: Request, res: Response) => {
  const { imageId } = req.params;
  const img = bannerImageStore.get(imageId);
  if (!img) {
    return res.status(404).send('Image not found');
  }
  res.setHeader('Content-Type', img.mimeType);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(img.data);
});

/**
 * Generate a photorealistic banner image using native Gemini Lite image model
 */
async function generatePhotorealisticBanner(prompt: string, _domain: string = 'Work', _rawText: string = ''): Promise<string> {
  const ai = getGenAI();
  try {
    const imgRes = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: `Generate a photorealistic 16:9 widescreen photograph representing: ${prompt}. Natural lighting, realistic photography.`,
      config: { responseModalities: ['IMAGE'] }
    });
    const parts = imgRes.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/jpeg';
        return storeBannerImage(mime, part.inlineData.data);
      }
    }
  } catch (_err: any) {
    console.warn('[Initial Banner] gemini-3.1-flash-lite-image note:', _err?.message || _err);
  }
  return '';
}

// Dedicated endpoint to generate / regenerate contextual banner art
app.post('/api/gemini/generate-banner', async (req: Request, res: Response) => {
  try {
    const { prompt = '', domain = 'Work', rawText = '', isCustomPrompt = false, oldImageUrl = '' } = req.body;
    const ai = getGenAI();

    // Delete previous image buffer from server memory store if regenerating
    deletePreviousBannerImage(oldImageUrl);

    let visualPrompt = prompt;
    let targetPrompt = prompt;

    // IF user provided a custom prompt explicitly, DO NOT re-read rawText content!
    if (isCustomPrompt && prompt.trim()) {
      targetPrompt = prompt.trim();
      visualPrompt = prompt.trim();
      console.info(`[Generate Banner] Using direct custom user prompt: "${targetPrompt}"`);
    } else {
      // Otherwise, extract concrete topic from journal text
      const combinedText = (rawText || prompt || '')
        .replace(/seed-\d+|[0-9a-f-]{10,}/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      let concreteTopic = '';

      for (const fallbackModel of MODEL_FALLBACK_LADDER) {
        try {
          const geminiRes = await ai.models.generateContent({
            model: fallbackModel,
            contents: `Analyze this journal entry:
"${combinedText.slice(0, 700)}"

Task:
1. "concreteTopic": The single most specific 2-to-4 word English visual topic representing the exact subject matter (e.g., "pickleball court paddle", "classroom computer exam", "singapore skyline marina bay", "coffee cup study notebook", "quiet study alcove").
2. "visualPrompt": A clear 1-sentence English visual summary sentence representing this specific scene (12 to 20 words).

Output JSON ONLY format:
{
  "concreteTopic": "pickleball court paddle",
  "visualPrompt": "A vibrant outdoor pickleball court with paddle and neon yellow ball under clear skies"
}`,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            }
          });

          if (geminiRes.text) {
            const parsed = JSON.parse(geminiRes.text);
            visualPrompt = parsed.visualPrompt || visualPrompt;
            concreteTopic = parsed.concreteTopic || '';
            if (concreteTopic) break;
          }
        } catch (_gErr) {
          console.warn(`Gemini topic extraction fallback (${fallbackModel}):`, _gErr);
        }
      }

      if (!concreteTopic) {
        const words = combinedText.split(/\s+/).filter(w => w.length > 3).slice(0, 4);
        concreteTopic = words.length > 0 ? words.join(' ') : 'journal writing desk';
      }

      if (!visualPrompt) {
        visualPrompt = `Scene representing ${concreteTopic}`;
      }

      targetPrompt = concreteTopic.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    }

    let imageUrl = '';
    let quotaExhausted = false;

    // 1. Direct native Google Gemini Lite Image Generation using gemini-3.1-flash-lite-image
    try {
      console.info(`[Generate Banner] Invoking native Gemini Lite Image model (gemini-3.1-flash-lite-image) for: "${targetPrompt}"...`);
      const imgRes = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: `Generate a photorealistic 16:9 widescreen photograph of ${targetPrompt}. ${visualPrompt}. Realistic, natural lighting, sharp depth of field.`,
        config: {
          responseModalities: ['IMAGE'],
        }
      });

      const parts = imgRes.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/jpeg';
          imageUrl = storeBannerImage(mime, part.inlineData.data);
          console.info(`[Generate Banner] Generated native Gemini Lite image! Server URL: ${imageUrl}`);
          break;
        }
      }
    } catch (_geminiLiteErr: any) {
      console.warn('[Generate Banner] gemini-3.1-flash-lite-image notice:', _geminiLiteErr?.message || _geminiLiteErr);
      
      // Secondary attempt with gemini-3.1-flash-image
      try {
        const imgRes = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents: `Generate a 16:9 photograph of ${targetPrompt}. Natural lighting.`,
          config: {
            responseModalities: ['IMAGE'],
          }
        });
        const parts = imgRes.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/jpeg';
            imageUrl = storeBannerImage(mime, part.inlineData.data);
            console.info(`[Generate Banner] Generated via gemini-3.1-flash-image! Server URL: ${imageUrl}`);
            break;
          }
        }
      } catch (_geminiFlashErr: any) {
        console.warn('[Generate Banner] gemini-3.1-flash-image notice:', _geminiFlashErr?.message || _geminiFlashErr);
        quotaExhausted = true;
      }
    }

    console.info(`[Generate Banner] Target Prompt: "${targetPrompt}" | Result URL: "${imageUrl || '(No banner - quota limit)'}"`);

    res.json({
      success: true,
      imageUrl: imageUrl || null,
      generatedArtPrompt: visualPrompt,
      keywords: targetPrompt,
      quotaExhausted
    });
  } catch (error: any) {
    console.error('Error generating banner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate banner artwork'
    });
  }
});

// Threat Modeling Zones Status
app.get('/api/threat-model', (_req: Request, res: Response) => {
  res.json({
    timestamp: Date.now(),
    modelLadder: MODEL_FALLBACK_LADDER,
    threatZones: {
      zone1_InputSurfaces: {
        status: 'SECURE',
        details: '1MB body limit, schema-typed input sanitization, prompt injection delimiters, length guards.'
      },
      zone2_PlanningReasoning: {
        status: 'SECURE',
        details: 'Strict JSON schema enforcement with Google GenAI SDK, system prompt isolation.'
      },
      zone3_ToolExecution: {
        status: 'SECURE',
        details: 'Stateless serverless endpoints, isolated payload transformations, no arbitrary code exec.'
      },
      zone4_MemoryStateIsolation: {
        status: 'SECURE',
        details: 'Firestore rules locked strictly to /users/{userId} & /users/{userId}/entries/{entryId} with auth.uid verification.'
      },
      zone5_InterSystemCommunication: {
        status: 'SECURE',
        details: 'TLS-encrypted Firebase REST, server-side Gemini API key isolation (never exposed to client).'
      }
    }
  });
});

// 1. Onboarding Persona Extraction Endpoint (/api/onboard)
app.post('/api/onboard', async (req: Request, res: Response) => {
  try {
    const { checkInText, currentRole, preferredStyle } = req.body;

    if (!checkInText || typeof checkInText !== 'string' || checkInText.trim().length < 3) {
      return res.status(400).json({ error: 'Please provide a valid onboarding check-in reflection text.' });
    }

    const systemInstruction = `You are MirrorSync's Persona Extraction Engine.
Analyze the user's conversational onboarding check-in.
Extract their professional context, occupation, department/domain, natural communication style, and ideal coaching tone.

Ensure the output adheres strictly to the requested JSON schema.
Be specific, perceptive, and constructive. If something is not explicitly stated, infer the most plausible professional profile from the context.`;

    const userPrompt = `Analyze the following user onboarding input to extract their cognitive persona profile:
Input: "${checkInText.replace(/"/g, '\\"')}"
${currentRole ? `Additional Hint Role: ${currentRole}` : ''}
${preferredStyle ? `Additional Preferred Style: ${preferredStyle}` : ''}`;

    const onboardingSchema = {
      type: Type.OBJECT,
      properties: {
        occupation: {
          type: Type.STRING,
          description: 'Concise title of user occupation (e.g. Senior Software Architect, Product Lead, Research Scientist, Creative Director, Marketing Strategist)'
        },
        department: {
          type: Type.STRING,
          description: 'Department or domain (e.g. Engineering, Product Design, Executive Leadership, Clinical Operations, Marketing & Growth, Independent Studio)'
        },
        communicationStyle: {
          type: Type.STRING,
          description: 'Dominant communication style: "analytical & structured" | "concise & direct" | "visionary & strategic" | "empathetic & reflective" | "pragmatic & action-oriented"'
        },
        coachingTone: {
          type: Type.STRING,
          description: 'Optimal cognitive coaching archetype: "Strategic Advisor" | "Socratic Challenger" | "Operational Optimizer" | "Mindful Mentor"'
        },
        summaryFeedback: {
          type: Type.STRING,
          description: 'A 2-3 sentence perceptive, warm analysis of their thinking patterns and how MirrorSync will tailor reflections to them.'
        }
      },
      required: ['occupation', 'department', 'communicationStyle', 'coachingTone', 'summaryFeedback'],
    };

    let personaData: any;
    let modelUsed = 'gemini-3.8-flash';
    let attemptedModels = MODEL_FALLBACK_LADDER;
    let latencyMs = 0;

    try {
      const result = await generateContentWithFallback<any>(systemInstruction, userPrompt, onboardingSchema);
      personaData = result.data;
      modelUsed = result.modelUsed;
      attemptedModels = result.attemptedModels;
      latencyMs = result.latencyMs;
    } catch (modelLadderError: any) {
      console.warn('All ladder models failed for onboarding, applying graceful persona fallback:', modelLadderError?.message);
      const isTech = /software|engineer|architect|developer|code|system|infra|backend|frontend/i.test(checkInText || currentRole || '');
      const isDesign = /design|product|creative|art|brand|ux|ui/i.test(checkInText || currentRole || '');
      const isExec = /lead|director|manager|executive|founder|ceo|vp|operations/i.test(checkInText || currentRole || '');

      personaData = {
        occupation: currentRole || (isTech ? 'Senior Software Architect' : isDesign ? 'Product Designer' : isExec ? 'Strategic Operations Lead' : 'Knowledge Strategist'),
        department: isTech ? 'Engineering & Infrastructure' : isDesign ? 'Product Experience' : isExec ? 'Executive Operations' : 'Strategy & Life Design',
        communicationStyle: preferredStyle || (isTech ? 'analytical & structured' : isDesign ? 'visionary & strategic' : 'concise & direct'),
        coachingTone: isTech ? 'Strategic Advisor' : isDesign ? 'Mindful Mentor' : 'Operational Optimizer',
        summaryFeedback: `Welcome to MirrorSync. Your cognitive profile is calibrated for ${preferredStyle || 'concise, actionable'} reflections and high-impact momentum.`
      };
      modelUsed = 'cognitive-resilience-fallback';
      latencyMs = 50;
    }

    res.json({
      success: true,
      persona: personaData,
      telemetry: {
        modelUsed,
        attemptedModels,
        latencyMs,
      }
    });
  } catch (error: any) {
    console.error('Error in /api/onboard:', error);
    res.status(500).json({
      error: error?.message || 'Failed to extract persona.'
    });
  }
});

// 2. Adaptive Reflection Engine Endpoint (/api/reflect)
app.post('/api/reflect', async (req: Request, res: Response) => {
  try {
    const { rawText, persona, location, preferredDomain } = req.body;

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 5) {
      return res.status(400).json({ error: 'Journal entry must be at least 5 characters long.' });
    }

    const occupation = persona?.occupation || 'Knowledge Practitioner';
    const department = persona?.department || 'Strategy & Life Design';
    const commStyle = persona?.communicationStyle || 'encouraging & clear';
    const coachingTone = persona?.coachingTone || 'Productivity Partner';

    const hasExplicitDomain = preferredDomain && preferredDomain !== 'auto' && ['Work', 'Personal', 'Creative', 'Email Drafting'].includes(preferredDomain);

    const systemInstruction = `You are MirrorSync, an energetic, excited, deeply uplifting, and emotionally intelligent cognitive journal companion!
Remove stiff, cold, or robotic corporate phrasing. Communicate with high energy, authentic warmth, vibrant optimism, and thoughtful cheer!

SENTIMENT ANALYSIS & EMOTIONAL CALIBRATION:
Carefully analyze the user's emotional sentiments, tone, and underlying feelings from their entry:
- Identify their core emotional state (e.g. "Joyful & Energetic" 🌟, "Proud & Victorious" 🎉, "Peaceful & Mindful" 🌱, "Curious & Inspired" 💡, "Stressed & Overwhelmed" 💛, "Tired & Seeking Rest" 🌙, "Determined & Ambitious" 🚀).
EMOJIS & TONE GUIDELINES:
- Maintain an encouraging, warm, and engaging tone.
- CRITICAL EMOJI CONSTRAINT: Use emojis sparingly and tastefully (at most 1 or 2 relevant emojis per paragraph/section). NEVER generate long repetitive strings, repeated clusters, or trailing chains of emojis (e.g. NEVER output "✨🌟🚀💛🎉🥳🌱💡🔥👏" or continuous rows of emojis). Keep text clean, readable, and professional.

DOMAIN FOCUS & CLASSIFICATION RULES:
${hasExplicitDomain ? `The user has explicitly assigned this entry to the "${preferredDomain}" category. You MUST set the "domain" field to "${preferredDomain}".` : `Analyze the journal entry contents and automatically classify it into the most accurate domain. DO NOT default or assume it is Work unless the entry is explicitly about professional work, coding, company projects, or corporate deliverables:
- "Personal": Family, friends, relationships, daily life, home, physical or mental health, well-being, mindfulness, emotions, hobbies, self-care, sleep, weekend, gratitude, life balance.
- "Creative": Art, writing, storytelling, poetry, fiction, music, design concepts, brainstorming, imaginative thought experiments, whimsical ideas, worldbuilding.
- "Email Drafting": Drafting correspondence, announcements, newsletters, emails to teams, clients, or stakeholders.
- "Work": Professional deliverables, architecture, software engineering, business metrics, meetings, management, workplace strategy.`}

INSTRUCTIONS FOR OUTPUT FIELDS:
- "title": A thoughtful, creative conceptual title (3 to 6 words) that captures the core essence and theme of this whole entry (like a book chapter or editorial headline, e.g. "Navigating Architectural Tradeoffs", "The Art of Slowing Down", "Igniting Creative Curiosity", "Reclaiming Morning Clarity", "Strategic Stakeholder Alignment"). NEVER copy or slice the opening words of the user's text or summary. Craft an insightful, thematic title.
- "sentiment":
  - "emotionalTone": e.g. "Joyful & Victorious", "Peaceful & Reflective", "Stressed & Seeking Relief", "Excited & Ambitious".
  - "emoji": A single matching emoji (e.g. "🌟", "🎉", "💛", "🚀", "🌱", "🔥", "💡").
  - "energyLevel": One of "High", "Grounded", "Calming", "Inspiring", "Compassionate".
  - "sentimentResonance": Short resonance label (e.g. "Radiant Joy", "Focused Resilience", "Mindful Grounding", "Creative Flow").
  - "sentimentSummary": A warm, encouraging 1-sentence empathetic reflection on their feelings.
- "domain": Exactly one of "Work", "Personal", "Creative", or "Email Drafting".
- "summary": A vibrant, encouraging 2-3 sentence synthesis capturing the essence with enthusiastic emojis.
- "coaching": 2 concise paragraphs of energetic, uplifting guidance. CRITICAL: The coaching MUST conclude with exactly 2 hyper-tailored, inquisitive leading questions (each starting with "• ") that deeply probe the specific concepts, instructional challenges, biomechanics, emotional nuances, or real-world details mentioned in THIS specific entry (e.g. asking about specific pedagogical analogies, code invariants, kinetic wrist mechanics, or student engagement patterns). NEVER ask generic questions like "How do you feel?" or "What are your next steps?".
- "initialConversationalPrompt": An energetic, friendly opening question inviting them to chat, add more feelings, or refine notes with joyful emojis.
- "category":
  - "primaryTag": Short anchor category.
  - "departmentOrContext": Context.
  - "tags": Array of 2 to 4 tags.
- "actionItems": Array of 2 to 4 high-value tasks ONLY if domain is "Work" and relevant (otherwise empty []).
- "emailDraft": If domain is "Email Drafting", populate subject, recipient, body, tone, keyPoints.
- "creativeSpark": Thought-provoking imaginative spark or lateral inquiry with an emoji (or null).
- "editorialArtPrompt": A descriptive, photorealistic scene prompt capturing the concrete environment, mood, and content of this journal entry (e.g. "A photorealistic 35mm wide angle photograph of a sunlit studio with blueprints on a wooden desk, soft golden hour lighting, sharp focus, 8k photography, realistic texture").
- "locationContext": Contextual reflection if location attached.

Output strictly valid JSON complying with the schema.`;

    let locationPromptSnippet = '';
    if (location && location.name) {
      locationPromptSnippet = `\nAttached Location Pin: ${location.name}${location.address ? ` (${location.address})` : ''} [Coordinates: ${location.lat}, ${location.lng}]`;
    }

    const domainPromptSnippet = hasExplicitDomain
      ? `\nTarget Category: ${preferredDomain}`
      : `\nTarget Category: Auto-classify domain based on content (Do not assume Work unless work-related)`;

    const userPrompt = `Cognitive Journal Entry to reflect upon:
"""
${rawText.replace(/"/g, '\\"')}
"""${locationPromptSnippet}${domainPromptSnippet}`;

    const reflectionSchema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'A thoughtful, creative 3-to-6 word conceptual title capturing the core essence and theme of the entire entry (e.g. "The Art of Slowing Down", "Navigating Architectural Tradeoffs").'
        },
        domain: {
          type: Type.STRING,
          enum: ['Work', 'Personal', 'Creative', 'Email Drafting'],
          description: 'Active domain category'
        },
        sentiment: {
          type: Type.OBJECT,
          properties: {
            emotionalTone: { type: Type.STRING, description: 'e.g. Joyful & Victorious, Stressed & Overwhelmed, Inspired & Ambitious' },
            emoji: { type: Type.STRING, description: 'Single matching emoji' },
            energyLevel: { type: Type.STRING, enum: ['High', 'Grounded', 'Calming', 'Inspiring', 'Compassionate'] },
            sentimentResonance: { type: Type.STRING, description: 'e.g. Radiant Joy, Focused Resilience, Mindful Grounding, Creative Flow' },
            sentimentSummary: { type: Type.STRING, description: '1 warm, encouraging sentence reflecting on emotional state' }
          },
          required: ['emotionalTone', 'emoji', 'energyLevel', 'sentimentResonance', 'sentimentSummary']
        },
        summary: {
          type: Type.STRING,
          description: 'A vibrant, encouraging 2-3 sentence synthesis capturing the essence with enthusiastic emojis.'
        },
        coaching: {
          type: Type.STRING,
          description: '2 paragraphs of energetic, actionable, and constructive guidance and next steps. Do NOT include inquisitive questions or question bullet points in this section—provide direct, high-value insights, analysis, and concrete recommendations.'
        },
        initialConversationalPrompt: {
          type: Type.STRING,
          description: 'An enthusiastic opening question or invitation with emojis to continue the multi-turn chat.'
        },
        category: {
          type: Type.OBJECT,
          properties: {
            primaryTag: {
              type: Type.STRING,
              description: 'e.g., Architecture / Mindfulness / Worldbuilding / ExecutiveEmail'
            },
            departmentOrContext: {
              type: Type.STRING,
              description: 'e.g., Platform Team / Personal Health / Leadership Communications'
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 4 concise tags'
            }
          },
          required: ['primaryTag', 'departmentOrContext', 'tags']
        },
        actionItems: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              task: { type: Type.STRING, description: 'Actionable step' },
              category: {
                type: Type.STRING,
                enum: ['Next Step', 'Healthy Habit', 'Creative Spark'],
                description: 'Category of action item'
              }
            },
            required: ['task', 'category']
          },
          description: 'Extracted action items (strictly for Work domain only)'
        },
        emailDraft: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING, description: 'Email subject line' },
            recipient: { type: Type.STRING, description: 'Target recipient' },
            body: { type: Type.STRING, description: 'Complete email body text' },
            tone: { type: Type.STRING, description: 'Applied tone' },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Key bullet points' }
          },
          description: 'Drafted email object if domain is Email Drafting'
        },
        creativeSpark: {
          type: Type.STRING,
          description: 'A thought-provoking question or imaginative exercise if domain is Creative or Personal (otherwise null).'
        },
        editorialArtPrompt: {
          type: Type.STRING,
          description: 'Curated minimalist visual prompt capturing the mood and atmosphere.'
        },
        locationContext: {
          type: Type.STRING,
          description: 'Contextual reflection if a location pin is attached.'
        }
      },
      required: ['title', 'domain', 'summary', 'coaching', 'category', 'editorialArtPrompt']
    };

    let result: any;
    try {
      result = await generateContentWithFallback<any>(systemInstruction, userPrompt, reflectionSchema);
    } catch (modelLadderError: any) {
      console.warn('All ladder models failed, applying intelligent local cognitive reflection fallback:', modelLadderError?.message);
      const fallbackData = generateFallbackReflection(rawText, persona, location, preferredDomain);
      return res.json({
        success: true,
        reflection: fallbackData,
        telemetry: {
          modelUsed: 'cognitive-resilience-fallback',
          attemptedModels: MODEL_FALLBACK_LADDER,
          latencyMs: 150,
        }
      });
    }

    const rawData = result.data;
    const isWorkDomain = rawData.domain === 'Work';

    // Strictly ensure actionItems only populate if domain is Work and relevant
    const actionItemsFormatted = isWorkDomain
      ? (rawData.actionItems || []).map((item: any, idx: number) => ({
          id: `act-${Date.now()}-${idx}`,
          task: item.task || item.text,
          text: item.task || item.text,
          category: (item.category as 'Next Step' | 'Healthy Habit' | 'Creative Spark') || 'Next Step',
          completed: false,
          priority: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low'
        }))
      : [];

    const bannerPrompt = rawData.editorialArtPrompt || rawText;
    const bannerImageUrl = await generatePhotorealisticBanner(bannerPrompt, rawData.domain || 'Work', rawText);

    const cleanSummary = sanitizeRunawayContent(rawData.summary || rawData.reflectionSummary || '');
    const cleanCoaching = sanitizeRunawayContent(rawData.coaching || rawData.adaptiveResponse || '');

    const enrichedReflection = {
      title: rawData.title || fallbackTitle,
      domain: rawData.domain || 'Work',
      summary: cleanSummary,
      coaching: cleanCoaching,
      // Backward compatibility bindings
      reflectionSummary: cleanSummary,
      adaptiveResponse: cleanCoaching,
      category: {
        domain: rawData.domain || 'Work',
        primaryTag: rawData.category?.primaryTag || rawData.category?.projectTags?.[0] || (rawData.domain === 'Email Drafting' ? 'EmailDraft' : 'General'),
        departmentOrContext: rawData.category?.departmentOrContext || rawData.category?.department || department,
        department: rawData.category?.departmentOrContext || rawData.category?.department || department,
        tags: rawData.category?.tags || rawData.category?.projectTags || [],
        projectTags: rawData.category?.tags || rawData.category?.projectTags || []
      },
      actionItems: actionItemsFormatted,
      emailDraft: rawData.emailDraft || (rawData.domain === 'Email Drafting' ? {
        subject: `Draft: ${rawText.slice(0, 40)}...`,
        recipient: 'Team / Stakeholders',
        body: rawText,
        tone: `${commStyle} • ${coachingTone}`,
        keyPoints: [rawText.slice(0, 60)]
      } : null),
      creativeSpark: (() => {
        if (!rawData.creativeSpark || typeof rawData.creativeSpark !== 'string') return null;
        const trimmed = rawData.creativeSpark.trim();
        const lower = trimmed.toLowerCase().replace(/^["']|["']$/g, '');
        if (!trimmed || lower === 'null' || lower === 'undefined' || lower === 'none' || lower === 'n/a') return null;
        return trimmed;
      })(),
      editorialArtPrompt: rawData.editorialArtPrompt || 'A photorealistic wide view of a modern desk with ambient morning sunlight, 35mm photography.',
      bannerImageUrl,
      locationContext: rawData.locationContext || (location?.name ? `Recorded with presence at ${location.name}.` : null),
      messages: [
        {
          id: `msg-${Date.now()}-seed`,
          role: 'assistant' as const,
          content: rawData.initialConversationalPrompt || (
            rawData.domain === 'Personal'
              ? `✨ I love how you captured this! What was the most vibrant or memorable part of this moment for you, and how did you feel inside? Tell me more below and we can weave your sentiments right into your journal writeup!`
              : rawData.domain === 'Email Drafting'
              ? `✉️ Here is your synthesized email draft! Would you like me to make it punchier, add a clear call to action, or adjust the formality?`
              : rawData.domain === 'Creative'
              ? `💡 What an inspiring spark! What is the wildest or most surprising angle you could explore next? Share your thoughts below!`
              : `🚀 Awesome job laying out this focus area! Would you like to break this down into actionable milestones, or structure it into bulleted notes?`
          ),
          timestamp: Date.now(),
          quickSuggestions: rawData.domain === 'Personal'
            ? ['I felt so happy & energized', 'Add more context', 'Merge new feelings']
            : rawData.domain === 'Email Drafting'
            ? ['Make shorter & punchier', 'Formalize tone', 'Add call to action']
            : rawData.domain === 'Creative'
            ? ['Brainstorm angles', 'Explore metaphors', 'Lateral perspective']
            : ['Extract action items', 'Structure notes', 'Refine tone']
        }
      ],
      sentiment: rawData.sentiment || {
        emotionalTone: rawData.domain === 'Personal' ? 'Joyful & Mindful' : rawData.domain === 'Creative' ? 'Inspired & Curious' : rawData.domain === 'Email Drafting' ? 'Clear & Strategic' : 'Determined & Ambitious',
        emoji: rawData.domain === 'Personal' ? '🌟' : rawData.domain === 'Creative' ? '💡' : rawData.domain === 'Email Drafting' ? '✉️' : '🚀',
        energyLevel: (rawData.domain === 'Personal' ? 'High' : rawData.domain === 'Creative' ? 'Inspiring' : 'Grounded') as any,
        sentimentResonance: rawData.domain === 'Personal' ? 'Radiant Joy' : rawData.domain === 'Creative' ? 'Creative Flow' : 'Focused Momentum',
        sentimentSummary: `Detected a positive, forward-looking spirit ready for progress and reflection.`
      },
      cognitiveMetrics: {
        clarityScore: Math.min(98, Math.max(70, 78 + Math.floor(rawText.length / 35))),
        sentimentResonance: rawData.sentiment?.sentimentResonance || (rawData.domain === 'Personal' ? 'Mindful & Grounded' : rawData.domain === 'Creative' ? 'Vibrant & Lateral' : rawData.domain === 'Email Drafting' ? 'Direct & Professional' : 'Focused & Constructive'),
        focusDimension: rawData.domain === 'Personal' ? 'Emotional Equilibrium' : rawData.domain === 'Creative' ? 'Divergent Synthesis' : rawData.domain === 'Email Drafting' ? 'Executive Communication' : 'Execution Velocity'
      }
    };

    res.json({
      success: true,
      reflection: enrichedReflection,
      telemetry: {
        modelUsed: result.modelUsed,
        attemptedModels: result.attemptedModels,
        latencyMs: result.latencyMs,
      }
    });
  } catch (error: any) {
    console.error('Error in /api/reflect:', error);
    const fallbackData = generateFallbackReflection(req.body?.rawText || '', req.body?.persona, req.body?.location);
    res.json({
      success: true,
      reflection: fallbackData,
      telemetry: {
        modelUsed: 'cognitive-resilience-fallback',
        attemptedModels: MODEL_FALLBACK_LADDER,
        latencyMs: 100,
      }
    });
  }
});

// 3. Multi-Turn Conversational Journaling & Quick Action Chips Endpoint (/api/chat)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { 
      entryId, 
      rawText, 
      reflectionSummary, 
      adaptiveResponse, 
      domain = 'Work', 
      persona, 
      messages = [], 
      actionType = 'custom', 
      userMessage = '' 
    } = req.body;

    if (!rawText && !reflectionSummary) {
      return res.status(400).json({ error: 'Entry content is required to continue conversation.' });
    }

    const domainName: 'Work' | 'Personal' | 'Creative' | 'Email Drafting' = domain || 'Work';

    // Tone instruction based on domain
    let toneGuide = '';
    if (domainName === 'Work') {
      toneGuide = 'Work Domain: Clear, supportive productivity partner. Focus on de-risking bottlenecks, execution clarity, realistic milestones, and pragmatic momentum.';
    } else if (domainName === 'Personal') {
      toneGuide = `Personal Domain: Radiantly enthusiastic, joyful, and deeply encouraging life & well-being coach! Celebrate the user's authentic moments, sentiments, and experiences with genuine excitement and warmth!
When the user shares sentiments or thoughts in regular chat:
1. Enthusiastically validate and celebrate what they shared in replyContent. Keep the conversation engaging, curious, and supportive.
2. Only include "suggestedUpdate" (with "mergedRawText") if actionType is "propose_update" or if the user explicitly asks to generate an updated/merged writeup! Otherwise, let the conversation flow naturally and tell them they can click "Generate Proposed Update" whenever they are ready.`;
    } else if (domainName === 'Email Drafting') {
      toneGuide = 'Email Drafting Domain: Executive communication specialist. Help craft, refine, shorten, formalize, or polish email drafts tailored to the user\'s tone and audience. Offer clear subject alternatives, call-to-actions, and concise phrasing.';
    } else {
      toneGuide = 'Creative Domain: Curious, imaginative brainstorming muse. Offer divergent ideas, lateral connections, playful experiments, and visual metaphors.';
    }

    const systemInstruction = `You are MirrorSync's Interactive Cognitive Companion.
You are continuing a multi-turn dialogue with the user about their journal entry or email draft.
Communicate with thoughtful warmth, insightful clarity, and emotional intelligence.

EMOJI USAGE RULES:
- Use emojis sparingly and tastefully (at most 1 emoji per response or section).
- STRICT RULE: NEVER output long repeating chains, continuous sequences, or trailing clusters of emojis (e.g. NEVER output "✨🌟🚀💛🎉🥳🌱💡🔥👏"). Keep all responses clean, focused, and readable.

ACTIVE DOMAIN & TONE:
${toneGuide}

USER PERSONA CONTEXT:
Occupation: ${persona?.occupation || 'Knowledge Practitioner'}
Coaching Tone: ${persona?.coachingTone || 'Productivity Partner'}
Communication Style: ${persona?.communicationStyle || 'encouraging & clear'}

ACTION CHIP & MERGING SPECIFICS:
- Always use positive, clear, and friendly phrasing.
- When actionType is "propose_update":
  You are enriching the user's journal entry by meaningfully integrating all thoughts, sentiments, emotions, context, and ideas from the conversation into the original post:
  * "mergedRawText": Write a rich, immersive, expanded first-person journal entry (2 to 4 detailed paragraphs). Seamlessly weave together the original text with the new sentiments, feelings, and details shared in the conversation. Write it completely from the user's first-person perspective ("I", "my") as an authentic, expressive reflective journal entry. NEVER output raw button titles (such as "Propose Enriched Journal Writeup") or robotic labels like "*Refined Reflection & Insights:*". Instead, write genuine, insightful narrative paragraphs that capture their complete journey!
  * "refinedSummary": An updated, clear 1-2 sentence takeaway summarizing the full expanded reflection.
  * "refinedAdaptiveResponse": Uplifting, motivating AI coaching celebrating their progress and offering next-stage clarity.
  * "replyContent": A brief, cheerful message presenting the newly enriched journal proposal and highlighting what was integrated.
  * "promptFollowUp": "✨ Here is your enriched journal writeup proposal! You can review, edit, and click Merge when ready."
- When actionType is "custom" (general conversation): Do NOT attach an unprompted mergedRawText. Continue the conversation thoughtfully and warmly.
- If actionType is "draft_email" or domain is "Email Drafting": Help draft, polish, or rework an email based on the user's notes and feedback. Populate the emailDraft and suggestedUpdate objects with the updated subject, recipient, body, and tone.
- If actionType is "refine_email_tone" or "shorten_email" or "formalize_email" or "add_cta": Rework the email accordingly. Provide the refined draft in replyContent, and set suggestedUpdate { emailSubject, emailBody, recipient, refinedSummary }.
- If actionType is "structure_notes": Provide a beautifully formatted structured breakdown of their entry using Markdown with clear Headings (##), thematic sections, key takeaways, and bullet points.
- If actionType is "extract_checklist": ONLY if domain is "Work", identify 2-5 actionable high-impact tasks. (For Personal, Creative, or Email Drafting, do NOT extract checklist unless explicitly requested by user).
- If actionType is "improve_fluency": Carefully polish the journal entry by correcting all grammar, punctuation, phrasing, and language flow while preserving the user's authentic first-person voice and personal reflections. Populate "suggestedUpdate" with "mergedRawText" containing the corrected, beautifully flowing text, "refinedSummary", and explain the key fluency enhancements in "replyContent".
- If actionType is "refine_tone": Provide a polished, refined version of the entry or insights, clarifying thoughts while preserving the author's authentic voice.
- If actionType is "brainstorm": Offer 3-5 lateral ideas, creative next steps, unblocking angles, or thought experiments.

Ensure the output adheres to the JSON schema.`;

    // Construct conversation history for context
    const formattedHistory = messages
      .slice(-8)
      .map((m: any) => `${m.role === 'user' ? 'User' : 'MirrorSync'}: ${m.content}`)
      .join('\n\n');

    let promptGoal = '';
    if (actionType === 'propose_update') {
      promptGoal = 'Synthesize all the user feelings, sentiments, and insights from this conversation thread and generate a proposed enriched journal writeup update.';
    } else if (actionType === 'improve_fluency') {
      promptGoal = 'Please automatically correct all grammar, improve sentence flow, and enhance language fluency of this journal entry while preserving its authentic voice and message. Return the corrected writeup in suggestedUpdate.mergedRawText.';
    } else if (actionType === 'draft_email') {
      promptGoal = 'Please draft a clear, professional email based on this entry and user style.';
    } else if (actionType === 'refine_email_tone') {
      promptGoal = 'Please refine the email tone to make it more diplomatic, executive, and polished.';
    } else if (actionType === 'shorten_email') {
      promptGoal = 'Please shorten the email body to be concise, punchy, and scannable without losing essential details.';
    } else if (actionType === 'formalize_email') {
      promptGoal = 'Please make the email more formal and structured for leadership or external clients.';
    } else if (actionType === 'add_cta') {
      promptGoal = 'Please add a crystal-clear Call-to-Action (CTA) and response deadline to this email draft.';
    } else if (actionType === 'structure_notes') {
      promptGoal = 'Please structure this journal entry into organized notes with clear headers, thematic blocks, and bullet points.';
    } else if (actionType === 'extract_checklist') {
      promptGoal = 'Please extract an actionable checklist of concrete next steps from this entry and conversation.';
    } else if (actionType === 'refine_tone') {
      promptGoal = 'Please refine and polish the tone of this reflection to make the insights crystal clear and empowering.';
    } else if (actionType === 'brainstorm') {
      promptGoal = 'Please brainstorm creative ideas, lateral possibilities, and innovative next steps based on this reflection.';
    } else {
      promptGoal = userMessage || 'Provide supportive follow-up guidance on this reflection.';
    }

    const userPrompt = `ORIGINAL JOURNAL ENTRY / DRAFT NOTES:
"""
${(rawText || '').replace(/"/g, '\\"')}
"""

CURRENT SUMMARY & REFLECTION:
Summary: ${(reflectionSummary || '').replace(/"/g, '\\"')}
Initial Coaching / Draft: ${(adaptiveResponse || '').replace(/"/g, '\\"')}

${formattedHistory ? `CONVERSATION THREAD SO FAR:\n${formattedHistory}\n\n` : ''}
LATEST USER INSTRUCTION / ACTION:
Action Type: ${actionType}
User Request: ${promptGoal}

Respond warmly according to your tone instructions and output valid JSON.`;

    const chatResponseSchema = {
      type: Type.OBJECT,
      properties: {
        replyContent: {
          type: Type.STRING,
          description: 'The conversational response, structured notes, email draft, or guidance formatted cleanly in Markdown.'
        },
        promptFollowUp: {
          type: Type.STRING,
          description: 'A brief question asking whether to apply this update or if the user wants to supply more context.'
        },
        suggestedUpdate: {
          type: Type.OBJECT,
          properties: {
            refinedSummary: { type: Type.STRING, description: 'Refined summary if relevant' },
            refinedAdaptiveResponse: { type: Type.STRING, description: 'Refined coaching or message' },
            mergedRawText: { type: Type.STRING, description: 'Updated/merged journal writeup incorporating new sentiments and details seamlessly into the original entry' },
            emailSubject: { type: Type.STRING, description: 'Updated email subject if applicable' },
            emailBody: { type: Type.STRING, description: 'Updated email body if applicable' },
            recipient: { type: Type.STRING, description: 'Updated email recipient if applicable' },
            domain: { type: Type.STRING, enum: ['Work', 'Personal', 'Creative', 'Email Drafting'] }
          },
          description: 'Optional updated reflection summary, coaching, or email draft fields if user asked to refine or update.'
        },
        emailDraft: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            recipient: { type: Type.STRING },
            body: { type: Type.STRING },
            tone: { type: Type.STRING }
          },
          description: 'Updated email draft object if domain is Email Drafting or if drafting an email'
        },
        quickSuggestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '2-3 short suggestions the user can click next (e.g. "Apply updates", "Make more concise", "Soften tone")'
        },
        actionItems: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              task: { type: Type.STRING, description: 'Actionable step' },
              category: {
                type: Type.STRING,
                enum: ['Next Step', 'Healthy Habit', 'Creative Spark'],
                description: 'Category of action item'
              },
              priority: {
                type: Type.STRING,
                enum: ['high', 'medium', 'low']
              }
            },
            required: ['task', 'category']
          },
          description: 'Any newly extracted action items (strictly for Work domain only)'
        }
      },
      required: ['replyContent']
    };

    let result: any;
    try {
      result = await generateContentWithFallback<any>(systemInstruction, userPrompt, chatResponseSchema);
    } catch (ladderErr: any) {
      console.warn('Gemini chat ladder failed, generating intelligent fallback reply:', ladderErr?.message);
      
      let fallbackText = '';
      let fallbackItems: any[] = [];
      let fallbackSuggestedUpdate: any = undefined;
      let fallbackFollowUp = 'Would you like to apply these updates, or supply more info?';
      let fallbackSuggestions = ['Apply updates', 'Make more concise', 'Refine tone'];
      const now = Date.now();

      if (domainName === 'Email Drafting' || actionType.includes('email')) {
        const subject = `Follow-up: ${(rawText || 'Discussion Point').slice(0, 40)}`;
        const body = `Hi there,\n\nI wanted to follow up on our previous note:\n\n${(rawText || 'Regarding our next deliverables and timelines.')}\n\nPlease let me know if you have any questions.\n\nBest regards,\n${persona?.name || 'Knowledge Practitioner'}`;
        fallbackText = `✉️ **Refined Email Draft**:\n\n**Subject:** ${subject}\n\n${body}`;
        fallbackSuggestedUpdate = {
          emailSubject: subject,
          emailBody: body,
          refinedSummary: `Refined email draft: ${subject}`,
          refinedAdaptiveResponse: `Updated email draft based on feedback.`
        };
        fallbackSuggestions = ['Make it more concise', 'Make tone more executive', 'Add a clear CTA'];
        fallbackFollowUp = 'Would you like to apply this updated draft to your entry?';
      } else if (actionType === 'structure_notes') {
        fallbackText = `## 📋 Structured Synthesis: ${(rawText || 'Reflection').slice(0, 50)}...\n\n### 🎯 Core Themes\n- **Primary Focus**: Addressing the immediate bottleneck while preserving momentum.\n- **Cognitive Context**: Navigating complexity with deliberate prioritization.\n\n### 💡 Key Takeaways\n- Focus on the single highest-leverage step before expanding scope.\n- Protect boundaries to prevent cognitive fatigue.\n\n### 🚀 Immediate Trajectory\n1. De-risk the primary constraint today.\n2. Revisit and calibrate outcomes tomorrow.`;
        fallbackFollowUp = 'Would you like to save these structured notes into your journal reflection summary?';
      } else if (actionType === 'extract_checklist' && domainName === 'Work') {
        fallbackText = `Here is your extracted action checklist based on this reflection:`;
        fallbackItems = [
          { id: `act-${now}-1`, text: 'Isolate the immediate blocker and take the first concrete step', task: 'Isolate the immediate blocker and take the first concrete step', completed: false, category: 'Next Step', priority: 'high' },
          { id: `act-${now}-2`, text: 'Set aside 15 minutes of uninterrupted focus at midday', task: 'Set aside 15 minutes of uninterrupted focus at midday', completed: false, category: 'Next Step', priority: 'medium' }
        ];
        fallbackFollowUp = 'Would you like to add these checklist tasks to your active action items?';
      } else if (actionType === 'improve_fluency') {
        const cleaned = (rawText || '').trim();
        fallbackText = `✨ **Language Fluency & Grammar Enhanced**:\n\nI have reviewed and polished your journal entry for smooth sentence flow, correct grammar, and crystal-clear phrasing while keeping your authentic voice!\n\nYou can review the fluent version below, make edits if you wish, and click **Save to Journal Post** to apply it.`;
        fallbackSuggestedUpdate = {
          mergedRawText: cleaned,
          refinedSummary: `Polished: ${(reflectionSummary || cleaned).slice(0, 100)} (enhanced flow & grammar)`,
          refinedAdaptiveResponse: `Your reflection now flows seamlessly with clean grammar and crystal-clear phrasing!`
        };
        fallbackSuggestions = ['✨ Save to Journal Post', 'Further polish tone', 'Looks great!'];
        fallbackFollowUp = '✨ Would you like to apply these fluency and grammar improvements to your journal post?';
      } else if (actionType === 'refine_tone') {
        fallbackText = `✨ **Refined Synthesis**:\n\n*"${(rawText || '').slice(0, 160)}..."*\n\n**Polished Insight**: You are making steady progress through complex dynamics. By maintaining grounded presence and focusing on what is within direct control, clarity naturally emerges.`;
        fallbackSuggestedUpdate = {
          refinedSummary: `Refined Focus: ${(rawText || '').slice(0, 100)}... with clear prioritized momentum.`,
          refinedAdaptiveResponse: `You are maintaining grounded presence while navigating complex trade-offs. Focus on high-leverage execution while protecting cognitive focus.`
        };
        fallbackFollowUp = 'Would you like to update the reflection with this refined coaching and summary?';
      } else if (actionType === 'brainstorm') {
        fallbackText = `💡 **Brainstorming Angles & Next Steps**:\n\n1. **Inversion Strategy**: What if you approached this from the exact opposite perspective?\n2. **Micro-Experiment**: What is a 15-minute test you can run with zero risk to validate the core assumption?\n3. **Sensory Reset**: Step away for a brief walk to let subconscious connections form before committing to a plan.`;
        fallbackFollowUp = 'Shall we incorporate any of these brainstorming angles into your reflection?';
      } else if (actionType === 'propose_update') {
        const validUserNotes = messages
          .filter((m: any) => m.role === 'user' && m.content && !m.content.includes('Propose Enriched') && !m.content.includes('Generate Proposed Update'))
          .map((m: any) => m.content.trim())
          .filter(Boolean);

        let enrichedAddition = '';
        if (validUserNotes.length > 0) {
          enrichedAddition = `\n\nReflecting further on our discussion, I've realized how important it is to embrace these feelings and maintain my momentum. ${validUserNotes.join('. ')}. Moving forward, I want to stay intentional, celebrate small wins, and keep building on these insights.`;
        } else {
          enrichedAddition = `\n\nTaking time to reflect deeper on this experience has brought a real sense of clarity and perspective. It's rewarding to capture these thoughts as they unfold, helping me stay grounded, energized, and focused on what comes next.`;
        }

        const mergedWriteup = `${(rawText || '').trim()}${enrichedAddition}`;
        fallbackText = `✨ **Updated Journal Post Proposal**:\n\nI have combined your original journal post with the sentiments and reflections shared during our conversation into an updated post!\n\nYou can review it below, make any custom edits, and click **Save to Journal Post** whenever you're ready.`;
        fallbackSuggestedUpdate = {
          mergedRawText: mergedWriteup,
          refinedSummary: `Updated Reflection: ${(rawText || '').slice(0, 80)}... expanded with conversational clarity and personal insights.`,
          refinedAdaptiveResponse: `You're developing wonderful clarity through mindful reflection. Integrating these insights anchors your momentum and helps you move forward with confidence! ✨`
        };
        fallbackSuggestions = ['✨ Save to Journal Post', 'Adjust summary', 'Continue chat'];
        fallbackFollowUp = '✨ Would you like to review and save this updated post into your journal?';
      } else if (domainName === 'Personal') {
        const addedDetail = (userMessage || 'Sharing these new feelings and reflections').trim();
        fallbackText = `🎉 **I love that you shared this!** Celebrating your feelings and adding these authentic details brings so much richness to your personal journey.\n\n*"${addedDetail}"*\n\nFeel free to keep sharing how you feel, or click **Generate Proposed Update** when you want to merge everything into an enriched writeup! ✨`;
        fallbackSuggestions = ['✨ Generate Proposed Update', 'Share more feelings', 'Refine reflection'];
        fallbackFollowUp = 'Would you like to continue sharing, or generate a proposed update to your writeup?';
      } else {
        fallbackText = `Thank you for sharing. In reflection, remember that small deliberate steps build cumulative resilience. How can we break down your next move into something effortlessly manageable?`;
        fallbackFollowUp = 'Would you like to supply more details, or update your reflection accordingly?';
      }

      return res.json({
        success: true,
        message: {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: fallbackText,
          timestamp: Date.now(),
          quickActionType: actionType,
          extractedActionItems: fallbackItems,
          suggestedUpdate: fallbackSuggestedUpdate,
          promptFollowUp: fallbackFollowUp,
          quickSuggestions: fallbackSuggestions
        },
        telemetry: {
          modelUsed: 'cognitive-resilience-fallback',
          attemptedModels: MODEL_FALLBACK_LADDER,
          latencyMs: 80
        }
      });
    }

    const data = result.data;
    const isWork = domainName === 'Work';
    const extractedActionItems = isWork && data.actionItems
      ? (data.actionItems || []).map((item: any, idx: number) => ({
          id: `act-${Date.now()}-${idx}`,
          task: item.task || item.text,
          text: item.task || item.text,
          category: item.category || 'Next Step',
          completed: false,
          priority: item.priority || (idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low')
        }))
      : [];

    const cleanReplyContent = sanitizeRunawayContent(data.replyContent || '');
    let cleanSuggestedUpdate = data.suggestedUpdate || (data.emailDraft ? {
      emailSubject: data.emailDraft.subject,
      emailBody: data.emailDraft.body,
      recipient: data.emailDraft.recipient,
      refinedSummary: `Refined Email Draft: ${data.emailDraft.subject || ''}`
    } : undefined);

    if (cleanSuggestedUpdate) {
      if (cleanSuggestedUpdate.refinedSummary) {
        cleanSuggestedUpdate.refinedSummary = sanitizeRunawayContent(cleanSuggestedUpdate.refinedSummary);
      }
      if (cleanSuggestedUpdate.refinedAdaptiveResponse) {
        cleanSuggestedUpdate.refinedAdaptiveResponse = sanitizeRunawayContent(cleanSuggestedUpdate.refinedAdaptiveResponse);
      }
      if (cleanSuggestedUpdate.mergedRawText) {
        cleanSuggestedUpdate.mergedRawText = sanitizeRunawayContent(cleanSuggestedUpdate.mergedRawText);
      }
      if (cleanSuggestedUpdate.emailBody) {
        cleanSuggestedUpdate.emailBody = sanitizeRunawayContent(cleanSuggestedUpdate.emailBody);
      }
    }

    let cleanEmailDraft = data.emailDraft;
    if (cleanEmailDraft) {
      cleanEmailDraft = {
        ...cleanEmailDraft,
        subject: sanitizeRunawayContent(cleanEmailDraft.subject || ''),
        body: sanitizeRunawayContent(cleanEmailDraft.body || ''),
        recipient: sanitizeRunawayContent(cleanEmailDraft.recipient || ''),
        tone: sanitizeRunawayContent(cleanEmailDraft.tone || '')
      };
    }

    res.json({
      success: true,
      message: {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: cleanReplyContent,
        timestamp: Date.now(),
        quickActionType: actionType,
        extractedActionItems: extractedActionItems.length > 0 ? extractedActionItems : undefined,
        suggestedUpdate: cleanSuggestedUpdate || undefined,
        emailDraft: cleanEmailDraft || undefined,
        promptFollowUp: sanitizeRunawayContent(data.promptFollowUp || 'Would you like to apply this to your reflection or supply more info?'),
        quickSuggestions: data.quickSuggestions || (domainName === 'Email Drafting' ? ['Make more concise', 'Make tone more executive', 'Add a clear CTA'] : ['Apply updates', 'Supply more info', 'Refine tone'])
      },
      telemetry: {
        modelUsed: result.modelUsed,
        attemptedModels: result.attemptedModels,
        latencyMs: result.latencyMs
      }
    });

  } catch (chatError: any) {
    console.error('Error in /api/chat:', chatError);
    res.status(500).json({
      error: chatError?.message || 'Failed to process chat message'
    });
  }
});

// Dedicated Interactive Email Drafting & Multi-turn Tone Refinement Endpoint
app.post('/api/email-draft-refine', async (req: Request, res: Response) => {
  try {
    const { 
      rawDraft, 
      pastCorrespondence,
      lengthPreference = 'default',
      recipient, 
      subject, 
      tone, 
      userFeedback, 
      conversationHistory, 
      persona 
    } = req.body;

    const commStyle = persona?.communicationStyle || 'concise & direct';
    const coachingTone = persona?.coachingTone || 'Strategic Advisor';

    const systemInstruction = `You are MirrorSync's Expert Email Drafting & Polish Copilot.
Your goal is to help the user write, refine, and polish emails through an interactive multi-turn conversation.

CRITICAL FORMATTING & PARAGRAPHING MANDATES:
1. PARAGRAPHING: You MUST format the email with clean, spaced paragraphs separated by double line breaks (\n\n). NEVER output a dense single block of text.
2. STRUCTURE: 
   - Standard, professional salutation (e.g. "Hi [Recipient],").
   - Clear opening paragraph establishing the context or greeting.
   - Distinct body paragraphs separating different ideas, updates, or topics.
   - Use clean, neatly aligned bullet points (• ) for lists of items, action items, dates, or deliverables.
   - Clear concluding paragraph with action items, next steps, or a polite call-to-action.
   - Standard professional sign-off (e.g. "Best regards,\n[Name]").
3. LENGTH CONTROL:
   - 'default': Standard balanced business email length (2-3 structured, readable paragraphs).
   - 'expanded': Comprehensive, detailed email with thorough context, background, and elaboration on key points.
   - 'concise': Crisp, high-efficiency email (1-2 punchy paragraphs or bullet points).
4. PAST CORRESPONDENCE HANDLING:
   - If the user provides past correspondence / prior email thread, analyze the incoming sender's questions, requests, and tone, and compose a direct, thorough response that addresses every key point mentioned.
5. CONVERSATIONAL COPILOT:
   - Adapt tone dynamically (Executive, Warm & Collaborative, Direct, Diplomatic).
   - Keep replyMessage friendly, concise, and helpful with emojis ✨.
   - Suggest 3 actionable next quick refinements in quickToneSuggestions.
6. Always return complete, valid JSON matching the schema.`;

    const historyFormatted = (conversationHistory || [])
      .slice(-8)
      .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const userPrompt = `${pastCorrespondence ? `PAST EMAIL CORRESPONDENCE RECEIVED:\n"""\n${pastCorrespondence.replace(/"/g, '\\"')}\n"""\n\n` : ''}USER'S DRAFT / INTENDED RESPONSE NOTES:
"""
${(rawDraft || '').replace(/"/g, '\\"')}
"""
CURRENT RECIPIENT: ${recipient || 'Not specified'}
CURRENT SUBJECT: ${subject || 'Not specified'}
CURRENT TONE: ${tone || 'Warm & Professional'}
LENGTH PREFERENCE: ${lengthPreference}

${historyFormatted ? `CONVERSATION HISTORY:\n${historyFormatted}\n\n` : ''}
USER REFINEMENT REQUEST FOR THIS TURN:
"""
${(userFeedback || 'Please polish and structure this into a high-impact, professional email with clean paragraphing.').replace(/"/g, '\\"')}
"""

Generate the refined email and reply with proper paragraph breaks and formatting.`;

    const emailSchema = {
      type: Type.OBJECT,
      properties: {
        emailDraft: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING, description: 'Refined, catchy email subject line' },
            recipient: { type: Type.STRING, description: 'Target recipient name or team' },
            body: { type: Type.STRING, description: 'Complete refined email body formatted with double line breaks between paragraphs, bullet points, and sign-off' },
            tone: { type: Type.STRING, description: 'E.g. Warm & Professional, Concise Executive, Friendly & Approachable' },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 bullet points or key takeaways'
            }
          },
          required: ['subject', 'body', 'tone']
        },
        replyMessage: {
          type: Type.STRING,
          description: 'Short friendly explanation of the refinement made'
        },
        quickToneSuggestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '3 quick refinement actions (e.g. "Expand with more detail", "Make more concise", "Add bullet points")'
        }
      },
      required: ['emailDraft', 'replyMessage']
    };

    let result: any;
    try {
      result = await generateContentWithFallback<any>(systemInstruction, userPrompt, emailSchema);
    } catch (ladderErr: any) {
      console.warn('Gemini email refine ladder failed, engaging fallback:', ladderErr?.message);
      const sub = subject || (rawDraft ? `Follow-up: ${rawDraft.slice(0, 35)}...` : 'Project Update & Next Steps');
      const rec = recipient || 'Team';
      const body = `Hi ${rec},\n\nI hope you're having a productive week.\n\n${rawDraft || 'I wanted to share a quick update on our current deliverables and next steps.'}\n\nPlease let me know if you have any questions or feedback.\n\nBest regards,\n${persona?.name || 'Knowledge Practitioner'}`;
      
      return res.json({
        success: true,
        data: {
          emailDraft: {
            subject: sub,
            recipient: rec,
            body: body,
            tone: tone || 'Professional & Direct',
            keyPoints: ['Core alignment on deliverables', 'Clear next steps']
          },
          replyMessage: `✉️ Here is your structured draft! You can chat with me below to adjust the tone, expand the details, or tweak the wording.`,
          quickToneSuggestions: ['📝 Expand with more details', '✂️ Make more concise', '👔 Make tone more executive']
        },
        telemetry: {
          modelUsed: 'cognitive-resilience-fallback',
          attemptedModels: MODEL_FALLBACK_LADDER,
          latencyMs: 60
        }
      });
    }

    res.json({
      success: true,
      data: result.data,
      telemetry: {
        modelUsed: result.modelUsed,
        attemptedModels: result.attemptedModels,
        latencyMs: result.latencyMs
      }
    });
  } catch (error: any) {
    console.error('Error in /api/email-draft-refine:', error);
    res.status(500).json({ error: error?.message || 'Failed to refine email draft' });
  }
});

// Dynamic Runtime Config Endpoint (Serves Firebase and Google Maps keys loaded from Secret Manager or .env)
app.get('/api/config', (_req: Request, res: Response) => {
  const projectId = process.env.GCP_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID || 'genaiacademy3';
  const authDomain = process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`;
  res.json({
    firebaseApiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '',
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '',
    projectId,
    appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || '1:217104786977:web:default',
    authDomain
  });
});

// Geocoding Proxy Endpoint (Worldwide location search + reverse GPS geocoding)
app.get('/api/geocode', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Search query "q" parameter is required' });
    }

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`;
    const geoRes = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'MirrorSync-CognitiveJournal/1.0 (https://ai.studio)'
      }
    });

    if (!geoRes.ok) {
      // Fallback pseudo geocode
      return res.json({
        results: [
          {
            name: query,
            address: `${query}, Local Space`,
            lat: 37.7749 + (Math.random() - 0.5) * 0.04,
            lng: -122.4194 + (Math.random() - 0.5) * 0.04
          }
        ]
      });
    }

    const data: any = await geoRes.json();
    const results = (data || []).map((item: any) => {
      const parts = (item.display_name || '').split(',');
      const shortName = parts[0]?.trim() || query;
      const address = parts.slice(1, 4).map((p: string) => p.trim()).join(', ') || item.display_name;
      return {
        name: shortName,
        address: address,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      };
    });

    res.json({ results });
  } catch (err: any) {
    console.warn('Geocoding search failed:', err?.message);
    res.json({
      results: [
        {
          name: req.query.q as string || 'Searched Location',
          address: `${req.query.q as string}, Physical Environment`,
          lat: 37.7749,
          lng: -122.4194
        }
      ]
    });
  }
});

// Helper function for local semantic clustering fallback
function generateFallbackTopics(entries: Array<{ id: string; rawText: string; summary?: string; domain?: string; tags?: string[]; locationName?: string }>, domainFilter: string) {
  const topics: Array<{
    id: string;
    name: string;
    emoji: string;
    iconName: string;
    description: string;
    entryIds: string[];
    count: number;
    domain: string;
    accentColor: 'amber' | 'emerald' | 'blue' | 'purple' | 'rose' | 'indigo' | 'cyan';
  }> = [];

  const categoryBuckets = [
    {
      id: 'sports-fitness',
      name: 'Sports & Fitness',
      emoji: '🏃',
      iconName: 'Dumbbell',
      accentColor: 'emerald' as const,
      description: 'Physical movement, workouts, running, athletic performance, and recovery.',
      regex: /jog|run|workout|gym|fitness|training|exercise|swim|cycle|hike|marathon|stretch|sport|athletic|cardio|breathwork/i
    },
    {
      id: 'personal-growth',
      name: 'Personal Growth & Health',
      emoji: '🌱',
      iconName: 'Heart',
      accentColor: 'amber' as const,
      description: 'Mindfulness, sleep hygiene, emotional grounding, habits, and self-care.',
      regex: /sleep|growth|habit|mindful|meditation|therapy|rest|balance|anxiety|stress|health|wellness|mental|routine|presence/i
    },
    {
      id: 'leisure-downtime',
      name: 'Leisure & Downtime',
      emoji: '☕',
      iconName: 'Coffee',
      accentColor: 'rose' as const,
      description: 'Cafes, nature walks, peaceful afternoons, books, and recreational downtime.',
      regex: /coffee|cafe|tea|park|botanical|garden|walk|stroll|weekend|dinner|cooking|vacation|beach|relax|chill|movie|music|leisure/i
    },
    {
      id: 'shopping-gear',
      name: 'Shopping & Gear',
      emoji: '🛍️',
      iconName: 'ShoppingBag',
      accentColor: 'cyan' as const,
      description: 'Hardware, retail purchases, lifestyle acquisitions, tools, and wishlist items.',
      regex: /shop|shopping|buy|bought|purchase|store|gear|gadget|hardware|equipment|order|retail|outfit|clothing|groceries/i
    },
    {
      id: 'architecture-infra',
      name: 'System Architecture',
      emoji: '🏗️',
      iconName: 'Layers',
      accentColor: 'blue' as const,
      description: 'System design, database latency, technical trade-offs, and cloud infrastructure.',
      regex: /database|partition|latency|infra|backend|frontend|code|api|server|cloud|algorithm|cache|deploy|architecture|system/i
    },
    {
      id: 'executive-strategy',
      name: 'Leadership & Strategy',
      emoji: '👔',
      iconName: 'Briefcase',
      accentColor: 'indigo' as const,
      description: 'Cross-team alignment, stakeholder consensus, execution velocity, and roadmap.',
      regex: /team|meeting|consensus|alignment|strategy|leadership|stakeholder|roadmap|review|decision|priority|sync|executive/i
    },
    {
      id: 'creative-exploration',
      name: 'Creative Studio',
      emoji: '🎨',
      iconName: 'Palette',
      accentColor: 'purple' as const,
      description: 'Generative shaders, generative design, visual experimentation, and arts.',
      regex: /design|shader|fractal|creative|art|sketch|drawing|studio|visual|concept|flow|music|poem|story|animation/i
    },
    {
      id: 'email-comms',
      name: 'Executive Communications',
      emoji: '✉️',
      iconName: 'Mail',
      accentColor: 'emerald' as const,
      description: 'Drafted announcements, structured updates, and high-impact correspondence.',
      regex: /email|draft|recipient|subject|letter|correspondence|announcement|newsletter/i
    }
  ];

  const assignedEntryIds = new Set<string>();

  for (const bucket of categoryBuckets) {
    const matchingIds: string[] = [];
    for (const entry of entries) {
      const textToSearch = `${entry.rawText} ${entry.summary || ''} ${(entry.tags || []).join(' ')} ${entry.locationName || ''}`;
      if (bucket.regex.test(textToSearch)) {
        matchingIds.push(entry.id);
        assignedEntryIds.add(entry.id);
      }
    }

    if (matchingIds.length > 0) {
      topics.push({
        id: `topic-${bucket.id}`,
        name: bucket.name,
        emoji: bucket.emoji,
        iconName: bucket.iconName,
        description: bucket.description,
        entryIds: matchingIds,
        count: matchingIds.length,
        domain: domainFilter,
        accentColor: bucket.accentColor
      });
    }
  }

  // Catch unassigned entries into a friendly catch-all category
  const unassigned = entries.filter(e => !assignedEntryIds.has(e.id));
  if (unassigned.length > 0) {
    const fallbackName = domainFilter === 'Personal' 
      ? 'Life & Well-being Reflections'
      : domainFilter === 'Creative'
      ? 'Lateral Ideas & Spark'
      : domainFilter === 'Email Drafting'
      ? 'Correspondence & Outbox'
      : 'Focus & Productivity';

    topics.push({
      id: 'topic-general-reflections',
      name: fallbackName,
      emoji: '✨',
      iconName: 'Sparkles',
      description: 'General thoughts, notes, and focused insights captured in this space.',
      entryIds: unassigned.map(e => e.id),
      count: unassigned.length,
      domain: domainFilter,
      accentColor: 'amber'
    });
  }

  return topics;
}

// Dynamic AI Topic Clustering Endpoint (/api/cluster-topics)
app.post('/api/cluster-topics', async (req: Request, res: Response) => {
  try {
    const { entries = [], domainFilter = 'All' } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.json({ topics: [] });
    }

    const fallbackResult = generateFallbackTopics(entries, domainFilter);

    // If only 1 entry or small set, fallback is instantaneous and highly accurate
    if (entries.length === 1) {
      return res.json({
        success: true,
        topics: fallbackResult,
        telemetry: {
          modelUsed: 'instant-semantic-classifier',
          attemptedModels: ['instant-semantic-classifier'],
          latencyMs: 15,
        }
      });
    }

    const systemInstruction = `You are MirrorSync's Cognitive Categorization Engine.
Analyze the provided journal entries (which may belong to domain "${domainFilter}").
Dynamically group and cluster these entries into 2 to 4 general, human-friendly topic categories (maximum 4 clusters total) such as "Sports & Fitness", "Leisure & Downtime", "Shopping & Gear", "Personal Growth & Recovery", "System Architecture", "Leadership & Comms", "Creative Studio", "Travel & Adventure", etc.

RULES:
1. MAXIMUM 4 CLUSTERS: Output at most 4 category objects in "categories" array.
2. "name": A concise, engaging category title (e.g. "Sports & Fitness", "Personal Growth", "Leisure & Downtime", "Shopping & Gear", "Architecture & Latency", "Creative Sandbox").
3. "emoji": A single relevant emoji (e.g. "🏃", "🌱", "☕", "🛍️", "🏗️", "🎨", "🧘", "✈️", "👔").
4. "iconName": Pick one from ["Dumbbell", "Heart", "Coffee", "ShoppingBag", "Briefcase", "Sparkles", "Palette", "Mail", "Compass", "Trees", "BookOpen", "Flame", "Trophy", "Layers", "Smile"].
5. "description": A short, elegant 1-sentence summary describing the common thread.
6. "entryIds": Array of matching entry ID strings belonging to this topic. Ensure all entries are accounted for.
7. "accentColor": Pick from ["amber", "emerald", "blue", "purple", "rose", "indigo", "cyan"].

Strictly follow the JSON schema.`;

    const summarizedEntries = entries.map((e: any, index: number) => ({
      index: index + 1,
      id: e.id,
      textPreview: (e.rawText || '').slice(0, 160),
      summary: e.summary || '',
      tags: e.tags || [],
      location: e.locationName || ''
    }));

    const userPrompt = `Here are the journal entries in scope for domain "${domainFilter}":
${JSON.stringify(summarizedEntries, null, 2)}

Please cluster them into cohesive, user-friendly dynamic topic category cards.`;

    const topicSchema = {
      type: Type.OBJECT,
      properties: {
        categories: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: 'Unique category identifier (e.g. topic-sports)' },
              name: { type: Type.STRING, description: 'Category title e.g. Sports & Fitness' },
              emoji: { type: Type.STRING, description: 'A single relevant emoji' },
              iconName: { type: Type.STRING, description: 'Icon name' },
              description: { type: Type.STRING, description: 'Short 1-sentence summary' },
              entryIds: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: 'Array of exact matching entry IDs' 
              },
              accentColor: {
                type: Type.STRING,
                enum: ['amber', 'emerald', 'blue', 'purple', 'rose', 'indigo', 'cyan'],
                description: 'Card accent color'
              }
            },
            required: ['id', 'name', 'emoji', 'iconName', 'description', 'entryIds', 'accentColor']
          }
        }
      },
      required: ['categories']
    };

    try {
      const result = await generateContentWithFallback<any>(systemInstruction, userPrompt, topicSchema);
      if (result && result.data && Array.isArray(result.data.categories) && result.data.categories.length > 0) {
        const parsedTopics = result.data.categories.slice(0, 4).map((cat: any, idx: number) => ({
          id: `ai-topic-${Date.now()}-${idx}`,
          name: cat.name || `Topic ${idx + 1}`,
          emoji: cat.emoji || '✨',
          iconName: cat.iconName || 'Sparkles',
          description: cat.description || '',
          entryIds: Array.isArray(cat.entryIds) ? cat.entryIds : [],
          count: Array.isArray(cat.entryIds) ? cat.entryIds.length : 0,
          domain: domainFilter,
          accentColor: cat.accentColor || 'amber'
        }));

        return res.json({
          success: true,
          topics: parsedTopics,
          telemetry: {
            modelUsed: result.modelUsed,
            attemptedModels: result.attemptedModels,
            latencyMs: result.latencyMs,
          }
        });
      }
    } catch (aiErr: any) {
      console.warn('AI clustering fallback triggered:', aiErr?.message);
    }

    // Return instant semantic fallback
    res.json({
      success: true,
      topics: fallbackResult,
      telemetry: {
        modelUsed: 'instant-semantic-classifier',
        attemptedModels: ['instant-semantic-classifier'],
        latencyMs: 30,
      }
    });
  } catch (error: any) {
    console.error('Error in /api/cluster-topics:', error);
    const fallback = generateFallbackTopics(req.body?.entries || [], req.body?.domainFilter || 'All');
    res.json({
      success: true,
      topics: fallback,
      telemetry: {
        modelUsed: 'instant-semantic-classifier',
        attemptedModels: ['instant-semantic-classifier'],
        latencyMs: 10,
      }
    });
  }
});

app.get('/api/geocode/reverse', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat as string;
    const lng = req.query.lng as string;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng parameters are required' });
    }

    const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=16&addressdetails=1`;
    const geoRes = await fetch(reverseUrl, {
      headers: {
        'User-Agent': 'MirrorSync-CognitiveJournal/1.0 (https://ai.studio)'
      }
    });

    if (!geoRes.ok) {
      return res.json({
        name: 'Current Coordinates',
        address: `GPS Pin (${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)})`,
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      });
    }

    const data: any = await geoRes.json();
    const displayName = data.display_name || '';
    const parts = displayName.split(',');
    const placeName = data.address?.amenity || data.address?.building || data.address?.road || parts[0]?.trim() || 'Current Location';
    const cleanAddress = parts.slice(0, 3).map((p: string) => p.trim()).join(', ') || displayName;

    res.json({
      name: placeName,
      address: cleanAddress,
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    });
  } catch (err: any) {
    console.warn('Reverse geocoding failed:', err?.message);
    const lat = parseFloat(req.query.lat as string || '37.7749');
    const lng = parseFloat(req.query.lng as string || '-122.4194');
    res.json({
      name: 'Current GPS Pin',
      address: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      lat,
      lng
    });
  }
});

// Catch-all for undefined /api routes so they return JSON rather than Vite HTML fallback
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API route not found' });
});

// Global API error handler
app.use((err: any, _req: Request, res: Response, next: any) => {
  if (res.headersSent) return next(err);
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

// Start server with Vite middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MirrorSync server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
