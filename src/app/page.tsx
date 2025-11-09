import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen animated-gradient pt-20 relative overflow-hidden">
      {/* Floating Particles Background */}
      <div className="floating-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
      </div>
      {/* Hero Section */}
      <section className="flex items-center justify-center min-h-[85vh] px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-10">
            <Image
              src="/logo.ico"
              alt="ECMO Bridge Logo"
              width={120}
              height={120}
              className="mx-auto mb-8 drop-shadow-2xl"
            />
          </div>
          <h1 className="text-7xl font-extrabold bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent mb-8 leading-tight">
            ECMO Bridge
          </h1>
          <p className="text-2xl text-gray-300 mb-14 max-w-3xl mx-auto leading-relaxed">
            Facilitating physician-to-physician communication for ECMO machine coordination and patient care
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/dashboard"
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-12 py-5 rounded-full font-bold text-lg transition-all duration-300 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105"
            >
              Get Started
            </Link>
            <Link
              href="/about"
              className="border-2 border-purple-500/50 hover:border-purple-500 text-white px-12 py-5 rounded-full font-bold text-lg hover:bg-black/40 transition-all duration-300 backdrop-blur-sm hover:scale-105"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="group bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl p-8 text-center border border-purple-500/10 hover:border-purple-500/30 hover:bg-black/60 transition-all duration-500 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/50 group-hover:shadow-purple-500/70 transition-all duration-500">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Physician Network</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Healthcare providers can connect with colleagues across institutions to locate available ECMO equipment</p>
            </div>

            <div className="group bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl p-8 text-center border border-purple-500/10 hover:border-purple-500/30 hover:bg-black/60 transition-all duration-500 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/50 group-hover:shadow-purple-500/70 transition-all duration-500">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Real-time Communication</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Instant messaging and notification system for urgent ECMO equipment requests</p>
            </div>

            <div className="group bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl p-8 text-center border border-purple-500/10 hover:border-purple-500/30 hover:bg-black/60 transition-all duration-500 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/50 group-hover:shadow-purple-500/70 transition-all duration-500">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Secure Platform</h3>
              <p className="text-gray-400 text-sm leading-relaxed">End-to-end encryption ensures data protection. Healthcare providers authenticate using their NPI credentials</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-2xl p-12 text-center border border-purple-500/20">
            <h2 className="text-4xl font-bold text-white mb-8">Our Mission</h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-10">
              ECMO Bridge facilitates direct communication between healthcare providers to locate and coordinate ECMO equipment availability for patients in critical need. By connecting physicians across institutions, we help ensure life-saving medical equipment reaches patients who need it most.
            </p>
            <div className="mt-8 pt-8 border-t border-purple-500/20">
              <div className="bg-white/95 rounded-xl p-6 inline-block mb-6">
                <Image
                  src="/Mayo Clinic.png"
                  alt="Mayo Clinic Partnership"
                  width={150}
                  height={150}
                  className="mx-auto"
                />
              </div>
              <p className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">In Partnership with Mayo Clinic</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action Footer */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-8">
            Ready to Connect?
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Join healthcare professionals using ECMO Bridge to coordinate critical patient care
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/dashboard"
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-12 py-5 rounded-full font-bold text-lg transition-all duration-300 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105"
            >
              Access Dashboard
            </Link>
            <Link
              href="/about"
              className="border-2 border-purple-500/50 hover:border-purple-500 text-white px-12 py-5 rounded-full font-bold text-lg hover:bg-black/40 transition-all duration-300 backdrop-blur-sm hover:scale-105"
            >
              About Our Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
