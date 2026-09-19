import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useSocket } from '../context/SocketContext.js';
import { AdminMetrics, Project, Task } from '../types/index.js';
import { ActivityFeed } from '../components/ActivityFeed.js';
import { TaskFilters } from '../components/TaskFilters.js';
import { TaskCard } from '../components/TaskCard.js';
import { CreateProjectModal } from '../components/CreateProjectModal.js';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Plus,
  ArrowRight,
  TrendingUp,
  Layers,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const { activeUsersCount, setTaskUpdateListener } = useSocket();
  const [searchParams] = useSearchParams();

  const loadData = async () => {
    try {
      const [dashData, projectsData, tasksData] = await Promise.all([
        api.getDashboardMetrics(),
        api.getProjects(),
        api.getTasks(searchParams.toString()),
      ]);

      if (dashData?.metrics) setMetrics(dashData.metrics);
      if (projectsData) setProjects(projectsData);
      if (tasksData) setTasks(tasksData);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchParams.toString()]);

  // Real-time task update listener
  useEffect(() => {
    setTaskUpdateListener((updatedTask) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
      );
      // Refresh metrics silently
      api.getDashboardMetrics().then((res) => {
        if (res?.metrics) setMetrics(res.metrics);
      });
    });

    return () => setTaskUpdateListener(null);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
            <span>Global Agency Overview</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Admin Access
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time monitoring across all client projects, team task progress, and live user presence.
          </p>
        </div>

        <button
          onClick={() => setIsProjectModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Client Project</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Projects</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white">
              {metrics?.totalProjects ?? 0}
            </span>
            <span className="text-xs text-slate-500">active engagements</span>
          </div>
        </div>

        {/* Total Tasks by Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Task Velocity</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white">
              {metrics?.totalTasks ?? 0}
            </span>
            <span className="text-xs text-emerald-400">
              {metrics?.tasksByStatus?.DONE ?? 0} completed
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center space-x-2">
            <span>{metrics?.tasksByStatus?.IN_PROGRESS ?? 0} in progress</span>
            <span>•</span>
            <span>{metrics?.tasksByStatus?.IN_REVIEW ?? 0} in review</span>
          </div>
        </div>

        {/* Overdue Task Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Overdue Tasks</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-rose-400">
              {metrics?.overdueTaskCount ?? 0}
            </span>
            <span className="text-xs text-slate-500">scheduler flagged</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">Background cron verified</p>
        </div>

        {/* Live Online Users (WebSocket Presence) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Users Online</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-400 animate-pulse">
              {activeUsersCount}
            </span>
            <span className="text-xs text-slate-500">live socket presence</span>
          </div>
          <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Connected sockets updating</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Projects & Global Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Project Cards & Task Browser */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects Carousel / Overview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>All Client Projects</span>
              </h2>
              <span className="text-xs text-slate-400">{projects.length} Total</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <Link
                  key={proj.id}
                  to={`/projects/${proj.id}`}
                  className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 shadow-lg transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                        {proj.client?.name || 'Client Project'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {proj._count?.tasks || 0} tasks
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {proj.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                      {proj.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>PM: {proj.manager?.name}</span>
                    <span className="flex items-center space-x-1 text-cyan-400 group-hover:translate-x-0.5 transition-transform font-medium">
                      <span>View Board</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Filterable Tasks View */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Agency Tasks Filter & Search</h2>
              <span className="text-xs text-slate-400">{tasks.length} Matches</span>
            </div>

            {/* Task Filters synced to URL Query Params */}
            <TaskFilters />

            {/* Tasks List */}
            {tasks.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                No tasks match the active filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    showProjectBadge
                    onStatusUpdated={(updated) => {
                      setTasks((prev) =>
                        prev.map((t) => (t.id === updated.id ? updated : t))
                      );
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Real-time Global Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed title="Global Activity Feed" />
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreated={(newProj) => {
          setProjects((prev) => [newProj, ...prev]);
        }}
      />
    </div>
  );
};

