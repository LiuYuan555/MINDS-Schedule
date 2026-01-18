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
  currentWaitlist?: number; // Number of people on waitlist
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
  // SMS confirmation message
  confirmationMessage?: string; // Custom SMS message sent after registration
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

export type UserStatus = 'pending' | 'active' | 'restricted';

export type MembershipType = 'adhoc' | 'once_weekly' | 'twice_weekly' | 'three_plus_weekly';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus; // pending = awaiting approval, active = can access, restricted = blocked
  membershipType?: MembershipType; // Only for participants
  // Caregiver fields
  isCaregiver?: boolean; // True if this user is a caregiver
  participantName?: string; // Name of person under caregiver's care
  // Volunteer specific fields
  skills?: string[];
  availability?: string[];
  emergencyContact?: string;
  emergencyPhone?: string;
  // Tracking
  createdAt: string;
  approvedAt?: string; // When admin approved the user
  approvedBy?: string; // Admin who approved
  lastUpdatedAt?: string; // Last modification timestamp
  lastUpdatedBy?: string; // Who made the last update
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
  status: 'registered' | 'waitlist' | 'attended' | 'absent' | 'cancelled' | 'rejected';
  waitlistPosition?: number; // Position in waitlist (1 = first in line)
  // Caregiver fields
  isCaregiver?: boolean; // True if registrant is a caregiver
  participantName?: string; // Name of actual participant (if different from userName)
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
  promotedAt?: string; // When promoted from waitlist to registered
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

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  pending: 'Pending Approval',
  active: 'Active',
  restricted: 'Restricted',
};
