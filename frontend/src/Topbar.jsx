import React from "react";

export default function Topbar() {
  return (
    <header className="w-full h-16 bg-white shadow flex items-center px-8 justify-between sticky top-0 z-40">
      <div className="text-xl font-bold text-purple-700 tracking-wide">Analytics Dashboard</div>
      <div className="flex items-center gap-4">
        <span className="text-gray-500 text-sm">Welcome, User</span>
        <img src="https://api.dicebear.com/7.x/identicon/svg?seed=movie" alt="avatar" className="w-8 h-8 rounded-full border border-purple-200" />
      </div>
    </header>
  );
}
