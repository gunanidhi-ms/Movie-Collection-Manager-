import React, { useEffect, useState } from "react";
import StatCard from "./StatCard";
import axios from "axios";

const baseUrl = import.meta.env.VITE_BASE_URL;

export default function StatCards() {
  const [stats, setStats] = useState({ total: 0, watched: 0, unwatched: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${baseUrl}/stats`);
        setStats(res.data);
      } catch {
        setError("Could not fetch stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-2 text-gray-500">Loading stats...</div>;
  if (error) return <div className="p-2 text-red-600">{error}</div>;
  return (
    <div className="flex gap-6 flex-wrap">
      <StatCard title="Total Movies" value={stats.total} color="border-blue-400" icon={<span>🎬</span>} />
      <StatCard title="Watched" value={stats.watched} color="border-green-400" icon={<span>✅</span>} />
      <StatCard title="Unwatched" value={stats.unwatched} color="border-yellow-400" icon={<span>🕒</span>} />
    </div>
  );
}
