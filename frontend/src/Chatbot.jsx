
import React, { useState } from 'react';

// Animated bot SVG
const BotIcon = () => (
  <svg className="w-6 h-6 animate-bounce mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="10" stroke="purple" strokeWidth="2" fill="#ede9fe" />
    <circle cx="9" cy="11" r="1.5" fill="#a78bfa" />
    <circle cx="15" cy="11" r="1.5" fill="#a78bfa" />
    <rect x="9" y="15" width="6" height="1.5" rx="0.75" fill="#a78bfa" />
  </svg>
);


const SUGGESTIONS = [
  "Recommend me a movie",
  "Show top rated movies",
  "Show unwatched movies",
  "Show watched movies",
  "Recommend an action movie",
  "Recommend a comedy movie",
  "Recommend a drama movie",
  "Recommend a sci-fi movie",
  "Recommend a horror movie",
  "Recommend a family movie"
];

const Chatbot = ({ onSend, messages }) => {
  const [input, setInput] = useState('');

  const handleSend = (msg) => {
    const text = typeof msg === 'string' ? msg : input;
    if (text.trim()) {
      onSend(text);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-gradient-to-br from-purple-50 to-blue-100 rounded-2xl shadow-2xl flex flex-col border border-purple-200 backdrop-blur-md">
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-t-2xl">
        <BotIcon />
        <span className="text-white font-bold tracking-wide text-lg">MovieBot</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 max-h-72 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`my-1 px-3 py-2 rounded-xl text-sm max-w-[90%] break-words shadow-sm ${
              msg.sender === 'user'
                ? 'bg-blue-100 text-right ml-8 self-end border border-blue-200'
                : 'bg-purple-100 text-left mr-8 self-start border border-purple-200'
            }`}
            style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}
          >
            {msg.text.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        ))}
      </div>
      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 px-3 pb-2">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSend(s)}
            className="bg-gradient-to-r from-purple-200 to-blue-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold shadow hover:bg-purple-300 hover:scale-105 transition border border-purple-300"
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex items-center border-t px-2 py-2 gap-2 bg-white rounded-b-2xl">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask for a movie recommendation..."
          className="flex-1 border rounded px-3 py-2 focus:ring-2 focus:ring-purple-400 bg-purple-50"
        />
        <button onClick={() => handleSend()} className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded shadow hover:scale-105 transition">Send</button>
      </div>
    </div>
  );
};

export default Chatbot;
