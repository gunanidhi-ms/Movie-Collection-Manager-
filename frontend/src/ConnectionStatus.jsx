import { useEffect, useState } from "react";

export default function ConnectionStatus() {
  const [status, setStatus] = useState({ backend: false, database: false, loading: true });

  useEffect(() => {
    const check = async () => {
      try {
  const res = await fetch("http://localhost:5000/health");
        const data = await res.json();
        setStatus({ ...data, loading: false });
      } catch {
        setStatus({ backend: false, database: false, loading: false });
      }
    };
    check();
  }, []);

  if (status.loading) return <div className="p-2 text-gray-500">Checking connection...</div>;
  return (
    <div className="p-2 flex gap-6 items-center justify-center bg-white rounded shadow mb-2">
      <div>
        <span className="font-bold text-gray-700">Backend:</span> {status.backend ? <span className="text-green-600 font-semibold">Connected</span> : <span className="text-red-600 font-semibold">Not Connected</span>}
      </div>
      <div>
        <span className="font-bold text-gray-700">Database:</span> {status.database ? <span className="text-green-600 font-semibold">Connected</span> : <span className="text-red-600 font-semibold">Not Connected</span>}
      </div>
    </div>
  );
}
