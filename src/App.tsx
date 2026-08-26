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
  occupation: 'Knowledge Practitioner',
  department: 'Strategy & Focus',
  communicationStyle: 'Clear & Insightful',
  coachingTone: 'Supportive & Strategic',
  customGoals: 'Gain clarity on daily decisions and cultivate healthy habits.',
  updatedAt: Date.now()
};

const SEED_ENTRIES: JournalEntry[] = [
  {
    id: 'seed-1',
    userId: 'local-user',
    rawText: 'Navigated a heated cross-team review regarding database partitioning strategy versus global replication. The frontend team wants sub-10ms response times while operations is worried about regional compliance and write costs. Felt drained by circular consensus-seeking.',
    createdAt: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
    reflectionSummary: 'A complex architectural meeting revealed trade-offs between low UI latency and infrastructure write costs. Circular consensus-seeking drained cognitive bandwidth.',
    adaptiveResponse: 'When teams stall on competing requirements, frame the debate around tiered Service Level Objectives (SLOs) rather than an all-or-nothing compromise.\n\nQuantify latency impact by feature priority, and nominate a clear decision owner for the write overhead.',
    category: {
      domain: 'Work',
      department: 'Core Infrastructure',
      projectTags: ['Databases', 'Latency', 'Alignment']
    },
    actionItems: [
      {
        id: 'act-1',
        text: 'Document benchmarked latency tradeoffs for tier-1 vs tier-2 data paths',
        completed: true,
        priority: 'high',
        category: 'Next Step'
      },
      {
        id: 'act-2',
        text: 'Schedule single-decider alignment with VP of Infrastructure before Friday',
        completed: false,
        priority: 'high',
        category: 'Next Step'
      }
    ],
    editorialArtPrompt: 'Abstract balanced architectural geometric forms in graphite and translucent cyan.',
    cognitiveMetrics: {
      clarityScore: 92,
      sentimentResonance: 'Analytical Alignment',
      focusDimension: 'Strategic Alignment'
    },
    bookmarked: true,
    messages: [
      {
        id: 'seed-msg-1',
        role: 'user',
        content: '📋 Structure this reflection with clear headers and bullet points.',
        timestamp: Date.now() - 1000 * 60 * 60 * 2.5,
        quickActionType: 'structure_notes'
      },
      {
        id: 'seed-msg-2',
        role: 'assistant',
        content: '### Key Insights\n- **Tension:** Sub-10ms latency goals vs. data compliance costs.\n- **Resolution:** Segment queries into critical cached paths vs async sync.\n\n### Action Step\n- Schedule single decider meeting with VP before Friday.',
        timestamp: Date.now() - 1000 * 60 * 60 * 2.4,
        quickActionType: 'structure_notes'
      }
    ]
  },
  {
    id: 'seed-2',
    userId: 'local-user',
    rawText: 'Spent the evening experimenting with generative visual shaders and recursive fractal algorithms at the local design studio. Found deep state of flow without any commercial deadline pressure.',
    createdAt: Date.now() - 1000 * 60 * 60 * 28, // yesterday
    reflectionSummary: 'Unconstrained creative exploration with procedural math fostered immediate flow, serving as a powerful cognitive reset.',
    adaptiveResponse: 'Unstructured technical play stimulates creative intuition and neural plasticity. Protect dedicated weekly time for exploration—it directly feeds back into your strategic problem-solving.',
    category: {
      domain: 'Creative',
      department: 'Generative Design',
      projectTags: ['CreativeFlow', 'Fractals', 'Design']
    },
    actionItems: [
      {
        id: 'act-4',
        text: 'Package procedural shader generator into an open-source visual sandbox',
        completed: false,
        priority: 'low',
        category: 'Creative Spark'
      }
    ],
    creativeSpark: 'What if you mapped real-time system network telemetry directly into shader vertex deformations?',
    location: {
      name: 'Modernist Design Studio & Coffee Hub',
      address: '420 Design District, Creative Arts Quarter',
      lat: 37.7749,
      lng: -122.4194
    },
    locationContext: 'Modernist Design Studio & Coffee Hub (Creative Arts Quarter)',
    editorialArtPrompt: 'Minimalist emerald and gold mathematical spirals in deep space void.',
    cognitiveMetrics: {
      clarityScore: 96,
      sentimentResonance: 'Deep Flow & Exploration',
      focusDimension: 'Creative Plasticity'
    }
  },
  {
    id: 'seed-3',
    userId: 'local-user',
    rawText: 'Completed an early morning 5km jog through the coastal botanical gardens followed by a 15-minute breathwork session. Sleep score improved significantly after switching off screens an hour before bed.',
    createdAt: Date.now() - 1000 * 60 * 60 * 52, // 2 days ago
    reflectionSummary: 'Morning aerobic movement combined with breathwork and digital sundown hygiene dramatically restored sleep recovery and focus.',
    adaptiveResponse: 'Prioritizing somatic recovery is your highest-leverage well-being habit. Natural morning light anchors your circadian rhythm and reduces afternoon energy slumps.',
    category: {
      domain: 'Personal',
      department: 'Well-being & Recovery',
      projectTags: ['SleepHygiene', 'Breathwork', 'Recovery']
    },
    actionItems: [
      {
        id: 'act-5',
        text: 'Maintain the 60-minute pre-bed digital curfew across weekdays',
        completed: true,
        priority: 'high',
        category: 'Healthy Habit'
      }
    ],
    location: {
      name: 'Coastal Botanical Reserve & Trail',
      address: '100 Ocean Shore Parkway, Coastal Bluffs',
      lat: 37.7690,
      lng: -122.4835
    },
    locationContext: 'Coastal Botanical Reserve & Trail',
    editorialArtPrompt: 'Warm morning sunlight through coastal forest pines in soft minimalist tones.',
    cognitiveMetrics: {
      clarityScore: 95,
      sentimentResonance: 'Restorative Grounding',
      focusDimension: 'Somatic Well-being'
    }
  },
  {
    id: 'seed-4',
    userId: 'local-user',
    rawText: 'Spent Saturday morning shopping at the artisanal neighborhood market. Picked up a custom split mechanical keyboard, Japanese stationery, and freshly roasted single-origin Ethiopian coffee beans for our morning brewing ritual.',
    createdAt: Date.now() - 1000 * 60 * 60 * 75, // 3 days ago
    reflectionSummary: 'Curated shopping and mindful neighborhood exploration provided tactile leisure, intentional living, and elevated the daily workspace ritual.',
    adaptiveResponse: 'Investing in intentional tools and quality rituals transforms mundane daily routines into moments of craft and presence.',
    category: {
      domain: 'Personal',
      department: 'Lifestyle & Leisure',
      projectTags: ['Shopping', 'Leisure', 'WorkspaceGear']
    },
    actionItems: [],
    location: {
      name: 'Hayes Valley Market & Roastery',
      address: '580 Hayes St, Arts District',
      lat: 37.7766,
      lng: -122.4241
    },
    locationContext: 'Hayes Valley Market & Roastery',
    editorialArtPrompt: 'Warm terracotta and charcoal minimalist composition with coffee ceramics and geometric stationery lines.',
    cognitiveMetrics: {
      clarityScore: 94,
      sentimentResonance: 'Mindful Lifestyle',
      focusDimension: 'Tactile Grounding'
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
