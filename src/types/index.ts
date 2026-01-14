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
  // New fields for nuances
  wheelchairAccessible: boolean;
  caregiverRequired: boolean;
  caregiverPaymentRequired: boolean;
  caregiverPaymentAmount?: number;
  ageRestriction?: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'all';
  // Volunteer fields
  volunteersNeeded?: number;
  currentVolunteers?: number;
  // Recurring event fields
  recurringGroupId?: string; // Links recurring events together
  isRecurring?: boolean;
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
  // New fields
  needsWheelchairAccess?: boolean;
  hasCaregiverAccompanying?: boolean;
  caregiverName?: string;
  caregiverPhone?: string;
}

export type ViewMode = 'calendar' | 'list';

export type UserRole = 'participant' | 'volunteer' | 'staff';

export type MembershipType = 'adhoc' | 'once_weekly' | 'twice_weekly' | 'three_plus_weekly';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  membershipType?: MembershipType; // Only for participants
  // Volunteer specific fields
  skills?: string[];
  availability?: string[];
  emergencyContact?: string;
  emergencyPhone?: string;
  // Tracking
  createdAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  registrationType: 'participant' | 'volunteer';
  status: 'registered' | 'attended' | 'absent' | 'cancelled';
  // Participant specific
  dietaryRequirements?: string;
  specialNeeds?: string;
  needsWheelchairAccess?: boolean;
  hasCaregiverAccompanying?: boolean;
  caregiverName?: string;
  caregiverPhone?: string;
  // Timestamps
  registeredAt: string;
  attendedAt?: string;
}

export interface WeeklyRegistrationCount {
  weekStart: string;
  weekEnd: string;
  count: number;
}

export const MEMBERSHIP_LIMITS: Record<MembershipType, number> = {
  adhoc: 999, // No limit
  once_weekly: 1,
  twice_weekly: 2,
  three_plus_weekly: 999, // No limit (3 or more)
};

export const MEMBERSHIP_LABELS: Record<MembershipType, string> = {
  adhoc: 'Ad-hoc Engagement',
  once_weekly: 'Once a Week',
  twice_weekly: 'Twice a Week',
  three_plus_weekly: '3 or More Times a Week',
};
