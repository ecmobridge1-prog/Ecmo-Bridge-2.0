'use client';

import { useState, useEffect } from 'react';
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

  // Auto-redirect .edu emails to dashboard
  useEffect(() => {
    if (user) {
      const userEmail = user.primaryEmailAddress?.emailAddress;
      const isEduEmail = userEmail?.toLowerCase().endsWith('.edu');
      
      if (isEduEmail) {
        // Auto-verify for .edu emails
        const userId = user.id;
        sessionStorage.setItem(`npi_verified_${userId}`, 'true');
        sessionStorage.setItem(`npi_verified_at_${userId}`, new Date().toISOString());
        router.push('/dashboard');
      }
    }
  }, [user, router]);

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
      <div className="min-h-screen animated-gradient flex items-center justify-center p-4 relative overflow-hidden">
        <div className="floating-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
        <div className="bg-black/60 backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-md w-full text-center animate-fade-in border border-purple-500/20 relative z-10">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-500">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome back!
            </h1>
            <p className="text-lg text-purple-200">
              Dr. {provider.firstName} {provider.lastName}
            </p>
            {provider.credential && (
              <p className="text-sm text-purple-400 mt-1">
                {provider.credential}
              </p>
            )}
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-purple-800/30">
            <p className="text-sm text-gray-300">
              Redirecting to dashboard in a moment...
            </p>
          </div>

          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center p-4 relative overflow-hidden">
      <div className="floating-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      <div className="bg-black/60 backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-md w-full border border-purple-500/20 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-600">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            NPI Verification
          </h1>
          <p className="text-gray-300">
            Please enter your National Provider Identifier to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="npi" className="block text-sm font-medium text-purple-300 mb-2">
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
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-white placeholder-gray-500 ${
                error ? 'border-red-500 bg-red-900/30' : 'border-purple-800/50 bg-gray-800/50'
              } ${loading ? 'bg-gray-800/30 cursor-not-allowed' : ''}`}
            />
            {error && (
              <p className="mt-2 text-sm text-red-400 animate-fade-in">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || npi.length !== 10}
            className={`w-full py-4 px-4 rounded-xl font-bold transition-all duration-300 ${
              loading || npi.length !== 10
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-xl shadow-purple-500/40 hover:shadow-purple-500/60 hover:scale-105'
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
              className="w-full py-2 px-4 text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors"
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
