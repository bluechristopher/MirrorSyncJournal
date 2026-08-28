import { useState, useEffect, useRef } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  ReflectionInput 
} from './components/ReflectionInput';
import { 
  ReflectionCard 
} from './components/ReflectionCard';
import { 
  HistorySidebar 
} from './components/HistorySidebar';
import { 
  OnboardingModal 
} from './components/OnboardingModal';
import { 
  PersonaSettingsModal 
} from './components/PersonaSettingsModal';
import { 
  ThreatModelModal 
} from './components/ThreatModelModal';
import { 
  CognitiveInsightsModal 
} from './components/CognitiveInsightsModal';
import { 
  WelcomeModal 
} from './components/WelcomeModal';
import { 
  DynamicCategoryCards 
} from './components/DynamicCategoryCards';
import { 
  CategoryHeaderBanner 
} from './components/CategoryHeaderBanner';
import { 
  BookJournalView 
} from './components/BookJournalView';
import { 
  auth, 
  onAuthStateChanged, 
  signInWithGoogle, 
  logOut, 
  getUserPersona, 
  saveUserPersona, 
  getJournalEntries, 
  saveJournalEntry, 
  updateJournalEntry, 
  deleteJournalEntry,
  deleteAllJournalEntries,
  type User 
} from './firebase';
import { reflectEntryAPI, clusterTopicsAPI } from './services/api';
import { generateLocalSemanticTopics, classifyContentDomain } from './utils/topicClustering';
import type { UserPersona, JournalEntry, DomainCategory, LocationPin, DynamicTopicCategory } from './types';
import { Sparkles, Shield, Compass, BrainCircuit, AlertCircle, CheckCircle2, RotateCw, Copy, Check, X, BookOpen, List, Cloud, UserCheck, Trash2, PenTool } from 'lucide-react';
import { motion } from 'motion/react';

const DEFAULT_PERSONA: UserPersona = {
  userId: 'local-user',
  occupation: 'Junior College Computing Educator (Singapore)',
  department: 'Computer Science & EdTech Department',
  communicationStyle: 'Energetic, Relatable & Pedagogical (Young Computing Teacher)',
  coachingTone: 'Empathetic Peer, Supportive Mentor & Strategic Coach',
  customGoals: 'Scaffold A-Level Computing (Python, SQL, Algorithms) with deep conceptual intuition, sustain teaching & consultation energy, and pursue personal athletic growth in sports like pickleball.',
  updatedAt: Date.now()
};

const SEED_ENTRIES: JournalEntry[] = [
  {
    id: 'seed-work-1',
    userId: 'local-user',
    title: 'Bridging Algorithm Mechanics and Conceptual Intuition',
    rawText: `Spent the afternoon tutorial going through QuickSort, MergeSort, and Binary Search with my JC2 computing students. I noticed a frustrating pattern during whiteboard discussions—when asked to explain why QuickSort degrades on already-sorted arrays or why MergeSort requires extra auxiliary memory, students freeze and start reciting rote definitions line-by-line.

They can write the standard partition code from memory, but the moment I change a single variable or ask them to trace the pointers verbally, they crumble. It is clear they are treating algorithms as static syntax to be memorized for the exam rather than dynamic, problem-solving abstractions. I need a way to break this rote habit and get them to actually internalize the underlying loop invariants.`,
    createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    reflectionSummary: 'Classroom whiteboard analysis revealed students relying heavily on rote-memorized algorithm syntax, struggling to verbally articulate mechanics or reason about pointer invariants under modified conditions.',
    adaptiveResponse: `When students resort to memorization, it usually signals that abstract mechanics haven't been translated into physical or visual models. Introducing kinetic sorting activities (like physical playing card sorting or volunteer role-play) forces students to state the loop invariant before writing code.

Encouraging peer-teaching where students explain the algorithm in plain English to a peer helps break the illusion of explanatory depth.

• What physical or visual analogy (like balancing scales or playing cards) could make the pivot selection in QuickSort tangible for your visual learners?
• How might you structure peer verbalization sessions where students must explain an algorithm without referencing code syntax?`,
    category: {
      domain: 'Work',
      department: 'Algorithms & Pedagogy',
      projectTags: ['Algorithms', 'Sorting', 'Searching', 'Pedagogy']
    },
    actionItems: [
      {
        id: 'act-w1-1',
        text: 'Design a hands-on card-sorting classroom exercise for QuickSort and Binary Search',
        completed: false,
        priority: 'high',
        category: 'Next Step'
      },
      {
        id: 'act-w1-2',
        text: 'Create a peer-explanation rubric assessing conceptual articulation over code memorization',
        completed: true,
        priority: 'medium',
        category: 'Next Step'
      }
    ],
    editorialArtPrompt: 'A photorealistic warm wooden classroom desk with tactile numbered wooden blocks, organized index cards, soft afternoon sun, 35mm photography.',
    cognitiveMetrics: {
      clarityScore: 94,
      sentimentResonance: 'Pedagogical Inquiry',
      focusDimension: 'Conceptual Scaffolding'
    },
    sentiment: {
      emotionalTone: 'Frustrated & Seeking Clarity',
      emoji: '💡',
      energyLevel: 'Grounded',
      sentimentResonance: 'Pedagogical Inquiry',
      sentimentSummary: 'Navigating the delicate gap between memorizing syntax and deep algorithmic intuition.'
    },
    bookmarked: true
  },
  {
    id: 'seed-work-2',
    userId: 'local-user',
    title: 'Designing Real-World Contexts for Python & SQL',
    rawText: `Sitting down at my desk trying to author Section B for the upcoming Paper 2 Preliminary Exam. The syllabus guidelines mandate that questions must be contextualized in authentic real-world systems, seamlessly interweaving SQLite relational schemas with Python data structures and file I/O.

I've been staring at a blank document for the past two hours. It's so easy to create contrived, artificial examples, but setting a scenario that feels genuinely realistic without burying students in unnecessary domain jargon is excruciatingly difficult. I need an engaging context—perhaps an automated MRT fare ticketing gate, a hospital triage appointment dispatch system, or a smart library locker network—that naturally demands multi-table joins, sanitization, and data validation.`,
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    reflectionSummary: 'Experiencing creative friction while brainstorming cohesive, authentic real-world contexts that naturally integrate both Python data manipulation and relational SQLite database tasks for upcoming exam papers.',
    adaptiveResponse: `Crafting authentic examination contexts is challenging because scenarios must feel naturally grounded without introducing unnecessary domain jargon. Anchor questions in relatable public utility systems—such as an automated MRT transit tap-in system, a smart library IoT sensor network, or a food delivery logistics dispatcher.

These domains naturally combine relational SQL tables (e.g., stations, trips, commuter fares) with Python data processing routines (calculating peak-hour surcharges or sanitizing CSV transaction logs).

• Which everyday public system in Singapore (like MRT transit cards, National Library checkouts, or hospital clinic queues) would resonate most intuitively with your students?
• What core SQL query patterns (joins, aggregations, group by) do you most want this paper's scenario to test?`,
    category: {
      domain: 'Work',
      department: 'Assessment & Curriculum',
      projectTags: ['ExamSetting', 'Python', 'SQL', 'ContextualDesign']
    },
    actionItems: [
      {
        id: 'act-w2-1',
        text: 'Draft a 3-table SQLite schema based on an automated transit tap-in system',
        completed: false,
        priority: 'high',
        category: 'Next Step'
      },
      {
        id: 'act-w2-2',
        text: 'Outline 4 progressive Python tasks that process and sanitize commuter transaction logs',
        completed: true,
        priority: 'high',
        category: 'Next Step'
      }
    ],
    editorialArtPrompt: 'A modern architect desk with blueprints of urban transit maps, open laptop showing database schemas, warm coffee cup, soft golden studio lighting, 8k photography.',
    cognitiveMetrics: {
      clarityScore: 92,
      sentimentResonance: 'Curriculum Design',
      focusDimension: 'Contextual Assessment'
    },
    sentiment: {
      emotionalTone: 'Thoughtful & Seeking Inspiration',
      emoji: '🌱',
      energyLevel: 'Inspiring',
      sentimentResonance: 'Curriculum Design',
      sentimentSummary: 'Seeking fresh, authentic narrative anchors for technical exam questions.'
    }
  },
  {
    id: 'seed-work-3',
    userId: 'local-user',
    title: 'Automated Diagnostic Scaffolding & Educator Energy',
    rawText: `Wrapped up back-to-back 1-on-1 consultations from 2pm to 6:30pm today with six different students. By the end of it, my voice was hoarse and my mental energy completely drained. What makes it so exhausting is that I found myself repeating the exact same explanations five times over—debugging off-by-one errors in while loops, clarifying the difference between parameter passing by reference vs value, and fixing SQL injection vulnerabilities in string concatenations.

I love mentoring students through complex architectural thinking, but spending hours on basic syntax checks is draining. How I wish we had an intelligent diagnostic system that could automatically generate scaffolded practice questions, assess their code line-by-line, and provide immediate contextual feedback before they come for consultations.`,
    createdAt: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
    reflectionSummary: 'Exhaustion from repetitive 1-on-1 consultations on fundamental computing concepts sparked a strong desire for automated question generation, instant grading, and personalized student feedback loops.',
    adaptiveResponse: `One-on-one consultations are emotionally and intellectually demanding, especially when repeatedly addressing the same foundational misconceptions. Your instinct to offload repetitive diagnostic feedback to an automated system is the right strategy for protecting your teaching energy for high-impact mentorship.

A tiered consultation framework—where students first complete self-checking automated code exercises and submit their diagnostic logs before booking a 1-on-1 slot—ensures that in-person time is reserved for deep architectural reasoning rather than basic syntax debugging.

• What are the top 3 recurring misconceptions that consume 80% of your consultation time?
• How could you pilot a lightweight automated quiz system that students must complete prior to booking individual consultation slots?`,
    category: {
      domain: 'Work',
      department: 'Student Consultations & EdTech',
      projectTags: ['Consultations', 'EdTech', 'AutomatedGrading', 'TeacherWellbeing']
    },
    actionItems: [
      {
        id: 'act-w3-1',
        text: 'Collate the 5 most frequent consultation questions into a self-service interactive FAQ with runnable code snippets',
        completed: false,
        priority: 'high',
        category: 'Next Step'
      },
      {
        id: 'act-w3-2',
        text: 'Establish prerequisite diagnostic checkpoints students must submit before booking 1-on-1 consultations',
        completed: false,
        priority: 'medium',
        category: 'Next Step'
      }
    ],
    editorialArtPrompt: 'A quiet modern university study alcove in the evening, illuminated laptop screen showing code diagnostics, notebook with neat handwritten notes, cinematic depth of field.',
    cognitiveMetrics: {
      clarityScore: 95,
      sentimentResonance: 'Sustainable Teaching',
      focusDimension: 'Educator Resilience'
    },
    sentiment: {
      emotionalTone: 'Exhausted & Seeking Leverage',
      emoji: '⚡',
      energyLevel: 'Compassionate',
      sentimentResonance: 'Sustainable Teaching',
      sentimentSummary: 'Acknowledging consultation fatigue while exploring automated leverage to protect your energy.'
    }
  },
  {
    id: 'seed-personal-1',
    userId: 'local-user',
    title: 'Embracing the Learning Curve in Pickleball',
    rawText: `Attended my third pickleball coaching clinic this morning at Kallang Tennis Centre. The sport is undeniably fun and addictive, but reprogramming my motor reflexes during groundstrokes is proving to be a humbling challenge. Coming from years of casual badminton and tennis, my instinct is always to whip and snap the wrist upon contact to generate topspin.

My coach kept reminding me throughout the drills: 'Lock your wrist! The paddle face must remain stable; drive the ball using your legs and shoulder torso rotation.' Every time a fast ball comes over the kitchen line, my wrist instinctively wants to bend. It feels awkward and robotic right now, but I can slowly feel the ball trajectory stabilizing when I trust the shoulder follow-through.`,
    createdAt: Date.now() - 1000 * 60 * 60 * 72, // 3 days ago
    reflectionSummary: 'Enjoying the playful energy of learning pickleball at Kallang Tennis Centre, while navigating the physical adaptation of locking the wrist during groundstrokes as instructed by the coach.',
    adaptiveResponse: `Taking up a new sport is a wonderful way to reconnect with the sensation of being a beginner. In pickleball, the instinct to flick or bend the wrist is natural (especially if you have background in tennis, badminton, or table tennis), but keeping a firm, stable wrist and initiating power from the shoulder and core creates consistency and paddle-face control.

Be patient with muscle memory reprogramming. The awkwardness you feel during groundstrokes is proof of neural rewiring in progress, and celebrating small improvements in paddle angle will make each session rewarding.

• What racquet sport habits (from badminton, tennis, or squash) find themselves creeping into your pickleball swing?
• How does the experience of being a novice player on the court give you fresh empathy for your students learning difficult concepts?`,
    category: {
      domain: 'Personal',
      department: 'Physical Well-Being & Sports',
      projectTags: ['Pickleball', 'Sports', 'MotorSkills', 'BeginnerMindset']
    },
    actionItems: [
      {
        id: 'act-p1-1',
        text: 'Practice 15 minutes of slow against-the-wall dinking focusing exclusively on a locked, neutral wrist',
        completed: false,
        priority: 'medium',
        category: 'Next Step'
      },
      {
        id: 'act-p1-2',
        text: 'Schedule the next weekend doubles friendly match to build relaxed court confidence',
        completed: false,
        priority: 'low',
        category: 'Next Step'
      }
    ],
    location: {
      name: 'Kallang Tennis Centre',
      address: '8 Stadium Blvd, Singapore 397804',
      lat: 1.3064,
      lng: 103.8786
    },
    locationContext: 'Kallang Tennis Centre (Singapore Sports Hub)',
    editorialArtPrompt: 'A vibrant outdoor pickleball court under clear blue skies, paddle and neon yellow perforated ball resting on clean green court surface, bright sunny morning light, crisp photography.',
    cognitiveMetrics: {
      clarityScore: 96,
      sentimentResonance: 'Mindful Somatics',
      focusDimension: 'Motor Skill Acquisition'
    },
    sentiment: {
      emotionalTone: 'Playful & Mindfully Learning',
      emoji: '🎾',
      energyLevel: 'Grounded',
      sentimentResonance: 'Mindful Somatics',
      sentimentSummary: 'Experiencing the humility and excitement of building brand new motor habits on the court.'
    }
  }
];

const GUEST_STORAGE_KEY = 'mirrorsync_guest_vault';
const TOPIC_CLUSTERS_CACHE_KEY = 'mirrorsync_topic_clusters_cache';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [persona, setPersona] = useState<UserPersona>(DEFAULT_PERSONA);
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(GUEST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasOldSeed = parsed.some((e: JournalEntry) => e.id === 'seed-work-4' || e.id === 'seed-creative-1' || e.id === 'seed-creative-2');
          const isShortSeed = parsed.some((e: JournalEntry) => e.id === 'seed-work-1' && e.rawText.length < 240);
          const hasLocation = parsed.some((e: JournalEntry) => e.id === 'seed-personal-1' && e.location);
          if (!hasOldSeed && !isShortSeed && hasLocation) {
            return parsed.map((e: JournalEntry) => ({
              ...e,
              bannerImageUrl: e.bannerImageUrl?.includes('pollinations.ai') ? undefined : e.bannerImageUrl
            }));
          }
        }
      }
    } catch (e) {
      console.warn('Could not read guest vault:', e);
    }
    return SEED_ENTRIES;
  });

  const [cachedClusters, setCachedClusters] = useState<Record<string, DynamicTopicCategory[]>>(() => {
    try {
      const saved = localStorage.getItem(TOPIC_CLUSTERS_CACHE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read cached topic clusters:', e);
    }
    return {};
  });

  const [selectedCategory, setSelectedCategory] = useState<'All' | DomainCategory>('All');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [dynamicTopics, setDynamicTopics] = useState<DynamicTopicCategory[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'book' | 'feed'>('book');

  const [errorBanner, setErrorBanner] = useState<{
    message: string;
    details?: string;
    action?: 'reflect' | 'auth' | 'general';
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedError, setCopiedError] = useState(false);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);

  const composerRef = useRef<HTMLDivElement | null>(null);

  // Modals
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isPersonaSettingsOpen, setIsPersonaSettingsOpen] = useState(false);
  const [isThreatModalOpen, setIsThreatModalOpen] = useState(false);
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);
  const [isLoginWelcomeOpen, setIsLoginWelcomeOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(() => {
    try {
      const hasChosen = localStorage.getItem('mirrorsync_welcome_chosen');
      return !hasChosen;
    } catch {
      return true;
    }
  });

  const handleWelcomeContinueGuest = () => {
    try {
      localStorage.setItem('mirrorsync_welcome_chosen', 'true');
    } catch {}
    setIsWelcomeModalOpen(false);
    showToast('✨ Welcome to MirrorSync! Exploring in Demo Mode.');
    // Trigger fresh re-cluster for guest entries
    triggerFullRecluster(entries);
  };

  const handleWelcomeSignInGoogle = async () => {
    try {
      localStorage.setItem('mirrorsync_welcome_chosen', 'true');
    } catch {}
    setIsWelcomeModalOpen(false);
    await handleSignInGoogle();
  };

  // Re-cluster all domains helper
  const triggerFullRecluster = (currentEntries: JournalEntry[]) => {
    const ALL_DOMAINS: ('All' | DomainCategory)[] = ['All', 'Personal', 'Work', 'Creative', 'Email Drafting'];
    for (const cat of ALL_DOMAINS) {
      reclusterCategoryTopics(cat, currentEntries, false);
    }
  };

  const handleClearAllPosts = async () => {
    setIsConfirmingClearAll(false);
    if (user) {
      try {
        await deleteAllJournalEntries(user.uid);
      } catch (dbErr) {
        console.warn('Firestore wipe warning:', dbErr);
      }
    }
    try {
      await fetch('/api/gemini/clear-all-images', { method: 'POST' });
    } catch (_imgErr) {
      console.warn('Server image cache clear note:', _imgErr);
    }
    setEntries([]);
    setActiveEntryId(null);
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch (_e) {}
    showToast('All journal posts & stored banner images deleted!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Keep localStorage updated when in guest mode
  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(entries));
      } catch (e) {
        console.warn('Failed to persist guest entries to localStorage:', e);
      }
    }
  }, [entries, user]);

  // Ref to track if auth state is the first background mount or an active user sign-in
  const hasInitializedAuthRef = useRef(false);
  const previousUserUidRef = useRef<string | null>(null);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const isFirstCheck = !hasInitializedAuthRef.current;
      hasInitializedAuthRef.current = true;
      const prevUid = previousUserUidRef.current;
      previousUserUidRef.current = currentUser ? currentUser.uid : null;

      setUser(currentUser);

      if (currentUser) {
        try {
          await currentUser.getIdToken();

          // Only trigger 3-second welcome popup if this is an explicit new login transition (not background page refresh)
          if (!isFirstCheck && prevUid !== currentUser.uid) {
            setIsLoginWelcomeOpen(true);
            setTimeout(() => {
              setIsLoginWelcomeOpen(false);
            }, 3000);
          }

          // 1. Fetch or initialize user persona in Firestore
          const userDoc = await getUserPersona(currentUser.uid);
          if (userDoc) {
            setPersona(userDoc);
          } else {
            const newPersona: UserPersona = {
              userId: currentUser.uid,
              name: currentUser.displayName || 'User',
              email: currentUser.email || '',
              occupation: 'Knowledge Practitioner',
              department: 'Strategy & Focus',
              communicationStyle: 'Clear & Insightful',
              coachingTone: 'Supportive & Strategic',
              customGoals: 'Gain clarity on daily decisions and cultivate healthy habits.',
              updatedAt: Date.now()
            };
            setPersona(newPersona);
            await saveUserPersona(currentUser.uid, newPersona);
          }

          // 2. Fetch user-specific isolated entries from Firestore
          const rawUserEntries = (await getJournalEntries(currentUser.uid)) || [];
          // Filter out seed demo entries so logged-in users ONLY see their own personal posts!
          const userEntries = rawUserEntries.filter(e => !e.id.startsWith('seed-'));

          // Clean up legacy seed entries from Firestore if any were saved previously
          const legacySeedEntries = rawUserEntries.filter(e => e.id.startsWith('seed-'));
          if (legacySeedEntries.length > 0) {
            for (const legacyItem of legacySeedEntries) {
              deleteJournalEntry(currentUser.uid, legacyItem.id).catch(() => {});
            }
          }

          if (userEntries.length > 0) {
            setEntries(userEntries);
            showToast(`Loaded ${userEntries.length} personal journals from your cloud vault.`);
          } else {
            // Migrate custom user-created guest entries if any exist
            const customGuestEntries = entries.filter(e => !e.id.startsWith('seed-'));
            if (customGuestEntries.length > 0) {
              const entriesToSeed = customGuestEntries.map(e => ({ ...e, userId: currentUser.uid }));
              setEntries(entriesToSeed);
              for (const item of entriesToSeed) {
                await saveJournalEntry(currentUser.uid, item);
              }
              showToast(`Migrated ${customGuestEntries.length} local entries to your cloud vault.`);
            } else {
              setEntries([]);
              showToast(`Welcome! Your private cloud vault is ready.`);
            }
          }
        } catch (error: any) {
          console.error('Error synchronizing Firestore user data:', error);
          setErrorBanner({
            message: 'Unable to synchronize cloud vault entries.',
            details: error?.message || String(error),
            action: 'general'
          });
        }
      } else {
        // Switched to guest mode: restore local guest vault
        let guestEntriesToLoad = SEED_ENTRIES;
        try {
          const saved = localStorage.getItem(GUEST_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              guestEntriesToLoad = parsed;
            }
          }
        } catch (e) {
          console.warn('Guest vault parse error:', e);
        }
        setEntries(guestEntriesToLoad);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignInGoogle = async () => {
    try {
      setIsSigningIn(true);
      setErrorBanner(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setErrorBanner({
        message: "Google login wasn't completed. Please try logging in again.",
        details: err?.code || String(err),
        action: 'auth'
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setUser(null);
      setPersona(DEFAULT_PERSONA);
      showToast('Signed out of cloud account. Now in guest mode.');
    } catch (err: any) {
      console.error('Sign Out error:', err);
    }
  };

  const handleSavePersona = async (updates: Partial<UserPersona>) => {
    const updatedPersona: UserPersona = {
      ...persona,
      ...updates,
      updatedAt: Date.now()
    };
    setPersona(updatedPersona);

    if (user) {
      try {
        await saveUserPersona(user.uid, updatedPersona);
        showToast('Profile & coaching style updated!');
      } catch (err: any) {
        console.error('Failed to persist persona to Firestore:', err);
        throw err;
      }
    } else {
      showToast('Profile updated locally.');
    }
  };

  // Background AI synthesis function
  const triggerAiSynthesis = async (
    entryId: string, 
    rawText: string, 
    currentPersona: UserPersona, 
    location?: LocationPin | null,
    preferredDomain?: DomainCategory | 'auto'
  ) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, aiStatus: 'synthesizing', aiError: undefined } : e))
    );

    try {
      const { reflection } = await reflectEntryAPI(rawText, currentPersona, location || undefined, preferredDomain);

      const updates: Partial<JournalEntry> = {
        title: reflection.title,
        reflectionSummary: reflection.reflectionSummary,
        adaptiveResponse: reflection.adaptiveResponse,
        category: reflection.category,
        actionItems: reflection.actionItems,
        creativeSpark: reflection.creativeSpark,
        locationContext: reflection.locationContext,
        location: reflection.location || location || undefined,
        editorialArtPrompt: reflection.editorialArtPrompt,
        bannerImageUrl: reflection.bannerImageUrl,
        cognitiveMetrics: reflection.cognitiveMetrics,
        sentiment: reflection.sentiment,
        aiStatus: 'ready',
        aiError: undefined
      };

      setEntries((prev) => {
        const nextEntries = prev.map((e) => (e.id === entryId ? { ...e, ...updates } : e));
        // Update clusters with rich summary & tags in background for this new reflection
        const domainToUpdate = updates.category?.domain || selectedCategory;
        reclusterCategoryTopics(domainToUpdate, nextEntries);
        if (domainToUpdate !== 'All') {
          reclusterCategoryTopics('All', nextEntries);
        }
        return nextEntries;
      });

      if (user) {
        try {
          await updateJournalEntry(user.uid, entryId, updates);
        } catch (dbErr) {
          console.warn('Firestore update warning:', dbErr);
        }
      }
      showToast('AI coaching & summary synthesized!');
    } catch (err: any) {
      console.error('Background AI synthesis failed:', err);
      const errorMsg = err?.message || 'AI reflection failed to complete.';

      const errorUpdates: Partial<JournalEntry> = {
        aiStatus: 'error',
        aiError: errorMsg
      };

      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, ...errorUpdates } : e))
      );

      if (user) {
        try {
          await updateJournalEntry(user.uid, entryId, errorUpdates);
        } catch (dbErr) {
          console.warn('Firestore update warning for error status:', dbErr);
        }
      }
    }
  };

  // Recluster specific category topics and save them to persistent cache
  const reclusterCategoryTopics = async (
    targetCategory: 'All' | DomainCategory,
    currentEntries: JournalEntry[],
    showNotification: boolean = false
  ) => {
    const domainEntries = currentEntries.filter(
      (e) => targetCategory === 'All' || e.category?.domain === targetCategory
    );
    if (domainEntries.length === 0) {
      if (selectedCategory === targetCategory) {
        setDynamicTopics([]);
      }
      return;
    }

    if (selectedCategory === targetCategory) {
      setIsLoadingTopics(true);
    }

    // Run AI topic clustering asynchronously without flashing local default dummy topics
    try {
      const { topics } = await clusterTopicsAPI(
        domainEntries.map((e) => ({
          id: e.id,
          rawText: e.rawText,
          summary: e.reflectionSummary,
          domain: e.category?.domain,
          tags: e.category?.projectTags,
          locationName: e.location?.name
        })),
        targetCategory
      );

      if (topics && topics.length > 0) {
        if (selectedCategory === targetCategory) {
          setDynamicTopics(topics);
        }
        setCachedClusters((prev) => {
          const updated = { ...prev, [targetCategory]: topics };
          try {
            localStorage.setItem(TOPIC_CLUSTERS_CACHE_KEY, JSON.stringify(updated));
          } catch (e) {
            console.warn('Topic cluster cache storage warning:', e);
          }
          return updated;
        });
        if (showNotification) {
          showToast('Dynamic AI topic categories refreshed!');
        }
      }
    } catch (err) {
      console.warn('Topic clustering fallback to local semantics:', err);
    } finally {
      if (selectedCategory === targetCategory) {
        setIsLoadingTopics(false);
      }
    }
  };

  // Save Journal Entry
  const handleSaveJournal = async (
    rawText: string, 
    autoReflect: boolean = true, 
    location?: LocationPin | null,
    preGeneratedEntry?: Partial<JournalEntry>,
    chosenCategory?: DomainCategory | 'auto'
  ) => {
    setErrorBanner(null);
    setLastFailedText(null);

    // Determine initial domain without blindly assuming Work
    let resolvedDomain: DomainCategory;
    if (preGeneratedEntry?.category?.domain) {
      resolvedDomain = preGeneratedEntry.category.domain;
    } else if (chosenCategory && chosenCategory !== 'auto') {
      resolvedDomain = chosenCategory;
    } else if (selectedCategory !== 'All') {
      resolvedDomain = selectedCategory;
    } else {
      // Auto classify based on contents — NEVER assume it is Work!
      resolvedDomain = classifyContentDomain(rawText);
    }

    const newEntryId = `entry-${Date.now()}`;
    const newEntry: JournalEntry = {
      id: newEntryId,
      userId: user ? user.uid : 'local-user',
      title: preGeneratedEntry?.title,
      rawText: preGeneratedEntry?.rawText || rawText,
      createdAt: Date.now(),
      reflectionSummary: preGeneratedEntry?.reflectionSummary || '',
      adaptiveResponse: preGeneratedEntry?.adaptiveResponse || '',
      location: preGeneratedEntry?.location || location || undefined,
      category: preGeneratedEntry?.category || {
        domain: resolvedDomain,
        department: resolvedDomain === 'Work' 
          ? (persona.department || 'Strategy & Operations') 
          : resolvedDomain === 'Creative' 
          ? 'Creative Studio' 
          : resolvedDomain === 'Email Drafting' 
          ? 'Executive Communications' 
          : 'Personal Well-Being',
        projectTags: [
          resolvedDomain === 'Work' ? 'DeepWork' : resolvedDomain === 'Creative' ? 'CreativeFlow' : resolvedDomain === 'Email Drafting' ? 'EmailDraft' : 'LifeBalance'
        ]
      },
      actionItems: preGeneratedEntry?.actionItems || [],
      emailDraft: preGeneratedEntry?.emailDraft || null,
      creativeSpark: preGeneratedEntry?.creativeSpark || null,
      editorialArtPrompt: preGeneratedEntry?.editorialArtPrompt || '',
      aiStatus: preGeneratedEntry?.aiStatus || (autoReflect ? 'synthesizing' : 'idle'),
      bookmarked: false,
      messages: preGeneratedEntry?.messages || []
    };

    const updatedEntries = [newEntry, ...entries];
    // Prepend immediately to user timeline
    setEntries(updatedEntries);
    setActiveEntryId(newEntryId);
    setViewMode('book');

    // Smoothly scroll down to the expanded new post in the book reader
    setTimeout(() => {
      const readerEl = document.getElementById('journal-reader-section');
      if (readerEl) {
        readerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);

    // Recluster ONLY when a new post is added!
    const targetDomain = newEntry.category?.domain || selectedCategory;
    reclusterCategoryTopics(selectedCategory, updatedEntries);
    if (targetDomain !== selectedCategory && targetDomain !== 'All') {
      reclusterCategoryTopics(targetDomain, updatedEntries);
    }

    // Persist immediately to Firestore if signed in
    if (user) {
      try {
        await saveJournalEntry(user.uid, newEntry);
      } catch (dbErr: any) {
        console.warn('Firestore write warning, stored in local state:', dbErr);
      }
    }

    showToast(preGeneratedEntry?.emailDraft ? 'Email draft saved to vault!' : 'Journal entry saved!');

    // Trigger AI synthesis in background if requested and not already pre-generated
    if (autoReflect && (!preGeneratedEntry || preGeneratedEntry.aiStatus === 'synthesizing')) {
      triggerAiSynthesis(newEntryId, rawText, persona, location, chosenCategory);
    }
  };

  const handleRetryLastReflection = async () => {
    if (!lastFailedText) return;
    const textToRetry = lastFailedText;
    await handleSaveJournal(textToRetry, true);
  };

  const handleCopyErrorBanner = () => {
    if (!errorBanner) return;
    const msg = `MirrorSync Report:\nTimestamp: ${new Date().toISOString()}\nMessage: ${errorBanner.message}\nDetails: ${errorBanner.details || 'N/A'}`;
    navigator.clipboard.writeText(msg);
    setCopiedError(true);
    setTimeout(() => setCopiedError(false), 2500);
  };

  // Update entry handler
  const handleUpdateEntry = async (entryId: string, updates: Partial<JournalEntry>) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === entryId ? { ...entry, ...updates } : entry))
    );

    // Only persist to Firestore if the user is authenticated and this is a real user document (not a static seed demo post)
    if (user && !entryId.startsWith('seed-')) {
      try {
        await updateJournalEntry(user.uid, entryId, updates);
      } catch (err) {
        console.error('Failed to update entry in Firestore:', err);
      }
    }
  };

  const handleToggleActionItem = async (entryId: string, actionId: string, completed: boolean) => {
    const targetEntry = entries.find((e) => e.id === entryId);
    if (!targetEntry) return;

    const updatedActions = (targetEntry.actionItems || []).map((action) =>
      action.id === actionId ? { ...action, completed } : action
    );

    await handleUpdateEntry(entryId, { actionItems: updatedActions });
  };

  const handleToggleBookmark = async (entryId: string, bookmarked: boolean) => {
    await handleUpdateEntry(entryId, { bookmarked });
    showToast(bookmarked ? 'Journal bookmarked!' : 'Bookmark removed.');
  };

  const handleDeleteEntry = async (entryId: string) => {
    const updated = entries.filter((entry) => entry.id !== entryId);
    setEntries(updated);
    if (activeEntryId === entryId) {
      setActiveEntryId(null);
    }

    // Cleanly remove deleted entry ID from cached clusters and active dynamicTopics
    setDynamicTopics((prev) =>
      prev
        .map((topic) => {
          const matching = topic.entryIds.filter((id) => id !== entryId);
          return { ...topic, entryIds: matching, count: matching.length };
        })
        .filter((topic) => topic.count > 0)
    );

    setCachedClusters((prev) => {
      const updatedCache: Record<string, DynamicTopicCategory[]> = {};
      for (const [cat, topics] of Object.entries(prev)) {
        updatedCache[cat] = topics
          .map((topic) => {
            const matching = topic.entryIds.filter((id) => id !== entryId);
            return { ...topic, entryIds: matching, count: matching.length };
          })
          .filter((topic) => topic.count > 0);
      }
      try {
        localStorage.setItem(TOPIC_CLUSTERS_CACHE_KEY, JSON.stringify(updatedCache));
      } catch (e) {
        console.warn('Cache write warning:', e);
      }
      return updatedCache;
    });

    if (user) {
      await deleteJournalEntry(user.uid, entryId);
    }
    showToast('Journal entry deleted.');
  };

  const handleSelectPastEntry = (entryId: string) => {
    setActiveEntryId(entryId);
    setIsHistorySidebarOpen(false);

    setTimeout(() => {
      const element = document.getElementById(`entry-${entryId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleScrollToComposer = () => {
    setIsHistorySidebarOpen(false);
    const composerSection = document.getElementById('reflection-composer-section');
    if (composerSection) {
      composerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (composerRef.current) {
      composerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => {
      const textarea = document.getElementById('reflection-textarea') as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.focus({ preventScroll: true });
      }
    }, 280);
  };

  const handleSelectCategory = (cat: 'All' | DomainCategory) => {
    setSelectedCategory(cat);
    setSelectedTopicId(null);
  };

  // Load saved dynamic topics for selectedCategory from persistent cache or fetch AI clusters
  useEffect(() => {
    const domainEntries = entries.filter(
      (e) => selectedCategory === 'All' || e.category?.domain === selectedCategory
    );

    if (domainEntries.length === 0) {
      setDynamicTopics([]);
      setSelectedTopicId(null);
      return;
    }

    // 1. Check if AI clusters already exist in cache for this category
    const savedForCategory = cachedClusters[selectedCategory];
    if (savedForCategory && savedForCategory.length > 0) {
      // Sync entry IDs with active entries in case entries were modified/deleted
      const validIds = new Set(domainEntries.map((e) => e.id));
      const synced = savedForCategory
        .map((topic) => {
          const matching = topic.entryIds.filter((id) => validIds.has(id));
          return { ...topic, entryIds: matching, count: matching.length };
        })
        .filter((topic) => topic.count > 0);

      if (synced.length > 0) {
        setDynamicTopics(synced);
        return;
      }
    }

    // 2. If no AI clusters exist in cache for this category, trigger authentic AI clustering
    reclusterCategoryTopics(selectedCategory, entries);
  }, [selectedCategory, cachedClusters, entries]);

  // Session First-Visit Initializer: clusters on brand-new first visit, persists through session refreshes
  const SESSION_CLUSTERED_KEY = 'mirrorsync_session_clustered_v1';
  useEffect(() => {
    if (entries.length === 0) return;
    
    // Check if initial clustering already executed for this browser session
    try {
      const alreadyClusteredInSession = sessionStorage.getItem(SESSION_CLUSTERED_KEY);
      if (alreadyClusteredInSession) {
        // Page was refreshed within the same session: do not re-run full clustering queries
        return;
      }
      sessionStorage.setItem(SESSION_CLUSTERED_KEY, 'true');
    } catch {
      // If sessionStorage unavailable, run once per component lifecycle
      if (initialClusteringRanRef.current) return;
      initialClusteringRanRef.current = true;
    }

    const ALL_CATEGORY_KEYS: ('All' | DomainCategory)[] = ['All', 'Personal', 'Work', 'Creative', 'Email Drafting'];

    // Query dynamic AI topic clustering for all categories on first session visit
    const initAllClusters = async () => {
      for (const cat of ALL_CATEGORY_KEYS) {
        const catEntries = entries.filter((e) => cat === 'All' || e.category?.domain === cat);
        if (catEntries.length === 0) continue;

        try {
          if (selectedCategory === cat) {
            setIsLoadingTopics(true);
          }
          const { topics } = await clusterTopicsAPI(
            catEntries.map((e) => ({
              id: e.id,
              rawText: e.rawText,
              summary: e.reflectionSummary,
              domain: e.category?.domain,
              tags: e.category?.projectTags,
              locationName: e.location?.name
            })),
            cat
          );

          if (topics && topics.length > 0) {
            setCachedClusters((prev) => {
              const updated = { ...prev, [cat]: topics };
              try {
                localStorage.setItem(TOPIC_CLUSTERS_CACHE_KEY, JSON.stringify(updated));
              } catch (e) {
                console.warn('Topic cluster cache storage warning:', e);
              }
              return updated;
            });

            // If user is viewing this category, update dynamic topics immediately
            if (selectedCategory === cat) {
              setDynamicTopics(topics);
            }
          }
        } catch (err) {
          console.warn(`Initial topic clustering fallback for ${cat}:`, err);
        } finally {
          if (selectedCategory === cat) {
            setIsLoadingTopics(false);
          }
        }
      }
    };

    initAllClusters();
  }, [entries]);

  const handleRefreshTopics = async () => {
    await reclusterCategoryTopics(selectedCategory, entries, true);
  };

  // Scoped domain entries for category card count
  const domainEntries = entries.filter((entry) => {
    return selectedCategory === 'All' || entry.category?.domain === selectedCategory;
  });

  // Filter and Search logic
  const filteredEntries = domainEntries.filter((entry) => {
    // Dynamic Topic Sub-category filter
    if (selectedTopicId) {
      const activeTopic = dynamicTopics.find((t) => t.id === selectedTopicId);
      if (activeTopic && !activeTopic.entryIds.includes(entry.id)) {
        return false;
      }
    }

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const matchesSummary = (entry.reflectionSummary || '').toLowerCase().includes(query);
    const matchesCoaching = (entry.adaptiveResponse || '').toLowerCase().includes(query);
    const matchesRaw = entry.rawText.toLowerCase().includes(query);
    const matchesTags = (entry.category?.projectTags || []).some((t) =>
      t.toLowerCase().includes(query)
    );
    const matchesActions = (entry.actionItems || []).some((a) =>
      (a.text || a.task || '').toLowerCase().includes(query)
    );
    const matchesMessages = (entry.messages || []).some((m) =>
      m.content.toLowerCase().includes(query)
    );

    return matchesSummary || matchesCoaching || matchesRaw || matchesTags || matchesActions || matchesMessages;
  });

  return (
    <div className="min-h-screen text-slate-100 selection:bg-amber-400/20 selection:text-[#f6e7b8] antialiased relative">
      {/* Header */}
      <Header
        user={user}
        persona={persona}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenPersonaModal={() => setIsPersonaSettingsOpen(true)}
        onOpenThreatModal={() => setIsThreatModalOpen(true)}
        onOpenInsightsModal={() => setIsInsightsModalOpen(true)}
        onSignInGoogle={handleSignInGoogle}
        onSignOut={handleSignOut}
        onClearAllPosts={() => setIsConfirmingClearAll(true)}
        totalEntriesCount={entries.length}
        searchMatchCount={filteredEntries.length}
        isSigningIn={isSigningIn}
        isHistoryOpen={isHistorySidebarOpen}
        onToggleHistorySidebar={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)}
      />

      {/* History Sidebar / Drawer */}
      <HistorySidebar
        isOpen={isHistorySidebarOpen}
        onClose={() => setIsHistorySidebarOpen(false)}
        entries={entries}
        activeEntryId={activeEntryId}
        onSelectEntry={handleSelectPastEntry}
        onNewEntry={handleScrollToComposer}
      />

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Global Toast Notification (Dark Bronze Background for Clear Contrast) */}
        {toastMessage && (
          <div className="fixed bottom-20 right-6 z-50 px-4 py-3 rounded-2xl bg-gradient-to-br from-[#2a1a0a] via-[#1a1006] to-[#0f0a04] border border-[#d4a373]/50 text-[#fef6e4] text-xs shadow-[0_12px_36px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,230,190,0.25)] flex items-center gap-2.5 backdrop-blur-xl animate-in fade-in-50 slide-in-from-bottom-3 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-100">{toastMessage}</span>
          </div>
        )}

        {/* Elegant Compact Metallic Red Authentication & System Notice */}
        {errorBanner && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a0b14]/95 via-[#18050b]/98 to-[#220810]/95 border border-rose-500/40 p-4 sm:p-4.5 space-y-3 shadow-[0_12px_40px_rgba(225,29,72,0.25),0_0_24px_rgba(244,63,94,0.12)] backdrop-blur-2xl animate-in fade-in-50 duration-250">
            {/* Top Ruby Specular Line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-400/50 to-transparent pointer-events-none" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 text-rose-200 font-bold text-sm">
                <div className="p-1.5 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-300 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-rose-300" />
                </div>
                <span>
                  {errorBanner.action === 'auth'
                    ? 'Authentication Notice'
                    : 'System Notice'}
                </span>
              </div>
              <button
                onClick={() => setErrorBanner(null)}
                className="text-rose-300/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed font-sans pl-1">
              {errorBanner.message}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-rose-500/20">
              <button
                type="button"
                onClick={handleCopyErrorBanner}
                className="text-[11px] text-rose-300/70 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedError ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedError ? 'Copied Details' : 'Copy Diagnostics'}</span>
              </button>

              <div className="flex items-center gap-2">
                {errorBanner.action === 'auth' && (
                  <button
                    onClick={handleSignInGoogle}
                    disabled={isSigningIn}
                    className="px-4 py-2 rounded-xl metallic-gold-button text-[#070d1e] font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_16px_rgba(246,231,184,0.35)] hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-[#070d1e] stroke-[2.5]" />
                    <span>Try Logging In Again</span>
                  </button>
                )}
                <button
                  onClick={() => setErrorBanner(null)}
                  className="px-3 py-1.5 rounded-xl text-rose-300/80 hover:text-white text-xs hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Header Banner (Suppressed for Email Drafting) */}
        {selectedCategory !== 'Email Drafting' && (
          <CategoryHeaderBanner
            category={selectedCategory}
            totalCount={filteredEntries.length}
          />
        )}

        {/* Dynamic AI Topic Category Cards (shown for domain category / entries) */}
        {domainEntries.length > 0 && (
          <DynamicCategoryCards
            topics={dynamicTopics}
            selectedTopicId={selectedTopicId}
            onSelectTopic={setSelectedTopicId}
            selectedCategory={selectedCategory}
            isLoadingTopics={isLoadingTopics}
            onRefreshTopics={handleRefreshTopics}
            totalEntriesCount={domainEntries.length}
          />
        )}

        {/* 1. Single Page Book Journal View (Or Timeline Feed Mode) */}
        <section aria-label="Journal Reader" className="space-y-5">
          {filteredEntries.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="p-12 text-center rounded-2xl metallic-card space-y-3"
            >
              <BrainCircuit className="w-8 h-8 text-[#f6e7b8]/60 mx-auto" />
              <p className="text-sm text-[#f6e7b8] font-medium">No journal entries found in this category.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Write a new journal entry below to get instant uplifting AI coaching, action checklists, and friendly perspectives!
              </p>
              <button
                type="button"
                onClick={handleScrollToComposer}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl metallic-titanium-button text-slate-200 text-xs font-semibold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#f6e7b8]" />
                <span>Compose Entry Below</span>
              </button>
            </motion.div>
          ) : viewMode === 'book' ? (
            <BookJournalView
              entries={filteredEntries}
              persona={persona}
              activeEntryId={activeEntryId}
              onSelectEntry={(id) => setActiveEntryId(id)}
              onToggleActionItem={handleToggleActionItem}
              onToggleBookmark={handleToggleBookmark}
              onDeleteEntry={handleDeleteEntry}
              onUpdateEntry={handleUpdateEntry}
              onTriggerAiReflection={(entryId) => {
                const target = entries.find((e) => e.id === entryId);
                if (target) {
                  triggerAiSynthesis(target.id, target.rawText, persona, target.location);
                }
              }}
              onWriteNewJournal={handleScrollToComposer}
              onClearAllPosts={() => setIsConfirmingClearAll(true)}
              viewMode={viewMode}
              onToggleViewMode={setViewMode}
              isGuest={!user}
              onSignInGoogle={handleSignInGoogle}
              currentUser={user}
            />
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-2 border-b border-amber-900/30 text-xs">
                <span className="font-bold text-[#f6e7b8] uppercase tracking-wider flex items-center gap-2">
                  <span>📜</span>
                  <span>Timeline Feed ({filteredEntries.length})</span>
                </span>
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center p-1 rounded-xl metallic-panel shadow-inner gap-1 border border-white/15">
                    <button
                      type="button"
                      onClick={() => setViewMode('book')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        viewMode === 'book'
                          ? 'metallic-gold-panel text-[#f6e7b8] border-[#f6e7b8]/60 shadow-[0_0_12px_rgba(246,231,184,0.25)]'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                      title="Single Page Book Journal Mode"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Book View</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('feed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        viewMode === 'feed'
                          ? 'metallic-gold-panel text-[#f6e7b8] border-[#f6e7b8]/60 shadow-[0_0_12px_rgba(246,231,184,0.25)]'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                      title="Vertical Scroll Feed Mode"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>Feed View</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleScrollToComposer}
                    className="px-3.5 py-2 rounded-xl metallic-sapphire-button font-bold text-xs flex items-center gap-1.5 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-md"
                  >
                    <span className="animate-star-emoji text-sm leading-none">✨</span>
                    <span>New Post</span>
                  </button>

                  {entries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingClearAll(true)}
                      title="Clear all journal posts from vault & Firestore cloud"
                      className="px-3 py-2 rounded-xl metallic-titanium-button border-rose-500/40 text-rose-300 hover:text-rose-100 hover:border-rose-400 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span className="hidden md:inline">Clear All</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-6 p-2.5 sm:p-5 rounded-2xl bg-[#14171f]/85 border border-white/10 shadow-2xl backdrop-blur-xl">
                {filteredEntries.map((entry, idx) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 36, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-20px" }}
                    transition={{ duration: 0.8, delay: Math.min(idx * 0.08, 0.3), ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ReflectionCard
                      entry={entry}
                      persona={persona}
                      isFocused={entry.id === activeEntryId}
                      isGuest={!user}
                      currentUser={user}
                      onSignInGoogle={handleSignInGoogle}
                      onToggleActionItem={handleToggleActionItem}
                      onToggleBookmark={handleToggleBookmark}
                      onDeleteEntry={handleDeleteEntry}
                      onUpdateEntry={handleUpdateEntry}
                      onTriggerAiReflection={(entryId) => {
                        const target = entries.find((e) => e.id === entryId);
                        if (target) {
                          triggerAiSynthesis(target.id, target.rawText, persona, target.location);
                        }
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 2. New Journal Entry Composer */}
        <motion.section 
          ref={composerRef} 
          id="reflection-composer-section"
          aria-label="Journal Input" 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="pt-6 border-t border-white/10 space-y-3 scroll-mt-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 pb-1">
            <div className="flex items-center gap-2.5">
              <span className="animate-star-emoji text-xl sm:text-2xl leading-none">✨</span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#fae8a8] via-[#38bdf8] via-[#c084fc] to-[#34d399] bg-clip-text text-transparent animate-gradient-text drop-shadow-md">
                Create New Journal Post
              </h2>
            </div>
            <span className="text-xs text-slate-300 font-medium">
              Saved instantly to your private cloud vault • Interactive AI coaching
            </span>
          </div>

          <ReflectionInput
            persona={persona}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onSaveJournal={handleSaveJournal}
            isLoading={isLoading}
            onOpenPersonaModal={() => setIsPersonaSettingsOpen(true)}
            lastFailedText={lastFailedText}
            externalError={errorBanner?.action === 'reflect' ? errorBanner.message : null}
            onClearError={() => setErrorBanner(null)}
          />
        </motion.section>
      </main>

      {/* Floating Quick Compose Action Button (Compact Vertical Layout: Emoji on Top, Text Below) */}
      <motion.button
        type="button"
        onClick={handleScrollToComposer}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-40 p-2.5 px-3 rounded-2xl metallic-sapphire-button text-white font-bold flex flex-col items-center justify-center gap-1 shadow-[0_12px_32px_rgba(0,0,0,0.65),0_0_20px_rgba(59,130,246,0.45)] border border-sky-400/60 backdrop-blur-md cursor-pointer group"
        title="Quick Write New Journal Post"
        aria-label="Quick Write New Journal Post"
      >
        <span className="animate-star-emoji text-lg leading-none group-hover:scale-115 transition-transform">✨</span>
        <span className="text-[11px] font-extrabold tracking-tight leading-none text-white whitespace-nowrap">New Post</span>
      </motion.button>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-8 border-t border-white/10 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37]" />
          <span className="text-slate-300">MirrorSync • Persona-Adaptive Cognitive Journal</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400 text-xs">
          <button
            onClick={() => setIsThreatModalOpen(true)}
            className="hover:text-[#f6e7b8] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-[#f6e7b8]" />
            <span>Privacy & Security</span>
          </button>
          <span className="text-slate-600">•</span>
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="hover:text-[#f6e7b8] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#f6e7b8]" />
            <span>Adjust AI Lens</span>
          </button>
        </div>
      </footer>

      {/* Modals */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSavePersona={handleSavePersona}
        initialPersona={persona}
      />

      <PersonaSettingsModal
        isOpen={isPersonaSettingsOpen}
        onClose={() => setIsPersonaSettingsOpen(false)}
        persona={persona}
        onSavePersona={handleSavePersona}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      <ThreatModelModal
        isOpen={isThreatModalOpen}
        onClose={() => setIsThreatModalOpen(false)}
      />

      <CognitiveInsightsModal
        isOpen={isInsightsModalOpen}
        onClose={() => setIsInsightsModalOpen(false)}
        entries={entries}
        persona={persona}
      />

      <WelcomeModal
        isOpen={isWelcomeModalOpen && !user}
        onClose={() => setIsWelcomeModalOpen(false)}
        onSignInGoogle={handleWelcomeSignInGoogle}
        onContinueGuest={handleWelcomeContinueGuest}
        isSigningIn={isSigningIn}
      />

      {/* Momentary 3-Second Successful Login Welcome Popup (Bottom-Left Corner) */}
      {isLoginWelcomeOpen && user && (
        <div className="fixed bottom-5 left-5 sm:bottom-6 sm:left-6 z-50 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15, x: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-80 sm:w-96 p-4 rounded-2xl bg-gradient-to-br from-[#022116]/98 via-[#063323]/98 to-[#01140d]/98 border border-emerald-400/80 shadow-[0_20px_50px_rgba(0,0,0,0.92),0_0_30px_rgba(52,211,153,0.35)] backdrop-blur-2xl flex items-center gap-3.5 pointer-events-auto"
          >
            <div className="relative shrink-0 w-11 h-11 rounded-xl p-0.5 bg-gradient-to-tr from-emerald-400 to-[#f6e7b8] shadow-md shadow-emerald-950/80">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-[10px] object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-[10px] bg-emerald-900 flex items-center justify-center text-base text-emerald-200 font-bold">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border border-emerald-950 flex items-center justify-center text-[8px] text-emerald-950 font-bold">
                ✓
              </span>
            </div>

            <div className="space-y-0.5 min-w-0 flex-1 text-left">
              <div className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9.5px] font-mono font-semibold">
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                <span>Logged In Successfully</span>
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold text-white font-sans tracking-tight truncate">
                Welcome, {user.displayName || 'Friend'}!
              </h3>
              <p className="text-[11px] text-slate-300 truncate">
                Private Cloud Vault & AI Banners active.
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Clear All Posts Confirmation Modal */}
      {isConfirmingClearAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl bg-gradient-to-br from-[#1a0808] via-[#120505] to-[#0a0202] border border-rose-500/50 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-3 text-rose-400 font-bold text-lg border-b border-rose-500/20 pb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <span>Clear All Journal Posts?</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Are you sure you want to delete <strong>all {entries.length} journal posts</strong>? This will permanently wipe all entries from your local timeline and Firestore cloud storage. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsConfirmingClearAll(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 font-bold text-xs hover:bg-white/20 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllPosts}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Clear All Posts</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
