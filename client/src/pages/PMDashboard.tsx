import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { PMMetrics, Project, Task } from '../types/index.js';
import { ActivityFeed } from '../components/ActivityFeed.js';
import { TaskFilters } from '../components/TaskFilters.js';
import { TaskCard } from '../components/TaskCard.js';
import { CreateProjectModal } from '../components/CreateProjectModal.js';
import { format } from 'date-fns';
import {
  FolderKanban,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const PMDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PMMetrics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const { setTaskUpdateListener } = useSocket();
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
      console.error('Failed to load PM dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchParams.toString()]);

  // Real-time task status update listener
  useEffect(() => {
    setTaskUpdateListener((updatedTask) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
      );
      api.getDashboardMetrics().then((res) => {
        if (res?.metrics) setMetrics(res.metrics);
      });
    });

    return () => setTaskUpdateListener(null);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
            <span>Project Manager Hub</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {user?.name}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Managing client delivery, sprint priorities, and team assignments for your projects.
          </p>
        </div>

        <button
          onClick={() => setIsProjectModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Managed Projects */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">My Managed Projects</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white">
              {metrics?.totalProjects ?? 0}
            </span>
            <span className="text-xs text-slate-500">active client projects</span>
          </div>
        </div>

        {/* Tasks by Priority */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tasks By Priority</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-sm font-bold text-rose-400">
              {metrics?.tasksByPriority?.CRITICAL ?? 0} Critical
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-sm font-bold text-amber-400">
              {metrics?.tasksByPriority?.HIGH ?? 0} High
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-sm font-bold text-blue-400">
              {metrics?.tasksByPriority?.MEDIUM ?? 0} Med
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Total of {metrics?.totalTasks ?? 0} tasks tracked across your projects
          </p>
        </div>

        {/* Upcoming Due Dates This Week */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Upcoming Due This Week</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-cyan-400">
              {metrics?.upcomingDueThisWeekCount ?? 0}
            </span>
            <span className="text-xs text-slate-500">deadlines this week</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Review deliverables on time</p>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Projects & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects Summary */}
          <div>
            <h2 className="text-base font-bold text-white mb-4">Your Assigned Projects</h2>
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
                        {proj.client?.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {proj._count?.tasks || 0} tasks
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {proj.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                      {proj.description || 'No description'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-cyan-400 font-medium">
                    <span>Manage Tasks</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Upcoming Due Dates This Week List */}
          {metrics?.upcomingTasksThisWeek && metrics.upcomingTasksThisWeek.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Upcoming Milestones This Week</span>
              </h3>
              <div className="divide-y divide-slate-800">
                {metrics.upcomingTasksThisWeek.map((t) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-slate-200">{t.title}</span>
                      <span className="text-slate-500 ml-2">({t.project?.name})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-cyan-400 font-medium">
                        {format(new Date(t.dueDate), 'MMM d')}
                      </span>
                      <span className="text-slate-400">
                        {t.assignedDeveloper?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filterable Tasks */}
          <div>
            <h2 className="text-base font-bold text-white mb-3">Tasks in Your Projects</h2>
            <TaskFilters />
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

        {/* Right 1 Col: PM-scoped Live Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed title="Project Team Activity" />
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

