'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Task, Workflow, User, Priority, Comment } from '@/types';
import Modal from './Modal';

interface TaskDetailsModalProps {
  task: Task;
  workflows: Workflow[];
  users: User[];
  onClose: () => void;
  onUpdate: () => void;
}

export default function TaskDetailsModal({ task, workflows, users, onClose, onUpdate }: TaskDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    assigneeId: task.assigneeId || '',
    workflowId: task.workflowId,
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    fetchComments();
  }, [task.id]);

  const fetchComments = async () => {
    try {
      const data = await api.get(`/api/tasks/${task.id}/comments`);
      setComments(data);
    } catch (err: any) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.patch(`/api/tasks/${task.id}`, {
        ...editForm,
        assigneeId: editForm.assigneeId || null,
        dueDate: editForm.dueDate || null,
      });
      setIsEditing(false);
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    setLoading(true);
    setError('');

    try {
      await api.delete(`/api/tasks/${task.id}`);
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    setError('');

    try {
      await api.post(`/api/tasks/${task.id}/comments`, { content: newComment });
      setNewComment('');
      fetchComments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.delete(`/api/comments/${commentId}`);
      fetchComments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-500/20 text-red-200 border-red-400/30';
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30';
      case 'Low':
        return 'bg-green-500/20 text-green-200 border-green-400/30';
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditing ? 'Edit Task' : 'Task Details'} size="lg">
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-400/30 p-4">
            <p className="text-sm text-red-100">{error}</p>
          </div>
        )}

        {isEditing ? (
          /* Edit Form */
          <form onSubmit={handleUpdateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">Title *</label>
              <input
                type="text"
                required
                maxLength={200}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 placeholder-blue-200 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">Priority *</label>
                <select
                  required
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as Priority })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="Low" className="bg-purple-900">Low</option>
                  <option value="Medium" className="bg-purple-900">Medium</option>
                  <option value="High" className="bg-purple-900">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">Workflow *</label>
                <select
                  required
                  value={editForm.workflowId}
                  onChange={(e) => setEditForm({ ...editForm, workflowId: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {workflows.map((workflow) => (
                    <option key={workflow.id} value={workflow.id} className="bg-purple-900">
                      {workflow.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">Assignee</label>
                <select
                  value={editForm.assigneeId}
                  onChange={(e) => setEditForm({ ...editForm, assigneeId: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="" className="bg-purple-900">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id} className="bg-purple-900">
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">Due Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-white text-purple-900 px-4 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <>
            {/* Task Info */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h2 className="text-2xl font-bold text-white">{task.title}</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
                    title="Edit task"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleDeleteTask}
                    disabled={loading}
                    className="text-red-300 hover:text-red-200 p-2 rounded-lg hover:bg-red-500/20 transition-all"
                    title="Delete task"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-3 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                  {task.priority} Priority
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  {workflows.find((w) => w.id === task.workflowId)?.name}
                </span>
              </div>

              {task.description && (
                <div>
                  <h4 className="text-sm font-medium text-blue-200 mb-2">Description</h4>
                  <p className="text-white whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-blue-200 mb-2">Assignee</h4>
                  {task.assignee ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {task.assignee.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white">{task.assignee.username}</span>
                    </div>
                  ) : (
                    <span className="text-white/60">Unassigned</span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-blue-200 mb-2">Due Date</h4>
                  <span className="text-white">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-blue-200 pt-2 border-t border-white/10">
                Created {new Date(task.createdAt).toLocaleString()} • Updated {new Date(task.updatedAt).toLocaleString()}
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-lg font-bold text-white mb-4">Comments ({comments.length})</h3>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="mb-6">
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 placeholder-blue-200 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="bg-white text-purple-900 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-all disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Comment'}
                </button>
              </form>

              {/* Comments List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-center text-blue-200 py-8">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-white/10 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {comment.user?.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{comment.user?.username}</p>
                            <p className="text-xs text-blue-200">
                              {new Date(comment.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {currentUser?.id === comment.userId && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-300 hover:text-red-200 p-1 rounded hover:bg-red-500/20 transition-all"
                            title="Delete comment"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <p className="text-white whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
