'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface SkillOption {
  name: string;
  description: string;
}

interface SlashCommandMenuProps {
  query: string;           // text after the '/', used for filtering
  skills: SkillOption[];   // all available skills
  visible: boolean;        // whether to show the menu
  selectedIndex: number;   // currently highlighted row index
  onSelect: (skillName: string) => void;
  onClose: () => void;
}

export function SlashCommandMenu({
  query,
  skills,
  visible,
  selectedIndex,
  onSelect,
  onClose,
}: SlashCommandMenuProps) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!visible) return null;

  const filtered = query
    ? skills.filter(
        s =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.description.toLowerCase().includes(query.toLowerCase())
      )
    : skills;

  if (filtered.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 z-50">
      <div className="mx-4 rounded-xl border border-border bg-card shadow-lg overflow-hidden max-h-64 overflow-y-auto">
        {filtered.map((skill, i) => (
          <button
            key={skill.name}
            ref={i === selectedIndex ? selectedRef : undefined}
            onClick={() => onSelect(skill.name)}
            className={cn(
              'w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors',
              i === selectedIndex
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50'
            )}
          >
            <Zap className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium font-mono leading-none">{skill.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{skill.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
