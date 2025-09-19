import React from "react";

export default function StatCard({ title, value, icon, color }) {
  return (
    <div className={`flex items-center gap-4 bg-white rounded-xl shadow p-5 min-w-[180px] border-t-4 ${color}`}>
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{title}</div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
      </div>
    </div>
  );
}
