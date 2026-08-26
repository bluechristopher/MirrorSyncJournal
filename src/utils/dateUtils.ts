/**
 * Date and relative time formatting utilities for MirrorSync Journal Posts.
 */

export interface RelativeTimeInfo {
  relativeLabel: string; // e.g. "Today", "Yesterday", "3 Days Ago", "Last Week", "Last Month"
  fullFormattedDate: string; // e.g. "Wednesday, Aug 26, 2026 • 10:45 AM"
  shortFormattedDate: string; // e.g. "Aug 26, 2026 • 10:45 AM"
  isoString: string;
  isToday: boolean;
  isYesterday: boolean;
  badgeStyle: 'today' | 'recent' | 'past' | 'old';
}

export function getRelativeTimeInfo(dateInput: number | string | Date): RelativeTimeInfo {
  const date = new Date(dateInput);
  const now = new Date();
  
  // Handle invalid dates safely
  if (isNaN(date.getTime())) {
    return {
      relativeLabel: 'Recent',
      fullFormattedDate: 'Date Unknown',
      shortFormattedDate: 'Date Unknown',
      isoString: new Date().toISOString(),
      isToday: false,
      isYesterday: false,
      badgeStyle: 'recent',
    };
  }

  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDifference = Math.round((nowMidnight - dateMidnight) / (1000 * 60 * 60 * 24));
  const msDiff = now.getTime() - date.getTime();

  let relativeLabel = 'Today';
  let badgeStyle: 'today' | 'recent' | 'past' | 'old' = 'today';
  let isToday = false;
  let isYesterday = false;

  if (dayDifference === 0 || msDiff < 0) {
    relativeLabel = 'Today';
    badgeStyle = 'today';
    isToday = true;
  } else if (dayDifference === 1) {
    relativeLabel = 'Yesterday';
    badgeStyle = 'recent';
    isYesterday = true;
  } else if (dayDifference >= 2 && dayDifference <= 6) {
    relativeLabel = `${dayDifference} Days Ago`;
    badgeStyle = 'recent';
  } else if (dayDifference >= 7 && dayDifference < 14) {
    relativeLabel = 'Last Week';
    badgeStyle = 'past';
  } else if (dayDifference >= 14 && dayDifference < 30) {
    const weeks = Math.floor(dayDifference / 7);
    relativeLabel = `${weeks} Weeks Ago`;
    badgeStyle = 'past';
  } else if (dayDifference >= 30 && dayDifference < 60) {
    relativeLabel = 'Last Month';
    badgeStyle = 'old';
  } else if (dayDifference >= 60 && dayDifference < 365) {
    const months = Math.floor(dayDifference / 30);
    relativeLabel = `${months} Months Ago`;
    badgeStyle = 'old';
  } else if (dayDifference >= 365 && dayDifference < 730) {
    relativeLabel = 'Last Year';
    badgeStyle = 'old';
  } else {
    const years = Math.floor(dayDifference / 365);
    relativeLabel = `${years} Years Ago`;
    badgeStyle = 'old';
  }

  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const isCurrentYear = year === now.getFullYear();
  const yearPart = isCurrentYear ? '' : `, ${year}`;

  const fullFormattedDate = `${weekday}, ${month} ${day}${yearPart} • ${time}`;
  const shortFormattedDate = `${month} ${day}${yearPart} • ${time}`;

  return {
    relativeLabel,
    fullFormattedDate,
    shortFormattedDate,
    isoString: date.toISOString(),
    isToday,
    isYesterday,
    badgeStyle,
  };
}
