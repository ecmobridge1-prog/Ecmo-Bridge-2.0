export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-600 to-purple-400 flex items-center justify-center pt-20">
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Dashboard
          </h1>
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-12 max-w-5xl mx-auto">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6">
              Dashboard Page
            </h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              This is the dashboard page. Here you can add charts, metrics, 
              and other data visualization components for your ECMO Bridge 
              application.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Dashboard widgets and analytics will be added here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
