export type DomainCategory = 'Work' | 'Personal' | 'Creative' | 'Email Drafting';

export interface LocationPin {
  name: string;
  address?: string;
  lat: number;
  lng: number;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

export interface FavoriteLocation {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  label?: string;
  createdAt?: number;
  addedAt?: number;
}

export interface ActionItemCategoryType {
  category: 'Next Step' | 'Healthy Habit' | 'Creative Spark';
}
export type ActionItemCategory = 'Next Step' | 'Healthy Habit' | 'Creative Spark';

export interface ActionItem {
  id: string;
  text: string;
  task?: string;
  category?: ActionItemCategory;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface ReflectionCategory {
  domain: DomainCategory;
  department?: string;
  departmentOrContext?: string;
  primaryTag?: string;
  projectTags: string[];
}

export interface SentimentAnalysis {
  emotionalTone: string; // e.g. "Joyful & Energetic", "Peaceful & Mindful", "Stressed & Overwhelmed", "Excited & Victorious"
  emoji: string;         // e.g. "🌟", "🎉", "💛", "💪", "🌱", "🧘", "🚀", "🔥"
  energyLevel: 'High' | 'Grounded' | 'Calming' | 'Inspiring' | 'Compassionate';
  sentimentResonance: string;
  sentimentSummary: string; // Warm empathetic 1-sentence read of user's emotional state
}

export interface CognitiveMetrics {
  clarityScore: number; // 1-100
  sentimentResonance: string;
  focusDimension: string;
}

export interface EmailDraft {
  subject: string;
  recipient?: string;
  body: string;
  tone?: string;
  keyPoints?: string[];
}

export interface ReflectionResult {
  title?: string;
  domain?: DomainCategory;
  summary?: string;
  coaching?: string;
  reflectionSummary: string;
  adaptiveResponse: string;
  category: ReflectionCategory;
  actionItems: ActionItem[];
  emailDraft?: EmailDraft | null;
  creativeSpark?: string | null;
  editorialArtPrompt: string;
  bannerImageUrl?: string | null;
  location?: LocationPin | null;
  locationContext?: string | null;
  cognitiveMetrics?: CognitiveMetrics;
  sentiment?: SentimentAnalysis;
}

export interface UserPersona {
  userId: string;
  name?: string;
  email?: string;
  occupation: string;
  department: string;
  communicationStyle: 'concise & direct' | 'analytical & structured' | 'visionary & strategic' | 'empathetic & reflective' | 'pragmatic & action-oriented' | string;
  coachingTone: 'Socratic Challenger' | 'Strategic Advisor' | 'Operational Optimizer' | 'Mindful Mentor' | string;
  customGoals?: string;
  updatedAt: number;
}

export type QuickActionType = 
  | 'structure_notes' 
  | 'extract_checklist' 
  | 'refine_tone' 
  | 'brainstorm' 
  | 'draft_email'
  | 'refine_email_tone'
  | 'shorten_email'
  | 'formalize_email'
  | 'add_cta'
  | 'propose_update'
  | 'custom';

export interface SuggestedUpdate {
  refinedSummary?: string;
  refinedAdaptiveResponse?: string;
  mergedRawText?: string;
  emailSubject?: string;
  emailBody?: string;
  recipient?: string;
  actionItems?: ActionItem[];
  domain?: DomainCategory;
  applied?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  quickActionType?: QuickActionType;
  extractedActionItems?: ActionItem[];
  emailDraft?: EmailDraft;
  suggestedUpdate?: SuggestedUpdate;
  promptFollowUp?: string;
  quickSuggestions?: string[];
  structuredNotes?: {
    title?: string;
    sections?: Array<{ heading: string; points: string[] }>;
  };
}

export interface JournalEntry {
  id: string;
  userId: string;
  title?: string;
  rawText: string;
  createdAt: number;
  updatedAt?: number;
  reflectionSummary: string;
  adaptiveResponse: string;
  category: ReflectionCategory;
  actionItems: ActionItem[];
  emailDraft?: EmailDraft | null;
  creativeSpark?: string | null;
  editorialArtPrompt: string;
  bannerImageUrl?: string | null;
  bannerImageLoading?: boolean;
  imageHistory?: string[];
  location?: LocationPin | null;
  locationContext?: string | null;
  cognitiveMetrics?: CognitiveMetrics;
  sentiment?: SentimentAnalysis;
  bookmarked?: boolean;
  aiStatus?: 'idle' | 'synthesizing' | 'ready' | 'error' | 'skipped';
  aiError?: string;
  aiModelUsed?: string;
  messages?: ChatMessage[];
}

export interface ModelLadderLog {
  modelUsed: string;
  attemptedModels: string[];
  latencyMs: number;
  timestamp: number;
}

export interface OnboardingExtractionResult {
  occupation: string;
  department: string;
  communicationStyle: string;
  coachingTone: string;
  summaryFeedback: string;
}

export type SynthesisStatusStage = 
  | 'idle'
  | 'connecting'
  | 'analyzing'
  | 'synthesizing'
  | 'persisting'
  | 'success'
  | 'error';

export interface AppErrorDetails {
  title: string;
  message: string;
  details?: string;
  timestamp: number;
  retryAction?: () => void | Promise<void>;
}

export interface AppStatusMessage {
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  details?: string;
  timestamp: number;
}

export interface DynamicTopicCategory {
  id: string;
  name: string;
  emoji: string;
  iconName?: string;
  description: string;
  entryIds: string[];
  count: number;
  domain: DomainCategory | 'All';
  accentColor?: 'amber' | 'emerald' | 'blue' | 'purple' | 'rose' | 'indigo' | 'cyan';
}
