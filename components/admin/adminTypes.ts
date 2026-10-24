import React from 'react';

export type AdminTab = 'activities' | 'collaborators' | 'jobs' | 'shop';

export interface AdminNavItemConfig {
  id: AdminTab;
  label: string;
  shortLabel?: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  badge?: {
    count: number;
    text?: string;
    isHighlight?: boolean;
    variant?: 'emerald' | 'amber' | 'blue' | 'slate';
  };
}
