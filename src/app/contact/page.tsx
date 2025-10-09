export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-600 to-purple-400 flex items-center justify-center pt-20">
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Contact Us
          </h1>
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-12 max-w-5xl mx-auto">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6">
              Contact Page
            </h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              This is the contact page. Here you can add contact information, 
              forms, or other ways for users to get in touch with your team.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Contact details and forms will be added here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
