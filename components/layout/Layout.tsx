import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Tractor,
  Milk,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
  Settings,
  User as UserIcon,
  PieChart,
} from "lucide-react";
import { cn } from "../ui";

import logo from "../../assets/cowsville-logo.svg";

export default function Layout() {
  const { logout, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Farms Registry", path: "/farms", icon: Tractor },
    { name: "Livestock", path: "/cows", icon: Milk },
    { name: "Cluster Analytics", path: "/clusters", icon: PieChart },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-900 text-slate-300 shadow-2xl transition-all duration-300 md:relative",
          isSidebarOpen
            ? "w-72 translate-x-0"
            : "-translate-x-full w-0 md:w-20 md:translate-x-0"
        )}
      >
        {/* Logo Area */}
        <div className="flex h-20 items-center px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src={logo}
              alt="Cowsville Logo"
              className="h-10 w-10 shrink-0 rounded-full object-cover shadow-lg shadow-primary-500/20 border border-slate-700"
            />
            <div
              className={cn(
                "flex flex-col transition-opacity duration-300",
                !isSidebarOpen && "md:hidden"
              )}
            >
              <span className="text-lg font-bold text-white tracking-tight">
                Cowsville
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Farm Manager Pro
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto custom-scrollbar">
          <div
            className={cn(
              "px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500",
              !isSidebarOpen && "md:hidden"
            )}
          >
            Menu
          </div>
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "group flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 relative",
                  isActive
                    ? "bg-primary-600 text-white shadow-md shadow-primary-900/20"
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors",
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-white"
                  )}
                />
                <span
                  className={cn(
                    "ml-3 transition-opacity duration-300",
                    !isSidebarOpen && "md:hidden"
                  )}
                >
                  {item.name}
                </span>
                {isActive && isSidebarOpen && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute right-3 h-2 w-2 rounded-full bg-white"
                  />
                )}
              </Link>
            );
          })}

          <div
            className={cn(
              "mt-8 px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500",
              !isSidebarOpen && "md:hidden"
            )}
          >
            System
          </div>
          <button
            className={cn(
              "w-full group flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 hover:bg-slate-800 hover:text-white text-slate-400"
            )}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            <span
              className={cn(
                "ml-3 transition-opacity duration-300",
                !isSidebarOpen && "md:hidden"
              )}
            >
              Settings
            </span>
          </button>
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t border-slate-800 bg-slate-900/50 p-4">
          <div
            className={cn(
              "flex items-center gap-3 mb-4",
              !isSidebarOpen && "md:hidden"
            )}
          >
            <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-white border-2 border-slate-600">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-white">
                {user?.username}
              </p>
              <p className="truncate text-xs text-slate-400">
                {user?.role || "Admin"}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className={cn(
              "group flex w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500",
              !isSidebarOpen && "md:p-2"
            )}
          >
            <LogOut
              className={cn("h-5 w-5 flex-shrink-0", isSidebarOpen && "mr-2")}
            />
            <span
              className={cn(
                "transition-opacity duration-300",
                !isSidebarOpen && "md:hidden"
              )}
            >
              Sign Out
            </span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content Wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 backdrop-blur-md dark:bg-slate-900/80 px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              {isSidebarOpen ? (
                <Menu className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="mx-auto max-w-7xl min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
