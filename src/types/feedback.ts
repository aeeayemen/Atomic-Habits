export type FeedbackCategory = 'ui' | 'flow' | 'bug' | 'idea';

export interface FeedbackCategoryMeta {
  id: FeedbackCategory;
  label: string;
  iconName: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export interface FeedbackNote {
  id: string;
  userId?: string;
  userEmail?: string;
  category: FeedbackCategory;
  message: string;
  viewSection?: string;
  isOnline: boolean;
  screenResolution?: string;
  deviceInfo?: string;
  createdAt: string;
}
