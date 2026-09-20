import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Clock, AlertTriangle, UserCheck } from 'lucide-react';
import { useSocket } from '../context/SocketContext.js';
import { formatDistanceToNow } from 'date-fns';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useSocket();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'TASK_IN_REVIEW':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'TASK_OVERDUE':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'TASK_ASSIGNED':
      default:
        return <UserCheck className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadNotificationCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-rose-500 rounded-full shadow-lg animate-pulse">
            {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-[-48px] sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-800/60">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-slate-100">Notifications</span>
              {unreadNotificationCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-medium">
                  {unreadNotificationCount} unread
                </span>
              )}
            </div>
            {unreadNotificationCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-medium hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                <Bell className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.isRead && markNotificationAsRead(notif.id)}
                  className={`p-3.5 text-left transition-colors flex items-start space-x-3 cursor-pointer ${
                    notif.isRead ? 'bg-slate-900/40 hover:bg-slate-800/40 text-slate-400' : 'bg-slate-800/40 hover:bg-slate-800 text-slate-100'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0 p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-semibold ${notif.isRead ? 'text-slate-300' : 'text-slate-100'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markNotificationAsRead(notif.id);
                      }}
                      title="Mark as read"
                      className="text-slate-500 hover:text-cyan-400 p-1 rounded transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

