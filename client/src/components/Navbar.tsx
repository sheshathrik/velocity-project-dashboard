import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { NotificationDropdown } from './NotificationDropdown.js';
import {
  Layers,
  Users,
  LogOut,
  ChevronDown,
  Activity,
  ShieldAlert,
  Briefcase,
  Code2,
} from 'lucide-react';

const DEMO_USERS = [
  { role: 'ADMIN', name: 'Alex Vance (Admin)', email: 'admin@velozity.com', icon: ShieldAlert },
  { role: 'PROJECT_MANAGER', name: 'Sarah Connor (PM)', email: 'pm.sarah@velozity.com', icon: Briefcase },
  { role: 'PROJECT_MANAGER', name: 'Michael Scott (PM)', email: 'pm.michael@velozity.com', icon: Briefcase },
  { role: 'DEVELOPER', name: 'Ravi Kumar (Dev)', email: 'dev.ravi@velozity.com', icon: Code2 },
  { role: 'DEVELOPER', name: 'Anita Desai (Dev)', email: 'dev.anita@velozity.com', icon: Code2 },
];

export const Navbar: React.FC = () => {
  const { user, logout, switchUser } = useAuth();
  const { isConnected, activeUsersCount } = useSocket();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3 mr-1" /> Admin
          </span>
        );
      case 'PROJECT_MANAGER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center space-x-1">
            <Briefcase className="w-3 h-3 mr-1" /> Project Manager
          </span>
        );
      case 'DEVELOPER':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
            <Code2 className="w-3 h-3 mr-1" /> Developer
          </span>
        );
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Branding & Nav */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors">
                  VELOCITY
                </span>
                <span className="text-[10px] block font-medium uppercase tracking-wider text-slate-400 -mt-1">
                  Agency Dashboard
                </span>
              </div>
            </Link>

            {/* Role Badge */}
            {user && getRoleBadge(user.role)}
          </div>

          {/* Center/Right: Live Indicators & Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* WebSocket Presence Indicator */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span>{isConnected ? 'Live WebSocket' : 'Connecting...'}</span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center text-slate-300 font-medium">
                <Users className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                {activeUsersCount} online
              </span>
            </div>

            {/* Quick Role Switcher for Assessment Evaluators */}
            <div className="relative">
              <button
                onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/50 text-cyan-300 text-xs font-medium transition-colors"
                title="Switch test accounts easily"
              >
                <span>Switch Role</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showSwitchMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-1.5 divide-y divide-slate-800">
                  <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Quick Account Switcher
                  </div>
                  <div className="py-1">
                    {DEMO_USERS.map((demo) => {
                      const Icon = demo.icon;
                      const isCurrent = user?.email === demo.email;
                      return (
                        <button
                          key={demo.email}
                          onClick={async () => {
                            setShowSwitchMenu(false);
                            await switchUser(demo.email);
                          }}
                          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                            isCurrent
                              ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-cyan-400" />
                          <div className="flex-1 truncate">
                            <p>{demo.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{demo.email}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Dropdown */}
            <NotificationDropdown />

            {/* User Profile / Logout */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1.5 pl-2.5 pr-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-xs text-slate-200"
              >
                <span className="font-medium truncate max-w-[100px] sm:max-w-[140px]">
                  {user?.name}
                </span>
                <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-xs">
                  {user?.name?.charAt(0)}
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-1 divide-y divide-slate-800">
                  <div className="px-3 py-2 text-xs">
                    <p className="font-semibold text-slate-200">{user?.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
