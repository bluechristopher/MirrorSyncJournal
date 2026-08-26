import type { JournalEntry, DomainCategory, DynamicTopicCategory } from '../types';

export function generateLocalSemanticTopics(
  entries: JournalEntry[], 
  domainFilter: 'All' | DomainCategory
): DynamicTopicCategory[] {
  if (!entries || entries.length === 0) return [];

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

  const topics: DynamicTopicCategory[] = [];
  const assignedEntryIds = new Set<string>();

  for (const bucket of categoryBuckets) {
    const matchingIds: string[] = [];
    for (const entry of entries) {
      const textToSearch = `${entry.rawText} ${entry.reflectionSummary || ''} ${(entry.category?.projectTags || []).join(' ')} ${entry.location?.name || ''}`;
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

  // Group remaining unassigned entries
  const unassigned = entries.filter((e) => !assignedEntryIds.has(e.id));
  if (unassigned.length > 0) {
    const fallbackName = domainFilter === 'Personal' 
      ? 'Life & Well-being'
      : domainFilter === 'Creative'
      ? 'Lateral Ideas'
      : domainFilter === 'Email Drafting'
      ? 'Correspondence'
      : 'Focus & Priorities';

    topics.push({
      id: 'topic-general-reflections',
      name: fallbackName,
      emoji: '✨',
      iconName: 'Sparkles',
      description: 'General thoughts, notes, and focused insights captured in this space.',
      entryIds: unassigned.map((e) => e.id),
      count: unassigned.length,
      domain: domainFilter,
      accentColor: 'amber'
    });
  }

  return topics;
}

/**
 * Intelligent content-based domain classifier.
 * Never blindly assumes Work; evaluates semantic markers for Personal, Creative, Email Drafting, and Work.
 */
export function classifyContentDomain(rawText: string): DomainCategory {
  if (!rawText || !rawText.trim()) return 'Personal';

  const text = rawText.toLowerCase();

  // 1. Email drafting check
  const emailScore = (
    (text.includes('email') ? 2 : 0) +
    (text.includes('draft') ? 2 : 0) +
    (text.includes('recipient') ? 2 : 0) +
    (text.includes('subject:') ? 3 : 0) +
    (text.includes('dear ') || text.includes('hi team') || text.includes('hello team') || text.includes('hello all') ? 3 : 0) +
    (text.includes('regards') || text.includes('sincerely') || text.includes('best regards') ? 2 : 0) +
    (text.includes('follow up on') ? 2 : 0) +
    (text.includes('announcement') ? 1 : 0)
  );

  // 2. Creative check
  const creativeKeywords = [
    'design', 'creative', 'art', 'artist', 'painting', 'drawing', 'sketch', 'writing', 'novel', 'poem', 
    'poetry', 'story', 'storytelling', 'concept', 'music', 'song', 'guitar', 'piano', 'lyrics', 
    'fiction', 'sci-fi', 'fantasy', 'craft', 'film', 'photo', 'photography', 'muse', 'brainstorm', 
    'worldbuilding', 'character', 'aesthetic', 'whimsical', 'illustration', 'canvas', 'metaphor',
    'sculpture', 'animation', 'soundtrack', 'prose', 'dialogue'
  ];
  let creativeScore = 0;
  for (const kw of creativeKeywords) {
    if (text.includes(kw)) creativeScore += 1.5;
  }

  // 3. Personal check (well-being, feelings, family, hobbies, fitness, daily life, mindfulness)
  const personalKeywords = [
    'personal', 'family', 'kids', 'children', 'wife', 'husband', 'partner', 'friend', 'friends', 
    'home', 'health', 'wellness', 'sleep', 'rest', 'exercise', 'workout', 'gym', 'run', 'running', 
    'hike', 'hiking', 'walk', 'walking', 'nature', 'coffee', 'dinner', 'lunch', 'breakfast', 'cooking', 
    'weekend', 'hobby', 'relax', 'relaxing', 'anxiety', 'feel', 'feeling', 'feelings', 'mood', 'breathe', 
    'breathing', 'stress', 'mindful', 'mindfulness', 'meditate', 'meditation', 'grateful', 'gratitude', 
    'joy', 'happy', 'happiness', 'life', 'well-being', 'doctor', 'therapy', 'vacation', 'trip', 'travel', 
    'pet', 'dog', 'cat', 'love', 'peace', 'peaceful', 'tired', 'recharge', 'overwhelmed', 'calm'
  ];
  let personalScore = 0;
  for (const kw of personalKeywords) {
    if (text.includes(kw)) personalScore += 1.5;
  }

  // 4. Work check (engineering, corporate, roadmap, sprint, tickets, client)
  const workKeywords = [
    'sprint', 'deploy', 'deployment', 'architecture', 'server', 'database', 'backend', 'frontend', 
    'code', 'coding', 'pr', 'pull request', 'jira', 'ticket', 'bug', 'meeting', 'client', 'customer', 
    'stakeholder', 'budget', 'kpi', 'okr', 'revenue', 'quarterly', 'strategy', 'roadmap', 'deadline', 
    'deliverable', 'boss', 'manager', 'coworker', 'colleague', 'employee', 'refactor', 'latency', 
    'throughput', 'infrastructure', 'sales', 'marketing campaign', 'conversion'
  ];
  let workScore = 0;
  for (const kw of workKeywords) {
    if (text.includes(kw)) workScore += 1.5;
  }

  if (emailScore >= 3 && emailScore > workScore && emailScore > personalScore && emailScore > creativeScore) {
    return 'Email Drafting';
  }

  if (creativeScore > 0 && creativeScore >= workScore && creativeScore >= personalScore) {
    return 'Creative';
  }

  if (personalScore > 0 && personalScore >= workScore) {
    return 'Personal';
  }

  if (workScore > personalScore && workScore > creativeScore) {
    return 'Work';
  }

  // If no strong work signals exist, do NOT assume work!
  if (personalScore > 0) return 'Personal';
  if (creativeScore > 0) return 'Creative';

  // Default to Personal (mindful daily stream-of-consciousness) rather than assuming corporate Work
  return 'Personal';
}

