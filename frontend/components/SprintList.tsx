'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Sprint, Task, SprintState } from '@/types';
import Modal from './Modal';

interface SprintListProps {
  projectId: string;
  sprints: Sprint[];
  onSprintsChange: (sprints: Sprint[]) => void;
  tasks: Task[];
}

export default function SprintList({ projectId, sprints, onSprintsChange, tasks }: SprintListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [newSprint, setNewSprint] = useState({
    name: '',
    startDate: '',
    endDate: '',
    state: 'Planned' as SprintState,
  });
  const [editForm, setEditForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    state: 'Planned' as SprintState,
  });

  const fetchSprints = async () => {
    try {
      const data = await api.get(`/api/projects/${projectId}/sprints`);
      onSprintsChange(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      await api.post(`/api/projects/${projectId}/sprints`, newSprint);
      setNewSprint({
        name: '',
        startDate: '',
        endDate: '',
        state: 'Planned',
      });
      setShowCreateModal(false);
      fetchSprints();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSprint) return;

    setUpdating(true);
    setError('');

    try {
      await api.patch(`/api/sprints/${selectedSprint.id}`, editForm);
      setShowEditModal(false);
      setSelectedSprint(null);
      fetchSprints();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteSprint = async (sprintId: string) => {
    if (!confirm('Are you sure you want to delete this sprint?')) return;

    try {
      await api.delete(`/api/sprints/${sprintId}`);
      fetchSprints();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEditModal = (sprint: Sprint) => {
    setSelectedSprint(sprint);
    setEditForm({
      name: sprint.name,
      startDate: sprint.startDate.split('T')[0],
      endDate: sprint.endDate.split('T')[0],
      state: sprint.state,
    });
    setShowEditModal(true);
  };

  const getSprintTasks = (sprintId: string) => {
    return tasks.filter((task) => task.sprintId === sprintId);
  };

  const getStateColor = (state: SprintState) => {
    switch (state) {
      case 'Planned':
        return 'bg-blue-500/20 text-blue-200 border-blue-400/30';
      case 'Active':
        return 'bg-green-500/20 text-green-200 border-green-400/30';
      case 'Completed':
        return 'bg-gray-500/20 text-gray-200 border-gray-400/30';
    }
  };

  const sortedSprints = [...sprints].sort((a, b) => {
    // Active first, then Planned, then Completed
    const stateOrder = { Active: 0, Planned: 1, Completed: 2 };
    const stateCompare = stateOrder[a.state] - stateOrder[b.state];
    if (stateCompare !== 0) return stateCompare;
    // Then by start date
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Sprints</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-white text-purple-900 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Sprint</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-400/30 p-4">
          <p className="text-sm text-red-100">{error}</p>
        </div>
      )}

      {/* Sprints List */}
      {sortedSprints.length === 0 ? (
        <div className="text-center py-20">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 max-w-md mx-auto">
            <svg className="w-20 h-20 text-blue-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-2xl font-bold text-white mb-2">No sprints yet</h3>
            <p className="text-blue-100 mb-6">Create your first sprint to organize tasks!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-purple-900 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all"
            >
              Create Sprint
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedSprints.map((sprint) => {
            const sprintTasks = getSprintTasks(sprint.id);
            const completedTasks = sprintTasks.filter((task) => 
              task.workflow?.name.toLowerCase().includes('done') || 
              task.workflow?.name.toLowerCase().includes('complete')
            ).length;
            const progress = sprintTasks.length > 0 ? (completedTasks / sprintTasks.length) * 100 : 0;

            return (
              <div
                key={sprint.id}
                className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{sprint.name}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full border ${getStateColor(sprint.state)}`}>
                        {sprint.state}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-blue-200">
                      <span>
                        {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{sprintTasks.length} tasks</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(sprint)}
                      className="text-blue-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
                      title="Edit sprint"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteSprint(sprint.id)}
                      className="text-red-300 hover:text-red-200 p-2 rounded-lg hover:bg-red-500/20 transition-all"
                      title="Delete sprint"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {sprintTasks.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-blue-200 mb-2">
                      <span>Progress</span>
                      <span>{completedTasks} / {sprintTasks.length} tasks completed ({Math.round(progress)}%)</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Tasks Preview */}
                {sprintTasks.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-sm text-blue-200 mb-2">Tasks in this sprint:</p>
                    <div className="space-y-2">
                      {sprintTasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="bg-white/10 rounded-lg p-3 flex items-center justify-between">
                          <span className="text-white text-sm">{task.title}</span>
                          <span className="text-xs text-blue-200">{task.workflow?.name}</span>
                        </div>
                      ))}
                      {sprintTasks.length > 3 && (
                        <p className="text-xs text-blue-200 text-center">
                          +{sprintTasks.length - 3} more tasks
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Sprint Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Sprint">
        <form onSubmit={handleCreateSprint} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">Sprint Name *</label>
            <input
              type="text"
              required
              maxLength={200}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 placeholder-blue-200 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="e.g., Sprint 1, Q1 2024"
              value={newSprint.name}
              onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">Start Date *</label>
              <input
                type="date"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newSprint.startDate}
                onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">End Date *</label>
              <input
                type="date"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newSprint.endDate}
                onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">State *</label>
            <select
              required
              value={newSprint.state}
              onChange={(e) => setNewSprint({ ...newSprint, state: e.target.value as SprintState })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="Planned" className="bg-purple-900">Planned</option>
              <option value="Active" className="bg-purple-900">Active</option>
              <option value="Completed" className="bg-purple-900">Completed</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 bg-white text-purple-900 px-4 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Sprint'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Sprint Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Sprint">
        <form onSubmit={handleUpdateSprint} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">Sprint Name *</label>
            <input
              type="text"
              required
              maxLength={200}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 placeholder-blue-200 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">Start Date *</label>
              <input
                type="date"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={editForm.startDate}
                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">End Date *</label>
              <input
                type="date"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={editForm.endDate}
                onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">State *</label>
            <select
              required
              value={editForm.state}
              onChange={(e) => setEditForm({ ...editForm, state: e.target.value as SprintState })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="Planned" className="bg-purple-900">Planned</option>
              <option value="Active" className="bg-purple-900">Active</option>
              <option value="Completed" className="bg-purple-900">Completed</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
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
              {updating ? 'Updating...' : 'Update Sprint'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
