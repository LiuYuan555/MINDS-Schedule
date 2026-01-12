export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  time: string;
  endTime?: string;
  location: string;
  category: string;
  capacity?: number;
  currentSignups?: number;
}

export interface SignUpData {
  eventId: string;
  eventTitle: string;
  name: string;
  email: string;
  phone: string;
  dietaryRequirements?: string;
  specialNeeds?: string;
  timestamp: string;
}

export type ViewMode = 'calendar' | 'list';
