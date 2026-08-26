import type { UserPersona, ReflectionResult, OnboardingExtractionResult, ModelLadderLog, LocationPin, ChatMessage, QuickActionType, DomainCategory, DynamicTopicCategory } from '../types';
import { auth } from '../firebase';

async function safeParseJson(response: Response): Promise<any> {
  const rawText = await response.text();
  try {
    return JSON.parse(rawText);
  } catch (_err) {
    if (!response.ok) {
      throw new Error(`Server request failed with status ${response.status}. Please check network connection.`);
    }
    // If response was 200 but not valid JSON
    throw new Error(`Server returned non-JSON payload: ${rawText.slice(0, 100)}`);
  }
}

export async function extractPersonaAPI(
  checkInText: string,
  currentRole?: string,
  preferredStyle?: string
): Promise<{ persona: OnboardingExtractionResult; telemetry?: ModelLadderLog }> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch('/api/onboard', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      checkInText,
      currentRole,
      preferredStyle,
    }),
  });

  const data = await safeParseJson(response);
  if (!response.ok) {
    if (data && data.fallbackPersona) {
      return { persona: data.fallbackPersona };
    }
    throw new Error(data?.error || 'Failed to extract persona');
  }

  return {
    persona: data.persona,
    telemetry: data.telemetry,
  };
}

export async function reflectEntryAPI(
  rawText: string,
  persona: UserPersona,
  location?: LocationPin | null,
  preferredDomain?: DomainCategory | 'auto'
): Promise<{ reflection: ReflectionResult; telemetry?: ModelLadderLog }> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch('/api/reflect', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      rawText,
      persona,
      location: location || undefined,
      preferredDomain: preferredDomain || undefined,
    }),
  });

  const data = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to generate reflection');
  }

  return {
    reflection: data.reflection,
    telemetry: data.telemetry,
  };
}

export async function sendChatMessageAPI(params: {
  entryId: string;
  rawText: string;
  reflectionSummary: string;
  adaptiveResponse: string;
  domain: DomainCategory;
  persona: UserPersona;
  messages: ChatMessage[];
  actionType: QuickActionType;
  userMessage?: string;
}): Promise<{ message: ChatMessage; telemetry?: ModelLadderLog }> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  const data = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to process chat response');
  }

  return {
    message: data.message,
    telemetry: data.telemetry,
  };
}

export async function fetchThreatModelStatus(): Promise<any> {
  const res = await fetch('/api/threat-model');
  if (!res.ok) throw new Error('Failed to fetch threat model');
  return safeParseJson(res);
}

export async function clusterTopicsAPI(
  entries: Array<{ id: string; rawText: string; summary?: string; domain?: string; tags?: string[]; locationName?: string }>,
  domainFilter: 'All' | DomainCategory
): Promise<{ topics: DynamicTopicCategory[]; telemetry?: ModelLadderLog }> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch('/api/cluster-topics', {
    method: 'POST',
    headers,
    body: JSON.stringify({ entries, domainFilter }),
  });

  const data = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to cluster topics');
  }

  return {
    topics: data.topics || [],
    telemetry: data.telemetry,
  };
}

export async function refineEmailDraftAPI(params: {
  rawDraft: string;
  pastCorrespondence?: string;
  lengthPreference?: 'default' | 'expanded' | 'concise';
  recipient?: string;
  subject?: string;
  tone?: string;
  userFeedback?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  persona: UserPersona;
}): Promise<{
  emailDraft: {
    subject: string;
    recipient?: string;
    body: string;
    tone?: string;
    keyPoints?: string[];
  };
  replyMessage: string;
  quickToneSuggestions: string[];
  telemetry?: ModelLadderLog;
}> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch('/api/email-draft-refine', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  const data = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to refine email draft');
  }

  return {
    emailDraft: data.data.emailDraft,
    replyMessage: data.data.replyMessage,
    quickToneSuggestions: data.data.quickToneSuggestions || [],
    telemetry: data.telemetry,
  };
}

