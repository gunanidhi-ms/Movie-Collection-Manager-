import React from "react";

export default function Sidebar() {
  return (
    <aside className="h-screen w-56 bg-gradient-to-b from-purple-700 to-blue-700 text-white flex flex-col shadow-xl">
      <div className="px-6 py-6 text-2xl font-bold tracking-wide flex items-center gap-2">
        <span className="bg-white/20 rounded-full p-2">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="#a78bfa" />
            <rect x="8" y="16" width="8" height="2" rx="1" fill="#fff" />
          </svg>
        </span>
        MovieDash
      </div>
      <nav className="flex-1 px-4 py-2 space-y-2">
        <a href="#" className="block px-4 py-2 rounded-lg hover:bg-white/10 transition font-medium">Dashboard</a>
        <a href="#" className="block px-4 py-2 rounded-lg hover:bg-white/10 transition font-medium">Movies</a>
        <a href="#" className="block px-4 py-2 rounded-lg hover:bg-white/10 transition font-medium">Analytics</a>
        <a href="#" className="block px-4 py-2 rounded-lg hover:bg-white/10 transition font-medium">Chatbot</a>
      </nav>
      <div className="px-6 py-4 text-xs text-white/70">© 2025 MovieDash</div>
    </aside>
  );
}
