



import MovieList from "./MovieList";
import Chatbot from "./Chatbot";
import ConnectionStatus from "./ConnectionStatus";
import StatCards from "./StatCards";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useState } from "react";


export default function App() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! Ask me for a movie recommendation." }
  ]);
  const [showChatbot, setShowChatbot] = useState(false);

  const handleSend = async (input) => {
    setMessages((msgs) => [
      ...msgs,
      { sender: "user", text: input },
      { sender: "bot", text: "Thinking..." }
    ]);

    try {
      const res = await fetch("http://localhost:6969/movies/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setMessages((msgs) => {
        // Remove the last "Thinking..." message
        const filtered = msgs.filter((m, i) => i !== msgs.length - 1);
        let botText = data.reply;
        if (data.movies && data.movies.length > 0) {
          botText += "\n" + data.movies.map(m => `• ${m.title}: ${m.desc}`).join("\n");
        }
        return [
          ...filtered,
          { sender: "bot", text: botText }
        ];
      });
    } catch (e) {
      setMessages((msgs) => {
        const filtered = msgs.filter((m, i) => i !== msgs.length - 1);
        return [
          ...filtered,
          { sender: "bot", text: "Sorry, there was an error getting recommendations." }
        ];
      });
    }
  };

  return (
  <div className="flex w-screen h-screen min-h-0 min-w-0 bg-gradient-to-br from-blue-50 to-purple-100 relative overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <Topbar />
        <main className="flex-1 min-h-0 min-w-0 p-6 md:p-8 overflow-y-auto">
          <div className="mb-8 flex justify-center">
            <StatCards />
          </div>
          <MovieList />
        </main>
        {/* Floating Chatbot Icon Button */}
        <button
          className="fixed bottom-8 left-8 z-50 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow-2xl w-16 h-16 flex items-center justify-center text-3xl hover:scale-110 transition border-4 border-white/80"
          style={{ boxShadow: '0 8px 32px 0 rgba(80, 0, 200, 0.18)' }}
          onClick={() => setShowChatbot(true)}
          aria-label="Open Chatbot"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="#a78bfa" />
            <rect x="8" y="16" width="8" height="2" rx="1" fill="#fff" />
            <circle cx="9" cy="11" r="1.5" fill="#fff" />
            <circle cx="15" cy="11" r="1.5" fill="#fff" />
          </svg>
        </button>
        {/* Chatbot Modal Overlay */}
        {showChatbot && (
          <div className="fixed inset-0 z-50 flex items-start justify-start bg-black/40 backdrop-blur-sm animate-fadeIn">
            <div className="relative mt-20 ml-16">
              <button
                className="absolute -top-6 -right-6 bg-white text-purple-700 rounded-full shadow p-2 text-2xl hover:bg-purple-100 border border-purple-200"
                onClick={() => setShowChatbot(false)}
                aria-label="Close Chatbot"
              >
                &times;
              </button>
              <Chatbot onSend={handleSend} messages={messages} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
