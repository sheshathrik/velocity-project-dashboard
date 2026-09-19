import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { DeveloperMetrics, Task } from '../types/index.js';
import { ActivityFeed } from '../components/ActivityFeed.js';
import { TaskFilters } from '../components/TaskFilters.js';
import { TaskCard } from '../components/TaskCard.js';
import { TaskDetailsModal } from '../components/TaskDetailsModal.js';
import {
  Code2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const DeveloperDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DeveloperMetrics | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const { setTaskUpdateListener } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  const loadData = async () => {
    try {
      const [dashData, tasksData] = await Promise.all([
        api.getDashboardMetrics(),
        api.getTasks(searchParams.toString()),
      ]);

      if (dashData?.metrics) setMetrics(dashData.metrics);
      if (tasksData) setTasks(tasksData);
    } catch (err) {
      console.error('Failed to load developer dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchParams.toString()]);

  // Real-time task listener
  useEffect(() => {
    setTaskUpdateListener((updatedTask) => {
      // If task belongs to this developer, update it
      setTasks((prev) => {
        const exists = prev.some((t) => t.id === updatedTask.id);
        if (exists) {
          return prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
        }
        if (updatedTask.assignedDeveloperId === user?.id) {
          return [updatedTask, ...prev];
        }
        return prev;
      });

      api.getDashboardMetrics().then((res) => {
        if (res?.metrics) setMetrics(res.metrics);
      });
    });

    return () => setTaskUpdateListener(null);
  }, [user?.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
          <span>Developer Workspace</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {user?.name}
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Your active sprints and assigned deliverables, strictly sorted by priority then due date.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Assigned */}
        <div
          onClick={() => {
            const p = new URLSearchParams();
            setSearchParams(p);
          }}
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 shadow-xl cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-blue-400 transition-colors">
              Total Assigned
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Code2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white">
              {metrics?.totalAssigned ?? 0}
            </span>
            <span className="text-xs text-slate-500">tickets</span>
          </div>
          <p className="mt-2 text-[10px] text-blue-400 font-medium">Click to show all tasks</p>
        </div>

        {/* In Flight / Pending */}
        <div
          onClick={() => {
            const p = new URLSearchParams(searchParams);
            p.set('status', 'IN_PROGRESS');
            setSearchParams(p);
          }}
          className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-xl cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-cyan-400 transition-colors">
              In Flight / Pending
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-cyan-400">
              {metrics?.pendingCount ?? 0}
            </span>
            <span className="text-xs text-slate-500">active tasks</span>
          </div>
          <p className="mt-2 text-[10px] text-cyan-400 font-medium">Click to filter in-progress</p>
        </div>

        {/* Overdue Deliverables */}
        <div
          onClick={() => {
            const p = new URLSearchParams(searchParams);
            p.set('dueDateRange', 'overdue');
            setSearchParams(p);
          }}
          className="bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-2xl p-5 shadow-xl cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-rose-400 transition-colors">
              Overdue Deliverables
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-rose-400">
              {metrics?.overdueCount ?? 0}
            </span>
            <span className="text-xs text-slate-500">requires attention</span>
          </div>
          <p className="mt-2 text-[10px] text-rose-400 font-medium">Click to filter overdue tasks</p>
        </div>

        {/* Completed */}
        <div
          onClick={() => {
            const p = new URLSearchParams(searchParams);
            p.set('status', 'DONE');
            setSearchParams(p);
          }}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 shadow-xl cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-emerald-400 transition-colors">
              Completed
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-400">
              {metrics?.completedCount ?? 0}
            </span>
            <span className="text-xs text-slate-500">shipped to prod</span>
          </div>
          <p className="mt-2 text-[10px] text-emerald-400 font-medium">Click to filter completed</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Assigned Tasks List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Your Assigned Tasks</h2>
            <span className="text-xs text-slate-400">{tasks.length} Assigned</span>
          </div>

          <TaskFilters />

          {tasks.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
              No assigned tasks match the active filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showProjectBadge
                  onViewDetails={(t) => setSelectedTaskId(t.id)}
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

        {/* Assigned Tasks Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed
            title="Your Task Activity"
            onSelectTask={(id) => setSelectedTaskId(id)}
          />
        </div>
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onStatusUpdated={(updated) => {
          setTasks((prev) =>
            prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
          );
        }}
      />
    </div>
  );
};

