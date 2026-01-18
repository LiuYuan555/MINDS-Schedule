'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useUser } from '@clerk/nextjs';
import { Event } from '@/types';
import { categoryColors, skillLevelColors } from '@/data/events';
import { useLanguage } from '@/components/LanguageProvider';

export interface BulkRegistrationResult {
  eventId: string;
  eventTitle: string;
  success: boolean;
  error?: string;
}

interface SignUpModalProps {
  event: Event;
  events?: Event[]; // For bulk registration
  onClose: () => void;
  onSubmit: (data: SignUpFormData) => Promise<BulkRegistrationResult[] | void>;
  isBulkRegistration?: boolean;
}

export interface SignUpFormData {
  name: string;
  email: string;
  phone: string;
  isCaregiver: boolean;
  participantName: string;
  dietaryRequirements: string;
  specialNeeds: string;
  needsWheelchairAccess: boolean;
  hasCaregiverAccompanying: boolean;
  caregiverName: string;
  caregiverPhone: string;
}

// Helper function to get user-friendly error display
const getErrorDisplay = (error: string, t: (section: 'signUpModal' | 'common', key: string) => string): { title: string; description: string; icon: string } => {
  if (error.includes('Already registered')) {
    return {
      title: t('signUpModal', 'alreadyRegistered'),
      description: t('signUpModal', 'alreadyRegisteredDesc'),
      icon: 'duplicate'
    };
  }
  if (error.includes('Time conflict')) {
    return {
      title: t('signUpModal', 'scheduleConflict'),
      description: error.replace('Time conflict: ', ''),
      icon: 'conflict'
    };
  }
  if (error.includes('Weekly limit reached')) {
    return {
      title: t('signUpModal', 'weeklyLimitReached'),
      description: error.replace('Weekly limit reached: ', ''),
      icon: 'limit'
    };
  }
  if (error.includes('Event is full')) {
    return {
      title: t('signUpModal', 'eventFull'),
      description: t('signUpModal', 'eventFullDesc'),
      icon: 'full'
    };
  }
  if (error.includes('No more volunteers needed')) {
    return {
      title: t('signUpModal', 'volunteerSpotsFilled'),
      description: t('signUpModal', 'volunteerSpotsFilledDesc'),
      icon: 'full'
    };
  }
  return {
    title: t('signUpModal', 'registrationFailedGeneric'),
    description: error || t('signUpModal', 'unexpectedError'),
    icon: 'generic'
  };
};

export default function SignUpModal({ event, events = [], onClose, onSubmit, isBulkRegistration = false }: SignUpModalProps) {
  const { user } = useUser();
  const { t } = useLanguage();
  const [formData, setFormData] = useState<SignUpFormData>({
    name: user?.fullName || '',
    email: user?.emailAddresses[0]?.emailAddress || '',
    phone: '',
    isCaregiver: false,
    participantName: '',
    dietaryRequirements: '',
    specialNeeds: '',
    needsWheelchairAccess: false,
    hasCaregiverAccompanying: event.caregiverRequired || false,
    caregiverName: '',
    caregiverPhone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkRegistrationResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // For now, allow all registrations - membership limits can be added via Clerk metadata later
  const canRegister = () => {
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null); // Clear any previous error

    setIsSubmitting(true);
    try {
      const result = await onSubmit(formData);
      if (isBulkRegistration && Array.isArray(result)) {
        setBulkResults(result);
      }
      setSubmitted(true);
    } catch (error: unknown) {
      console.error('Error submitting form:', error);
      const message = error instanceof Error ? error.message : 'There was an error submitting your registration. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const spotsLeft = event.capacity && event.currentSignups 
    ? event.capacity - event.currentSignups 
    : null;
  
  const isEventFull = spotsLeft !== null && spotsLeft <= 0;
  const waitlistCount = event.currentWaitlist || 0;

  if (submitted) {
    const successCount = bulkResults.filter(r => r.success).length;
    const failureCount = bulkResults.filter(r => !r.success).length;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          {isBulkRegistration && bulkResults.length > 0 ? (
            <>
              {/* Bulk Registration Results */}
              <div className={`w-16 h-16 ${failureCount === 0 ? 'bg-green-100' : failureCount === bulkResults.length ? 'bg-red-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                {failureCount === 0 ? (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : failureCount === bulkResults.length ? (
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">
                {failureCount === 0 
                  ? t('signUpModal', 'allRegistrationsSuccessful')
                  : failureCount === bulkResults.length 
                    ? t('signUpModal', 'registrationFailed')
                    : t('signUpModal', 'partialSuccess')}
              </h3>
              <p className="text-gray-600 mb-4 text-center">
                {successCount} / {bulkResults.length} {t('signUpModal', 'eventsRegisteredSuccessfully')}
              </p>
              
              {/* Individual Event Results */}
              <div className="max-h-64 overflow-y-auto space-y-2 mb-6">
                {bulkResults.map((result) => (
                  <div 
                    key={result.eventId}
                    className={`flex items-start gap-2 p-3 rounded-lg ${
                      result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    {result.success ? (
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                        {result.eventTitle}
                      </p>
                      {result.success ? (
                        <p className="text-xs text-green-600">{t('signUpModal', 'registeredSuccessfully')}</p>
                      ) : (
                        <p className="text-xs text-red-600">{result.error || t('signUpModal', 'registrationFailed')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Single Event Success */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('signUpModal', 'registrationSuccessful')}</h3>
                <p className="text-gray-600 mb-4">
                  {t('signUpModal', 'registeredFor')} <strong>{event.title}</strong>.
                </p>
                
                {/* Confirmation notifications */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
                  <p className="text-blue-800 text-sm font-medium mb-2">📬 {t('signUpModal', 'confirmationSent')}</p>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {t('signUpModal', 'emailConfirmation')}
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      {t('signUpModal', 'smsReminder')}
                    </li>
                  </ul>
                </div>

                {event.caregiverPaymentRequired && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left">
                    <p className="text-yellow-800 text-sm">
                      <strong>{t('signUpModal', 'paymentRequired')}</strong> {t('signUpModal', 'caregiverFee')} ${event.caregiverPaymentAmount} {t('signUpModal', 'caregiverFeePayableOnArrival')}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('common', 'close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {isBulkRegistration ? t('signUpModal', 'bulkEventRegistration') : t('signUpModal', 'eventRegistration')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Prominent Full Event Banner */}
          {!isBulkRegistration && isEventFull && (
            <div className="mt-3 bg-amber-100 border border-amber-300 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-semibold text-amber-800">{t('signUpModal', 'eventFullBanner')}</p>
                  <p className="text-sm text-amber-700">{t('signUpModal', 'registeringForWaitlist')}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Error Message Display */}
          {errorMessage && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                {(() => {
                  const errorDisplay = getErrorDisplay(errorMessage, t);
                  return (
                    <>
                      <div className="flex-shrink-0 mt-0.5">
                        {errorDisplay.icon === 'duplicate' && (
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {errorDisplay.icon === 'conflict' && (
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                        {errorDisplay.icon === 'limit' && (
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                        {errorDisplay.icon === 'full' && (
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                        {errorDisplay.icon === 'generic' && (
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-800 mb-1">{errorDisplay.title}</h4>
                        <p className="text-sm text-red-700">{errorDisplay.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setErrorMessage(null)}
                        className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors"
                        aria-label="Dismiss error"
                      >
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Event Details or List of Events */}
          {isBulkRegistration ? (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                {t('signUpModal', 'registeringFor')} {events.length} {t('signUpModal', 'events')}:
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {events.map((evt) => (
                  <div key={evt.id} className="flex items-start gap-2 text-sm">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <span className="font-medium text-gray-800">{evt.title}</span>
                      <span className="text-gray-500"> - {format(parseISO(evt.date), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {t('signUpModal', 'allEventsUseSameDetails')}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex gap-4">
              <div className="flex-shrink-0 w-16 text-center">
                <div className="bg-blue-600 text-white rounded-t-lg py-1 text-xs font-medium">
                  {format(parseISO(event.date), 'MMM')}
                </div>
                <div className="bg-blue-50 text-blue-600 rounded-b-lg py-2 text-2xl font-bold">
                  {format(parseISO(event.date), 'd')}
                </div>
              </div>
              <div className="flex-grow">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={`inline-block text-xs px-2 py-1 rounded-full border ${categoryColors[event.category] || 'bg-gray-100 text-gray-800'}`}>
                    {event.category}
                  </span>
                  {event.skillLevel && (
                    <span className={`inline-block text-xs px-2 py-1 rounded-full ${skillLevelColors[event.skillLevel]}`}>
                      {event.skillLevel === 'all' ? 'All Levels' : event.skillLevel.charAt(0).toUpperCase() + event.skillLevel.slice(1)}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">{event.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                
                {/* Event Info Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {event.isRecurring && (
                    <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      🔄 {t('signUpModal', 'recurringEvent')}
                    </span>
                  )}
                  {event.wheelchairAccessible && (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      ♿ {t('signUpModal', 'wheelchairAccessible')}
                    </span>
                  )}
                  {event.caregiverRequired && (
                    <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      👥 {t('signUpModal', 'caregiverRequired')}
                    </span>
                  )}
                  {event.caregiverPaymentRequired && (
                    <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      💰 {t('signUpModal', 'caregiverFee')}: ${event.caregiverPaymentAmount}
                    </span>
                  )}
                  {event.ageRestriction && (
                    <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      🎂 {t('signUpModal', 'age')}: {event.ageRestriction}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{event.time}{event.endTime ? ` - ${event.endTime}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{event.location}</span>
                  </div>
                </div>
                {spotsLeft !== null && (
                  <div className="mt-3">
                    {isEventFull ? (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-red-600">
                          {t('signUpModal', 'joinWaitlist')}
                        </div>
                        {waitlistCount > 0 && (
                          <div className="text-xs text-gray-500">
                            {waitlistCount} {waitlistCount === 1 ? t('signUpModal', 'personOnWaitlist') : t('signUpModal', 'peopleOnWaitlist')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`text-sm font-medium ${spotsLeft <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                        {spotsLeft} {spotsLeft === 1 ? t('signUpModal', 'spotRemaining') : t('signUpModal', 'spotsRemaining')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Waitlist Notice */}
          {!isBulkRegistration && isEventFull && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">{t('signUpModal', 'waitlistNoticeTitle')}</h4>
                  <p className="text-sm text-yellow-800">
                    {t('signUpModal', 'waitlistNoticeText')}
                    {waitlistCount > 0 && ` ${t('signUpModal', 'waitlistRequests')} ${waitlistCount} ${t('signUpModal', 'waitlistRequestsSuffix')}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Caregiver Identification */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="isCaregiver"
                  checked={formData.isCaregiver}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    isCaregiver: e.target.checked, 
                    participantName: e.target.checked ? formData.participantName : '',
                    // Clear caregiver accompanying fields if checking "I am a caregiver"
                    hasCaregiverAccompanying: e.target.checked ? false : formData.hasCaregiverAccompanying,
                    caregiverName: e.target.checked ? '' : formData.caregiverName,
                    caregiverPhone: e.target.checked ? '' : formData.caregiverPhone,
                  })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isCaregiver" className="text-sm font-medium text-gray-700">
                  {t('signUpModal', 'iAmCaregiver')}
                </label>
              </div>
              
              {formData.isCaregiver && (
                <div className="mt-3">
                  <label htmlFor="participantName" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('signUpModal', 'participantName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="participantName"
                    required={formData.isCaregiver}
                    value={formData.participantName}
                    onChange={(e) => setFormData({ ...formData, participantName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-black"
                    placeholder={t('signUpModal', 'enterParticipantName')}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('signUpModal', 'participantNameHint')}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.isCaregiver ? t('signUpModal', 'caregiverName') : t('signUpModal', 'fullName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  readOnly
                  value={user?.fullName || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">{t('signUpModal', 'nameLinkedToAccount')}</p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('signUpModal', 'phoneNumber')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-black"
                  placeholder={t('signUpModal', 'enterPhoneNumber')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('signUpModal', 'emailAddress')} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                required
                readOnly
                value={user?.emailAddresses[0]?.emailAddress || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">{t('signUpModal', 'emailLinkedToAccount')}</p>
            </div>

            {/* Accessibility Options */}
            {event.wheelchairAccessible && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="wheelchairAccess"
                  checked={formData.needsWheelchairAccess}
                  onChange={(e) => setFormData({ ...formData, needsWheelchairAccess: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="wheelchairAccess" className="text-sm text-gray-700">
                  {t('signUpModal', 'wheelchairAccessNeeded')}
                </label>
              </div>
            )}

            {/* Caregiver Accompanying Section - Only show if NOT registering as caregiver */}
            {!formData.isCaregiver && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="hasCaregiverAccompanying"
                    checked={formData.hasCaregiverAccompanying}
                    onChange={(e) => setFormData({ ...formData, hasCaregiverAccompanying: e.target.checked })}
                    disabled={event.caregiverRequired}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="hasCaregiverAccompanying" className="text-sm text-gray-700">
                    {t('signUpModal', 'caregiverAccompanying')} {event.caregiverRequired && <span className="text-red-500">({t('common', 'required')})</span>}
                  </label>
                </div>

              {formData.hasCaregiverAccompanying && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                  <div>
                    <label htmlFor="caregiverName" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('signUpModal', 'caregiverName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="caregiverName"
                      required={formData.hasCaregiverAccompanying}
                      value={formData.caregiverName}
                      onChange={(e) => setFormData({ ...formData, caregiverName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-black"
                      placeholder={t('signUpModal', 'caregiverFullName')}
                    />
                  </div>
                  <div>
                    <label htmlFor="caregiverPhone" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('signUpModal', 'caregiverPhone')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="caregiverPhone"
                      required={formData.hasCaregiverAccompanying}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.caregiverPhone}
                      onChange={(e) => setFormData({ ...formData, caregiverPhone: e.target.value.replace(/[^0-9]/g, '') })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-black"
                      placeholder={t('signUpModal', 'caregiverPhoneNumber')}
                    />
                  </div>
                  {event.caregiverPaymentRequired && (
                    <div className="col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800 text-sm">
                        💰 {t('signUpModal', 'caregiverFeePayable')} <strong>${event.caregiverPaymentAmount}</strong> {t('signUpModal', 'payableOnArrival')}
                      </p>
                    </div>
                  )}
                </div>
              )}
              </div>
            )}

            <div>
              <label htmlFor="dietary" className="block text-sm font-medium text-gray-700 mb-1">
                {t('signUpModal', 'dietaryRequirements')}
              </label>
              <input
                type="text"
                id="dietary"
                value={formData.dietaryRequirements}
                onChange={(e) => setFormData({ ...formData, dietaryRequirements: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-black"
                placeholder={t('signUpModal', 'dietaryPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="specialNeeds" className="block text-sm font-medium text-gray-700 mb-1">
                {t('signUpModal', 'specialNeeds')}
              </label>
              <textarea
                id="specialNeeds"
                value={formData.specialNeeds}
                onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-black"
                placeholder={t('signUpModal', 'specialNeedsPlaceholder')}
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('common', 'cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isEventFull && !isBulkRegistration
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubmitting 
                  ? t('signUpModal', 'submitting')
                  : isBulkRegistration 
                    ? `${t('signUpModal', 'registerForEvents')} ${events.length} ${t('signUpModal', 'events')}` 
                    : isEventFull
                      ? t('signUpModal', 'requestWaitlist')
                      : t('common', 'register')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
