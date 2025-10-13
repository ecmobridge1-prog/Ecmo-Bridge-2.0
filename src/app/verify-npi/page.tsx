'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

interface Provider {
  firstName: string;
  lastName: string;
  organizationName: string;
  credential: string;
}

export default function VerifyNPI() {
  const [npi, setNpi] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState<Provider | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate NPI format
    if (!/^\d{10}$/.test(npi)) {
      setError('NPI must be exactly 10 digits');
      return;
    }

    setLoading(true);
    setError('');
    setProvider(null);

    try {
      const response = await fetch('/api/verify-npi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ npi }),
      });

      const data = await response.json();

      if (data.success) {
        setProvider(data.provider);
        setShowSuccess(true);
        
        // Store NPI verification with user-specific key
        if (user) {
          const userId = user.id;
          const sessionKey = `npi_verified_${userId}`;
          const verifiedAtKey = `npi_verified_at_${userId}`;
          
          sessionStorage.setItem(sessionKey, 'true');
          sessionStorage.setItem(verifiedAtKey, new Date().toISOString());
        }
        
        // Auto-redirect to dashboard after 2.5 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2500);
      } else {
        setError(data.error || 'NPI verification failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setShowSuccess(false);
    setProvider(null);
    setError('');
    setNpi('');
  };

  if (showSuccess && provider) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back!
            </h1>
            <p className="text-lg text-gray-700">
              Dr. {provider.firstName} {provider.lastName}
            </p>
            {provider.credential && (
              <p className="text-sm text-gray-500 mt-1">
                {provider.credential}
              </p>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              Redirecting to dashboard in a moment...
            </p>
          </div>
          
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            NPI Verification
          </h1>
          <p className="text-gray-600">
            Please enter your National Provider Identifier to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="npi" className="block text-sm font-medium text-gray-700 mb-2">
              NPI Number
            </label>
            <input
              type="text"
              id="npi"
              value={npi}
              onChange={(e) => {
                setNpi(e.target.value.replace(/\D/g, '')); // Only allow digits
                setError('');
              }}
              placeholder="Enter 10-digit NPI"
              maxLength={10}
              disabled={loading}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-300'
              } ${loading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 animate-fade-in">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || npi.length !== 10}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              loading || npi.length !== 10
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verifying NPI...
              </div>
            ) : (
              'Verify NPI'
            )}
          </button>
        </form>

        {error && !loading && (
          <div className="mt-6">
            <button
              onClick={handleRetry}
              className="w-full py-2 px-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
