'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Event } from '@/types';
import { categoryColors } from '@/data/events';

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
}

export default function SignUpModal({ event, onClose, onSubmit }: SignUpModalProps) {
  const [formData, setFormData] = useState<SignUpFormData>({
    name: '',
    email: '',
    phone: '',
    dietaryRequirements: '',
    specialNeeds: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
                <span className={`inline-block text-xs px-2 py-1 rounded-full border mb-2 ${categoryColors[event.category] || 'bg-gray-100 text-gray-800'}`}>
                  {event.category}
                </span>
                <h3 className="font-semibold text-gray-800 text-lg">{event.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
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
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter your phone number"
              />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="e.g., Vegetarian, Halal, No nuts"
              />
            </div>

            <div>
              <label htmlFor="specialNeeds" className="block text-sm font-medium text-gray-700 mb-1">
                Special Needs / Accessibility Requirements
              </label>
              <textarea
                id="specialNeeds"
                value={formData.specialNeeds}
                onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
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
