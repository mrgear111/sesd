'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface User {
  id: string;
  username: string;
  email: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await api.get('/api/projects');
      setProjects(data);
    } catch (err: any) {
      if (err.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    
    try {
      await api.post('/api/projects', newProject);
      setNewProject({ name: '', description: '' });
      setShowCreateForm(false);
      fetchProjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your projects...</p>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center space-x-4">
              <div className="text-white text-sm">
                <span className="text-blue-200">Welcome,</span> <span className="font-semibold">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-white hover:text-blue-200 px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Projects</h1>
            <p className="text-blue-100">Manage and track all your projects in one place</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-white text-purple-900 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{showCreateForm ? 'Cancel' : 'New Project'}</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-400/30 p-4">
            <p className="text-sm text-red-100">{error}</p>
          </div>
        )}

        {/* Create Project Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
            <h3 className="text-2xl font-bold text-white mb-6">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 placeholder-blue-200 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all"
                  placeholder="Enter project name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 placeholder-blue-200 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all"
                  placeholder="Describe your project..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-white text-purple-900 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 max-w-md mx-auto">
              <svg className="w-20 h-20 text-blue-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-2xl font-bold text-white mb-2">No projects yet</h3>
              <p className="text-blue-100 mb-6">Create your first project to get started!</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-white text-purple-900 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl"
              >
                Create Project
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all transform hover:scale-105 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <span className="text-xs text-blue-200 bg-white/10 px-3 py-1 rounded-full">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-blue-200 transition-colors">
                  {project.name}
                </h3>
                <p className="text-blue-100 text-sm line-clamp-2 mb-4">
                  {project.description || 'No description provided'}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-xs text-blue-200">View Details →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
