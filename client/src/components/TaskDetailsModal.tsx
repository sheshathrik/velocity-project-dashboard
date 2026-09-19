import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { Task, TaskStatus, TaskPriority, TaskActivityLog } from '../types/index.js';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import {
  X,
  Calendar,
  AlertTriangle,
  User,
  Clock,
  CheckCircle2,
  Activity,
  Layers,
  Tag,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface TaskDetailsModalProps {
  taskId: number | null;
  onClose: () => void;
  onStatusUpdated?: (updatedTask: Task) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  taskId,
  onClose,
  onStatusUpdated,
}) => {
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [activityLogs, setActivityLogs] = useState<TaskActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!taskId) {
      setTask(null);
      setActivityLogs([]);
      return;
    }

    setIsLoading(true);
    setError('');

    api
      .getTaskById(taskId)
      .then((data) => {
        setTask(data);
        setActivityLogs(data.activityLogs || []);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load task details');
      })
      .finally(() => setIsLoading(false));
  }, [taskId]);

  if (!taskId) return null;

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task || newStatus === task.status) return;
    setIsUpdating(true);
    try {
      const updated = await api.updateTaskStatus(task.id, newStatus);
      setTask((prev) => (prev ? { ...prev, ...updated } : prev));
      if (onStatusUpdated) {
        onStatusUpdated(updated);
      }
      // Refresh task details to fetch updated activity logs
      const refreshed = await api.getTaskById(task.id);
      setTask(refreshed);
      setActivityLogs(refreshed.activityLogs || []);
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'LOW':
      default:
        return 'bg-slate-700/40 text-slate-400 border-slate-600/40';
    }
  };

  const isOverdue =
    task && (task.isOverdue || (isPast(new Date(task.dueDate)) && task.status !== 'DONE'));

  const canChangeStatus =
    user?.role === 'ADMIN' ||
    user?.role === 'PROJECT_MANAGER' ||
    (user?.role === 'DEVELOPER' && task?.assignedDeveloperId === user.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              #{taskId}
            </span>
            {task?.project && (
              <span className="text-xs text-cyan-400 font-medium flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 mr-1" />
                <span>{task.project.name}</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span>Loading task #{taskId} details...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          ) : task ? (
            <>
              {/* Overdue Alert Banner */}
              {isOverdue && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400 animate-pulse" />
                  <div>
                    <p className="font-bold">Task Overdue</p>
                    <p className="text-[11px] text-rose-400/90">
                      The due date for this task passed on{' '}
                      {format(new Date(task.dueDate), 'MMMM d, yyyy')}.
                    </p>
                  </div>
                </div>
              )}

              {/* Title & Description */}
              <div>
                <h3 className="text-lg font-bold text-white leading-snug">{task.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  {task.description || 'No detailed description provided for this task.'}
                </p>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Priority */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                    Priority
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getPriorityBadge(
                      task.priority
                    )}`}
                  >
                    {task.priority}
                  </span>
                </div>

                {/* Status */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                    Status
                  </span>
                  {canChangeStatus ? (
                    <select
                      disabled={isUpdating}
                      value={task.status}
                      onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                      className="text-xs font-semibold rounded px-2 py-0.5 bg-slate-900 border border-slate-700 text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="DONE">Done</option>
                    </select>
                  ) : (
                    <span className="text-xs font-bold text-slate-200">
                      {task.status.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {/* Assignee */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                    Assignee
                  </span>
                  <span className="text-xs font-semibold text-slate-200 truncate block">
                    {task.assignedDeveloper?.name || 'Unassigned'}
                  </span>
                </div>

                {/* Due Date */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                    Due Date
                  </span>
                  <span
                    className={`text-xs font-semibold block ${
                      isOverdue ? 'text-rose-400 font-bold' : 'text-slate-200'
                    }`}
                  >
                    {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>

              {/* Activity History Audit Trail */}
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Task Activity Audit Log</span>
                </h4>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 max-h-48 overflow-y-auto divide-y divide-slate-800/80">
                  {activityLogs.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-500">
                      No status changes recorded yet
                    </div>
                  ) : (
                    activityLogs.map((log) => (
                      <div key={log.id} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{log.message}</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        {log.details && (log.details as any).fromStatus && (
                          <div className="mt-1 flex items-center space-x-1.5 text-[10px] text-slate-400">
                            <span>{(log.details as any).fromStatus}</span>
                            <ArrowRight className="w-3 h-3 text-cyan-400" />
                            <span className="text-cyan-300 font-medium">
                              {(log.details as any).toStatus}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
