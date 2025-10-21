export default function About() {
  // Define your team members here
  const teamMembers = [
    {
      name: "Huzaifah Sheikh",
      role: "Team Lead",
      photo: "/group members/Huz.png"
    },
    {
      name: "Neha Kanjamala",
      role: "Front-End Engineer",
      photo: "/group members/Neha.png"
    },
    {
      name: "Jia Cheng Kang",
      role: "Back-End Engineer",
      photo: "/group members/Jc.jpg"
    },
    {
      name: "Arjun Chaudhary",
      role: "Back-End Engineer",
      photo: "/group members/Arjun.png"
    },
    {
      name: "Mrinal Chopde",
      role: "Front-End Engineer",
      photo: "/group members/Mrinal.png"
    },
    {
      name: "Ameya Patibanda",
      role: "Front-End Engineer",
      photo: "/group members/Ameya.png"
    },
    {
      name: "Harshit Kumar",
      role: "Back-End Engineer",
      photo: "/group members/Harshit.png"
    },
    {
      name: "Pranav Kondapalli",
      role: "Front-End Engineer",
      photo: "/group members/Pranav.png"
    },
    {
      name: "Abdimalik Abdirahman",
      role: "Back-End Engineer",
      photo: "/group members/Abdi.png"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-600 to-purple-400 pt-20 pb-12">
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-12">
            About ECMO Bridge 2.0
          </h1>

          {/* Logo Section */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 mb-8">
            <div className="flex items-center justify-center gap-12">
              {/* Your Team Logo */}
              <div className="flex flex-col items-center">
                {/* Replace with your team logo once you have the file */}
                {/* <img 
                  src="/YourTeamLogo.png" 
                  alt="ECMO Bridge Team" 
                  className="w-48 h-48 object-contain mb-3"
                /> */}
                <div className="w-48 h-48 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg shadow-lg flex items-center justify-center mb-3">
                  <span className="text-white text-2xl font-bold">ECMO Bridge</span>
                </div>
                <p className="text-lg font-semibold text-gray-700">Our Logo</p>
              </div>

              {/* X Symbol */}
              <div className="text-6xl font-bold text-gray-400">×</div>

              {/* Mayo Clinic Logo */}
              <div className="flex flex-col items-center">
                <img 
                  src="/Mayo Clinic.png" 
                  alt="Mayo Clinic" 
                  className="w-48 h-48 object-contain mb-3"
                />
                <p className="text-lg font-semibold text-gray-700">Mayo Clinic</p>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-12 mb-12">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed max-w-4xl mx-auto">
              ECMO Bridge is a state-of-the-art application designed to efficiently allocate ECMO (Extracorporeal Membrane Oxygenation) machines to patients in critical need. By integrating a sophisticated dynamic matching algorithm, ECMO Bridge assesses multiple vital factors to ensure optimal resource distribution and enhanced patient care
            </p>
          </div>

          {/* Team Section */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-12 mb-12">
            <h2 className="text-3xl font-semibold text-gray-800 mb-8">
              Our Team
            </h2>
            <div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto">
              {teamMembers.map((member, index) => (
                <div key={index} className="flex flex-col items-center">
                  {/* Team Member Photo */}
                  {member.photo ? (
                    <img 
                      src={member.photo} 
                      alt={member.name}
                      className="w-40 h-40 rounded-full shadow-lg object-cover mb-3 hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-40 h-40 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full shadow-lg flex items-center justify-center mb-3 hover:scale-105 transition-transform">
                      <svg className="w-20 h-20 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {/* Team Member Name */}
                  <p className="text-sm font-medium text-gray-600">
                    {member.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-12">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
              Contact Us
            </h2>
            <div className="text-center">
              <p className="text-lg text-gray-700 mb-4">
                Have questions or need support?
              </p>
              <a 
                href="mailto:ecmobridge1@gmail.com"
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                ecmobridge1@gmail.com
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
