import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-600 to-purple-400 pt-20">
      {/* Hero Section */}
      <section className="flex items-center justify-center min-h-[80vh] px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <Image 
              src="/logo.ico" 
              alt="ECMO Bridge Logo" 
              width={100} 
              height={100}
              className="mx-auto mb-6"
            />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            ECMO Bridge 2.0
          </h1>
          <p className="text-xl text-purple-100 mb-12 max-w-2xl mx-auto">
            Facilitating physician-to-physician communication for ECMO machine coordination and patient care
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/dashboard"
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors duration-200"
            >
              Get Started
            </Link>
            <Link 
              href="/about"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Physician Network</h3>
              <p className="text-gray-600">Healthcare providers can connect with colleagues across institutions to locate available ECMO equipment</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Real-time Communication</h3>
              <p className="text-gray-600">Instant messaging and notification system for urgent ECMO equipment requests</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Secure Platform</h3>
              <p className="text-gray-600">End-to-end encryption ensures data protection. Healthcare providers authenticate using their NPI credentials</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              ECMO Bridge facilitates direct communication between healthcare providers to locate and coordinate ECMO equipment availability for patients in critical need. By connecting physicians across institutions, we help ensure life-saving medical equipment reaches patients who need it most.
            </p>
            <div className="mt-6">
              <Image 
                src="/Mayo Clinic.png" 
                alt="Mayo Clinic Partnership" 
                width={150} 
                height={150}
                className="mx-auto"
              />
              <p className="text-lg font-semibold text-gray-700 mt-4">In Partnership with Mayo Clinic</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action Footer */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Connect?
          </h2>
          <p className="text-lg text-purple-100 mb-8">
            Join healthcare professionals using ECMO Bridge to coordinate critical patient care
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/dashboard"
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors duration-200"
            >
              Access Dashboard
            </Link>
            <Link 
              href="/about"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors duration-200"
            >
              About Our Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
