import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { Project, Task, TaskStatus } from '../types/index.js';
import { TaskCard } from '../components/TaskCard.js';
import { ActivityFeed } from '../components/ActivityFeed.js';
import { CreateTaskModal } from '../components/CreateTaskModal.js';
import {
  ArrowLeft,
  Plus,
  Layers,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  ListTodo,
} from 'lucide-react';

const COLUMNS: { status: TaskStatus; label: string; icon: any; color: string }[] = [
  { status: 'TODO', label: 'To Do', icon: ListTodo, color: 'border-slate-700' },
  { status: 'IN_PROGRESS', label: 'In Progress', icon: Clock, color: 'border-cyan-500/40' },
  { status: 'IN_REVIEW', label: 'In Review', icon: Clock, color: 'border-amber-500/40' },
  { status: 'DONE', label: 'Done', icon: CheckCircle2, color: 'border-emerald-500/40' },
];

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { joinProjectRoom, leaveProjectRoom, setTaskUpdateListener, refreshActivities } =
    useSocket();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Join WebSocket project room for real-time updates
    joinProjectRoom(id);

    setIsLoading(true);
    api
      .getProjectById(id)
      .then((data) => {
        setProject(data);
        setTasks(data.tasks || []);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load project');
      })
      .finally(() => setIsLoading(false));

    return () => {
      leaveProjectRoom(id);
    };
  }, [id]);

  // Listen to WebSocket task updates in real-time
  useEffect(() => {
    setTaskUpdateListener((updatedTask) => {
      if (updatedTask.projectId === id) {
        setTasks((prev) => {
          const index = prev.findIndex((t) => t.id === updatedTask.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = { ...next[index], ...updatedTask };
            return next;
          }
          return [updatedTask, ...prev];
        });
      }
    });

    return () => setTaskUpdateListener(null);
  }, [id]);

  const canCreateTask = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 text-sm">
        Loading project workspace...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-rose-400 text-sm font-semibold">{error || 'Project not found'}</p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-xs text-cyan-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center space-x-3 flex-wrap">
            <h1 className="text-2xl font-black tracking-tight text-white">
              {project.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {project.client?.name}
            </span>
          </div>
          {project.description && (
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        {canCreateTask && (
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project Task</span>
          </button>
        )}
      </div>

      {/* Kanban Board Columns (4 Columns: To Do, In Progress, In Review, Done) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Real-Time Task Board
          </h2>
          <span className="text-xs text-emerald-400 font-medium flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live WebSocket Synced</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {COLUMNS.map((col) => {
            const ColumnIcon = col.icon;
            const columnTasks = tasks.filter((t) => t.status === col.status);

            return (
              <div
                key={col.status}
                className={`bg-slate-900/60 border ${col.color} rounded-2xl p-4 min-h-[450px] flex flex-col`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                  <div className="flex items-center space-x-2">
                    <ColumnIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-200">
                      {col.label}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                  {columnTasks.length === 0 ? (
                    <div className="h-32 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-[11px] text-slate-500">
                      No tasks in this lane
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusUpdated={(updated) => {
                          setTasks((prev) =>
                            prev.map((t) => (t.id === updated.id ? updated : t))
                          );
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project-specific Activity Feed */}
      <div className="pt-4">
        <ActivityFeed
          title={`Activity Stream: ${project.name}`}
          projectId={project.id}
          maxHeight="max-h-[350px]"
        />
      </div>

      {/* Task Creation Modal */}
      {id && (
        <CreateTaskModal
          isOpen={isTaskModalOpen}
          projectId={id}
          onClose={() => setIsTaskModalOpen(false)}
          onCreated={(newTask) => {
            setTasks((prev) => [newTask, ...prev]);
          }}
        />
      )}
    </div>
  );
};
