import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { TaskPriority, User } from '../types/index.js';
import { X, Plus, Loader2 } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onCreated: (task: any) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  projectId,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedDeveloperId, setAssignedDeveloperId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [developers, setDevelopers] = useState<User[]>([]);
  const [isLoadingDevs, setIsLoadingDevs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Default due date to 5 days from now
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    setDueDate(d.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingDevs(true);
      api
        .getDevelopers()
        .then((data) => {
          setDevelopers(data);
          if (data.length > 0 && !assignedDeveloperId) {
            setAssignedDeveloperId(data[0].id);
          }
        })
        .catch((err) => setError('Failed to load developers: ' + err.message))
        .finally(() => setIsLoadingDevs(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) {
      setError('Please provide task title and due date');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const task = await api.createTask({
        title,
        description: description || undefined,
        projectId,
        assignedDeveloperId: assignedDeveloperId || null,
        priority,
        dueDate: new Date(dueDate).toISOString(),
      });
      onCreated(task);
      onClose();
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Create New Task</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Implement OAuth2 Refresh Token Rotation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Assign Developer
              </label>
              <select
                value={assignedDeveloperId}
                onChange={(e) => setAssignedDeveloperId(e.target.value)}
                disabled={isLoadingDevs}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Unassigned</option>
                {developers.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.name} ({dev.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Due Date *
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Detailed acceptance criteria or implementation notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
