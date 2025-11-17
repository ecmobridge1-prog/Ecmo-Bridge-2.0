export default function About() {
  // Define your team members here
  const teamMembers = [
    {
      name: "Huzaifah Sheikh",
      role: "Team Lead",
      photo: "/Updated Headshots/Huzaifah_S_Headshot.jpg"
    },
    {
      name: "Neha Kanjamala",
      role: "Front-End Engineer",
      photo: "/Updated Headshots/Neha headshot.jpg"
    },
    {
      name: "Jia Cheng Kang",
      role: "Back-End Engineer",
      photo: "/Updated Headshots/Jia Cheng Kang - Headshot.jpg"
    },
    {
      name: "Arjun Chaudhary",
      role: "Back-End Engineer",
      photo: "/Updated Headshots/Arjun_Headshot_Square.png"
    },
    {
      name: "Mrinal Chopde",
      role: "Front-End Engineer",
      photo: "/Updated Headshots/Mrinal.jpg"
    },
    {
      name: "Ameya Patibanda",
      role: "Front-End Engineer",
      photo: "/Updated Headshots/ameya.jpg"
    },
    {
      name: "Harshit Kumar",
      role: "Back-End Engineer",
      photo: "/Updated Headshots/Harshit_Headshot.jpg"
    },
    {
      name: "Pranav Kondapalli",
      role: "Front-End Engineer",
      photo: "/Updated Headshots/pranavheadshot.jpg"
    },
    {
      name: "Abdimalik Abdirahman",
      role: "Back-End Engineer",
      photo: "/Updated Headshots/Abdi.jpg"
    }
  ];

  return (
    <div className="min-h-screen animated-gradient pt-28 pb-12 relative overflow-hidden">
      {/* Floating Particles Background */}
      <div className="floating-particles">
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
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
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="planet"></div>
        <div className="planet"></div>
        <div className="planet"></div>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="text-center">
          {/* Logo Section */}
          <div className="bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-2xl p-12 mb-10 border border-purple-500/20">
            <div className="flex items-center justify-center gap-16">
              {/* Your Team Logo */}
              <div className="flex flex-col items-center">
                <div className="bg-white/95 rounded-xl p-6 mb-4">
                  <img
                    src="/ECMO Bridge.png"
                    alt="ECMO Bridge"
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <p className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">ECMO Bridge</p>
              </div>

              {/* X Symbol */}
              <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">×</div>

              {/* Mayo Clinic Logo */}
              <div className="flex flex-col items-center">
                <div className="bg-white/95 rounded-xl p-6 mb-4">
                  <img
                    src="/Mayo Clinic.png"
                    alt="Mayo Clinic"
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <p className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">Mayo Clinic</p>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl p-12 mb-10 border border-purple-500/10">
            <h2 className="text-4xl font-bold text-white mb-12">
              Our Team
            </h2>
            <div className="grid grid-cols-3 gap-10 max-w-5xl mx-auto">
              {teamMembers.map((member, index) => (
                <div key={index} className="group flex flex-col items-center">
                  {/* Team Member Photo */}
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-44 h-44 rounded-2xl shadow-xl shadow-purple-500/20 object-cover mb-4 group-hover:scale-105 transition-all duration-300 border border-purple-500/30 group-hover:border-purple-500/60"
                    />
                  ) : (
                    <div className="w-44 h-44 bg-gradient-to-br from-purple-700 to-purple-900 rounded-2xl shadow-xl shadow-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-all duration-300 border border-purple-500/30">
                      <svg className="w-20 h-20 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {/* Team Member Name */}
                  <p className="text-base font-bold text-white">
                    {member.name}
                  </p>
                  <p className="text-sm text-purple-400 font-medium">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl p-12 border border-purple-500/10">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">
              Contact Us
            </h2>
            <div className="text-center">
              <p className="text-lg text-gray-300 mb-8">
                Have questions or need support?
              </p>
              <a
                href="mailto:ecmobridge1@gmail.com"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-10 py-5 rounded-full font-bold text-lg transition-all duration-300 shadow-xl shadow-purple-500/40 hover:shadow-purple-500/60 hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
