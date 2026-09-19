import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types/index.js';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { format, isPast } from 'date-fns';
import {
  Calendar,
  AlertTriangle,
  User,
  Clock,
  CheckCircle2,
  ArrowRightCircle,
  Loader2,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onStatusUpdated?: (updatedTask: Task) => void;
  showProjectBadge?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusUpdated,
  showProjectBadge = false,
}) => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const isOverdue = task.isOverdue || (isPast(new Date(task.dueDate)) && task.status !== 'DONE');

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === task.status) return;
    setIsUpdating(true);
    try {
      const updated = await api.updateTaskStatus(task.id, newStatus);
      if (onStatusUpdated) {
        onStatusUpdated(updated);
      }
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

  const getStatusBadgeColor = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'IN_PROGRESS':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'IN_REVIEW':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'DONE':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    }
  };

  // Developer can only change their own assigned tasks
  const canChangeStatus =
    user?.role === 'ADMIN' ||
    user?.role === 'PROJECT_MANAGER' ||
    (user?.role === 'DEVELOPER' && task.assignedDeveloperId === user.id);

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-lg hover:shadow-cyan-500/5 transition-all flex flex-col justify-between group">
      <div>
        {/* Top Badges: Project, Priority, Overdue */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-mono font-semibold text-slate-400">
              #{task.id}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getPriorityBadge(
                task.priority
              )}`}
            >
              {task.priority}
            </span>
            {showProjectBadge && task.project && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-cyan-400 border border-slate-700 truncate max-w-[140px]">
                {task.project.name}
              </span>
            )}
          </div>

          {isOverdue && (
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              <span>Overdue</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug">
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col gap-2.5">
        {/* Metadata row: Assignee & Due Date */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span className="truncate max-w-[120px]">
              {task.assignedDeveloper?.name || 'Unassigned'}
            </span>
          </div>

          <div
            className={`flex items-center space-x-1 ${
              isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
          </div>
        </div>

        {/* Status Dropdown / Action */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Status
          </span>

          {canChangeStatus ? (
            <div className="relative">
              <select
                disabled={isUpdating}
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className={`text-xs font-semibold rounded-lg px-2.5 py-1 border cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${getStatusBadgeColor(
                  task.status
                )} ${isUpdating ? 'opacity-50' : ''}`}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
              {isUpdating && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-lg">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                </div>
              )}
            </div>
          ) : (
            <span
              className={`text-xs font-semibold rounded-lg px-2.5 py-1 border ${getStatusBadgeColor(
                task.status
              )}`}
            >
              {task.status.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
