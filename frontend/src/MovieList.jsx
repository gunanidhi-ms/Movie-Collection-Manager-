import axios from "axios";
import { useState, useEffect } from "react";

export default function MovieList() {
  const [movies, setMovies] = useState([]);
  const [form, setForm] = useState({ title: "", desc: "", genre: "", rating: 0, watched: false });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [sort, setSort] = useState("-rating");

  const baseUrl = import.meta.env.VITE_BASE_URL;

  const fetchMovies = async (params = {}) => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(baseUrl, { params });
      setMovies(response.data || []);
    } catch (error) {
      setError("Could not fetch movies. Backend may be down.");
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await axios.put(`${baseUrl}/${editingId}`, form);
      } else {
        await axios.post(baseUrl, form);
      }
      setForm({ title: "", desc: "", genre: "", rating: 0, watched: false });
      setEditingId(null);
      setShowModal(false);
      fetchMovies();
    } catch (error) {
      setError("Could not save movie. Backend may be down.");
    }
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      await axios.delete(`${baseUrl}/${id}`);
      fetchMovies();
    } catch (error) {
      setError("Could not delete movie. Backend may be down.");
    }
  };

  const handleEdit = (movie) => {
    setForm({
      title: movie.title,
      desc: movie.desc,
      genre: movie.genre || "",
      rating: movie.rating || 0,
      watched: movie.watched || false
    });
    setEditingId(movie._id);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setForm({ title: "", desc: "", genre: "", rating: 0, watched: false });
    setEditingId(null);
    setShowModal(true);
  };

  useEffect(() => {
    fetchMovies({
      search: search || undefined,
      genre: genreFilter || undefined,
      sort: sort || undefined
    });
    // eslint-disable-next-line
  }, [search, genreFilter, sort]);

  return (
    <section className="px-2 md:px-16 pt-12 bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen w-full">
      <div className="w-full flex flex-col items-center mb-12">
        <h1 className="text-6xl font-extrabold text-center mb-4 text-purple-700 drop-shadow-lg tracking-tight">🍿 Movie Collection Manager</h1>
      </div>

      {/* Floating Add Button */}
      <button
        className="fixed bottom-10 right-10 z-40 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow-2xl w-16 h-16 flex items-center justify-center text-3xl hover:scale-110 transition border-4 border-white/80"
        style={{ boxShadow: '0 8px 32px 0 rgba(80, 0, 200, 0.18)' }}
        onClick={handleAddNew}
        aria-label="Add Movie"
      >
        <span className="drop-shadow-lg">+</span>
      </button>

      {/* Search, Filter, Sort Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-8">
        <input
          type="text"
          placeholder="Search by title, genre, or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full md:w-72 border rounded p-2 focus:ring-2 focus:ring-purple-400"
        />
        <select
          value={genreFilter}
          onChange={e => setGenreFilter(e.target.value)}
          className="w-full md:w-48 border rounded p-2 focus:ring-2 focus:ring-purple-400"
        >
          <option value="">All Genres</option>
          <option value="action">Action</option>
          <option value="comedy">Comedy</option>
          <option value="drama">Drama</option>
          <option value="thriller">Thriller</option>
          <option value="romance">Romance</option>
          <option value="sci-fi">Sci-Fi</option>
          <option value="horror">Horror</option>
          <option value="animation">Animation</option>
          <option value="adventure">Adventure</option>
          <option value="fantasy">Fantasy</option>
          <option value="crime">Crime</option>
          <option value="mystery">Mystery</option>
          <option value="family">Family</option>
        </select>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="w-full md:w-48 border rounded p-2 focus:ring-2 focus:ring-purple-400"
        >
          <option value="-rating">Sort: Top Rated</option>
          <option value="title">Sort: Title (A-Z)</option>
          <option value="-title">Sort: Title (Z-A)</option>
          <option value="watched">Sort: Watched First</option>
          <option value="-watched">Sort: Unwatched First</option>
        </select>
      </div>

      {/* Modal for Add/Edit Movie */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border-2 border-purple-200 rounded-3xl shadow-2xl w-full max-w-2xl mx-4 scale-100 animate-modalPop relative">
            <button className="absolute top-4 right-6 text-gray-400 hover:text-purple-700 text-4xl font-bold" onClick={() => setShowModal(false)} aria-label="Close">&times;</button>
            <div className="flex justify-between items-center border-b px-10 py-6">
              <h2 className="text-3xl font-bold text-purple-700 tracking-tight">{editingId ? "Edit Movie" : "Add Movie"}</h2>
            </div>
            <form onSubmit={handleCreateOrUpdate} className="px-10 py-8 space-y-6">
              <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border rounded-lg p-4 text-lg focus:ring-2 focus:ring-purple-400" required />
              <input type="text" placeholder="Description" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} className="w-full border rounded-lg p-4 text-lg focus:ring-2 focus:ring-purple-400" required />
              <input type="text" placeholder="Genre" value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })} className="w-full border rounded-lg p-4 text-lg focus:ring-2 focus:ring-purple-400" />
              <input type="number" min="1" max="5" placeholder="Rating (1-5)" value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} className="w-full border rounded-lg p-4 text-lg focus:ring-2 focus:ring-purple-400" />
              <label className="flex items-center gap-3 text-lg">
                <input type="checkbox" checked={form.watched} onChange={e => setForm({ ...form, watched: e.target.checked })} className="accent-purple-500 w-5 h-5" />
                <span className="text-gray-700">Watched</span>
              </label>
              {error && <div className="bg-red-100 text-red-700 rounded p-3 text-lg">{error}</div>}
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-lg" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold shadow hover:scale-105 transition text-lg">{editingId ? "Update" : "Add"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-2">
        {loading ? (
          <div className="text-center p-4 text-gray-500">Loading movies...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie, index) => (
              <div className="bg-white rounded-xl shadow-lg p-5 flex flex-col justify-between hover:shadow-2xl transition" key={movie._id}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-purple-700">{movie.title}</span>
                    {movie.watched ? (
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">Watched</span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-semibold">Unwatched</span>
                    )}
                  </div>
                  {movie.genre && <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold mb-2">{movie.genre}</span>}
                  <p className="text-gray-700 mb-2">{movie.desc}</p>
                  <div className="mb-2">
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-semibold">Rating: {movie.rating}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleEdit(movie)} className="flex-1 px-3 py-1 rounded bg-purple-500 text-white hover:bg-purple-600 transition">Edit</button>
                  <button onClick={() => handleDelete(movie._id)} className="flex-1 px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition">Delete</button>
                </div>
              </div>
            ))}
            {movies.length === 0 && !loading && (
              <div className="col-span-full">
                <div className="bg-blue-100 text-blue-700 rounded p-4 text-center">No movies available.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
