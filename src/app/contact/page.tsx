export default function Contact() {
  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center relative overflow-hidden">
      <div className="floating-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Contact Us
          </h1>
          <div className="bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl p-16 max-w-5xl mx-auto border border-purple-500/10">
            <h2 className="text-4xl font-bold text-white mb-8">
              Contact Page
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              This is the contact page. Here you can add contact information,
              forms, or other ways for users to get in touch with your team.
            </p>
            <p className="text-xl text-gray-300 leading-relaxed">
              Contact details and forms will be added here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
