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
import { EditorialArtCanvas } from './EditorialArtCanvas';
import { GoogleMapView } from './GoogleMapView';
import { StreamingMarkdown } from './StreamingMarkdown';
import { sendChatMessageAPI } from '../services/api';
import { JournalVoicePlayer } from './JournalVoicePlayer';
import { getRelativeTimeInfo } from '../utils/dateUtils';

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
}

export function ReflectionCard({
  entry,
  persona,
  onToggleActionItem,
  onToggleBookmark,
  onDeleteEntry,
  onTriggerAiReflection,
  onUpdateEntry,
  isFocused = false
}: ReflectionCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const prevMsgLengthRef = useRef(entry.messages?.length || 0);
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(isFocused);
  const [showMap, setShowMap] = useState<boolean>(true);
  
  // Banner art state - visible in condensed and expanded view
  const [showBanner, setShowBanner] = useState<boolean>(true);
  const [bannerSeed, setBannerSeed] = useState(entry.editorialArtPrompt || `${entry.id}-${entry.rawText.slice(0, 40)}`);

  // Voice narration player state
  const [showVoicePlayer, setShowVoicePlayer] = useState(false);

  // Editing original journal state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(entry.rawText);
  const [editSummary, setEditSummary] = useState(entry.reflectionSummary || '');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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
    if (entry.bannerImageUrl) {
      setShowBanner(true);
    }
  }, [entry.rawText, entry.reflectionSummary, entry.bannerImageUrl]);

  // Expand card if isFocused is set
  useEffect(() => {
    if (isFocused) {
      setIsExpanded(true);
    }
  }, [isFocused]);

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

  const isSynthesizing = entry.aiStatus === 'synthesizing';
  const isError = entry.aiStatus === 'error';
  const hasAiContent = Boolean(entry.reflectionSummary && entry.adaptiveResponse);

  // Derived meta properties for clean collapsed view
  const wordCount = entry.rawText ? entry.rawText.trim().split(/\s+/).filter(Boolean).length : 0;
  const isEdited = Boolean(entry.updatedAt && entry.updatedAt > entry.createdAt);
  // Compact short title (max ~42 chars with clean word boundary)
  const rawTitleSource = entry.reflectionSummary
    ? entry.reflectionSummary.split('\n')[0].replace(/^[#*>\s]+/, '').trim()
    : entry.rawText.split('\n')[0].trim();

  const truncateCompactTitle = (str: string, maxLen = 42) => {
    if (!str || str.length <= maxLen) return str || 'Untitled Reflection';
    const trimmed = str.slice(0, maxLen);
    const lastSpace = trimmed.lastIndexOf(' ');
    return (lastSpace > 15 ? trimmed.slice(0, lastSpace) : trimmed).trim() + '...';
  };

  const postTitle = truncateCompactTitle(rawTitleSource, 42);

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
      if (actionType === 'propose_update') displayPrompt = '📝 Propose Enriched Journal Writeup (incorporating our conversation)';
      else if (actionType === 'structure_notes') displayPrompt = '📋 Structure Notes (Headers & Bullets)';
      else if (actionType === 'extract_checklist') displayPrompt = '✅ Extract Action Checklist';
      else if (actionType === 'refine_tone') displayPrompt = '✨ Refine & Polish Reflection';
      else if (actionType === 'brainstorm') displayPrompt = '💡 Brainstorm Ideas & Next Steps';
      else if (actionType === 'draft_email') displayPrompt = '✉️ Draft Executive Email';
      else if (actionType === 'shorten_email') displayPrompt = '✂️ Make Email Shorter & Punchier';
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
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), filter 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0px)' : 'translateY(28px)'
      }}
      className={`relative rounded-2xl ${cardThemeClass} aero-float-card shadow-2xl overflow-hidden ${
        isFocused ? 'ring-2 ring-[#f6e7b8] border-[#f6e7b8]/70 shadow-[0_0_35px_rgba(246,231,184,0.35)]' : ''
      }`}
    >
      {/* 1. Header Row with Prominent Relative Date Bubble & Exact Date */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-white/[0.02]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-wrap">
          {/* Prominent Relative Time Bubble & Actual Date Section */}
          <div className="flex flex-col items-start gap-1">
            <div className={`px-3.5 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-md border ${relativeTimeBadgeStyle}`}>
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{timeInfo.relativeLabel}</span>
            </div>
            <div className="text-xs sm:text-[13px] font-mono font-medium text-slate-100 tracking-tight pl-0.5 flex items-center gap-1.5">
              <span>{timeInfo.fullFormattedDate}</span>
            </div>
          </div>

          <div className="h-7 w-[1px] bg-white/15 hidden sm:block" />

          {/* Domain Badge & Context Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Domain Badge */}
            <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border flex items-center gap-1.5 shadow-sm ${domainConfig.badgeBg}`}>
              <DomainIcon className="w-3.5 h-3.5" />
              <span>{domain}</span>
            </span>

            {/* Department / Category Tag */}
            {entry.category?.departmentOrContext && (
              <span className="text-xs text-slate-300 font-medium px-2.5 py-1 rounded-lg metallic-panel truncate max-w-[200px]">
                {entry.category.departmentOrContext}
              </span>
            )}

            {/* Location Pin Badge */}
            {entry.location && (
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="text-xs text-[#f6e7b8] metallic-gold-panel px-2.5 py-1 rounded-lg flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer shadow-sm"
                title="Toggle Map View"
              >
                <MapPin className="w-3.5 h-3.5 text-[#f6e7b8]" />
                <span className="truncate max-w-[150px] font-medium">{entry.location.name}</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-1.5 text-slate-300 self-stretch sm:self-auto justify-between sm:justify-end md:self-center">
          {/* Prominent Expand / Collapse Details Button */}
          <button
            type="button"
            onClick={() => {
              const next = !isExpanded;
              setIsExpanded(next);
              if (next) {
                scrollToCardTop();
              }
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isExpanded
                ? 'metallic-gold-panel text-[#f6e7b8] border-[#f6e7b8]/40 shadow-[0_0_12px_rgba(246,231,184,0.2)]'
                : 'metallic-titanium-button text-slate-100 hover:text-[#f6e7b8] hover:border-[#f6e7b8]/40'
            }`}
            title={isExpanded ? 'Collapse to sleek overview' : 'Expand full reflection details'}
          >
            {isExpanded ? (
              <>
                <span>Collapse</span>
                <ChevronUp className="w-3.5 h-3.5 text-[#f6e7b8]" />
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-[#f6e7b8]" />
                <span>View Details</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#f6e7b8]" />
              </>
            )}
          </button>

          <div className="flex items-center gap-1.5">
            {/* Voice Narration Audio Player Toggle */}
            <button
              type="button"
              onClick={() => setShowVoicePlayer(!showVoicePlayer)}
              className={`px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                showVoicePlayer
                  ? 'metallic-gold-panel text-[#f6e7b8] shadow-[0_0_10px_rgba(246,231,184,0.25)]'
                  : 'metallic-panel text-slate-300 hover:text-[#f6e7b8]'
              }`}
              title="Read aloud journal & reflection with natural voice audio narration"
            >
              <Headphones className="w-3.5 h-3.5 text-[#f6e7b8]" />
              <span className="hidden sm:inline">{showVoicePlayer ? 'Hide Voice' : 'Listen'}</span>
            </button>

            {/* Generate / Toggle Banner Artwork Button */}
            <button
              type="button"
              onClick={() => {
                setShowBanner(!showBanner);
                if (!showBanner) {
                  setBannerSeed(`${entry.id}-${Date.now()}`);
                }
              }}
              className={`px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                showBanner 
                  ? 'metallic-gold-panel text-[#f6e7b8] shadow-[0_0_10px_rgba(246,231,184,0.2)]'
                  : 'metallic-panel text-slate-300 hover:text-white'
              }`}
              title="Generate & view matching banner artwork"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#f6e7b8]" />
              <span className="hidden sm:inline">{showBanner ? 'Hide Banner' : 'Banner Art'}</span>
              <span className="sm:hidden">{showBanner ? 'Hide' : 'Art'}</span>
            </button>

            {/* Edit Entry Button */}
            <button
              type="button"
              onClick={() => {
                setIsEditing(!isEditing);
                setEditText(entry.rawText);
                setEditSummary(entry.reflectionSummary || '');
              }}
              className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
                isEditing 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40 shadow-sm'
                  : 'hover:text-white hover:bg-white/10 text-slate-400'
              }`}
              title="Edit Journal Text"
            >
              <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Bookmark Button */}
            <button
              type="button"
              onClick={() => onToggleBookmark(entry.id, !entry.bookmarked)}
              className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
                entry.bookmarked
                  ? 'text-[#f6e7b8] metallic-gold-panel shadow-[0_0_10px_rgba(246,231,184,0.2)]'
                  : 'hover:text-white hover:bg-white/10 text-slate-400'
              }`}
              title={entry.bookmarked ? 'Remove Bookmark' : 'Bookmark Reflection'}
            >
              <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${entry.bookmarked ? 'fill-[#f6e7b8] text-[#f6e7b8]' : ''}`} />
            </button>

            {/* Copy Reflection */}
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 sm:p-2 rounded-xl hover:text-white hover:bg-white/10 transition-all cursor-pointer text-slate-400"
              title="Copy Reflection to Clipboard"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            {/* Delete Entry with Safe Confirmation */}
            {isConfirmingDelete ? (
              <div className="flex items-center gap-1 bg-rose-950/80 p-1 rounded-xl border border-rose-500/50 animate-in fade-in-50 duration-150">
                <span className="text-[10px] text-rose-200 font-medium px-1">Del?</span>
                <button
                  type="button"
                  onClick={() => onDeleteEntry(entry.id)}
                  className="px-1.5 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-1.5 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] transition-colors cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="p-1.5 sm:p-2 rounded-xl hover:text-rose-300 hover:bg-rose-500/15 transition-all cursor-pointer text-slate-400"
                title="Delete Journal Entry"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Photorealistic AI Banner Image Display (Shows in condensed & expanded view) */}
      {showBanner && (
        <div className="p-4 pb-0 animate-in fade-in-50 duration-200">
          <EditorialArtCanvas 
            prompt={entry.rawText || entry.reflectionSummary} 
            domain={entry.category?.domain} 
            imageUrl={entry.bannerImageUrl}
            rawText={entry.rawText}
            isExpanded={isExpanded}
            className="w-full shadow-lg border border-white/15"
            onRegenerate={() => {
              onUpdateEntry?.(entry.id, { bannerImageUrl: undefined });
            }}
            onClose={() => setShowBanner(false)}
            onImageGenerated={(newUrl) => {
              onUpdateEntry?.(entry.id, { bannerImageUrl: newUrl });
            }}
            onClickToggleExpand={() => setIsExpanded(!isExpanded)}
          />
        </div>
      )}

      {/* 3. Interactive Map Snippet Preview (Shows ONLY when expanded) */}
      {isExpanded && showMap && entry.location && (
        <div className="p-4 bg-[#070d1e]/90 border-b border-white/10 space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-2 font-medium text-[#f6e7b8]">
              <MapPin className="w-4 h-4 text-[#f6e7b8]" />
              <span>{entry.location.name}</span>
              {entry.location.address && (
                <span className="text-slate-400 font-normal truncate max-w-sm">({entry.location.address})</span>
              )}
            </span>
            <button
              onClick={() => setShowMap(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 cursor-pointer"
            >
              Close Map
            </button>
          </div>
          <GoogleMapView location={entry.location} className="h-44 w-full rounded-xl overflow-hidden border border-white/15" />
        </div>
      )}

      {/* 4. Main Content Body (Collapsed Overview VS Staggered Expanded Details) */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Voice Narration Audio Player (if active) */}
        {showVoicePlayer && (
          <div className="animate-in fade-in-50 duration-200">
            <JournalVoicePlayer
              entry={entry}
              onClose={() => setShowVoicePlayer(false)}
            />
          </div>
        )}

        {/* Collapsed Overview Card View (Default Clean View) */}
        {!isExpanded && !isEditing ? (
          <div
            onClick={() => {
              setIsExpanded(true);
              scrollToCardTop();
            }}
            className="p-4 sm:p-5 rounded-2xl metallic-card space-y-3.5 cursor-pointer group hover:border-emerald-400/60 hover:bg-white/[0.03] transition-all shadow-md"
          >
            {/* Title Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl metallic-green-panel text-emerald-300 shrink-0 mt-0.5 shadow-sm group-hover:scale-105 transition-transform border border-emerald-400/40">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors leading-snug truncate">
                    {postTitle}
                  </h3>
                  <p className="text-sm sm:text-base text-[#fef6e4] font-libre-baskerville line-clamp-6 sm:line-clamp-8 leading-relaxed font-normal whitespace-pre-wrap tracking-wide drop-shadow-sm">
                    {postSnippet}
                  </p>
                </div>
              </div>

              <span className="text-xs px-2.5 py-1 rounded-lg metallic-panel text-emerald-300 font-mono shrink-0 hidden sm:inline-block border border-emerald-400/20">
                {wordCount} words
              </span>
            </div>

            {/* Quick Meta Indicators Matrix */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-white/10 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {/* Domain Pill */}
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${domainConfig.badgeBg}`}>
                  {domain}
                </span>

                {/* Action Items Pill (if any) */}
                {domain === 'Work' && totalActionCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{completedActionCount}/{totalActionCount} Actions</span>
                  </span>
                )}

                {/* Chat History Messages Count */}
                {chatMessageCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-500/15 text-sky-300 border border-sky-400/30">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                    <span>{chatMessageCount} Follow-ups</span>
                  </span>
                )}

                {/* Sentiment Pill */}
                {entry.sentiment && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs metallic-panel text-[#f6e7b8] border border-white/10 font-medium">
                    <span>{entry.sentiment.emoji || '✨'}</span>
                    <span>{entry.sentiment.emotionalTone}</span>
                  </span>
                )}
              </div>

              {/* Tap to Reveal Prompt */}
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-300 group-hover:translate-x-1 transition-transform ml-auto">
                <span>Tap to view details & AI coaching</span>
                <ArrowRight className="w-4 h-4 text-emerald-300" />
              </div>
            </div>
          </div>
        ) : (
          /* Expanded Full Details View (Staggered Animations) */
          <div className="space-y-6">
            {/* Element 1: Inline Edit Mode Form OR Original Journal Input */}
            {isEditing ? (
              <motion.div 
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.04 }}
                className="p-5 rounded-2xl metallic-card border border-blue-400/40 space-y-4 shadow-xl"
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
                    rows={5}
                    className="w-full p-4 rounded-xl bg-black/60 text-[#fef6e4] font-oregano text-xl sm:text-2xl focus:outline-none focus:ring-1 focus:ring-amber-400/40 transition-all leading-relaxed shadow-inner"
                    placeholder="Write your journal thoughts here..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Reflection Summary (Optional)</label>
                  <input
                    type="text"
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 text-[#f6e7b8] text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-blue-400/30 transition-all"
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
              /* Original Journal Post (Borderless Metallic Background with Fountain Pen Logo & Oregano Font) */
              <motion.div 
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.04 }}
                className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#1a233a]/90 via-[#0e1628]/95 to-[#060b14] shadow-2xl space-y-3.5"
              >
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-300">
                  <div className="flex items-center gap-2 text-slate-200">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent flex items-center justify-center text-[#f6e7b8] shadow-sm">
                      <PenTool className="w-4 h-4 text-[#f6e7b8] drop-shadow-[0_0_8px_rgba(246,231,184,0.4)]" />
                    </div>
                    <span className="uppercase tracking-widest text-xs font-bold bg-gradient-to-r from-[#f6e7b8] via-amber-200 to-[#d4af37] bg-clip-text text-transparent">
                      {isEdited ? 'Edited Journal Post' : 'Journal Post'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {entry.rawText ? `${wordCount} words` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                        setEditText(entry.rawText);
                        setEditSummary(entry.reflectionSummary || '');
                      }}
                      className="text-[11px] text-slate-300 hover:text-[#f6e7b8] flex items-center gap-1 cursor-pointer transition-colors px-2.5 py-1 rounded-lg metallic-panel shadow-sm"
                      title="Edit journal text"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
                <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-transparent font-oregano text-xl sm:text-2xl md:text-[25px] text-[#fef6e4] leading-relaxed tracking-wide whitespace-pre-wrap select-text shadow-inner">
                  {entry.rawText}
                </div>
              </motion.div>
            )}

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
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.08 }}
                  className="space-y-4"
                >
                  {/* Sentiment Analysis Banner (if present) */}
                  {entry.sentiment && (
                    <div className="p-3.5 sm:p-4 rounded-xl metallic-gold-panel shadow-sm space-y-1.5">
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
                    </div>
                  )}

                  {/* Side-by-Side Grid for Highlights & Creative Spark Cards */}
                  {(() => {
                    const cleanSpark = getCleanCreativeSpark(entry.creativeSpark);
                    return (
                      <div className={`grid grid-cols-1 ${cleanSpark ? 'md:grid-cols-2' : ''} gap-3.5`}>
                        {/* Card 1: Friendly Highlights Card (Cyan/Emerald Theme) */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#06241b] via-[#041a13] to-[#020e0b] border border-emerald-500/40 space-y-2 shadow-md flex flex-col justify-between">
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
                        </div>

                        {/* Card 2: Creative Spark Card (Amethyst/Purple Theme) - ONLY RENDERED WHEN VALID! */}
                        {cleanSpark && (
                          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#241133] via-[#1a0a26] to-[#0d0414] border border-purple-500/40 space-y-2 shadow-md flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
                                <Lightbulb className="w-4 h-4 text-purple-400" />
                                <span>✨ Creative Spark</span>
                              </div>
                              <div className="text-xs sm:text-sm text-purple-100 font-sans leading-relaxed italic">
                                "{cleanSpark}"
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </motion.div>
              </>
            )}

            {/* Location Context Grounding */}
            {entry.locationContext && !showMap && (
              <div className="p-2.5 sm:p-3 rounded-xl metallic-gold-panel text-xs text-[#f6e7b8] flex items-start gap-2">
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
              </div>
            )}

            {/* Role-Specific Cognitive Coaching & Actions (Revealed with staggered motion animations) */}
            {isExpanded && (
              <div className="space-y-5 pt-1">
                {/* Element 3: Dedicated Email Draft & Domain Coaching Guidance */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.12 }}
                  className="space-y-4"
                >
                  {/* Dedicated Email Draft Card if domain is Email Drafting or emailDraft is present */}
                  {(domain === 'Email Drafting' || entry.emailDraft) && entry.emailDraft && (
                    <div className="p-4 sm:p-5 rounded-2xl metallic-card border border-emerald-500/40 space-y-3 shadow-xl">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-500/20">
                        <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs uppercase tracking-wider">
                          <Mail className="w-4 h-4 text-emerald-400" />
                          <span>Friendly Email Draft</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.emailDraft.tone && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-[10px] font-mono">
                              Tone: {entry.emailDraft.tone}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const full = `Subject: ${entry.emailDraft?.subject || ''}\nTo: ${entry.emailDraft?.recipient || ''}\n\n${entry.emailDraft?.body || ''}`;
                              navigator.clipboard.writeText(full);
                              setIsCopied(true);
                              setTimeout(() => setIsCopied(false), 2000);
                            }}
                            className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Copy Full Email"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Email</span>
                          </button>
                        </div>
                      </div>

                      {/* Email Headers */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 metallic-panel p-2.5 rounded-xl">
                          <span className="font-semibold text-emerald-300 shrink-0">Subject:</span>
                          <span className="font-medium text-[#f6e7b8] flex-1 select-all text-xs">{entry.emailDraft.subject}</span>
                        </div>

                        {entry.emailDraft.recipient && (
                          <div className="flex items-center gap-2 metallic-panel px-3 py-1.5 rounded-xl text-[11px] text-slate-300">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-slate-400">Recipient:</span>
                            <span className="text-[#f6e7b8] font-medium">{entry.emailDraft.recipient}</span>
                          </div>
                        )}
                      </div>

                      {/* Email Body */}
                      <div className="p-3.5 sm:p-4 rounded-xl metallic-panel text-[#f6e7b8] font-ai-response text-xs sm:text-sm leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/30">
                        {entry.emailDraft.body}
                      </div>
                    </div>
                  )}

                  {/* Coaching Guidance & Comments (Slanted by domain) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#f6e7b8]">
                      <Compass className="w-3.5 h-3.5 text-[#f6e7b8]" />
                      <span>
                        {domain === 'Personal' 
                          ? '💖 Friendly Life & Well-Being Notes' 
                          : domain === 'Work'
                          ? '🚀 Friendly Coaching & Next Steps'
                          : domain === 'Creative'
                          ? '🎨 Friendly Creative Sparks & Insights'
                          : '✉️ Friendly Email Insights'}
                      </span>
                    </div>
                    <div className={`font-ai-response text-xs sm:text-sm text-[#f6e7b8] leading-relaxed space-y-2.5 pl-3.5 border-l-2 ${
                      domain === 'Personal' ? 'border-[#f6e7b8]' : 'border-[#f6e7b8]/60'
                    }`}>
                      <StreamingMarkdown content={entry.adaptiveResponse || ''} />
                    </div>
                  </div>


                </motion.div>

                {/* Element 4: Extracted Action Items Checklist - ONLY FOR WORK DOMAIN */}
                {domain === 'Work' && entry.actionItems && entry.actionItems.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.16 }}
                    className="space-y-2.5 pt-2"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-300">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>🎯 Action Checklist ({entry.actionItems.filter(a => a.completed).length}/{entry.actionItems.length})</span>
                      </span>
                    </div>
                    <div className="space-y-2">
                      {entry.actionItems.map(item => {
                        const itemCategory = item.category || 'Next Step';
                        const categoryBadge = {
                          'Next Step': 'bg-blue-500/15 text-blue-200 border-blue-400/30',
                          'Healthy Habit': 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
                          'Creative Spark': 'bg-purple-500/15 text-purple-200 border-purple-400/30'
                        }[itemCategory] || 'bg-white/10 text-slate-300 border-white/15';

                        return (
                          <div
                            key={item.id}
                            onClick={() => onToggleActionItem(entry.id, item.id, !item.completed)}
                            className={`flex items-start gap-3.5 p-3 rounded-xl border transition-all cursor-pointer select-none shadow-sm ${
                              item.completed
                                ? 'bg-black/30 border-white/5 shadow-none'
                                : 'metallic-panel text-[#f6e7b8] hover:border-white/30'
                            }`}
                          >
                            <button className="mt-0.5 shrink-0 focus:outline-none">
                              {item.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-[#8a919e]" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                              )}
                            </button>
                            <span className={`text-xs sm:text-sm leading-normal flex-1 transition-colors ${
                              item.completed 
                                ? 'text-[#7d8594] line-through font-normal' 
                                : 'text-[#f6e7b8]'
                            }`}>
                              {item.text || item.task}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono shrink-0 ${
                              item.completed 
                                ? 'bg-white/5 text-[#7d8594] border-white/10' 
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
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.24 }}
                  className="pt-3 border-t border-white/10 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-2 font-semibold text-[#f6e7b8]">
                      <MessageSquare className="w-3.5 h-3.5 text-[#f6e7b8]" />
                      <span>
                        {domain === 'Personal' 
                          ? '💬 Reflection & Sentiment Assistant' 
                          : domain === 'Work' 
                          ? '💬 Coaching & Action Assistant'
                          : domain === 'Creative'
                          ? '💬 Creative Spark & Ideas Assistant'
                          : '💬 Email Refinement Assistant'}
                      </span>
                    </span>
                  </div>

                  {/* Integrated Inquisitive Leading Questions Banner */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#0c1a2e] via-[#081220] to-[#040812] border border-sky-500/35 space-y-2 shadow-md">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-300">
                      <HelpCircle className="w-4 h-4 text-sky-400" />
                      <span>🤔 Inquisitive Leading Questions</span>
                    </div>
                    <div className="text-xs sm:text-sm text-sky-100 font-sans leading-relaxed">
                      <StreamingMarkdown content={extractInquisitiveQuestions(entry.adaptiveResponse || '', entry.rawText || '')} />
                    </div>
                  </div>

                  {/* Messages Feed */}
                  {entry.messages && entry.messages.length > 0 && (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {entry.messages.map((msg, msgIdx) => {
                        const isUser = msg.role === 'user';
                        const isLatestAssistant = !isUser && msgIdx === entry.messages!.length - 1;
                        const isEditingThisProposal = editingProposalMsgId === msg.id;

                        return (
                          <div
                            key={msg.id}
                            className={`p-3.5 rounded-2xl border text-xs space-y-2.5 relative group ${
                              isUser
                                ? 'metallic-titanium-button text-slate-100 ml-6'
                                : 'metallic-card text-[#f6e7b8] mr-6'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="font-semibold text-[#f6e7b8]">
                                {isUser ? 'You' : (domain === 'Personal' ? '🌟 MirrorSync Life Cheerleader' : '✨ MirrorSync Partner')}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px]">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                                  title="Delete Message"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Message Text with appropriate typography & markdown streaming */}
                            {isUser ? (
                              <div className="leading-relaxed font-neuton text-xs sm:text-sm text-slate-100 whitespace-pre-wrap">
                                {msg.content}
                              </div>
                            ) : (
                              <div className="leading-relaxed font-ai-response text-xs sm:text-sm text-[#f6e7b8]">
                                <StreamingMarkdown content={msg.content} animate={isLatestAssistant && isChatLoading} />
                              </div>
                            )}

                            {/* Suggested Update / Merge Action Card with Editable Writeup */}
                            {!isUser && msg.suggestedUpdate && (
                              <div className="p-3.5 sm:p-5 rounded-2xl metallic-proposal-card text-xs space-y-3.5 shadow-2xl border border-[#f6e7b8]/35">
                                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                                  <div className="flex items-center gap-2 text-[#f6e7b8] font-bold text-xs">
                                    <Sparkles className="w-4 h-4 text-[#f6e7b8]" />
                                    <span className="tracking-wide">{msg.suggestedUpdate.mergedRawText ? 'Enriched Journal Writeup Proposal' : 'Suggested Refinement'}</span>
                                  </div>
                                  {msg.suggestedUpdate.applied && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-medium flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span>{msg.suggestedUpdate.mergedRawText ? 'Merged into Journal' : 'Applied'}</span>
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
                                            <span>Edit Writeup Before Merging:</span>
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
                                          placeholder="Edit the proposed journal writeup..."
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
                                          <strong className="text-[#f6e7b8] block text-xs">Preview Enriched Journal Writeup:</strong>
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
                                              <span>Edit Writeup</span>
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
                                    <strong className="text-[#f6e7b8]">Refined Key Takeaway:</strong> {msg.suggestedUpdate.refinedSummary}
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
                                        <span>Edit Before Merge</span>
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
                                      <span>{msg.suggestedUpdate.mergedRawText ? '✨ Merge with Journal Writeup' : 'Apply to Reflection'}</span>
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
                                    className="px-2.5 py-1 rounded-lg metallic-panel text-slate-300 hover:text-[#f6e7b8] text-[11px] transition-all cursor-pointer"
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
                        className="w-full p-3.5 pr-24 rounded-xl metallic-panel text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#f6e7b8] focus:ring-1 focus:ring-[#f6e7b8]/40 disabled:opacity-50 transition-all shadow-inner font-sans leading-relaxed resize-y"
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

                    {/* Primary Trigger: Propose Enriched Journal Writeup */}
                    <button
                      type="button"
                      disabled={isChatLoading}
                      onClick={() => handleTriggerQuickAction('propose_update')}
                      className="w-full p-2.5 sm:p-3 rounded-xl border border-[#f6e7b8]/40 text-left flex items-center justify-between gap-3 text-xs transition-all cursor-pointer metallic-proposal-card hover:border-[#f6e7b8]/70 text-[#f6e7b8] shadow-lg disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#f6e7b8] shrink-0 animate-pulse" />
                        <div>
                          <span className="font-bold text-sm block text-[#f6e7b8]">✨ Propose Enriched Journal Writeup</span>
                          <span className="text-[11px] text-slate-300">Synthesizes full conversation into an updated writeup for you to edit & merge</span>
                        </div>
                      </div>
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#f6e7b8]/15 border border-[#f6e7b8]/35 font-semibold uppercase tracking-wider shrink-0 hidden sm:inline text-[#f6e7b8]">
                        Generate Update
                      </span>
                    </button>

                    {domain === 'Email Drafting' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={isChatLoading}
                          onClick={() => handleTriggerQuickAction('shorten_email')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                            activeActionChip === 'shorten_email'
                              ? 'metallic-gold-panel text-[#f6e7b8] shadow-sm'
                              : 'metallic-panel text-slate-200 hover:text-[#f6e7b8]'
                          }`}
                        >
                          <Wand2 className="w-4 h-4 text-emerald-300 shrink-0" />
                          <span className="font-medium">✂️ Make Shorter & Concise</span>
                        </button>

                        <button
                          type="button"
                          disabled={isChatLoading}
                          onClick={() => handleTriggerQuickAction('formalize_email')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                            activeActionChip === 'formalize_email'
                              ? 'metallic-gold-panel text-[#f6e7b8] shadow-sm'
                              : 'metallic-panel text-slate-200 hover:text-[#f6e7b8]'
                          }`}
                        >
                          <Briefcase className="w-4 h-4 text-blue-300 shrink-0" />
                          <span className="font-medium">👔 Formalize for Leadership</span>
                        </button>

                        <button
                          type="button"
                          disabled={isChatLoading}
                          onClick={() => handleTriggerQuickAction('add_cta')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                            activeActionChip === 'add_cta'
                              ? 'metallic-gold-panel text-[#f6e7b8] shadow-sm'
                              : 'metallic-panel text-slate-200 hover:text-[#f6e7b8]'
                          }`}
                        >
                          <CheckSquare className="w-4 h-4 text-[#f6e7b8] shrink-0" />
                          <span className="font-medium">🎯 Add Call to Action</span>
                        </button>

                        <button
                          type="button"
                          disabled={isChatLoading}
                          onClick={() => handleTriggerQuickAction('refine_email_tone')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                            activeActionChip === 'refine_email_tone'
                              ? 'metallic-gold-panel text-[#f6e7b8] shadow-sm'
                              : 'metallic-panel text-slate-200 hover:text-[#f6e7b8]'
                          }`}
                        >
                          <Sparkles className="w-4 h-4 text-purple-300 shrink-0" />
                          <span className="font-medium">✨ Refine Tone & Clarity</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={isChatLoading}
                          onClick={() => handleTriggerQuickAction('structure_notes')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                            activeActionChip === 'structure_notes'
                              ? 'metallic-gold-panel text-[#f6e7b8] shadow-sm'
                              : 'metallic-panel text-slate-200 hover:text-[#f6e7b8]'
                          }`}
                        >
                          <ListOrdered className="w-4 h-4 text-blue-300 shrink-0" />
                          <span className="font-medium">📋 Structure with Bullets</span>
                        </button>

                        {domain === 'Work' ? (
                          <button
                            type="button"
                            disabled={isChatLoading}
                            onClick={() => handleTriggerQuickAction('extract_checklist')}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                              activeActionChip === 'extract_checklist'
                                ? 'metallic-gold-panel text-[#f6e7b8] shadow-sm'
                                : 'metallic-panel text-slate-200 hover:text-[#f6e7b8]'
                            }`}
                          >
                            <CheckSquare className="w-4 h-4 text-emerald-300 shrink-0" />
                            <span className="font-medium">✅ Extract Action Items</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isChatLoading}
                            onClick={() => handleTriggerQuickAction('brainstorm')}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                              activeActionChip === 'brainstorm'
                                ? 'metallic-gold-panel text-[#f6e7b8] shadow-sm'
                              : 'metallic-panel text-slate-200 hover:text-[#f6e7b8]'
                            }`}
                          >
                            <Lightbulb className="w-4 h-4 text-purple-300 shrink-0" />
                            <span className="font-medium">💡 Brainstorm Perspectives</span>
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
            )}

            {/* Toggle Collapse Bar */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.32 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-2.5 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-[#f6e7b8] transition-colors border-t border-white/10 cursor-pointer metallic-panel rounded-xl mt-2 font-medium"
            >
              {isExpanded ? (
                <>
                  <span>Collapse details</span>
                  <ChevronUp className="w-3.5 h-3.5 text-[#f6e7b8]" />
                </>
              ) : (
                <>
                  <span>Expand details & follow-up chat</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#f6e7b8]" />
                </>
              )}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
