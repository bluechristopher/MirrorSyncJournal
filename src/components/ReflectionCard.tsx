import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Bookmark, 
  Trash2, 
  Copy, 
  Check, 
  Compass, 
  ChevronDown, 
  ChevronUp, 
  Tag, 
  Loader2, 
  AlertCircle, 
  RotateCw, 
  Clock, 
  MapPin, 
  Lightbulb, 
  Heart, 
  Briefcase, 
  Palette, 
  Map as MapIcon,
  MessageSquare,
  Send,
  ListOrdered,
  CheckSquare,
  Wand2,
  Mail,
  UserCheck,
  Pencil,
  X,
  Save,
  Image as ImageIcon,
  BookOpen,
  FileText,
  Edit3,
  Headphones,
  Volume2,
  Eye,
  ArrowRight,
  HelpCircle,
  Plus,
  RefreshCw,
  PenTool
} from 'lucide-react';
import type { JournalEntry, UserPersona, ChatMessage, QuickActionType } from '../types';
import type { User } from 'firebase/auth';
import { EditorialArtCanvas } from './EditorialArtCanvas';
import { GoogleMapView } from './GoogleMapView';
import { StreamingMarkdown } from './StreamingMarkdown';
import { sendChatMessageAPI } from '../services/api';
import { JournalVoicePlayer } from './JournalVoicePlayer';
import { JournalPhotoGallery } from './JournalPhotoGallery';
import { getRelativeTimeInfo } from '../utils/dateUtils';
import { logoImg, fountainPenImg } from '../assets/bannerAssets';

function extractInquisitiveQuestions(adaptiveResponse: string, rawText: string = ''): string {
  if (!adaptiveResponse) {
    return `• What specific moment during this activity stood out to you the most?\n• What is one detail or technique you'd like to explore further?\n• How did this experience shift your perspective or energy for the day?`;
  }

  // 1. Search for bullet point lines or questions containing '?'
  const lines = adaptiveResponse.split('\n').map(l => l.trim()).filter(Boolean);
  const explicitQuestionLines = lines.filter(l => l.includes('?') || l.startsWith('•') || l.startsWith('-') || /^\d+[\.\)]/.test(l));

  if (explicitQuestionLines.length >= 1) {
    return explicitQuestionLines
      .slice(0, 3)
      .map(l => {
        const clean = l.replace(/^[\d\.\)\-\*•\s]+/, '').trim();
        return `• ${clean}`;
      })
      .join('\n');
  }

  // 2. Extract question sentences from prose
  const sentences = adaptiveResponse
    .replace(/([.?!])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.includes('?'));

  if (sentences.length >= 1) {
    return sentences
      .slice(0, 3)
      .map(s => `• ${s.replace(/^[\d\.\)\-\*•\s]+/, '').trim()}`)
      .join('\n');
  }

  // 3. Contextual inquisitive questions grounded in entry domain
  const lower = (rawText + ' ' + adaptiveResponse).toLowerCase();
  if (/pickleball|tennis|court|racket|paddle|sport|game|play|workout|gym|run/i.test(lower)) {
    return `• What specific shot or wrist movement felt most challenging during your game?\n• How did your paddle angle or stance affect control on the court?\n• What key technique adjustment do you want to test in your next match?`;
  } else if (/code|python|exam|student|class|teaching|lecture|project|work|meeting/i.test(lower)) {
    return `• What was the primary takeaway or breakthrough from this work milestone?\n• What underlying factor contributed most to the outcome?\n• What is the single most critical next action item to maintain momentum?`;
  } else if (/paint|art|design|music|song|writing|creative|idea|book|story/i.test(lower)) {
    return `• What unexpected perspective sparked your curiosity during this process?\n• What detail would make this creation even more unique or meaningful?\n• What wild or surprising angle could you explore next?`;
  }

  return `• What specific detail or emotion from this moment would add clarity to your post?\n• What was the most memorable part of this experience?\n• What is one actionable insight or lesson you want to carry forward?`;
}

function getCleanCreativeSpark(spark?: string | null): string | null {
  if (!spark || typeof spark !== 'string') return null;
  const trimmed = spark.trim();
  const lower = trimmed.toLowerCase().replace(/^["']|["']$/g, '');
  if (!trimmed || lower === 'null' || lower === 'undefined' || lower === 'none' || lower === 'n/a') {
    return null;
  }
  return trimmed.replace(/^["']|["']$/g, '').trim();
}

function getCleanAiFeedback(adaptiveResponse?: string | null): string {
  if (!adaptiveResponse) return '';
  const lines = adaptiveResponse.split('\n');
  const filtered: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // If a section starts with "Questions to consider" or "Inquisitive Questions" or "Reflective prompts", break early
    if (/^(#+\s*)?(inquisitive\s*questions?|questions?\s*to\s*(consider|reflect|explore)|reflective\s*(prompts?|questions?)):?/i.test(line)) {
      break;
    }
    // If line is a trailing question bullet point towards the end of the text
    if (/^[•\-\*]\s*.*\?$/.test(line) && i >= lines.length - 4) {
      continue;
    }
    filtered.push(lines[i]);
  }

  const result = filtered.join('\n').trim();
  // Strip trailing "What do you think?" or similar closing question sentence if present at the very end
  return result.replace(/\n*(\b(what\s*(are|do|would|could)\s*you\s*(think|do|feel|explore|takeaway)|how\s*(would|could|do|might)\s*you)\b[^.?!]*\?)\s*$/i, '').trim();
}

interface ReflectionCardProps {
  key?: string;
  entry: JournalEntry;
  persona: UserPersona;
  onToggleActionItem: (entryId: string, actionId: string, completed: boolean) => void;
  onToggleBookmark: (entryId: string, bookmarked: boolean) => void;
  onDeleteEntry: (entryId: string) => void;
  onTriggerAiReflection?: (entryId: string) => void;
  onUpdateEntry?: (entryId: string, updates: Partial<JournalEntry>) => Promise<void>;
  isFocused?: boolean;
  isGuest?: boolean;
  onSignInGoogle?: () => void;
  currentUser?: User | null;
}

export function ReflectionCard({
  entry,
  persona,
  onToggleActionItem,
  onToggleBookmark,
  onDeleteEntry,
  onTriggerAiReflection,
  onUpdateEntry,
  isFocused = false,
  isGuest = false,
  onSignInGoogle,
  currentUser
}: ReflectionCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const prevMsgLengthRef = useRef(entry.messages?.length || 0);
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMap, setShowMap] = useState<boolean>(true);
  const prevAiStatusRef = useRef(entry.aiStatus);

  // Auto-expand card only right after new AI reflection finishes generating in real-time
  useEffect(() => {
    if (entry.aiStatus === 'ready' && prevAiStatusRef.current === 'synthesizing') {
      setIsExpanded(true);
    }
    prevAiStatusRef.current = entry.aiStatus;
  }, [entry.aiStatus]);

  // Always reset to collapsed view when navigating to or viewing any post
  useEffect(() => {
    setIsExpanded(false);
    setIsEditing(false);
    setShowVoicePlayer(false);
  }, [entry.id]);

  // Voice narration player state
  const [showVoicePlayer, setShowVoicePlayer] = useState(false);

  // Editing original journal state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(entry.rawText);
  const [editSummary, setEditSummary] = useState(entry.reflectionSummary || '');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Direct editing email draft state
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editEmailSubject, setEditEmailSubject] = useState(entry.emailDraft?.subject || '');
  const [editEmailRecipient, setEditEmailRecipient] = useState(entry.emailDraft?.recipient || '');
  const [editEmailBody, setEditEmailBody] = useState(entry.emailDraft?.body || '');
  const [isSavingEmailEdit, setIsSavingEmailEdit] = useState(false);

  const handleSaveEmailDraftEdit = async () => {
    if (!onUpdateEntry || !entry.emailDraft) return;
    setIsSavingEmailEdit(true);
    try {
      const updatedDraft = {
        ...entry.emailDraft,
        subject: editEmailSubject.trim() || entry.emailDraft.subject,
        recipient: editEmailRecipient.trim() || entry.emailDraft.recipient,
        body: editEmailBody
      };
      await onUpdateEntry(entry.id, {
        emailDraft: updatedDraft,
        updatedAt: Date.now()
      });
      setIsEditingEmail(false);
    } catch (err) {
      console.error('Failed to save email draft edit:', err);
    } finally {
      setIsSavingEmailEdit(false);
    }
  };

  // Proposal editing state (allows editing writeup proposal before merging)
  const [editingProposalMsgId, setEditingProposalMsgId] = useState<string | null>(null);
  const [editedProposalWriteup, setEditedProposalWriteup] = useState<string>('');
  const [editedProposalSummary, setEditedProposalSummary] = useState<string>('');

  // Delete confirmation state
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Chat input state
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeActionChip, setActiveActionChip] = useState<QuickActionType | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  // Inquisitive questions follow-up textarea state
  const [followUpAnswerText, setFollowUpAnswerText] = useState('');
  const [isAppendingFollowUp, setIsAppendingFollowUp] = useState(false);

  const handleAppendFollowUpToPost = async () => {
    if (!followUpAnswerText.trim() || !onUpdateEntry) return;
    setIsAppendingFollowUp(true);
    try {
      const appendedText = `${entry.rawText.trim()}\n\n[Follow-up Details Added]:\n${followUpAnswerText.trim()}`;
      await onUpdateEntry(entry.id, {
        rawText: appendedText,
        updatedAt: Date.now()
      });
      setFollowUpAnswerText('');
      setEditText(appendedText);
      if (onTriggerAiReflection) {
        onTriggerAiReflection(entry.id);
      }
    } catch (err) {
      console.error('Failed to append follow-up details:', err);
    } finally {
      setIsAppendingFollowUp(false);
    }
  };

  // Smoothly scroll this card's top into focus just beneath the fixed top navbar
  const scrollToCardTop = () => {
    setTimeout(() => {
      if (cardRef.current) {
        const yOffset = -75; // Account for the sticky top metallic navbar
        const elementPosition = cardRef.current.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset + yOffset;
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth'
        });
      }
    }, 60);
  };

  // Keep local edit state in sync if entry changes outside
  useEffect(() => {
    setEditText(entry.rawText);
    setEditSummary(entry.reflectionSummary || '');
    if (entry.emailDraft) {
      setEditEmailSubject(entry.emailDraft.subject || '');
      setEditEmailRecipient(entry.emailDraft.recipient || '');
      setEditEmailBody(entry.emailDraft.body || '');
    }
  }, [entry.rawText, entry.reflectionSummary, entry.emailDraft]);

  // Fluid Scroll Animation via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entryObserver]) => {
        if (entryObserver.isIntersecting) {
          setIsVisible(true);
          if (cardRef.current) {
            observer.unobserve(cardRef.current);
          }
        }
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Auto scroll to chat bottom ONLY when a new message is actively added during conversation
  useEffect(() => {
    const currentLen = entry.messages?.length || 0;
    if (currentLen > prevMsgLengthRef.current && isExpanded) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    prevMsgLengthRef.current = currentLen;
  }, [entry.messages?.length, isExpanded]);

  const handleCopy = () => {
    let textToCopy = '';
    if (entry.reflectionSummary) {
      textToCopy += `Domain: ${entry.category?.domain || 'Work'}\nSummary: ${entry.reflectionSummary}\n\nCoaching:\n${entry.adaptiveResponse}\n\n`;
      if (entry.creativeSpark) {
        textToCopy += `Creative Spark:\n${entry.creativeSpark}\n\n`;
      }
      if (entry.location) {
        textToCopy += `Location: ${entry.location.name} (${entry.location.address || ''})\n\n`;
      }
      if (entry.messages && entry.messages.length > 0) {
        textToCopy += `Discussion Thread:\n` + entry.messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n') + '\n\n';
      }
      textToCopy += `Original Journal:\n${entry.rawText}`;
    } else {
      textToCopy = entry.rawText;
    }

    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const domain = entry.category?.domain || 'Work';
  
  const domainConfig = {
    Work: {
      badgeBg: 'metallic-blue-panel text-sky-200 border-sky-400/50 shadow-[0_0_10px_rgba(56,189,248,0.25)]',
      tagline: 'Work & Strategy Partner 🚀',
      icon: Briefcase,
    },
    Personal: {
      badgeBg: 'metallic-green-panel text-emerald-200 border-emerald-400/50 shadow-[0_0_10px_rgba(52,211,153,0.25)]',
      tagline: 'Life & Well-Being Cheerleader 🌟',
      icon: Heart,
    },
    Creative: {
      badgeBg: 'metallic-purple-panel text-purple-200 border-purple-400/50 shadow-[0_0_10px_rgba(192,132,252,0.25)]',
      tagline: 'Creative Muse & Spark 🎨',
      icon: Palette,
    },
    'Email Drafting': {
      badgeBg: 'metallic-green-panel text-emerald-200 border-emerald-400/50 shadow-[0_0_10px_rgba(52,211,153,0.25)]',
      tagline: 'Friendly Email Stylist ✉️',
      icon: Mail,
    }
  }[domain] || {
    badgeBg: 'metallic-gold-panel text-[#f6e7b8] border-[#f6e7b8]/50 shadow-[0_0_10px_rgba(246,231,184,0.25)]',
    tagline: 'Friendly Journal Companion ✨',
    icon: Sparkles,
  };

  const DomainIcon = domainConfig.icon;

  const timeInfo = getRelativeTimeInfo(entry.createdAt);

  const relativeTimeBadgeStyle = {
    today: 'metallic-gold-panel text-[#f6e7b8] border-[#f6e7b8]/60 shadow-[0_0_14px_rgba(246,231,184,0.35)]',
    recent: 'metallic-blue-panel text-sky-200 border-sky-400/50 shadow-[0_0_14px_rgba(56,189,248,0.25)]',
    past: 'metallic-purple-panel text-purple-200 border-purple-400/50 shadow-[0_0_14px_rgba(192,132,252,0.25)]',
    old: 'metallic-titanium-button text-slate-200 border-white/25 shadow-sm'
  }[timeInfo.badgeStyle] || 'metallic-gold-panel text-[#f6e7b8] border-[#f6e7b8]/60';

  const cardThemeClass = {
    Work: 'metallic-card-work',
    Personal: 'metallic-card-personal',
    Creative: 'metallic-card-creative',
    'Email Drafting': 'metallic-card-email',
  }[domain] || 'metallic-card-gold';

  const memoThemeConfig = {
    Work: {
      wrapper: 'memo-paper-work border-[#2563eb]',
      innerSheet: 'memo-inner-work border-[#93c5fd] text-[#0f2744]',
      tape: 'bg-gradient-to-r from-sky-600/40 via-sky-400/60 to-sky-600/40',
      iconBox: 'bg-sky-950/80 border-sky-400/50 text-sky-300',
      iconText: 'text-sky-300',
      titleText: 'text-sky-100',
      wordCountText: 'text-sky-300/80',
      editBtn: 'bg-sky-900/60 hover:bg-sky-800/80 text-sky-100 border-sky-400/50',
    },
    Personal: {
      wrapper: 'memo-paper-personal border-[#784724]',
      innerSheet: 'memo-inner-personal border-[#cbb592] text-[#2c1808]',
      tape: 'bg-gradient-to-r from-amber-600/40 via-amber-400/60 to-amber-600/40',
      iconBox: 'bg-[#1e1208] border-amber-400/50 text-amber-300',
      iconText: 'text-amber-300',
      titleText: 'text-amber-100',
      wordCountText: 'text-amber-300/80',
      editBtn: 'bg-amber-950/70 hover:bg-amber-900/80 text-amber-100 border-amber-400/50',
    },
    Creative: {
      wrapper: 'memo-paper-creative border-[#7e22ce]',
      innerSheet: 'memo-inner-creative border-[#d8b4fe] text-[#2e1052]',
      tape: 'bg-gradient-to-r from-purple-600/40 via-purple-400/60 to-purple-600/40',
      iconBox: 'bg-purple-950/80 border-purple-400/50 text-purple-300',
      iconText: 'text-purple-300',
      titleText: 'text-purple-100',
      wordCountText: 'text-purple-300/80',
      editBtn: 'bg-purple-900/60 hover:bg-purple-800/80 text-purple-100 border-purple-400/50',
    },
    'Email Drafting': {
      wrapper: 'memo-paper-email border-[#16a34a]',
      innerSheet: 'memo-inner-email border-[#86efac] text-[#063319]',
      tape: 'bg-gradient-to-r from-emerald-600/40 via-emerald-400/60 to-emerald-600/40',
      iconBox: 'bg-emerald-950/80 border-emerald-400/50 text-emerald-300',
      iconText: 'text-emerald-300',
      titleText: 'text-emerald-100',
      wordCountText: 'text-emerald-300/80',
      editBtn: 'bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-100 border-emerald-400/50',
    },
  }[domain] || {
    wrapper: 'memo-paper-personal border-[#784724]',
    innerSheet: 'memo-inner-personal border-[#cbb592] text-[#2c1808]',
    tape: 'bg-gradient-to-r from-amber-600/40 via-amber-400/60 to-amber-600/40',
    iconBox: 'bg-[#1e1208] border-amber-400/50 text-amber-300',
    iconText: 'text-amber-300',
    titleText: 'text-amber-100',
    wordCountText: 'text-amber-300/80',
    editBtn: 'bg-amber-950/70 hover:bg-amber-900/80 text-amber-100 border-amber-400/50',
  };

  const isSynthesizing = entry.aiStatus === 'synthesizing';
  const isError = entry.aiStatus === 'error';
  const hasAiContent = Boolean(entry.reflectionSummary && entry.adaptiveResponse);

  // Derived meta properties for clean collapsed view
  const wordCount = entry.rawText ? entry.rawText.trim().split(/\s+/).filter(Boolean).length : 0;
  const isEdited = Boolean(entry.updatedAt && entry.updatedAt > entry.createdAt);
  // Essence-driven title for this journal post (never slices raw highlights)
  const formatEssenceTitle = () => {
    if (entry.title) {
      return entry.title.replace(/^[#*>\-\s"']+|[#*>\-\s"']+$/g, '').trim();
    }
    if (isSynthesizing) {
      return '✨ Synthesizing Reflection...';
    }
    return `${domain} Reflection`;
  };

  const postTitle = formatEssenceTitle();

  // Show full main journal text in snippet preview
  const postSnippet = entry.rawText || entry.reflectionSummary;
  const totalActionCount = entry.actionItems?.length || 0;
  const completedActionCount = entry.actionItems?.filter(a => a.completed).length || 0;
  const chatMessageCount = entry.messages?.length || 0;

  // Save Edit Handler
  const handleSaveEdit = async (reReflect: boolean = false) => {
    if (!editText.trim()) return;
    setIsSavingEdit(true);
    try {
      const updates: Partial<JournalEntry> = {
        rawText: editText.trim(),
        reflectionSummary: editSummary.trim() || entry.reflectionSummary,
        updatedAt: Date.now()
      };

      if (onUpdateEntry) {
        await onUpdateEntry(entry.id, updates);
      }

      setIsEditing(false);

      if (reReflect && onTriggerAiReflection) {
        onTriggerAiReflection(entry.id);
      }
    } catch (err) {
      console.error('Failed to save edited entry:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete message handler
  const handleDeleteMessage = async (msgId: string) => {
    if (!onUpdateEntry) return;
    const currentMessages = entry.messages || [];
    const filtered = currentMessages.filter(m => m.id !== msgId);
    await onUpdateEntry(entry.id, { messages: filtered });
  };

  // Multi-Turn Chat & Quick Action Handler
  const handleTriggerQuickAction = async (actionType: QuickActionType, customPrompt?: string) => {
    if (isChatLoading) return;
    setChatError(null);
    setActiveActionChip(actionType);
    setIsChatLoading(true);

    const now = Date.now();
    let displayPrompt = customPrompt || '';
    if (!displayPrompt) {
      if (actionType === 'propose_update') displayPrompt = '📝 Update Journal Post (with conversation insights)';
      else if (actionType === 'improve_fluency') displayPrompt = '✨ Improve Language Fluency & Grammar Flow';
      else if (actionType === 'structure_notes') displayPrompt = '📋 Structure Notes (Headers & Bullets)';
      else if (actionType === 'extract_checklist') displayPrompt = '✅ Extract Action Checklist';
      else if (actionType === 'refine_tone') displayPrompt = '✨ Refine & Polish Reflection';
      else if (actionType === 'brainstorm') displayPrompt = '💡 Brainstorm Ideas & Next Steps';
      else if (actionType === 'draft_email') displayPrompt = '✉️ Draft Executive Email';
      else if (actionType === 'expand_email') displayPrompt = '📖 Expand Email with Context & Detail';
      else if (actionType === 'shorten_email') displayPrompt = '✂️ Make Email Shorter & Concise';
      else if (actionType === 'formalize_email') displayPrompt = '👔 Formalize Tone for Leadership';
      else if (actionType === 'add_cta') displayPrompt = '🎯 Add Clear Call to Action';
      else if (actionType === 'refine_email_tone') displayPrompt = '✨ Refine Tone & Clarity';
      else displayPrompt = 'Explore next steps on this journal entry.';
    }

    const newUserMsg: ChatMessage = {
      id: `msg-user-${now}`,
      role: 'user',
      content: displayPrompt,
      timestamp: now,
      quickActionType: actionType
    };

    const currentMessages = entry.messages || [];
    const updatedMessagesWithUser = [...currentMessages, newUserMsg];

    if (onUpdateEntry) {
      onUpdateEntry(entry.id, { messages: updatedMessagesWithUser });
    }

    try {
      const response = await sendChatMessageAPI({
        entryId: entry.id,
        rawText: entry.rawText,
        reflectionSummary: entry.reflectionSummary,
        adaptiveResponse: entry.adaptiveResponse,
        domain: entry.category?.domain || 'Work',
        persona,
        messages: updatedMessagesWithUser,
        actionType,
        userMessage: displayPrompt
      });

      const assistantMsg = response.message;
      const finalMessages = [...updatedMessagesWithUser, assistantMsg];

      const updates: Partial<JournalEntry> = {
        messages: finalMessages
      };

      if (assistantMsg.emailDraft) {
        updates.emailDraft = assistantMsg.emailDraft;
      }

      if (domain === 'Work' && assistantMsg.extractedActionItems && assistantMsg.extractedActionItems.length > 0) {
        const existingTasks = new Set((entry.actionItems || []).map(a => (a.text || a.task || '').toLowerCase()));
        const newUniqueItems = assistantMsg.extractedActionItems.filter(
          item => !existingTasks.has((item.text || item.task || '').toLowerCase())
        );

        if (newUniqueItems.length > 0) {
          updates.actionItems = [...(entry.actionItems || []), ...newUniqueItems];
        }
      }

      if (onUpdateEntry) {
        await onUpdateEntry(entry.id, updates);
      }
    } catch (err: any) {
      console.error('Chat action failed:', err);
      setChatError(err?.message || 'Failed to generate response. Please try again.');
    } finally {
      setIsChatLoading(false);
      setActiveActionChip(null);
      setChatInput('');
    }
  };

  // Proposal Editing Handlers (edit proposal before merging)
  const handleStartEditingProposal = (msgId: string, initialWriteup: string, initialSummary?: string) => {
    setEditingProposalMsgId(msgId);
    setEditedProposalWriteup(initialWriteup);
    setEditedProposalSummary(initialSummary || '');
  };

  const handleCancelEditingProposal = () => {
    setEditingProposalMsgId(null);
    setEditedProposalWriteup('');
    setEditedProposalSummary('');
  };

  const handleSaveEditedProposalToMessage = async (msgId: string) => {
    if (!onUpdateEntry) return;
    const currentMessages = entry.messages || [];
    const updatedMessages = currentMessages.map(m => {
      if (m.id === msgId && m.suggestedUpdate) {
        return {
          ...m,
          suggestedUpdate: {
            ...m.suggestedUpdate,
            mergedRawText: editedProposalWriteup.trim() || m.suggestedUpdate.mergedRawText,
            refinedSummary: editedProposalSummary.trim() || m.suggestedUpdate.refinedSummary
          }
        };
      }
      return m;
    });

    await onUpdateEntry(entry.id, { messages: updatedMessages });
    setEditingProposalMsgId(null);
  };

  const handleApplySuggestedUpdate = async (
    msgId: string, 
    update: NonNullable<ChatMessage['suggestedUpdate']>,
    customWriteup?: string
  ) => {
    if (!onUpdateEntry) return;

    const writeupToUse = customWriteup !== undefined ? customWriteup : update.mergedRawText;

    const updates: Partial<JournalEntry> = {};
    if (writeupToUse) {
      updates.rawText = writeupToUse;
      setEditText(writeupToUse);
    }
    if (update.refinedSummary) {
      updates.reflectionSummary = update.refinedSummary;
      setEditSummary(update.refinedSummary);
    }
    if (update.refinedAdaptiveResponse) {
      updates.adaptiveResponse = update.refinedAdaptiveResponse;
    }
    if (update.emailBody || update.emailSubject) {
      updates.emailDraft = {
        subject: update.emailSubject || entry.emailDraft?.subject || 'Email Draft',
        body: update.emailBody || entry.emailDraft?.body || '',
        recipient: update.recipient || entry.emailDraft?.recipient,
        tone: entry.emailDraft?.tone
      };
    }
    if (update.actionItems && update.actionItems.length > 0 && domain === 'Work') {
      updates.actionItems = update.actionItems;
    }

    const currentMessages = entry.messages || [];
    const updatedMessages = currentMessages.map(m =>
      m.id === msgId
        ? {
            ...m,
            suggestedUpdate: {
              ...m.suggestedUpdate,
              ...update,
              mergedRawText: writeupToUse || update.mergedRawText,
              applied: true
            }
          }
        : m
    );
    updates.messages = updatedMessages;

    await onUpdateEntry(entry.id, updates);
    setEditingProposalMsgId(null);
  };

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    handleTriggerQuickAction('custom', chatInput.trim());
  };

  return (
    <div
      ref={cardRef}
      id={`entry-${entry.id}`}
      style={{
        transition: 'opacity 0.4s ease-out',
        opacity: isVisible ? 1 : 0
      }}
      className={`relative rounded-xl sm:rounded-2xl ${cardThemeClass} aero-float-card shadow-2xl overflow-hidden ${
        isFocused ? 'ring-2 ring-[#f6e7b8] border-[#f6e7b8]/70 shadow-[0_0_35px_rgba(246,231,184,0.35)]' : ''
      }`}
    >
      {/* 1. Header Row with Prominent Date Time & Unified When | Category Bubble */}
      <div className="p-2.5 sm:p-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3.5 bg-white/[0.02]">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-4">
          {/* Prominent Clear Date & Time */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs sm:text-base font-bold text-slate-100 font-sans tracking-tight drop-shadow-xs">
              {timeInfo.fullFormattedDate}
            </span>
          </div>

          {/* Unified Bubble: When | Category */}
          <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold border border-white/20 metallic-panel shadow-sm bg-black/40">
            <span className="flex items-center gap-1 text-sky-200">
              <Clock className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-sky-400 shrink-0" />
              <span>{timeInfo.relativeLabel}</span>
            </span>

            <span className="text-white/30 font-light select-none">|</span>

            <span className="flex items-center gap-1 uppercase tracking-wider text-amber-200 font-bold">
              <DomainIcon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
              <span>{domain}</span>
            </span>
          </div>

          {entry.category?.departmentOrContext && (
            <span className="text-[10px] sm:text-xs text-slate-300 font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg metallic-panel truncate max-w-[140px] sm:max-w-[200px] border border-white/10 hidden xs:inline">
              {entry.category.departmentOrContext}
            </span>
          )}

          {/* Location Pin Badge */}
          {entry.location && (
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="text-[10px] sm:text-xs text-slate-200 bg-gradient-to-r from-slate-800/90 via-slate-700/85 to-slate-800/90 hover:from-slate-700 hover:to-slate-750 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-lg sm:rounded-xl flex items-center gap-1 hover:text-white transition-all cursor-pointer shadow-md border border-slate-400/40"
              title="Toggle Map View"
            >
              <span className="text-xs select-none">📍</span>
              <span className="font-semibold truncate max-w-[120px] sm:max-w-none">{entry.location.name}</span>
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-slate-300 shrink-0 self-auto justify-end md:self-center">
          
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* 1. Read Aloud Audio Player Toggle */}
            <button
              type="button"
              onClick={() => setShowVoicePlayer(!showVoicePlayer)}
              className={`h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap transition-all ${
                showVoicePlayer
                  ? 'metallic-btn-3d-violet ring-2 ring-purple-300/80 brightness-115'
                  : 'metallic-btn-3d-violet'
              }`}
              title="Read aloud journal & reflection with voice narration"
            >
              <Volume2 className="w-3.5 h-3.5 text-purple-200 shrink-0" />
              <span className="hidden sm:inline">{showVoicePlayer ? 'Hide Audio' : 'Read Aloud'}</span>
            </button>

            {/* 2. Expand / Collapse Details Button */}
            <button
              type="button"
              onClick={() => {
                const next = !isExpanded;
                setIsExpanded(next);
                if (next) {
                  scrollToCardTop();
                }
              }}
              className={`h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap transition-all ${
                isExpanded
                  ? 'metallic-gold-button text-[#070d1e] shadow-[0_0_16px_rgba(246,231,184,0.4)]'
                  : 'metallic-btn-3d-blue'
              }`}
              title={isExpanded ? 'Collapse view' : 'Expand full reflection details'}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-[#070d1e] shrink-0" />
                  <span className="hidden sm:inline">Collapse</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-sky-200 shrink-0" />
                  <span className="hidden sm:inline">View Details</span>
                </>
              )}
            </button>
          </div>

          {/* 3. Utility Actions Group: Bookmark & Delete */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Bookmark Button */}
            <button
              type="button"
              onClick={() => onToggleBookmark(entry.id, !entry.bookmarked)}
              className={`h-8 sm:h-8.5 w-8 sm:w-8.5 rounded-lg sm:rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                entry.bookmarked
                  ? 'metallic-btn-3d text-[#f6e7b8] border-amber-400/80 shadow-[0_0_12px_rgba(246,231,184,0.35)]'
                  : 'metallic-btn-3d text-slate-300 hover:text-[#f6e7b8]'
              }`}
              title={entry.bookmarked ? 'Remove Bookmark' : 'Bookmark Reflection'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${entry.bookmarked ? 'fill-[#f6e7b8] text-[#f6e7b8]' : ''}`} />
            </button>

            {/* Delete Entry */}
            {isConfirmingDelete ? (
              <div className="h-8 sm:h-8.5 flex items-center gap-1 bg-gradient-to-r from-rose-950 to-rose-900 px-2 rounded-lg sm:rounded-xl border border-rose-500/70 shadow-lg animate-in fade-in-50 duration-150">
                <span className="text-[9px] sm:text-[10px] text-rose-200 font-bold px-0.5">Del?</span>
                <button
                  type="button"
                  onClick={() => onDeleteEntry(entry.id)}
                  className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[9px] sm:text-[10px] font-extrabold cursor-pointer"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 text-[9px] sm:text-[10px] cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="h-8 sm:h-8.5 w-8 sm:w-8.5 rounded-lg sm:rounded-xl flex items-center justify-center metallic-btn-3d text-slate-300 hover:text-rose-400 hover:border-rose-500/60 cursor-pointer transition-all"
                title="Delete Journal Entry"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Voice Narration Audio Player (Placed Directly Above the Banner Part) */}
      {showVoicePlayer && (
        <div className="p-3.5 sm:p-4 pb-0 animate-in fade-in-50 duration-200">
          <JournalVoicePlayer
            entry={entry}
            onClose={() => setShowVoicePlayer(false)}
          />
        </div>
      )}

      {/* 3. Photorealistic AI Banner Image Display (Logged-In Feature / Locked in Demo, Suppressed for Email Drafting) */}
      {domain !== 'Email Drafting' && (
        isGuest ? (
          <div className="p-4 pb-0 animate-in fade-in-50 duration-200">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0c1527] via-[#090e1a] to-[#060a12] border border-white/10 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm select-none">🎨</span>
                <span className="text-xs font-semibold text-[#f6e7b8] uppercase tracking-wider font-sans">AI Banner Artwork</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-white/10 font-mono">Logged-In Feature</span>
              </div>
              <p className="text-xs text-slate-400">
                AI Banner generation is accessible when logged in.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 pb-0 animate-in fade-in-50 duration-200">
            <EditorialArtCanvas 
              entryId={entry.id}
              prompt={entry.rawText || entry.reflectionSummary} 
              domain={entry.category?.domain} 
              imageUrl={entry.bannerImageUrl}
              storagePath={entry.bannerStoragePath}
              rawText={entry.rawText}
              topicTitle={postTitle}
              isExpanded={isExpanded}
              className="w-full shadow-lg border border-white/15"
              onRegenerate={() => {
                onUpdateEntry?.(entry.id, { bannerImageUrl: undefined, bannerStoragePath: undefined });
              }}
              onImageGenerated={(newUrl, newStoragePath) => {
                onUpdateEntry?.(entry.id, { bannerImageUrl: newUrl, bannerStoragePath: newStoragePath });
              }}
              onClickToggleExpand={() => setIsExpanded(!isExpanded)}
            />
          </div>
        )
      )}

      {/* 4. Interactive Map Snippet Preview (Logged-In Feature / Locked in Demo) */}
      {isExpanded && showMap && entry.location && (
        <div className="p-3.5 sm:p-4.5 bg-gradient-to-r from-[#0c1322] via-[#090e1a] to-[#060a12] border-b border-slate-500/30 space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 font-semibold text-slate-200 flex-wrap">
              <span className="text-sm select-none">📍</span>
              <span className="text-white font-bold text-sm">{entry.location.name}</span>
              {entry.location.address && (
                <span className="text-slate-400 font-normal text-xs">({entry.location.address})</span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setShowMap(false)}
              className="text-slate-300 hover:text-white text-xs px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer border border-white/10 ml-auto font-medium"
            >
              Close
            </button>
          </div>
          {isGuest ? (
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-4 sm:p-5 text-center space-y-1.5">
              <div className="inline-flex items-center justify-center p-2 rounded-full bg-slate-800/80 border border-white/10 text-slate-300 shadow-sm">
                <span className="text-base">🗺️</span>
              </div>
              <h4 className="text-xs font-semibold text-slate-200 font-sans">
                Interactive Map Grounding
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Interactive Google Maps previews with spatial pins are accessible when logged in.
              </p>
            </div>
          ) : (
            <GoogleMapView location={entry.location} className="h-72 sm:h-80 md:h-96 w-full rounded-2xl overflow-hidden border border-slate-400/30 shadow-2xl" />
          )}
        </div>
      )}

      {/* 5. Main Content Body (Collapsed Overview VS Staggered Expanded Details) */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Main Content Body: Authentic Paper Journal Memo & Optional Staggered AI Details */}
        <div className="space-y-4">
          {/* Element 1: Inline Edit Mode Form OR Original Journal Memo Paper Sheet */}
          {isEditing ? (
            <motion.div 
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.04 }}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="p-5 rounded-2xl metallic-card border border-blue-400/40 space-y-4 shadow-xl select-text"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                  <Pencil className="w-4 h-4 text-blue-400" />
                  <span>Edit Journal Entry</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Original Journal Text</label>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={6}
                  className={`w-full px-3.5 sm:px-4 py-3 rounded-xl ${memoThemeConfig.innerSheet} placeholder-stone-500 font-oregano text-[18px] sm:text-[19px] leading-[32px] border focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all shadow-inner select-text`}
                  placeholder="Write your journal thoughts here..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Reflection Summary (Optional)</label>
                <input
                  type="text"
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 text-[#f6e7b8] text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-blue-400/30 transition-all select-text"
                  placeholder="Core summary takeaway..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSavingEdit || !editText.trim()}
                    onClick={() => handleSaveEdit(false)}
                    className="px-4 py-2 rounded-xl metallic-titanium-button text-slate-200 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5 text-blue-300" />
                    <span>Save Text</span>
                  </button>

                  {onTriggerAiReflection && (
                    <button
                      type="button"
                      disabled={isSavingEdit || !editText.trim()}
                      onClick={() => handleSaveEdit(true)}
                      className="px-4 py-2 rounded-xl metallic-gold-button text-[#070d1e] font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#070d1e]" />
                      <span>Save & Update AI Coaching</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            /* Original Journal Post (Compact Memo with Category Tinted Dot Grid & Crisp Text) */
            <motion.div 
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.04 }}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className={`p-2.5 sm:p-4 rounded-xl ${memoThemeConfig.wrapper} shadow-[0_10px_28px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.7)] space-y-2 relative overflow-hidden select-text`}
            >
              {/* Subtle memo top washi tape / paper clip accent */}
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-20 sm:w-28 h-1 sm:h-1.5 ${memoThemeConfig.tape} rounded-b-md shadow-xs`} />

              <div className="flex items-center justify-between gap-1.5 text-xs font-semibold pt-0.5">
                <div className="flex items-center gap-1.5">
                  <img 
                    src={fountainPenImg} 
                    alt="Journal Memo Icon" 
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg object-cover shadow-xs border border-white/20" 
                  />
                  <span className={`uppercase tracking-widest text-[11px] sm:text-xs font-extrabold ${memoThemeConfig.titleText}`}>
                    {domain === 'Email Drafting'
                      ? (isEdited ? 'Edited Email Prompt' : 'initial email prompt')
                      : (isEdited ? 'Edited Journal Memo' : 'Journal Memo')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className={`text-[10px] sm:text-[11px] ${memoThemeConfig.wordCountText} font-mono font-medium px-1`}>
                    {entry.rawText ? `${wordCount} ${wordCount === 1 ? 'word' : 'words'}` : ''}
                  </span>

                  {/* Copy Journal Text Button */}
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`text-[10px] sm:text-[11px] ${memoThemeConfig.editBtn} flex items-center gap-1 cursor-pointer transition-colors px-2 py-0.5 rounded-lg shadow-xs font-medium border`}
                    title="Copy journal text"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 opacity-75" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {/* Edit Journal Memo Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setEditText(entry.rawText);
                      setEditSummary(entry.reflectionSummary || '');
                    }}
                    className={`text-[10px] sm:text-[11px] ${memoThemeConfig.editBtn} flex items-center gap-1 cursor-pointer transition-colors px-2 py-0.5 rounded-lg shadow-xs font-medium border`}
                    title={domain === 'Email Drafting' ? "Edit email prompt" : "Edit journal memo"}
                  >
                    <Pencil className="w-3 h-3 opacity-75" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
              <div 
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className={`px-3.5 sm:px-4 py-3 rounded-lg ${memoThemeConfig.innerSheet} font-oregano text-[18px] sm:text-[19px] leading-[32px] tracking-wide whitespace-pre-wrap select-text cursor-text shadow-xs min-h-[96px]`}
              >
                {entry.rawText}
              </div>
            </motion.div>
          )}

          {/* JOURNAL PHOTOS GALLERY (Parked directly under the post, visible in condensed and expanded views) */}
          <JournalPhotoGallery
            entryId={entry.id}
            photos={entry.photos || []}
            onUpdatePhotos={(updatedPhotos) => {
              onUpdateEntry?.(entry.id, { photos: updatedPhotos });
            }}
            isExpanded={isExpanded}
          />

          {/* CONDENSED VIEW FOOTER (Shown when isExpanded is false) */}
          {!isExpanded && (
            <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2.5 pt-1.5 sm:pt-2 border-t border-white/10 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${domainConfig.badgeBg}`}>
                  {domain}
                </span>

                {domain === 'Work' && totalActionCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{completedActionCount}/{totalActionCount}</span>
                  </span>
                )}

                {chatMessageCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-sky-500/15 text-sky-300 border border-sky-400/30">
                    <MessageSquare className="w-3 h-3 text-sky-400" />
                    <span>{chatMessageCount} msgs</span>
                  </span>
                )}

                {entry.sentiment && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs metallic-panel text-[#f6e7b8] border border-white/10 font-medium">
                    <span>{entry.sentiment.emoji || '✨'}</span>
                    <span className="truncate max-w-[110px] sm:max-w-none">{entry.sentiment.emotionalTone}</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsExpanded(true);
                }}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl metallic-gold-button text-[#070d1e] font-bold text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-md ml-auto group"
              >
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#070d1e] animate-pulse" />
                <span>{domain === 'Email Drafting' ? 'View Email Draft' : 'Expand AI Coaching'}</span>
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#070d1e] group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* EXPANDED VIEW: All AI coaching, analysis, actions, and interactive companion */}
          {isExpanded && (
            <div className="space-y-6 pt-2">

            {/* Synthesizing Status Banner */}
            {isSynthesizing && (
              <div className="p-4 rounded-xl metallic-gold-panel flex items-center gap-3.5 text-slate-200 shadow-md">
                <Loader2 className="w-5 h-5 text-[#f6e7b8] animate-spin shrink-0" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-[#f6e7b8]">Synthesizing {domain} Reflection...</p>
                  <p className="text-[11px] text-slate-300">
                    Calibrating {domainConfig.tagline} coaching & extracting action items.
                  </p>
                </div>
              </div>
            )}

            {/* AI Error & Retry State */}
            {isError && (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs space-y-2.5 text-rose-200 shadow-lg">
                <div className="flex items-center gap-2 font-semibold text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>AI Coaching Synthesis Paused</span>
                </div>
                <p className="text-[11px] text-rose-200/90 leading-relaxed">
                  {entry.aiError || 'AI reflection could not be generated. Your original journal text is safely stored.'}
                </p>
                {onTriggerAiReflection && (
                  <button
                    type="button"
                    onClick={() => onTriggerAiReflection(entry.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md w-fit"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Retry AI Analysis</span>
                  </button>
                )}
              </div>
            )}

            {/* Rich Synthesized View */}
            {hasAiContent && !isSynthesizing && (
              <>
                {/* Element 2: Sentiment Analysis & Reflection Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 35, filter: 'blur(4px)' }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, margin: '0px 0px -80px 0px', amount: 0.2 }}
                  transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4"
                >
                  {/* Sentiment Analysis Banner (if present) */}
                  {entry.sentiment && (
                    <motion.div 
                      initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
                      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      viewport={{ once: true, margin: '0px 0px -80px 0px', amount: 0.2 }}
                      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                      className="p-3.5 sm:p-4 rounded-xl metallic-gold-panel shadow-sm space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl" role="img" aria-label="sentiment emoji">
                            {entry.sentiment.emoji || '✨'}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-[#f6e7b8]">
                            Sentiment: {entry.sentiment.emotionalTone}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.sentiment.energyLevel && (
                            <span className="px-2.5 py-0.5 rounded-full bg-black/40 border border-[#f6e7b8]/30 text-[#f6e7b8] text-[10px] font-mono font-medium">
                              Energy: {entry.sentiment.energyLevel}
                            </span>
                          )}
                          {entry.sentiment.sentimentResonance && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-[#f6e7b8]/40 text-[#f6e7b8] text-[10px] font-medium">
                              {entry.sentiment.sentimentResonance}
                            </span>
                          )}
                        </div>
                      </div>
                      {entry.sentiment.sentimentSummary && (
                        <p className="text-xs sm:text-sm text-[#f6e7b8] leading-relaxed italic">
                          "{entry.sentiment.sentimentSummary}"
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Side-by-Side Grid for Highlights & Creative Spark Cards */}
                  {(() => {
                    const cleanSpark = getCleanCreativeSpark(entry.creativeSpark);
                    return (
                      <div className={`grid grid-cols-1 ${cleanSpark ? 'md:grid-cols-2' : ''} gap-3.5`}>
                        {/* Card 1: Friendly Highlights Card (Lush Emerald / Green Theme) */}
                        <motion.div 
                          initial={{ opacity: 0, y: 35, filter: 'blur(4px)' }}
                          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          viewport={{ once: true, margin: '0px 0px -80px 0px', amount: 0.2 }}
                          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#063b28] via-[#042a1d] to-[#021810] border border-emerald-400/60 space-y-2 shadow-[0_8px_24px_rgba(4,42,27,0.5),inset_0_1px_1px_rgba(52,211,153,0.3)] flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                <span>
                                  {domain === 'Personal' 
                                    ? 'Personal Highlights' 
                                    : domain === 'Work' 
                                    ? 'Focus Summary' 
                                    : domain === 'Creative'
                                    ? 'Creative Highlights'
                                    : 'Email Summary'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="text-[11px] text-emerald-400/70 hover:text-emerald-200 flex items-center gap-1 font-normal lowercase tracking-normal cursor-pointer transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>edit</span>
                              </button>
                            </div>
                            <div className="text-xs sm:text-sm text-emerald-100 font-sans leading-relaxed">
                              <StreamingMarkdown content={entry.reflectionSummary || ''} />
                            </div>
                          </div>
                        </motion.div>

                        {/* Card 2: Creative Spark Card (Amethyst/Purple Theme) - ONLY RENDERED WHEN VALID! */}
                        {cleanSpark && (
                          <motion.div 
                            initial={{ opacity: 0, y: 35, filter: 'blur(4px)' }}
                            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            viewport={{ once: true, margin: '0px 0px -80px 0px', amount: 0.2 }}
                            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
                            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#241133] via-[#1a0a26] to-[#0d0414] border border-purple-500/40 space-y-2 shadow-md flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
                                <Lightbulb className="w-4 h-4 text-purple-400" />
                                <span>✨ Creative Spark</span>
                              </div>
                              <div className="text-xs sm:text-sm text-purple-100 font-sans leading-relaxed italic">
                                "{cleanSpark}"
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })()}
                </motion.div>
              </>
            )}

            {/* Location Context Grounding */}
            {entry.locationContext && !showMap && (
              <motion.div 
                initial={{ opacity: 0, y: 25, filter: 'blur(3px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '0px 0px -60px 0px' }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                className="p-2.5 sm:p-3 rounded-xl metallic-gold-panel text-xs text-[#f6e7b8] flex items-start gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-[#f6e7b8] shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed text-xs text-[#f6e7b8]">
                  <strong className="text-[#f6e7b8]">Setting:</strong> {entry.locationContext}
                </div>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="text-[11px] text-[#f6e7b8] hover:underline shrink-0 cursor-pointer font-medium"
                >
                  View Map
                </button>
              </motion.div>
            )}

            {/* Role-Specific Cognitive Coaching & Actions (Revealed with deliberate scroll & slow fade) */}
            <div className="space-y-5 pt-1">
                {/* Element 3: Dedicated Email Draft & Domain Coaching Guidance */}
                <motion.div
                  initial={{ opacity: 0, y: 40, filter: 'blur(4px)' }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, margin: '0px 0px -90px 0px', amount: 0.2 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4"
                >
                  {/* Dedicated Email Draft Card if domain is Email Drafting or emailDraft is present */}
                  {(domain === 'Email Drafting' || Boolean(entry.emailDraft)) && (
                    (() => {
                      // Ensure a reliable, well-formed draft object is always available
                      const rawDraft = entry.emailDraft;
                      let resolvedSubject = rawDraft?.subject?.trim() || (entry.reflectionSummary ? `Update: ${entry.reflectionSummary.slice(0, 50)}` : `Update: ${entry.rawText.slice(0, 40)}`);
                      let resolvedRecipient = rawDraft?.recipient?.trim() || '';
                      let resolvedBody = rawDraft?.body?.trim() || entry.adaptiveResponse?.trim() || entry.rawText?.trim() || '';
                      let rawTone = rawDraft?.tone?.trim() || 'Professional & Direct';

                      // If LLM returned the whole draft or description inside 'tone', extract clean tone label and push body into body
                      let resolvedTone = rawTone;
                      if (rawTone.length > 50) {
                        resolvedTone = rawTone.slice(0, 45) + '...';
                        if (!rawDraft?.body && rawTone.includes('Body')) {
                          resolvedBody = rawTone;
                        }
                      }

                      const draft = {
                        subject: resolvedSubject,
                        recipient: resolvedRecipient,
                        body: resolvedBody,
                        tone: resolvedTone
                      };

                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 30, filter: 'blur(3px)' }}
                          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          viewport={{ once: true, margin: '0px 0px -80px 0px' }}
                          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                          className="p-3 sm:p-5 rounded-xl sm:rounded-2xl metallic-card border border-emerald-500/40 space-y-2.5 sm:space-y-3.5 shadow-xl"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 pb-2 sm:pb-2.5 border-b border-emerald-500/20">
                            <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-300 font-semibold text-xs uppercase tracking-wider">
                              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                              <span>EMAIL</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              {draft.tone && (
                                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-[9px] sm:text-[10px] font-mono max-w-[180px] sm:max-w-md truncate" title={rawDraft?.tone || draft.tone}>
                                  Tone: {draft.tone}
                                </span>
                              )}

                              {!isEditingEmail ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsEditingEmail(true);
                                      setEditEmailSubject(draft.subject || '');
                                      setEditEmailRecipient(draft.recipient || '');
                                      setEditEmailBody(draft.body || '');
                                    }}
                                    className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[11px] sm:text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Edit Email"
                                  >
                                    <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const full = `Subject: ${draft.subject || ''}\n${draft.recipient ? `To: ${draft.recipient}\n` : ''}\n${draft.body || ''}`;
                                      navigator.clipboard.writeText(full);
                                      setIsCopied(true);
                                      setTimeout(() => setIsCopied(false), 2000);
                                    }}
                                    className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[11px] sm:text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Copy Full Email"
                                  >
                                    <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                                  </button>
                                </>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={isSavingEmailEdit}
                                    onClick={async () => {
                                      if (!onUpdateEntry) return;
                                      setIsSavingEmailEdit(true);
                                      try {
                                        const updatedDraft = {
                                          ...draft,
                                          subject: editEmailSubject.trim() || draft.subject,
                                          recipient: editEmailRecipient.trim() || draft.recipient,
                                          body: editEmailBody
                                        };
                                        await onUpdateEntry(entry.id, {
                                          emailDraft: updatedDraft,
                                          updatedAt: Date.now()
                                        });
                                        setIsEditingEmail(false);
                                      } catch (err) {
                                        console.error('Failed to save email draft edit:', err);
                                      } finally {
                                        setIsSavingEmailEdit(false);
                                      }
                                    }}
                                    className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg bg-emerald-500 text-black font-bold hover:bg-emerald-400 text-[11px] sm:text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>{isSavingEmailEdit ? 'Saving...' : 'Save'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsEditingEmail(false)}
                                    className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-[11px] sm:text-xs transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Email Form / Content */}
                          {isEditingEmail ? (
                            <div className="space-y-3 pt-1">
                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-emerald-300">Subject Line</label>
                                <input
                                  type="text"
                                  value={editEmailSubject}
                                  onChange={(e) => setEditEmailSubject(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl metallic-panel text-white border border-emerald-400/40 text-xs focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                                  placeholder="Email Subject"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-white">Recipient</label>
                                <input
                                  type="text"
                                  value={editEmailRecipient}
                                  onChange={(e) => setEditEmailRecipient(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl metallic-panel text-[#f6e7b8] border border-emerald-400/40 text-xs focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                                  placeholder="e.g. client@company.com"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-emerald-300">Email Body</label>
                                <textarea
                                  rows={8}
                                  value={editEmailBody}
                                  onChange={(e) => setEditEmailBody(e.target.value)}
                                  className="w-full p-3 rounded-xl metallic-panel text-[#f6e7b8] border border-emerald-400/40 text-xs sm:text-sm font-ai-response leading-relaxed focus:ring-1 focus:ring-emerald-400 focus:outline-none resize-y"
                                  placeholder="Compose or edit email body..."
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Email Headers */}
                              <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2 metallic-panel p-2.5 rounded-xl">
                                  <span className="font-semibold text-emerald-300 shrink-0">Subject:</span>
                                  <span className="font-medium text-[#f6e7b8] flex-1 select-all text-xs">{draft.subject}</span>
                                </div>

                                {draft.recipient && (
                                  <div className="flex items-center gap-2 metallic-panel px-3 py-1.5 rounded-xl text-[11px] text-slate-300">
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-white font-medium">Recipient:</span>
                                    <span className="text-[#f6e7b8] font-medium">{draft.recipient}</span>
                                  </div>
                                )}
                              </div>

                              {/* Email Body */}
                              <div className="p-3.5 sm:p-4 rounded-xl metallic-panel text-[#f6e7b8] font-ai-response text-xs sm:text-sm leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/30 min-h-[60px]">
                                {draft.body}
                              </div>
                            </>
                          )}
                        </motion.div>
                      );
                    })()
                  )}

                  {/* Coaching Guidance & Comments (Sapphire Blue Background with Aurora Glow & Gold Text) */}
                  <motion.div 
                    initial={{ opacity: 0, y: 35, filter: 'blur(4px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, margin: '0px 0px -90px 0px', amount: 0.15 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
                    className="p-5 sm:p-6 rounded-2xl ai-feedback-aurora-card space-y-3 relative"
                  >
                    {/* Multicolor Aurora Flow Effect with Cyan, Emerald, Purple & Sky Blue */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl opacity-65">
                      <div className="absolute -top-10 -left-10 w-60 h-60 bg-gradient-to-br from-cyan-500/25 via-sky-400/20 to-transparent rounded-full blur-3xl aurora-orb-1" />
                      <div className="absolute -bottom-12 -right-10 w-64 h-64 bg-gradient-to-tl from-purple-500/25 via-emerald-400/20 to-transparent rounded-full blur-3xl aurora-orb-2" />
                      <div className="absolute top-1/4 right-1/3 w-48 h-48 bg-gradient-to-r from-blue-600/20 via-teal-400/18 to-indigo-500/20 rounded-full blur-2xl aurora-orb-3" />
                    </div>

                    <div className="relative z-10 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#f6e7b8]">
                      <div className="w-6 h-6 rounded-lg bg-sky-950/80 border border-sky-400/40 flex items-center justify-center text-[#f6e7b8] shadow-xs">
                        <Compass className="w-3.5 h-3.5 text-[#f6e7b8]" />
                      </div>
                      <span>
                        {domain === 'Personal' 
                          ? '💖 Friendly Life & Well-Being Notes' 
                          : domain === 'Work' 
                          ? '🚀 AI Feedback & Next Steps'
                          : domain === 'Creative'
                          ? '🎨 Creative Sparks & Insights'
                          : '✉️ Email Insights & Guidance'}
                      </span>
                    </div>
                    <div className="relative z-10 font-ai-response text-xs sm:text-sm text-slate-100 leading-relaxed space-y-2.5 pl-3.5 border-l-2 border-[#f6e7b8]/70 selection:bg-amber-400/30 selection:text-white">
                      <StreamingMarkdown content={getCleanAiFeedback(entry.adaptiveResponse)} />
                    </div>
                  </motion.div>
                </motion.div>

                {/* Element 4: Extracted Action Items Checklist (Next Steps) - ONLY FOR WORK DOMAIN */}
                {domain === 'Work' && entry.actionItems && entry.actionItems.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 35, filter: 'blur(4px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, margin: '0px 0px -90px 0px', amount: 0.15 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                    className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0a1e3f] via-[#07162e] to-[#040e1d] border border-sky-400/35 shadow-[0_10px_32px_rgba(8,24,48,0.55),inset_0_1px_1px_rgba(56,189,248,0.2)] space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#f6e7b8]">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#f6e7b8]" />
                        <span>🎯 Action Checklist & Next Steps ({entry.actionItems.filter(a => a.completed).length}/{entry.actionItems.length})</span>
                      </span>
                    </div>
                    <div className="space-y-2">
                      {entry.actionItems.map(item => {
                        const itemCategory = item.category || 'Next Step';
                        const categoryBadge = {
                          'Next Step': 'bg-amber-400/20 text-[#f6e7b8] border-[#f6e7b8]/40',
                          'Healthy Habit': 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40',
                          'Creative Spark': 'bg-purple-400/20 text-purple-200 border-purple-400/40'
                        }[itemCategory] || 'bg-amber-400/15 text-[#f6e7b8] border-[#f6e7b8]/30';

                        return (
                          <div
                            key={item.id}
                            onClick={() => onToggleActionItem(entry.id, item.id, !item.completed)}
                            className={`flex items-start gap-3.5 p-3 rounded-xl border transition-all cursor-pointer select-none shadow-xs ${
                              item.completed
                                ? 'bg-black/40 border-white/5 opacity-60'
                                : 'bg-[#0e274e]/70 border-sky-400/30 text-[#f6e7b8] hover:border-sky-300 hover:bg-[#123160]/80'
                            }`}
                          >
                            <button className="mt-0.5 shrink-0 focus:outline-none">
                              {item.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-[#8a919e]" />
                              ) : (
                                <Circle className="w-4 h-4 text-[#f6e7b8] hover:text-white" />
                              )}
                            </button>
                            <span className={`text-xs sm:text-sm leading-normal flex-1 transition-colors ${
                              item.completed 
                                ? 'text-slate-400 line-through font-normal' 
                                : 'text-[#f6e7b8] font-medium'
                            }`}>
                              {item.text || item.task}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono shrink-0 ${
                              item.completed 
                                ? 'bg-white/5 text-slate-400 border-white/10' 
                                : categoryBadge
                            }`}>
                              {itemCategory}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Element 6: Follow-Up Chat Stream with Multi-Turn Conversation & Sentiments Merging */}
                <motion.div
                  initial={{ opacity: 0, y: 35, filter: 'blur(4px)' }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, margin: '0px 0px -90px 0px', amount: 0.15 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
                  className="pt-3 border-t border-white/10 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl sm:text-2xl select-none filter drop-shadow-[0_2px_8px_rgba(246,231,184,0.4)]" aria-hidden="true">
                        💬
                      </span>
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold silver-blue-gradient-text tracking-wide drop-shadow-[0_0_14px_rgba(56,189,248,0.35)]">
                          Chat More
                        </h3>
                        <p className="text-[11px] sm:text-xs text-slate-300/80 font-normal">
                          Explore deeper reflections, ask questions, or polish your thoughts together.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Integrated Inquisitive Leading Questions Banner */}
                  <motion.div 
                    initial={{ opacity: 0, y: 30, filter: 'blur(3px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, margin: '0px 0px -80px 0px' }}
                    transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                    className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#0c1a2e] via-[#081220] to-[#040812] border border-sky-500/35 space-y-2 shadow-md"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-300">
                      <HelpCircle className="w-4 h-4 text-sky-400" />
                      <span>🤔 Inquisitive Leading Questions</span>
                    </div>
                    <div className="text-xs sm:text-sm text-sky-100 font-sans leading-relaxed">
                      <StreamingMarkdown content={extractInquisitiveQuestions(entry.adaptiveResponse || '', entry.rawText || '')} />
                    </div>
                  </motion.div>

                  {/* Messages Feed (Naturally flows downwards without fixed scrollbar) */}
                  {entry.messages && entry.messages.length > 0 && (
                    <div className="space-y-3">
                      {entry.messages.map((msg, msgIdx) => {
                        const isUser = msg.role === 'user';
                        const isLatestAssistant = !isUser && msgIdx === entry.messages!.length - 1;
                        const isEditingThisProposal = editingProposalMsgId === msg.id;

                        return (
                          <div
                            key={msg.id}
                            className={`p-3.5 sm:p-4 rounded-2xl border text-xs space-y-2.5 relative group ${
                              isUser
                                ? 'metallic-user-chat-bubble ml-auto max-w-[90%] sm:max-w-[80%] md:max-w-[72%] border-amber-600/50 text-[#f6e7b8] shadow-[0_8px_24px_rgba(40,20,8,0.75)]'
                                : 'metallic-card text-[#f6e7b8] mr-auto max-w-[95%] sm:max-w-[90%]'
                            }`}
                          >
                            {/* Header row with gradient sender title, enlarged profile avatar & crisp separator line */}
                            <div className={`flex items-center justify-between pb-2 mb-2 ${isUser ? 'border-b border-amber-500/20' : 'border-b border-white/10'}`}>
                              <div className="flex items-center gap-2">
                                {isUser ? (
                                  <>
                                    {currentUser?.photoURL ? (
                                      <img
                                        src={currentUser.photoURL}
                                        alt={currentUser.displayName || 'You'}
                                        referrerPolicy="no-referrer"
                                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border-2 border-amber-300 shadow-md"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 border border-amber-200/60 flex items-center justify-center text-xs shadow-md">
                                        👤
                                      </div>
                                    )}
                                    <span className="bg-gradient-to-r from-amber-200 via-[#f6e7b8] to-yellow-100 bg-clip-text text-transparent font-extrabold text-xs sm:text-sm tracking-wide">
                                      You
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <img
                                      src={logoImg}
                                      alt="MirrorSync Logo"
                                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border-2 border-[#f6e7b8]/80 shadow-md ring-1 ring-sky-400/40"
                                    />
                                    <span className="bg-gradient-to-r from-amber-300 via-yellow-100 to-sky-300 bg-clip-text text-transparent font-extrabold text-xs sm:text-sm tracking-wide">
                                      {domain === 'Personal' ? 'MirrorSync Life Cheerleader' : 'MirrorSync Partner'}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`font-mono text-[10px] sm:text-[11px] ${isUser ? 'text-amber-200/80' : 'text-slate-400'}`}>
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className={`${isUser ? 'text-amber-400/60 hover:text-rose-300' : 'text-slate-500 hover:text-rose-400'} opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer`}
                                  title="Delete Message"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Message Text with gold text, slightly larger font & refined typography */}
                            {isUser ? (
                              <div className="leading-relaxed font-neuton text-sm sm:text-base text-[#f6e7b8] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-medium whitespace-pre-wrap">
                                {msg.content}
                              </div>
                            ) : (
                              <div className="leading-relaxed font-ai-response text-xs sm:text-sm text-slate-100">
                                <StreamingMarkdown content={msg.content} animate={isLatestAssistant && isChatLoading} />
                              </div>
                            )}

                            {/* Suggested Update / Merge Action Card with Editable Writeup */}
                            {!isUser && msg.suggestedUpdate && (
                              <div className="p-3.5 sm:p-5 rounded-2xl metallic-proposal-card text-xs space-y-3.5 shadow-2xl border border-[#f6e7b8]/35">
                                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                                  <div className="flex items-center gap-2 text-[#f6e7b8] font-bold text-xs">
                                    <Sparkles className="w-4 h-4 text-[#f6e7b8]" />
                                    <span className="tracking-wide">{msg.suggestedUpdate.mergedRawText ? 'Updated Post Proposal' : 'Suggested Refinement'}</span>
                                  </div>
                                  {msg.suggestedUpdate.applied && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-medium flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span>{msg.suggestedUpdate.mergedRawText ? 'Saved to Journal' : 'Applied'}</span>
                                    </span>
                                  )}
                                </div>

                                {msg.suggestedUpdate.mergedRawText && (
                                  <div className="space-y-2.5">
                                    {isEditingThisProposal ? (
                                      <div className="space-y-2.5 bg-black/50 p-3.5 rounded-xl border border-[#f6e7b8]/30">
                                        <div className="flex items-center justify-between">
                                          <span className="font-semibold text-[#f6e7b8] text-xs flex items-center gap-1.5">
                                            <Edit3 className="w-3.5 h-3.5 text-[#f6e7b8]" />
                                            <span>Edit Post Before Saving:</span>
                                          </span>
                                          <button
                                            type="button"
                                            onClick={handleCancelEditingProposal}
                                            className="text-slate-400 hover:text-white p-1 text-[11px] cursor-pointer"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                        <textarea
                                          value={editedProposalWriteup}
                                          onChange={(e) => setEditedProposalWriteup(e.target.value)}
                                          rows={6}
                                          className="w-full p-3 rounded-lg bg-black/70 border border-white/20 text-slate-100 font-neuton text-sm sm:text-base focus:outline-none focus:border-[#f6e7b8] focus:ring-1 focus:ring-[#f6e7b8]/40 transition-all leading-relaxed"
                                          placeholder="Edit your updated journal post..."
                                        />
                                        <div className="flex items-center justify-end gap-2 pt-1">
                                          <button
                                            type="button"
                                            onClick={handleCancelEditingProposal}
                                            className="px-3 py-1 rounded-lg text-slate-400 hover:text-white text-xs cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleSaveEditedProposalToMessage(msg.id)}
                                            className="px-3 py-1 rounded-lg metallic-titanium-button text-slate-200 text-xs font-medium cursor-pointer"
                                          >
                                            Save Draft
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-slate-200 text-[11px] leading-relaxed bg-black/50 p-3.5 rounded-xl space-y-2 border border-white/10">
                                        <div className="flex items-center justify-between">
                                          <strong className="text-[#f6e7b8] block text-xs">Preview Updated Post:</strong>
                                          {!msg.suggestedUpdate.applied && (
                                            <button
                                              type="button"
                                              onClick={() => handleStartEditingProposal(
                                                msg.id, 
                                                msg.suggestedUpdate?.mergedRawText || '',
                                                msg.suggestedUpdate?.refinedSummary
                                              )}
                                              className="text-[11px] text-[#f6e7b8] hover:text-white flex items-center gap-1 cursor-pointer font-medium underline"
                                            >
                                              <Pencil className="w-3 h-3" />
                                              <span>Edit Post</span>
                                            </button>
                                          )}
                                        </div>
                                        <div className="whitespace-pre-wrap font-neuton text-slate-100 text-sm sm:text-base leading-relaxed bg-black/40 p-3 rounded-lg border border-white/10">
                                          {msg.suggestedUpdate.mergedRawText}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {msg.suggestedUpdate.refinedSummary && (
                                  <div className="text-[#f6e7b8] text-[11px] leading-relaxed bg-black/50 p-3 rounded-xl border border-white/10 font-ai-response">
                                    <strong className="text-[#f6e7b8]">Key Takeaway:</strong> {msg.suggestedUpdate.refinedSummary}
                                  </div>
                                )}

                                {!msg.suggestedUpdate.applied && (
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
                                    {!isEditingThisProposal && (
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditingProposal(
                                          msg.id, 
                                          msg.suggestedUpdate?.mergedRawText || '',
                                          msg.suggestedUpdate?.refinedSummary
                                        )}
                                        className="px-3 py-2 sm:py-1.5 rounded-xl metallic-titanium-button text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer hover:text-white"
                                      >
                                        <Pencil className="w-3.5 h-3.5 text-blue-300" />
                                        <span>Edit Post</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (msg.suggestedUpdate) {
                                          const writeup = isEditingThisProposal && editedProposalWriteup.trim()
                                            ? editedProposalWriteup.trim()
                                            : msg.suggestedUpdate.mergedRawText;
                                          handleApplySuggestedUpdate(msg.id, msg.suggestedUpdate, writeup);
                                        }
                                      }}
                                      className="px-3.5 py-2 sm:py-1.5 rounded-xl metallic-gold-button text-[#070d1e] font-bold text-xs hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                                    >
                                      <Check className="w-3.5 h-3.5 text-[#070d1e]" />
                                      <span>{msg.suggestedUpdate.mergedRawText ? '✨ Save to Journal Post' : 'Apply to Reflection'}</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Quick Suggestion Chips */}
                            {isLatestAssistant && msg.quickSuggestions && msg.quickSuggestions.length > 0 && !isChatLoading && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {msg.quickSuggestions.map((suggestion, sIdx) => (
                                  <button
                                    key={sIdx}
                                    type="button"
                                    onClick={() => handleTriggerQuickAction('custom', suggestion)}
                                    className="px-2.5 py-1 rounded-lg metallic-dark-slate text-[11px] transition-all cursor-pointer shadow-xs hover:border-sky-400/60"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>
                  )}

                  {/* Loading Chat Spinner */}
                  {isChatLoading && (
                    <div className="p-3 rounded-xl metallic-gold-panel flex items-center gap-3 text-xs text-[#f6e7b8] animate-pulse">
                      <Loader2 className="w-4 h-4 text-[#f6e7b8] animate-spin" />
                      <span>Life Coach is actively listening & preparing sentiments...</span>
                    </div>
                  )}

                  {/* Chat Error Notice */}
                  {chatError && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-200 flex items-center justify-between gap-2">
                      <span>{chatError}</span>
                      <button
                        type="button"
                        onClick={() => setChatError(null)}
                        className="text-rose-300 hover:text-white text-[11px] underline cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {/* Chat Input Form (Multi-line Textarea: Enter for newline, Ctrl+Enter to send) */}
                  <form onSubmit={handleCustomSubmit} className="space-y-2 pt-1">
                    <div className="relative flex items-end gap-2">
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            if (chatInput.trim() && !isChatLoading) {
                              handleCustomSubmit(e);
                            }
                          }
                        }}
                        disabled={isChatLoading}
                        rows={3}
                        placeholder={
                          domain === 'Personal' 
                            ? "Type your answers or thoughts here to converse & merge into your post (Press Ctrl+Enter to send, Enter for next line)..." 
                            : "Ask a question or continue discussing (Press Ctrl+Enter to send, Enter for next line)..."
                        }
                        className="w-full p-3.5 pr-24 rounded-xl metallic-chat-textarea text-xs sm:text-sm text-slate-100 placeholder-slate-400/80 focus:outline-none disabled:opacity-50 transition-all font-sans leading-relaxed resize-y"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isChatLoading}
                        className="absolute right-2.5 bottom-3 px-3.5 py-2 rounded-xl metallic-gold-button text-[#070d1e] font-semibold text-xs flex items-center gap-1 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-md"
                      >
                        {isChatLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Send</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans px-1">
                      <span>💡 <strong>Tip:</strong> Press <strong>Ctrl + Enter</strong> to send automatically, or <strong>Enter</strong> for a new line.</span>
                    </div>
                  </form>

                  {/* Quick AI Actions (Placed at the bottom below textarea, clicking sends prompt automatically) */}
                  <div className="pt-3 border-t border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-2 font-semibold text-[#f6e7b8]">
                        <Wand2 className="w-3.5 h-3.5 text-[#f6e7b8]" />
                        <span>{domain === 'Email Drafting' ? 'Quick Email Actions' : 'Quick AI Actions'}</span>
                      </span>
                      <span className="text-[11px] text-slate-400">Click to automatically generate & update</span>
                    </div>

                    {domain === 'Email Drafting' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* 1. Update with Chat */}
                        <button
                          type="button"
                          disabled={isChatLoading}
                          onClick={() => handleTriggerQuickAction('propose_update')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                            activeActionChip === 'propose_update' && isChatLoading
                              ? 'metallic-dark-slate-active'
                              : 'metallic-dark-slate'
                          } disabled:opacity-60`}
                        >
                          {isChatLoading && activeActionChip === 'propose_update' ? (
                            <Loader2 className="w-4 h-4 text-sky-300 animate-spin shrink-0" />
                          ) : (
                            <span className="text-sm select-none">💬</span>
                          )}
                          <span className="font-semibold text-slate-100">Update with Chat</span>
                        </button>

                        {/* 2. Improve Fluency & Grammar */}
                        <button
                          type="button"
                          disabled={isChatLoading}
                          onClick={() => handleTriggerQuickAction('improve_fluency')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                            activeActionChip === 'improve_fluency' && isChatLoading
                              ? 'metallic-dark-slate-active'
                              : 'metallic-dark-slate'
                          } disabled:opacity-60`}
                        >
                          {isChatLoading && activeActionChip === 'improve_fluency' ? (
                            <Loader2 className="w-4 h-4 text-emerald-300 animate-spin shrink-0" />
                          ) : (
                            <span className="text-sm select-none">✍️</span>
                          )}
                          <span className="font-semibold text-slate-100">Improve Fluency</span>
                        </button>

                        {/* 3. Expand with Context */}
                        <button
                          type="button"
                          disabled={isChatLoading}
                          onClick={() => handleTriggerQuickAction('expand_email')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                            activeActionChip === 'expand_email' && isChatLoading
                              ? 'metallic-dark-slate-active'
                              : 'metallic-dark-slate'
                          } disabled:opacity-60`}
                        >
                          {isChatLoading && activeActionChip === 'expand_email' ? (
                            <Loader2 className="w-4 h-4 text-sky-300 animate-spin shrink-0" />
                          ) : (
                            <span className="text-sm select-none">📖</span>
                          )}
                          <span className="font-semibold text-slate-100">Expand with Context</span>
                        </button>

                        {/* 4. Make Concise & Direct */}
                        <button
                          type="button"
                          disabled={isChatLoading}
                          onClick={() => handleTriggerQuickAction('shorten_email')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                            activeActionChip === 'shorten_email' && isChatLoading
                              ? 'metallic-dark-slate-active'
                              : 'metallic-dark-slate'
                          } disabled:opacity-60`}
                        >
                          {isChatLoading && activeActionChip === 'shorten_email' ? (
                            <Loader2 className="w-4 h-4 text-amber-300 animate-spin shrink-0" />
                          ) : (
                            <span className="text-sm select-none">✂️</span>
                          )}
                          <span className="font-semibold text-slate-100">Make Concise</span>
                        </button>

                        {/* 5. Formalize for Leadership */}
                        <button
                          type="button"
                          disabled={isChatLoading}
                          onClick={() => handleTriggerQuickAction('formalize_email')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                            activeActionChip === 'formalize_email' && isChatLoading
                              ? 'metallic-dark-slate-active'
                              : 'metallic-dark-slate'
                          } disabled:opacity-60`}
                        >
                          {isChatLoading && activeActionChip === 'formalize_email' ? (
                            <Loader2 className="w-4 h-4 text-blue-300 animate-spin shrink-0" />
                          ) : (
                            <span className="text-sm select-none">👔</span>
                          )}
                          <span className="font-semibold text-slate-100">Formalize Tone</span>
                        </button>

                        {/* 6. Add Call to Action */}
                        <button
                          type="button"
                          disabled={isChatLoading}
                          onClick={() => handleTriggerQuickAction('add_cta')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                            activeActionChip === 'add_cta' && isChatLoading
                              ? 'metallic-dark-slate-active'
                              : 'metallic-dark-slate'
                          } disabled:opacity-60`}
                        >
                          {isChatLoading && activeActionChip === 'add_cta' ? (
                            <Loader2 className="w-4 h-4 text-[#f6e7b8] animate-spin shrink-0" />
                          ) : (
                            <span className="text-sm select-none">🎯</span>
                          )}
                          <span className="font-semibold text-slate-100">Add Call to Action</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* 1. Update Post with Conversation */}
                        <button
                          type="button"
                          disabled={isChatLoading}
                          onClick={() => handleTriggerQuickAction('propose_update')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                            activeActionChip === 'propose_update' && isChatLoading
                              ? 'metallic-dark-slate-active'
                              : 'metallic-dark-slate'
                          } disabled:opacity-60`}
                        >
                          {isChatLoading && activeActionChip === 'propose_update' ? (
                            <Loader2 className="w-4 h-4 text-sky-300 animate-spin shrink-0" />
                          ) : (
                            <span className="text-sm select-none">💬</span>
                          )}
                          <span className="font-semibold text-slate-100">Update with Chat</span>
                        </button>

                        {/* 2. Improve Fluency & Grammar */}
                        <button
                          type="button"
                          disabled={isChatLoading}
                          onClick={() => handleTriggerQuickAction('improve_fluency')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                            activeActionChip === 'improve_fluency' && isChatLoading
                              ? 'metallic-dark-slate-active'
                              : 'metallic-dark-slate'
                          } disabled:opacity-60`}
                        >
                          {isChatLoading && activeActionChip === 'improve_fluency' ? (
                            <Loader2 className="w-4 h-4 text-emerald-300 animate-spin shrink-0" />
                          ) : (
                            <span className="text-sm select-none">✍️</span>
                          )}
                          <span className="font-semibold text-slate-100">Improve Fluency</span>
                        </button>

                        {/* 3. Structure with Bullets */}
                        <button
                          type="button"
                          disabled={isChatLoading}
                          onClick={() => handleTriggerQuickAction('structure_notes')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                            activeActionChip === 'structure_notes' && isChatLoading
                              ? 'metallic-dark-slate-active'
                              : 'metallic-dark-slate'
                          } disabled:opacity-60`}
                        >
                          {isChatLoading && activeActionChip === 'structure_notes' ? (
                            <Loader2 className="w-4 h-4 text-blue-300 animate-spin shrink-0" />
                          ) : (
                            <span className="text-sm select-none">📋</span>
                          )}
                          <span className="font-semibold text-slate-100">Structure with Bullets</span>
                        </button>

                        {/* 4. Domain Specific Action */}
                        {domain === 'Work' ? (
                          <button
                            type="button"
                            disabled={isChatLoading}
                            onClick={() => handleTriggerQuickAction('extract_checklist')}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                              activeActionChip === 'extract_checklist' && isChatLoading
                                ? 'metallic-dark-slate-active'
                                : 'metallic-dark-slate'
                            } disabled:opacity-60`}
                          >
                            {isChatLoading && activeActionChip === 'extract_checklist' ? (
                              <Loader2 className="w-4 h-4 text-emerald-300 animate-spin shrink-0" />
                            ) : (
                              <span className="text-sm select-none">✅</span>
                            )}
                            <span className="font-semibold text-slate-100">Extract Action Items</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isChatLoading}
                            onClick={() => handleTriggerQuickAction('brainstorm')}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                              activeActionChip === 'brainstorm' && isChatLoading
                                ? 'metallic-dark-slate-active'
                                : 'metallic-dark-slate'
                            } disabled:opacity-60`}
                          >
                            {isChatLoading && activeActionChip === 'brainstorm' ? (
                              <Loader2 className="w-4 h-4 text-purple-300 animate-spin shrink-0" />
                            ) : (
                              <span className="text-sm select-none">💡</span>
                            )}
                            <span className="font-semibold text-slate-100">Brainstorm Perspectives</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Element 7: Project Tags & Clarity */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.28 }}
                  className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Tag className="w-3 h-3 text-slate-400" />
                    {entry.category?.projectTags && entry.category.projectTags.length > 0 ? (
                      entry.category.projectTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-lg metallic-panel text-slate-300 text-[11px]"
                        >
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-[11px]">#JournalEntry</span>
                    )}
                  </div>

                  {entry.cognitiveMetrics && (
                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span>
                        Clarity Score: <strong className="text-[#f6e7b8]">{entry.cognitiveMetrics.clarityScore}%</strong>
                      </span>
                    </div>
                  )}
                </motion.div>
              </div>

            {/* Toggle Collapse Bar */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.32 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-2.5 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-[#f6e7b8] transition-colors border-t border-white/10 cursor-pointer metallic-panel rounded-xl mt-2 font-medium"
            >
              <span>{domain === 'Email Drafting' ? 'Collapse to Email Prompt Only' : 'Collapse to Journal Memo Only'}</span>
              <ChevronUp className="w-3.5 h-3.5 text-[#f6e7b8]" />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
