import { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = import.meta.env.VITE_BASE_URL;

export default function MovieStats() {
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
    <div className="p-2 flex gap-6 items-center justify-center bg-white rounded shadow mb-4">
      <span className="text-gray-700">Total: <b className="text-blue-700">{stats.total}</b></span>
      <span className="text-gray-700">Watched: <b className="text-green-700">{stats.watched}</b></span>
      <span className="text-gray-700">Unwatched: <b className="text-yellow-700">{stats.unwatched}</b></span>
    </div>
  );
}
