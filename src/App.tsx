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
  DynamicCategoryCards 
} from './components/DynamicCategoryCards';
import { 
  CategoryHeaderBanner 
} from './components/CategoryHeaderBanner';
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
  type User 
} from './firebase';
import { reflectEntryAPI, clusterTopicsAPI } from './services/api';
import { generateLocalSemanticTopics, classifyContentDomain } from './utils/topicClustering';
import type { UserPersona, JournalEntry, DomainCategory, LocationPin, DynamicTopicCategory } from './types';
import { Sparkles, Shield, Compass, BrainCircuit, AlertCircle, CheckCircle2, RotateCw, Copy, Check, X, BookOpen, Cloud, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

const DEFAULT_PERSONA: UserPersona = {
  userId: 'local-user',
  occupation: 'A-Level Computing Educator (JC)',
  department: 'Computer Science & Educational Technology',
  communicationStyle: 'Pedagogical, Structured & Encouraging',
  coachingTone: 'Academic Mentor & Strategic Coach',
  customGoals: 'Prepare JC2 students (age 17-18) for A-Level Computing Theory and Python Practical examinations with deep conceptual mastery.',
  updatedAt: Date.now()
};

const SEED_ENTRIES: JournalEntry[] = [
  {
    id: 'seed-work-1',
    userId: 'local-user',
    rawText: 'Conducted a 2-hour timed Paper 2 Practical mock exam focusing on OOP and SQLite database connectivity with Python. Noticed several JC2 students struggled with parameterised queries and exception handling when reading CSV datasets into linked lists. Need to design targeted scaffolding for edge-case debugging before next week\'s review.',
    createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    reflectionSummary: 'Timed Paper 2 mock exam highlighted key conceptual gaps in SQLite database integration and defensive exception handling among JC2 candidates.',
    adaptiveResponse: 'Focus subsequent practical clinics on live code refactoring and step-through debugging. Encourage students to write test assertions before assembling full SQL queries to build automatic verification habits under exam time constraints.',
    category: {
      domain: 'Work',
      department: 'A-Level Practical Prep',
      projectTags: ['PythonPractical', 'OOP', 'SQLite', 'ExamTechnique']
    },
    actionItems: [
      {
        id: 'act-c1',
        text: 'Prepare 5 targeted CSV-to-SQLite edge case debugging worksheets for tomorrow\'s lab clinic',
        completed: false,
        priority: 'high',
        category: 'Next Step'
      },
      {
        id: 'act-c2',
        text: 'Record a 10-minute walkthrough on parameterised query best practices and error handling',
        completed: true,
        priority: 'high',
        category: 'Next Step'
      }
    ],
    editorialArtPrompt: 'Clean minimalist chalkboard with elegant Python syntax diagrams, relational database schemas, and warm golden lighting.',
    cognitiveMetrics: {
      clarityScore: 94,
      sentimentResonance: 'Pedagogical Precision',
      focusDimension: 'Curriculum Scaffolding'
    },
    bookmarked: true,
    messages: [
      {
        id: 'msg-w1-1',
        role: 'user',
        content: '📋 Structure this reflection with clear headers and bullet points for departmental sync.',
        timestamp: Date.now() - 1000 * 60 * 50,
        quickActionType: 'structure_notes'
      },
      {
        id: 'msg-w1-2',
        role: 'assistant',
        content: '### Practical Mock Diagnosis\n- **Identified Gap:** SQLite sanitisation & dynamic linked list insertion from CSV.\n- **Pedagogical Intervention:** Deploy short timed unit-test exercises prior to full paper simulation.\n\n### Next Steps\n- Share standardized marking rubrics and model solutions with departmental colleagues.',
        timestamp: Date.now() - 1000 * 60 * 48,
        quickActionType: 'structure_notes'
      }
    ]
  },
  {
    id: 'seed-work-2',
    userId: 'local-user',
    rawText: 'Led a deep-dive seminar on Dynamic Programming versus Divide-and-Conquer (Merge Sort, Binary Search trees, Memoization). Transitioning students from recursion trees to iterative state tables proved effective for visual learners. A few students who previously scored U-grade showed breakthrough understanding.',
    createdAt: Date.now() - 1000 * 60 * 60 * 26, // 1 day ago
    reflectionSummary: 'Visual recursion tree decomposition and step-by-step state tables enabled breakthrough comprehension in complex algorithmic analysis for struggling candidates.',
    adaptiveResponse: 'Capitalize on this conceptual momentum by having these students explain the memoization step to peers in breakout study circles. Socratic peer-teaching solidifies algorithmic mental models.',
    category: {
      domain: 'Work',
      department: 'Algorithms & Theory',
      projectTags: ['Algorithms', 'Memoization', 'BinaryTrees', 'TheoryPaper1']
    },
    actionItems: [
      {
        id: 'act-c3',
        text: 'Create a visual comparison infographic for Top-Down Memoization vs Bottom-Up Tabulation',
        completed: true,
        priority: 'medium',
        category: 'Next Step'
      }
    ],
    editorialArtPrompt: 'Abstract glowing binary tree recursion visual with indigo background and crystalline gold nodes.',
    cognitiveMetrics: {
      clarityScore: 96,
      sentimentResonance: 'Inspirational Mastery',
      focusDimension: 'Algorithmic Intuition'
    }
  },
  {
    id: 'seed-work-3',
    userId: 'local-user',
    rawText: 'Reviewed student submissions for Networking and Cybersecurity theory questions. Common misconceptions emerged regarding asymmetric public/private key encryption versus hashing integrity checks in HTTPS handshakes. Prepared custom diagnostic flashcards to reinforce protocol handshakes.',
    createdAt: Date.now() - 1000 * 60 * 60 * 50, // 2 days ago
    reflectionSummary: 'Targeted analysis of networking and cybersecurity questions revealed conflation between cryptographic hashing and public-key encryption.',
    adaptiveResponse: 'Anchor the distinction using a concrete physical analogy (digital signatures as wax seals vs hashing as tamper-evident tape). Use interactive network packet tracing in class to visualize real-time TLS handshakes.',
    category: {
      domain: 'Work',
      department: 'Network & Cyber Security',
      projectTags: ['Cybersecurity', 'Networking', 'TLS', 'Paper1Theory']
    },
    actionItems: [
      {
        id: 'act-c4',
        text: 'Distribute 10-question quick diagnostic quiz on Cryptographic Protocols before Friday',
        completed: false,
        priority: 'high',
        category: 'Next Step'
      }
    ],
    editorialArtPrompt: 'Minimalist geometric network topology with glowing nodes and cryptographic lock symbols in ultramarine.',
    cognitiveMetrics: {
      clarityScore: 91,
      sentimentResonance: 'Diagnostic Insight',
      focusDimension: 'Conceptual Precision'
    }
  },
  {
    id: 'seed-work-4',
    userId: 'local-user',
    rawText: 'One-on-one consultation sessions with 6 students anxious about their preliminary exam performance. Reframed their revision strategy around high-weightage topics (Data Structures, Socket Programming, and Ethics in Computing). Emphasized time-budgeting: 1.5 minutes per mark on Paper 1.',
    createdAt: Date.now() - 1000 * 60 * 60 * 74, // 3 days ago
    reflectionSummary: 'Empathetic consultations helped de-escalate exam anxiety and instilled structured time-management strategies across high-weightage syllabus components.',
    adaptiveResponse: 'Providing structured exam pacing templates gives students a tangible sense of control. Celebrate their incremental gains in past-year paper scores to sustain high morale into the final sprint.',
    category: {
      domain: 'Work',
      department: 'Student Mentorship & Exam Strategy',
      projectTags: ['Mentorship', 'TimeManagement', 'RevisionStrategy', 'PastPapers']
    },
    actionItems: [
      {
        id: 'act-c5',
        text: 'Collate and share the 2020-2025 A-Level Computing marking trends summary document',
        completed: true,
        priority: 'high',
        category: 'Next Step'
      }
    ],
    editorialArtPrompt: 'Warm sunlit modern classroom desk with organized study plans, hourglass, and focused stationery.',
    cognitiveMetrics: {
      clarityScore: 95,
      sentimentResonance: 'Empathetic Mentorship',
      focusDimension: 'Student Morale & Strategy'
    }
  },
  {
    id: 'seed-creative-1',
    userId: 'local-user',
    rawText: 'Spent the evening at the National Library building in Bugis designing an interactive gamified web simulation for A-Level sorting algorithms (QuickSort and MergeSort pivots). Envisioned animated particle systems that visualize swap operations in real-time on student iPads.',
    createdAt: Date.now() - 1000 * 60 * 60 * 18,
    reflectionSummary: 'Brainstormed an interactive visual sorting simulator with kinetic particle physics to transform abstract algorithm complexity into an intuitive sensory learning experience.',
    adaptiveResponse: 'Interactive kinetic learning bridges theoretical syntax and algorithmic intuition. Build an initial lightweight Canvas prototype to test with students during tutorial warm-ups.',
    category: {
      domain: 'Creative',
      department: 'EdTech Innovation',
      projectTags: ['CreativeCoding', 'AlgorithmVisualizer', 'CanvasAPI', 'EdTech']
    },
    actionItems: [
      {
        id: 'act-cr1',
        text: 'Build a prototype interactive QuickSort partition animation in HTML5 Canvas',
        completed: false,
        priority: 'low',
        category: 'Creative Spark'
      }
    ],
    creativeSpark: 'What if algorithm comparison was gamified as a musical synthesizer where array comparisons produce harmonic chords based on sorting efficiency?',
    location: {
      name: 'National Library Building Singapore',
      address: '100 Victoria Street, Bugis, Singapore 188064',
      lat: 1.2976,
      lng: 103.8543
    },
    locationContext: 'National Library Building Singapore (Bugis Cultural Corridor)',
    editorialArtPrompt: 'Futuristic architectural interior of Singapore National Library with warm golden lights, glowing algorithm particle flow, and glass bridges.',
    cognitiveMetrics: {
      clarityScore: 97,
      sentimentResonance: 'Imaginative Innovation',
      focusDimension: 'Pedagogical Creativity'
    }
  },
  {
    id: 'seed-creative-2',
    userId: 'local-user',
    rawText: 'Visited the ArtScience Museum at Marina Bay Sands exploring the digital generative art installations. Conceptualized a collaborative classroom project: having computing students generate generative procedural Singapore cityscapes using recursive L-systems and turtle geometry.',
    createdAt: Date.now() - 1000 * 60 * 60 * 42,
    reflectionSummary: 'Exploration of generative digital art installations inspired a creative cross-disciplinary coding assignment applying L-systems to procedural architecture.',
    adaptiveResponse: 'Connecting formal computing grammar to artistic expression fosters deep joy and shows students that code is an expressive, limitless medium beyond exam rubrics.',
    category: {
      domain: 'Creative',
      department: 'Generative Design Lab',
      projectTags: ['GenerativeArt', 'LSystems', 'CreativeComputing', 'ArtScience']
    },
    actionItems: [
      {
        id: 'act-cr2',
        text: 'Draft sample Python turtle script generating fractal Singapore Supertrees for post-exam coding workshop',
        completed: false,
        priority: 'low',
        category: 'Creative Spark'
      }
    ],
    creativeSpark: 'Could students map real-time Singapore climate and weather API data into generative digital watercolor shaders?',
    location: {
      name: 'ArtScience Museum Singapore',
      address: '6 Bayfront Ave, Marina Bay Sands, Singapore 018974',
      lat: 1.2863,
      lng: 103.8593
    },
    locationContext: 'ArtScience Museum (Marina Bay Waterfront, Singapore)',
    editorialArtPrompt: 'Lotus-inspired ArtScience Museum building over reflecting Marina Bay waters at twilight with shimmering laser projections.',
    cognitiveMetrics: {
      clarityScore: 96,
      sentimentResonance: 'Vibrant Curiosity',
      focusDimension: 'Aesthetic Computational Design'
    }
  },
  {
    id: 'seed-creative-3',
    userId: 'local-user',
    rawText: 'Evening walk along the Henderson Waves bridge at Southern Ridges drafting ideas for an AI computing ethics debate case study: evaluating autonomous public transport algorithms navigating Singapore\'s dense urban environment.',
    createdAt: Date.now() - 1000 * 60 * 60 * 66,
    reflectionSummary: 'Architectural immersion at Henderson Waves spurred a real-world case study on autonomous transport ethics and algorithmic fairness calibrated for Singapore urban mobility.',
    adaptiveResponse: 'Situating computing ethics in familiar local contexts (like MRT scheduling and autonomous shuttles) grounds abstract moral philosophy in tangible engineering trade-offs.',
    category: {
      domain: 'Creative',
      department: 'Computing Ethics & Society',
      projectTags: ['ComputingEthics', 'AIEthics', 'SmartNation', 'SouthernRidges']
    },
    actionItems: [
      {
        id: 'act-cr3',
        text: 'Curate 3 debate prompt cards on algorithmic accountability in Smart Nation infrastructure',
        completed: true,
        priority: 'low',
        category: 'Creative Spark'
      }
    ],
    creativeSpark: 'How would students program an ethical decision-tree simulator when sensor noise introduces 5% ambiguity in pedestrian recognition?',
    location: {
      name: 'Henderson Waves & Southern Ridges',
      address: 'Henderson Road, Southern Ridges, Singapore 109572',
      lat: 1.2761,
      lng: 103.8153
    },
    locationContext: 'Henderson Waves (Southern Ridges Canopy Walk, Singapore)',
    editorialArtPrompt: 'Sweeping undulating wooden architectural waves of Henderson bridge illuminated against lush tropical Singapore canopy at sunset.',
    cognitiveMetrics: {
      clarityScore: 95,
      sentimentResonance: 'Philosophical Inspiration',
      focusDimension: 'Sociotechnical Ethics'
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await currentUser.getIdToken();

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
          const userEntries = await getJournalEntries(currentUser.uid);

          if (userEntries && userEntries.length > 0) {
            setEntries(userEntries);
            showToast(`Loaded ${userEntries.length} journals from your cloud vault.`);
          } else {
            // Check if there are local guest entries created by this user to migrate!
            const guestEntries = entries.filter(e => !e.id.startsWith('seed-'));
            const entriesToSeed = guestEntries.length > 0 
              ? guestEntries.map(e => ({ ...e, userId: currentUser.uid }))
              : SEED_ENTRIES.map(e => ({ ...e, userId: currentUser.uid }));

            setEntries(entriesToSeed);
            for (const item of entriesToSeed) {
              await saveJournalEntry(currentUser.uid, item);
            }
            showToast(`Synchronized initial journals to your account.`);
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
        try {
          const saved = localStorage.getItem(GUEST_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setEntries(parsed);
              return;
            }
          }
        } catch (e) {
          console.warn('Guest vault parse error:', e);
        }
        setEntries(SEED_ENTRIES);
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
      const isPopupBlocked = err?.code === 'auth/popup-blocked' || err?.message?.includes('popup');
      setErrorBanner({
        message: isPopupBlocked 
          ? 'Google Sign-In popup was blocked by browser settings. Please allow popups or open in a new tab.'
          : err?.message || 'Google Sign-In encountered an error.',
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
        reflectionSummary: reflection.reflectionSummary,
        adaptiveResponse: reflection.adaptiveResponse,
        category: reflection.category,
        actionItems: reflection.actionItems,
        creativeSpark: reflection.creativeSpark,
        locationContext: reflection.locationContext,
        location: reflection.location || location || undefined,
        editorialArtPrompt: reflection.editorialArtPrompt,
        cognitiveMetrics: reflection.cognitiveMetrics,
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

    // 1. Generate local semantic clusters immediately & save
    const localTopics = generateLocalSemanticTopics(domainEntries, targetCategory);
    if (selectedCategory === targetCategory) {
      setDynamicTopics(localTopics);
    }

    setCachedClusters((prev) => {
      const updated = { ...prev, [targetCategory]: localTopics };
      try {
        localStorage.setItem(TOPIC_CLUSTERS_CACHE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Topic cluster cache storage warning:', e);
      }
      return updated;
    });

    // 2. Run AI topic clustering asynchronously in background
    try {
      if (selectedCategory === targetCategory) {
        setIsLoadingTopics(true);
      }
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

    if (user) {
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
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.focus();
    }
  };

  const handleSelectCategory = (cat: 'All' | DomainCategory) => {
    setSelectedCategory(cat);
    setSelectedTopicId(null);
  };

  // Load saved dynamic topics for selectedCategory from persistent cache without re-reading or querying AI
  useEffect(() => {
    const domainEntries = entries.filter(
      (e) => selectedCategory === 'All' || e.category?.domain === selectedCategory
    );

    if (domainEntries.length === 0) {
      setDynamicTopics([]);
      setSelectedTopicId(null);
      return;
    }

    // 1. Check if saved clusters already exist in cache for this category
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

    // 2. If no saved clusters exist yet, compute local semantic topics and save them
    const initialTopics = generateLocalSemanticTopics(domainEntries, selectedCategory);
    setDynamicTopics(initialTopics);
    setCachedClusters((prev) => {
      const updated = { ...prev, [selectedCategory]: initialTopics };
      try {
        localStorage.setItem(TOPIC_CLUSTERS_CACHE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Topic cache write error:', e);
      }
      return updated;
    });
  }, [selectedCategory, cachedClusters, entries]);

  // First Visit Initializer: automatically cluster all categories on first load and cache them
  const initialClusteringRanRef = useRef(false);
  useEffect(() => {
    if (entries.length === 0) return;
    if (initialClusteringRanRef.current) return;
    initialClusteringRanRef.current = true;

    const ALL_CATEGORY_KEYS: ('All' | DomainCategory)[] = ['All', 'Personal', 'Work', 'Creative', 'Email Drafting'];

    // 1. Prepopulate local semantic clusters for all categories immediately
    setCachedClusters((prev) => {
      const updated = { ...prev };
      let changed = false;
      for (const cat of ALL_CATEGORY_KEYS) {
        const catEntries = entries.filter((e) => cat === 'All' || e.category?.domain === cat);
        if (catEntries.length > 0 && (!updated[cat] || updated[cat].length === 0)) {
          updated[cat] = generateLocalSemanticTopics(catEntries, cat);
          changed = true;
        }
      }
      if (changed) {
        try {
          localStorage.setItem(TOPIC_CLUSTERS_CACHE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn('Initial topic cache write warning:', e);
        }
      }
      return updated;
    });

    // 2. Query initial AI topic clustering for all categories sequentially in background
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

            // If user is viewing this category, update dynamic topics in real-time
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
        totalEntriesCount={entries.length}
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
        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl metallic-gold-panel text-[#f6e7b8] text-xs shadow-2xl flex items-center gap-2.5 backdrop-blur-xl animate-in fade-in-50 slide-in-from-bottom-3 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {errorBanner && (
          <div className="p-4 rounded-2xl bg-[#0b152d]/95 border border-rose-500/50 text-xs space-y-2.5 shadow-2xl backdrop-blur-xl animate-in fade-in-50 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  {errorBanner.action === 'auth'
                    ? 'Authentication Notice'
                    : 'System Notice'}
                </span>
              </div>
              <button
                onClick={() => setErrorBanner(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-200 font-mono text-[11px] break-words">
              {errorBanner.message}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
              <button
                type="button"
                onClick={handleCopyErrorBanner}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedError ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedError ? 'Copied Error Info' : 'Copy Diagnostics'}</span>
              </button>

              <div className="flex items-center gap-2">
                {errorBanner.action === 'auth' && (
                  <button
                    onClick={handleSignInGoogle}
                    disabled={isSigningIn}
                    className="px-3.5 py-1.5 rounded-xl metallic-gold-button text-[#070d1e] font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Retry Sign-In</span>
                  </button>
                )}
                <button
                  onClick={() => setErrorBanner(null)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Header Banner */}
        <CategoryHeaderBanner
          category={selectedCategory}
          totalCount={filteredEntries.length}
        />

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

        {/* 1. Timeline Feed of Past Reflections */}
        <section aria-label="Journal Feed" className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-1 pb-1 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#f6e7b8]" />
              <span className="font-semibold text-[#f6e7b8] uppercase tracking-wider text-xs">
                📖 Your Thought Feed ({filteredEntries.length})
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleScrollToComposer}
                className="px-3.5 py-1.5 rounded-xl metallic-gold-button text-[#070d1e] font-semibold text-xs flex items-center gap-1.5 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Write New Journal</span>
              </button>
            </div>
          </div>

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
          ) : (
            <div className="space-y-6">
              {filteredEntries.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.45, delay: Math.min(idx * 0.05, 0.25), ease: [0.21, 0.47, 0.32, 0.98] }}
                >
                  <ReflectionCard
                    entry={entry}
                    persona={persona}
                    isFocused={entry.id === activeEntryId}
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
          )}
        </section>

        {/* 2. New Journal Entry Composer */}
        <motion.section 
          ref={composerRef} 
          aria-label="Journal Input" 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="pt-6 border-t border-white/10 space-y-3"
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37]" />
              <h2 className="text-sm font-semibold text-[#f6e7b8] tracking-wide uppercase">
                ✍️ Pour Your Thoughts Into Words
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Saved instantly • Interactive follow-up chat
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
    </div>
  );
}
