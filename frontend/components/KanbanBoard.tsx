'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Task, Workflow, User, Priority } from '@/types';
import Modal from './Modal';
import TaskDetailsModal from './TaskDetailsModal';

interface KanbanBoardProps {
  projectId: string;
  workflows: Workflow[];
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

export default function KanbanBoard({ projectId, workflows, tasks, onTasksChange }: KanbanBoardProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filterAssignee, setFilterAssignee] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium' as Priority,
    assigneeId: '',
    workflowId: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.get('/api/users');
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await api.get(`/api/projects/${projectId}/tasks`);
      onTasksChange(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      await api.post(`/api/projects/${projectId}/tasks`, {
        ...newTask,
        assigneeId: newTask.assigneeId || null,
      });
      setNewTask({
        title: '',
        description: '',
        priority: 'Medium',
        assigneeId: '',
        workflowId: '',
      });
      setShowCreateModal(false);
      fetchTasks();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleMoveTask = async (taskId: string, newWorkflowId: string) => {
    try {
      await api.patch(`/api/tasks/${taskId}/workflow`, { workflowId: newWorkflowId });
      fetchTasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, workflowId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    handleMoveTask(taskId, workflowId);
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterAssignee && task.assigneeId !== filterAssignee) return false;
    if (filterPriority && task.priority !== filterPriority) return false;
    return true;
  });

  const sortedWorkflows = [...workflows].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

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
    <div>
      {/* Header with Filters */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Assignees</option>
            {users.map((user) => (
              <option key={user.id} value={user.id} className="bg-purple-900">
                {user.username}
              </option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Priorities</option>
            <option value="High" className="bg-purple-900">High</option>
            <option value="Medium" className="bg-purple-900">Medium</option>
            <option value="Low" className="bg-purple-900">Low</option>
          </select>

          {(filterAssignee || filterPriority) && (
            <button
              onClick={() => {
                setFilterAssignee('');
                setFilterPriority('');
              }}
              className="text-blue-200 hover:text-white text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-white text-purple-900 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Task</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-400/30 p-4">
          <p className="text-sm text-red-100">{error}</p>
        </div>
      )}

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-x-auto">
        {sortedWorkflows.map((workflow) => {
          const workflowTasks = filteredTasks.filter((task) => task.workflowId === workflow.id);

          return (
            <div
              key={workflow.id}
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4 min-w-[280px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, workflow.id)}
            >
              {/* Column Header */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-1">{workflow.name}</h3>
                <p className="text-sm text-blue-200">{workflowTasks.length} tasks</p>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {workflowTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => setSelectedTask(task)}
                    className="bg-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-all border border-white/10 hover:border-white/30"
                  >
                    <h4 className="text-white font-medium mb-2 line-clamp-2">{task.title}</h4>
                    
                    {task.description && (
                      <p className="text-sm text-blue-100 mb-3 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </span>

                      {task.assignee && (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {task.assignee.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {task.dueDate && (
                      <div className="mt-2 text-xs text-blue-200">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}

                {workflowTasks.length === 0 && (
                  <div className="text-center py-8 text-blue-200 text-sm">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">Title *</label>
            <input
              type="text"
              required
              maxLength={200}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 placeholder-blue-200 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter task title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">Description</label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 placeholder-blue-200 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Describe the task..."
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">Priority *</label>
              <select
                required
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
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
                value={newTask.workflowId}
                onChange={(e) => setNewTask({ ...newTask, workflowId: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="" className="bg-purple-900">Select workflow</option>
                {sortedWorkflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id} className="bg-purple-900">
                    {workflow.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">Assignee</label>
            <select
              value={newTask.assigneeId}
              onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
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
              {creating ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          workflows={workflows}
          users={users}
          onClose={() => setSelectedTask(null)}
          onUpdate={fetchTasks}
        />
      )}
    </div>
  );
}
