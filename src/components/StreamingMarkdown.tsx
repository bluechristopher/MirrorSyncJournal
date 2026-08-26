import { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';

interface StreamingMarkdownProps {
  content: string;
  animate?: boolean;
  speedMs?: number;
  className?: string;
  onComplete?: () => void;
}

/**
 * StreamingMarkdown: Progressively reveals AI-generated markdown text smoothly.
 */
export function StreamingMarkdown({
  content,
  animate = false,
  speedMs = 18,
  className = '',
  onComplete
}: StreamingMarkdownProps) {
  const [displayedLength, setDisplayedLength] = useState(() => (animate ? 0 : content.length));
  const [isFinished, setIsFinished] = useState(() => !animate);
  const prevContentRef = useRef(content);

  useEffect(() => {
    // If content changes significantly, restart streaming if animate is active
    if (content !== prevContentRef.current) {
      prevContentRef.current = content;
      if (animate) {
        setDisplayedLength(0);
        setIsFinished(false);
      } else {
        setDisplayedLength(content.length);
        setIsFinished(true);
      }
    }
  }, [content, animate]);

  useEffect(() => {
    if (!animate || isFinished) {
      setDisplayedLength(content.length);
      setIsFinished(true);
      return;
    }

    if (displayedLength < content.length) {
      // Chunk characters or words for smooth natural pacing
      const step = Math.max(1, Math.floor((content.length - displayedLength) / 25) + 2);
      const timer = setTimeout(() => {
        setDisplayedLength(prev => {
          const next = Math.min(content.length, prev + step);
          if (next >= content.length) {
            setIsFinished(true);
            onComplete?.();
          }
          return next;
        });
      }, speedMs);

      return () => clearTimeout(timer);
    } else {
      setIsFinished(true);
      onComplete?.();
    }
  }, [animate, displayedLength, content, speedMs, isFinished, onComplete]);

  const displayedContent = isFinished ? content : content.slice(0, displayedLength);

  return (
    <div className={`markdown-body ${className}`}>
      <Markdown>{displayedContent}</Markdown>
      {!isFinished && (
        <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-[#f6e7b8] animate-pulse rounded-sm opacity-80" />
      )}
    </div>
  );
}
