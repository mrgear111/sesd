import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Agile Project Dashboard
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Manage your projects with ease
          </p>
        </div>
        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="block w-full px-6 py-3 bg-white text-blue-600 font-medium rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Create Account
          </Link>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Full-stack application with Node.js/TypeScript backend
          </p>
        </div>
      </div>
    </div>
  );
}
