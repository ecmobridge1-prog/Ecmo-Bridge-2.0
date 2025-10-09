export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-600 to-purple-400 flex items-center justify-center pt-20">
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            About ECMO Bridge 2.0
          </h1>
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-12 max-w-5xl mx-auto">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6">
              About Page
            </h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              This is the about page. Here you can add information about your 
              ECMO Bridge application, its purpose, and how it helps healthcare 
              professionals with patient-machine matching.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              More content about your application will go here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
