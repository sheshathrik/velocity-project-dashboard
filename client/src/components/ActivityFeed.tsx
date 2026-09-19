import React from 'react';
import { useSocket } from '../context/SocketContext.js';
import { useAuth } from '../context/AuthContext.js';
import { formatDistanceToNow } from 'date-fns';
import { Activity, ArrowRight, UserCheck, AlertTriangle, PlusCircle } from 'lucide-react';
import { TaskActivityLog } from '../types/index.js';

interface ActivityFeedProps {
  title?: string;
  projectId?: string;
  maxHeight?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  title = 'Live Activity Feed',
  projectId,
  maxHeight = 'max-h-[500px]',
}) => {
  const { activities, isConnected } = useSocket();
  const { user } = useAuth();

  // Filter activities if project-specific
  const filteredActivities = projectId
    ? activities.filter((a) => a.projectId === projectId)
    : activities;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'STATUS_CHANGE':
        return <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />;
      case 'TASK_ASSIGNED':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'TASK_OVERDUE':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'TASK_CREATED':
      default:
        return <PlusCircle className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const formatActivityMessage = (log: TaskActivityLog) => {
    const timeAgo = formatDistanceToNow(new Date(log.createdAt), { addSuffix: true });
    // e.g. "Ravi moved Task #12 from In Progress → In Review · 2 mins ago"
    return (
      <div className="text-xs">
        <span className="text-slate-200 font-medium">{log.message}</span>
        <span className="text-slate-500 ml-1.5 font-normal">· {timeAgo}</span>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
            <p className="text-[11px] text-slate-400">
              {user?.role === 'ADMIN'
                ? 'Global real-time stream across all projects'
                : user?.role === 'PROJECT_MANAGER'
                ? 'Stream from your managed client projects'
                : 'Stream on your assigned tasks'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span>{isConnected ? 'Real-Time' : 'Syncing'}</span>
        </div>
      </div>

      <div className={`mt-4 overflow-y-auto space-y-3.5 pr-1 ${maxHeight}`}>
        {filteredActivities.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <Activity className="w-6 h-6 mx-auto mb-2 opacity-40 text-slate-400" />
            No activity events recorded yet
          </div>
        ) : (
          filteredActivities.map((log) => (
            <div
              key={log.id}
              className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700/80 transition-colors"
            >
              <div className="mt-0.5 p-1 rounded-md bg-slate-800 border border-slate-700/60 flex-shrink-0">
                {getActivityIcon(log.type)}
              </div>
              <div className="flex-1 min-w-0">
                {formatActivityMessage(log)}
                {log.project && !projectId && (
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-medium">
                    {log.project.name}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
