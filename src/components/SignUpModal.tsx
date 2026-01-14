'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useUser } from '@clerk/nextjs';
import { Event } from '@/types';
import { categoryColors, skillLevelColors } from '@/data/events';

interface SignUpModalProps {
  event: Event;
  onClose: () => void;
  onSubmit: (data: SignUpFormData) => Promise<void>;
}

export interface SignUpFormData {
  name: string;
  email: string;
  phone: string;
  dietaryRequirements: string;
  specialNeeds: string;
  needsWheelchairAccess: boolean;
  hasCaregiverAccompanying: boolean;
  caregiverName: string;
  caregiverPhone: string;
}

export default function SignUpModal({ event, onClose, onSubmit }: SignUpModalProps) {
  const { user } = useUser();
  const [formData, setFormData] = useState<SignUpFormData>({
    name: user?.fullName || '',
    email: user?.emailAddresses[0]?.emailAddress || '',
    phone: '',
    dietaryRequirements: '',
    specialNeeds: '',
    needsWheelchairAccess: false,
    hasCaregiverAccompanying: event.caregiverRequired || false,
    caregiverName: '',
    caregiverPhone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // For now, allow all registrations - membership limits can be added via Clerk metadata later
  const canRegister = () => {
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const spotsLeft = event.capacity && event.currentSignups 
    ? event.capacity - event.currentSignups 
    : null;

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Registration Successful!</h3>
          <p className="text-gray-600 mb-6">
            You have been registered for <strong>{event.title}</strong>. 
            We&apos;ll send a confirmation to your email.
          </p>
          {event.caregiverPaymentRequired && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left">
              <p className="text-yellow-800 text-sm">
                <strong>Payment Required:</strong> Caregiver fee of ${event.caregiverPaymentAmount} is payable on arrival.
              </p>
            </div>
          )}
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Event Registration</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Event Details */}
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
                  {event.wheelchairAccessible && (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      ♿ Wheelchair Accessible
                    </span>
                  )}
                  {event.caregiverRequired && (
                    <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      👥 Caregiver Required
                    </span>
                  )}
                  {event.caregiverPaymentRequired && (
                    <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      💰 Caregiver Fee: ${event.caregiverPaymentAmount}
                    </span>
                  )}
                  {event.ageRestriction && (
                    <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      🎂 Age: {event.ageRestriction}
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
                  <div className={`mt-3 text-sm font-medium ${spotsLeft <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                    {spotsLeft} spots remaining
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  readOnly
                  value={user?.fullName || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Name is linked to your account.</p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
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
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                required
                readOnly
                value={user?.emailAddresses[0]?.emailAddress || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Email is linked to your account.</p>
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
                  I require wheelchair accessibility
                </label>
              </div>
            )}

            {/* Caregiver Section */}
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
                  Caregiver will be accompanying {event.caregiverRequired && <span className="text-red-500">(Required)</span>}
                </label>
              </div>

              {formData.hasCaregiverAccompanying && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                  <div>
                    <label htmlFor="caregiverName" className="block text-sm font-medium text-gray-700 mb-1">
                      Caregiver Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="caregiverName"
                      required={formData.hasCaregiverAccompanying}
                      value={formData.caregiverName}
                      onChange={(e) => setFormData({ ...formData, caregiverName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-black"
                      placeholder="Caregiver's full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="caregiverPhone" className="block text-sm font-medium text-gray-700 mb-1">
                      Caregiver Phone <span className="text-red-500">*</span>
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
                      placeholder="Caregiver's phone number"
                    />
                  </div>
                  {event.caregiverPaymentRequired && (
                    <div className="col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800 text-sm">
                        💰 Caregiver fee: <strong>${event.caregiverPaymentAmount}</strong> - payable on arrival
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="dietary" className="block text-sm font-medium text-gray-700 mb-1">
                Dietary Requirements
              </label>
              <input
                type="text"
                id="dietary"
                value={formData.dietaryRequirements}
                onChange={(e) => setFormData({ ...formData, dietaryRequirements: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-black"
                placeholder="e.g., Vegetarian, Halal, No nuts"
              />
            </div>

            <div>
              <label htmlFor="specialNeeds" className="block text-sm font-medium text-gray-700 mb-1">
                Special Needs / Additional Requirements
              </label>
              <textarea
                id="specialNeeds"
                value={formData.specialNeeds}
                onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-black"
                placeholder="Please let us know if you have any special requirements"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
