'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ProjectDetailsResponse, User, Task, Sprint } from '@/types';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import KanbanBoard from '@/components/KanbanBoard';
import SprintList from '@/components/SprintList';

type TabType = 'overview' | 'tasks' | 'sprints' | 'members';

export default function ProjectDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<ProjectDetailsResponse | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      const [projectData, tasksData, sprintsData] = await Promise.all([
        api.get(`/api/projects/${projectId}`),
        api.get(`/api/projects/${projectId}/tasks`),
        api.get(`/api/projects/${projectId}/sprints`),
      ]);

      setProject(projectData);
      setTasks(tasksData);
      setSprints(sprintsData);
      setEditForm({ name: projectData.name, description: projectData.description });
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

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');

    try {
      await api.patch(`/api/projects/${projectId}`, editForm);
      setShowEditModal(false);
      fetchProjectDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    setError('');

    try {
      await api.delete(`/api/projects/${projectId}`);
      router.push('/projects');
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading project details..." />;
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <Navbar user={user} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Project not found</h2>
            <button
              onClick={() => router.push('/projects')}
              className="text-blue-300 hover:text-blue-200"
            >
              ← Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === project.ownerId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/projects')}
            className="text-blue-200 hover:text-white mb-4 flex items-center space-x-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Projects</span>
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{project.name}</h1>
              <p className="text-blue-100">{project.description || 'No description'}</p>
              <p className="text-sm text-blue-200 mt-2">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>

            {isOwner && (
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-500/20 hover:bg-red-500/30 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-400/30 p-4">
            <p className="text-sm text-red-100">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-white/20">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { id: 'tasks', label: 'Tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                { id: 'sprints', label: 'Sprints', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                { id: 'members', label: 'Members', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-white text-white'
                      : 'border-transparent text-blue-200 hover:text-white hover:border-white/50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Info */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Project Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-blue-200">Name</p>
                    <p className="text-white font-medium">{project.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-200">Description</p>
                    <p className="text-white">{project.description || 'No description'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-200">Created</p>
                    <p className="text-white">{new Date(project.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Workflows */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Workflows</h3>
                <div className="space-y-2">
                  {project.workflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="bg-white/10 rounded-lg p-3 flex items-center justify-between"
                    >
                      <span className="text-white font-medium">{workflow.name}</span>
                      <span className="text-xs text-blue-200 bg-white/10 px-2 py-1 rounded">
                        Order: {workflow.sequenceOrder}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-white">{tasks.length}</p>
                    <p className="text-sm text-blue-200">Total Tasks</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-white">{sprints.length}</p>
                    <p className="text-sm text-blue-200">Sprints</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-white">{project.members.length}</p>
                    <p className="text-sm text-blue-200">Members</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-white">
                      {sprints.filter((s) => s.state === 'Active').length}
                    </p>
                    <p className="text-sm text-blue-200">Active Sprints</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <KanbanBoard
              projectId={projectId}
              workflows={project.workflows}
              tasks={tasks}
              onTasksChange={setTasks}
            />
          )}

          {activeTab === 'sprints' && (
            <SprintList
              projectId={projectId}
              sprints={sprints}
              onSprintsChange={setSprints}
              tasks={tasks}
            />
          )}

          {activeTab === 'members' && (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Project Members</h3>
              <div className="space-y-3">
                {project.members.map((member) => (
                  <div
                    key={member.userId}
                    className="bg-white/10 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {member.user?.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{member.user?.username}</p>
                        <p className="text-sm text-blue-200">{member.user?.email}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        member.role === 'Owner'
                          ? 'bg-yellow-500/20 text-yellow-200'
                          : 'bg-blue-500/20 text-blue-200'
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Project">
        <form onSubmit={handleUpdateProject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">Project Name *</label>
            <input
              type="text"
              required
              maxLength={200}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 placeholder-blue-200 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">Description</label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 placeholder-blue-200 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="flex-1 bg-white text-purple-900 px-4 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all disabled:opacity-50"
            >
              {updating ? 'Updating...' : 'Update Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Project" size="sm">
        <div className="space-y-4">
          <p className="text-white">
            Are you sure you want to delete this project? This action cannot be undone and will delete all tasks, sprints, and comments.
          </p>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteProject}
              disabled={deleting}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Project'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
