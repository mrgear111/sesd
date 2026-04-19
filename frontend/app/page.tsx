import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg"></div>
              <span className="text-white font-bold text-xl">AgileFlow</span>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/login"
                className="text-white hover:text-blue-200 px-4 py-2 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-white text-purple-900 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-all transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Manage Projects
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              The Agile Way
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Streamline your workflow with powerful project management tools. 
            Track tasks, manage sprints, and collaborate with your team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-purple-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-2xl"
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all border-2 border-white/30"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Task Management</h3>
            <p className="text-blue-100">
              Create, assign, and track tasks with ease. Keep your team organized and productive.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sprint Planning</h3>
            <p className="text-blue-100">
              Plan and execute sprints efficiently. Track progress and meet deadlines consistently.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Team Collaboration</h3>
            <p className="text-blue-100">
              Work together seamlessly. Comment, share updates, and stay connected with your team.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-12">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">100%</div>
              <div className="text-blue-100">TypeScript</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">REST</div>
              <div className="text-blue-100">API Design</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">JWT</div>
              <div className="text-blue-100">Secure Auth</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-blue-100">Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-blue-100">
            <p className="mb-2">Built with Node.js, TypeScript, Express, PostgreSQL, Next.js & Tailwind CSS</p>
            <p className="text-sm text-blue-200">© 2026 AgileFlow. SESD Course Project.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
