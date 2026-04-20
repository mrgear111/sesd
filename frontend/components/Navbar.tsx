'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from '@/types';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/projects" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg"></div>
            <span className="text-white font-bold text-xl">AgileFlow</span>
          </Link>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="text-white text-sm">
                  <span className="text-blue-200">Welcome,</span>{' '}
                  <span className="font-semibold">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-blue-200 px-4 py-2 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
