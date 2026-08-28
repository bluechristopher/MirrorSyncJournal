import { useState, type FormEvent } from 'react';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  Mail, 
  RotateCw, 
  HelpCircle, 
  BookmarkPlus, 
  CheckCircle2, 
  ArrowUpRight, 
  AlertTriangle,
  UserCheck,
  FileText,
  MessageSquareReply,
  ChevronDown,
  ChevronUp,
  AlignLeft
} from 'lucide-react';
import type { UserPersona, EmailDraft, ChatMessage } from '../types';
import { refineEmailDraftAPI } from '../services/api';
import { StreamingMarkdown } from './StreamingMarkdown';

interface EmailDraftingStudioProps {
  persona: UserPersona;
  onSaveToVault: (draft: EmailDraft, rawNotes: string, messages: ChatMessage[]) => Promise<void>;
  onOpenPersonaModal: () => void;
  initialDraftNotes?: string;
}

const EMAIL_SPARKS = [
  { text: 'Thank them for the update, confirm Friday timeline, and ask for final deck by 3pm...', label: 'Reply & Confirm' },
  { text: 'Politely decline meeting request due to schedule conflict and suggest alternate slot next week...', label: 'Polite Decline' },
  { text: 'Follow-up on project deliverables & milestone timelines with bulleted blockers...', label: 'Milestone Update' },
  { text: 'Executive summary update for leadership with highlights, metrics, and next steps...', label: 'Exec Summary' },
  { text: 'Appreciative note thanking team for successful sprint launch and client demo...', label: 'Team Gratitude' }
];

export function EmailDraftingStudio({
  persona,
  onSaveToVault,
  onOpenPersonaModal,
  initialDraftNotes = ''
}: EmailDraftingStudioProps) {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [pastCorrespondence, setPastCorrespondence] = useState('');
  const [showPastCorrespondence, setShowPastCorrespondence] = useState(false);
  const [lengthPreference, setLengthPreference] = useState<'default' | 'expanded' | 'concise'>('default');
  const [rawNotes, setRawNotes] = useState(initialDraftNotes);
  const [activeDraft, setActiveDraft] = useState<EmailDraft | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([
    '📝 Expand with More Detail',
    '✂️ Make Shorter & Concise',
    '👔 Executive & Formal',
    '🤝 Warm & Friendly',
    '🎯 Add Clear Deadline/CTA',
    '💡 Add Bullet Points'
  ]);

  // Initial Polish & Formatting
  const handleInitialPolish = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!rawNotes.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const initialFeedback = lengthPreference === 'expanded'
        ? 'Please structure this into a comprehensive, detailed email with thorough context and clean paragraphs.'
        : lengthPreference === 'concise'
        ? 'Please structure this into a crisp, concise email with punchy paragraphs.'
        : 'Please structure this into a well-balanced, professional email with clean paragraphing and proper formatting.';

      const res = await refineEmailDraftAPI({
        rawDraft: rawNotes,
        pastCorrespondence: pastCorrespondence.trim() || undefined,
        lengthPreference,
        recipient: recipient.trim() || undefined,
        subject: subject.trim() || undefined,
        tone: 'Warm & Professional',
        userFeedback: initialFeedback,
        conversationHistory: [],
        persona
      });

      setActiveDraft(res.emailDraft);
      if (res.emailDraft.subject && !subject) {
        setSubject(res.emailDraft.subject);
      }
      if (res.emailDraft.recipient && !recipient) {
        setRecipient(res.emailDraft.recipient);
      }

      if (res.quickToneSuggestions && res.quickToneSuggestions.length > 0) {
        setQuickSuggestions(res.quickToneSuggestions);
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: res.replyMessage,
        timestamp: Date.now(),
        emailDraft: res.emailDraft
      };
      setChatMessages([assistantMsg]);
    } catch (err: any) {
      console.error('Initial email polish error:', err);
      setErrorMessage(err?.message || 'Failed to refine email draft. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Multi-Turn Chat Refinement
  const handleSendRefinement = async (feedbackText: string) => {
    if (!feedbackText.trim() || isLoading) return;

    const userFeedback = feedbackText.trim();
    setChatInput('');
    setErrorMessage(null);

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: userFeedback,
      timestamp: Date.now()
    };

    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    setIsLoading(true);

    try {
      const historyPayload = updatedHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Check if feedback specifies length
      const currentLength = userFeedback.toLowerCase().includes('expand')
        ? 'expanded'
        : userFeedback.toLowerCase().includes('concise') || userFeedback.toLowerCase().includes('shorter')
        ? 'concise'
        : lengthPreference;

      const res = await refineEmailDraftAPI({
        rawDraft: activeDraft?.body || rawNotes,
        pastCorrespondence: pastCorrespondence.trim() || undefined,
        lengthPreference: currentLength,
        recipient: recipient.trim() || activeDraft?.recipient || undefined,
        subject: subject.trim() || activeDraft?.subject || undefined,
        tone: activeDraft?.tone || 'Warm & Professional',
        userFeedback,
        conversationHistory: historyPayload,
        persona
      });

      setActiveDraft(res.emailDraft);
      if (res.emailDraft.subject) setSubject(res.emailDraft.subject);
      if (res.emailDraft.recipient) setRecipient(res.emailDraft.recipient);

      if (res.quickToneSuggestions && res.quickToneSuggestions.length > 0) {
        setQuickSuggestions(res.quickToneSuggestions);
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: res.replyMessage,
        timestamp: Date.now(),
        emailDraft: res.emailDraft
      };

      setChatMessages([...updatedHistory, assistantMsg]);
    } catch (err: any) {
      console.error('Refinement error:', err);
      setErrorMessage(err?.message || 'Failed to refine tone. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Length Switcher during review
  const handleQuickLengthToggle = (newLength: 'default' | 'expanded' | 'concise') => {
    setLengthPreference(newLength);
    if (activeDraft) {
      const prompt = newLength === 'expanded' 
        ? 'Please expand this draft with more context, thorough background, and detailed elaboration on key points.'
        : newLength === 'concise'
        ? 'Please make this draft more concise, direct, and compact.'
        : 'Please balance the length of this draft into standard business paragraphing.';
      handleSendRefinement(prompt);
    }
  };

  // Copy Full Email (Subject, Recipient, Body) with clean double linebreaks
  const handleCopyFullEmail = () => {
    const targetSubject = activeDraft?.subject || subject || 'Draft Email';
    const targetRecipient = activeDraft?.recipient || recipient || '';
    const targetBody = activeDraft?.body || rawNotes;

    const textToCopy = `Subject: ${targetSubject}${targetRecipient ? `\nTo: ${targetRecipient}` : ''}\n\n${targetBody}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Optional Save to Journal Vault
  const handleSaveToVault = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const finalDraft: EmailDraft = activeDraft || {
        subject: subject || 'Quick Email Draft',
        recipient: recipient || undefined,
        body: rawNotes,
        tone: 'Draft'
      };

      const combinedRaw = pastCorrespondence 
        ? `[PAST CORRESPONDENCE RECEIVED]:\n${pastCorrespondence}\n\n[YOUR RESPONSE NOTES]:\n${rawNotes}`
        : rawNotes;

      await onSaveToVault(finalDraft, combinedRaw, chatMessages);
      setSaveSuccess('Email draft & refinement history saved to your journal vault!');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      console.error('Failed to save email to vault:', err);
      setErrorMessage(err?.message || 'Failed to save email draft.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset & Start New Draft
  const handleStartNewDraft = () => {
    setRecipient('');
    setSubject('');
    setPastCorrespondence('');
    setShowPastCorrespondence(false);
    setLengthPreference('default');
    setRawNotes('');
    setActiveDraft(null);
    setChatMessages([]);
    setChatInput('');
    setErrorMessage(null);
    setSaveSuccess(null);
  };

  return (
    <div className="space-y-4">
      {/* Active Persona Lens Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5 text-slate-300">
          <span className="flex items-center gap-1.5 font-medium text-slate-200">
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span>Interactive Email Copilot:</span>
          </span>
          <span className="text-[#f6e7b8] font-semibold">{persona.occupation || 'Knowledge Practitioner'}</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-300 font-mono text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30">
            Multi-Turn Polish
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenPersonaModal}
          className="text-[#f6e7b8] hover:brightness-110 text-xs transition-colors flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-lg metallic-gold-panel"
        >
          <span>Calibrate Lens</span>
          <ArrowUpRight className="w-3 h-3 text-[#f6e7b8]" />
        </button>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-400/40 text-xs text-emerald-200 flex items-center justify-between gap-2 shadow-md animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
          <button onClick={() => setSaveSuccess(null)} className="text-emerald-400 hover:text-emerald-200 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 flex items-center justify-between gap-2 shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* INITIAL COMPOSITION OR ACTIVE WORKSPACE */}
      {!activeDraft ? (
        /* 1. Initial Draft Input Form */
        <div className="space-y-4">
          {/* Optional Past Correspondence Box */}
          <div className="rounded-xl metallic-panel border border-white/15 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setShowPastCorrespondence(!showPastCorrespondence)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs font-medium text-slate-300 hover:text-emerald-300 transition-colors bg-white/5 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <MessageSquareReply className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200">
                  Past Correspondence / Email Thread Received
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {pastCorrespondence ? '(Thread Attached)' : '(Optional)'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>{showPastCorrespondence ? 'Collapse' : pastCorrespondence ? 'Edit Thread' : '+ Paste Past Email'}</span>
                {showPastCorrespondence ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {(showPastCorrespondence || pastCorrespondence) && (
              <div className="p-3.5 pt-2 space-y-2 border-t border-white/10 bg-black/30">
                <p className="text-[11px] text-slate-400">
                  Paste the previous email or message you received. The AI will analyze its points and ensure your response addresses everything seamlessly.
                </p>
                <textarea
                  rows={3}
                  value={pastCorrespondence}
                  onChange={(e) => setPastCorrespondence(e.target.value)}
                  placeholder="Paste past email thread here...&#10;e.g. 'Hi Alex, Could you send over the updated budget by Friday? Also wondering if we are still on track for next Tuesday demo...'"
                  className="w-full metallic-panel text-slate-200 placeholder-slate-500 font-sans text-xs rounded-xl p-3 border border-white/10 focus:outline-none focus:border-emerald-400 transition-all resize-y min-h-[75px] leading-relaxed"
                />
              </div>
            )}
          </div>

          {/* Recipient & Subject Header Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Recipient Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                <UserCheck className="w-3 h-3 text-emerald-400" />
                <span>To / Recipient (Optional)</span>
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. Sarah Jenkins, Leadership Team, Client"
                className="w-full metallic-panel text-xs text-slate-100 placeholder-slate-400 rounded-xl px-3.5 py-2.5 border border-white/15 focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Subject Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-emerald-400" />
                <span>Subject (Optional - AI can generate)</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Re: Project Milestone Update & Deliverables"
                className="w-full metallic-panel text-xs text-slate-100 placeholder-slate-400 rounded-xl px-3.5 py-2.5 border border-white/15 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Rough Notes / What you want to respond Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <label className="font-medium text-slate-300 flex items-center gap-1.5">
                <span>✍️ What You Want to Respond / Key Points:</span>
              </label>
              {/* Length Selector */}
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>Length:</span>
                <div className="flex items-center gap-1.5 p-1 rounded-xl metallic-panel border border-white/10">
                  <button
                    type="button"
                    onClick={() => setLengthPreference('default')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                      lengthPreference === 'default'
                        ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/60 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <span>📄</span>
                    <span>Standard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLengthPreference('expanded')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                      lengthPreference === 'expanded'
                        ? 'bg-sky-500/25 text-sky-200 border border-sky-400/60 font-bold shadow-xs shadow-sky-500/20'
                        : 'text-slate-400 hover:text-sky-300 hover:bg-white/5'
                    }`}
                  >
                    <span>📖</span>
                    <span>Expand</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLengthPreference('concise')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                      lengthPreference === 'concise'
                        ? 'bg-amber-500/25 text-amber-200 border border-amber-400/60 font-bold shadow-xs shadow-amber-500/20'
                        : 'text-slate-400 hover:text-amber-300 hover:bg-white/5'
                    }`}
                  >
                    <span>✂️</span>
                    <span>Concise</span>
                  </button>
                </div>
              </div>
            </div>

            <textarea
              rows={4}
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="State what you want to say in your response...&#10;e.g. Yes budget is ready and attaching it. Confirm Tuesday demo works at 2pm. Remind to invite QA lead."
              className="w-full metallic-panel text-slate-100 placeholder-slate-400 font-neuton text-base rounded-xl p-4 border border-white/15 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all resize-y min-h-[110px] leading-relaxed"
            />
          </div>

          {/* Actions Bar: Quick Save & Polish Draft Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Formats into clean, structured business paragraphs with standard greetings & sign-off.</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 justify-end">
              <button
                type="button"
                onClick={handleSaveToVault}
                disabled={!rawNotes.trim() || isLoading || isSaving}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-medium text-xs text-slate-200 metallic-titanium-button active:scale-[0.98] disabled:opacity-40 transition-all cursor-pointer shrink-0"
                title="Store raw notes directly to journal vault without AI polish"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-slate-300" />
                <span>Quick Save</span>
              </button>

              <button
                type="button"
                onClick={() => handleInitialPolish()}
                disabled={!rawNotes.trim() || isLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-[#070d1e] bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] cursor-pointer shrink-0 min-w-[170px]"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Polishing Draft...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#070d1e]" />
                    <span>Polish & Refine Draft</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sparks Bubbles placed in the next line */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs scrollbar-none pt-2 border-t border-white/5">
            <span className="text-slate-400 flex items-center gap-1 shrink-0 text-[11px]">
              <HelpCircle className="w-3 h-3 text-emerald-400" /> Sparks:
            </span>
            {EMAIL_SPARKS.map((spark, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRawNotes(spark.text)}
                className="shrink-0 px-3 py-1.5 rounded-lg metallic-panel text-slate-300 hover:text-emerald-300 text-[11px] transition-colors truncate max-w-[240px] cursor-pointer flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="truncate">{spark.text}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* 2. Interactive Multi-Turn Email Refinement Studio */
        <div className="space-y-4 animate-in fade-in-50">
          {/* Polished Draft Preview Box */}
          <div className="p-4 sm:p-5 rounded-2xl metallic-card border border-emerald-500/40 space-y-3.5 shadow-2xl bg-black/40">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-xs text-emerald-200 uppercase tracking-wider">
                      Send-Ready Email Draft
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                      Clean Paragraphs
                    </span>
                  </div>
                  {activeDraft.tone && (
                    <span className="text-[10px] text-emerald-400/90 font-mono">
                      Tone: {activeDraft.tone}
                    </span>
                  )}
                </div>
              </div>

              {/* Length Controls & Action Controls */}
              <div className="flex items-center gap-2">
                {/* Length Modifier Pills with Emojis and Distinct Colors */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl metallic-panel border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickLengthToggle('expanded')}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-sky-950/40 text-sky-200 hover:text-white border border-sky-500/30 hover:border-sky-400/60 hover:bg-sky-900/50 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                    title="Expand email with more detail and context"
                  >
                    <span>📖</span>
                    <span>Expand</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLengthToggle('concise')}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-950/40 text-amber-200 hover:text-white border border-amber-500/30 hover:border-amber-400/60 hover:bg-amber-900/50 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                    title="Make email shorter and more concise"
                  >
                    <span>✂️</span>
                    <span>Concise</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyFullEmail}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied Full Email!' : 'Copy Email'}</span>
                </button>
              </div>
            </div>

            {/* Headers: Subject & Recipient */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 metallic-panel p-2.5 rounded-xl border border-white/10">
                <span className="font-semibold text-emerald-300 shrink-0">Subject:</span>
                <span className="font-medium text-slate-100 flex-1 select-all text-xs">{activeDraft.subject}</span>
              </div>

              {activeDraft.recipient && (
                <div className="flex items-center gap-2 metallic-panel px-3 py-1.5 rounded-xl text-xs text-slate-300 border border-white/10">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-400">To:</span>
                  <span className="text-slate-100 font-medium">{activeDraft.recipient}</span>
                </div>
              )}
            </div>

            {/* Email Body with Pristine Paragraph Spacing */}
            <div className="p-4 sm:p-5 rounded-xl metallic-panel text-[#f6e7b8] font-ai-response text-xs sm:text-sm leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/30 border border-white/10 shadow-inner">
              {activeDraft.body}
            </div>
          </div>

          {/* Multi-Turn Conversation Stream */}
          <div className="p-4 rounded-2xl metallic-card border border-white/15 space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-white/10">
              <span className="flex items-center gap-2 font-semibold text-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Multi-Turn Refinement & Tone Copilot</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {chatMessages.length} {chatMessages.length === 1 ? 'exchange' : 'exchanges'}
              </span>
            </div>

            {/* Messages List */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {chatMessages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl text-xs ${
                      isUser
                        ? 'metallic-panel border border-white/15 text-slate-200 ml-6'
                        : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-100 mr-6'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold mb-1 text-[11px]">
                      {isUser ? (
                        <span className="text-slate-400">You:</span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> MirrorSync:
                        </span>
                      )}
                    </div>
                    <div className="leading-relaxed">
                      <StreamingMarkdown content={msg.content} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Refinement Chips */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] text-slate-400 font-medium">Quick Tone & Length Refinements:</div>
              <div className="flex flex-wrap gap-1.5">
                {quickSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSendRefinement(suggestion)}
                    className="px-2.5 py-1 rounded-lg metallic-panel hover:border-emerald-400/50 text-slate-300 hover:text-emerald-300 text-[11px] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Refinement Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendRefinement(chatInput);
              }}
              className="flex items-center gap-2 pt-1"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Refine draft (e.g., 'Expand on the budget timeline', 'Make it more formal', 'Add bullet points')..."
                className="flex-1 metallic-panel text-xs text-slate-100 placeholder-slate-400 rounded-xl px-3.5 py-2 border border-white/15 focus:outline-none focus:border-emerald-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isLoading}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shrink-0"
              >
                {isLoading ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>

          {/* Bottom Action Controls: Save to Vault, Copy, New Draft */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleStartNewDraft}
              className="text-slate-400 hover:text-slate-200 text-xs transition-colors flex items-center justify-center sm:justify-start gap-1 cursor-pointer py-1"
            >
              <span>+ Start New Email Draft</span>
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyFullEmail}
                className="px-4 py-2.5 sm:py-2 rounded-xl metallic-titanium-button text-slate-200 text-xs flex items-center justify-center gap-1.5 cursor-pointer font-medium"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy Email'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToVault}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:brightness-110 text-[#070d1e] font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.25)] transition-all cursor-pointer disabled:opacity-40"
              >
                {isSaving ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                <span>Save to Journal Vault</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
