import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Image as ImageIcon, 
  Search, 
  Sparkles, 
  User, 
  Bot, 
  Loader2, 
  Trash2,
  Plus,
  ArrowRight
} from "lucide-react";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { 
  generateChatResponse, 
  generateImage, 
  searchGrounding, 
  Message 
} from "@/src/services/gemini";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"chat" | "image" | "search">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      type: "text",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (mode === "image") {
        const imageUrl = await generateImage(input);
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "model",
          content: `Generated image for: "${input}"`,
          type: "image",
          imageUrl: imageUrl || undefined,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else if (mode === "search") {
        const result = await searchGrounding(input);
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "model",
          content: result.text + (result.sources.length > 0 ? "\n\n**Sources:**\n" + result.sources.map(s => `- [${s}](${s})`).join("\n") : ""),
          type: "text",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        const response = await generateChatResponse(input, []);
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "model",
          content: response || "I'm sorry, I couldn't generate a response.",
          type: "text",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: "An error occurred while processing your request.",
        type: "text",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Lumina AI</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={clearChat}
            className="p-2 text-slate-500 hover:text-red-600 transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-8 space-y-6 max-w-4xl mx-auto w-full"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">How can I help you today?</h2>
                <p className="text-slate-500 mt-2">Choose a mode and start a conversation.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl px-4">
                <button 
                  onClick={() => setMode("chat")}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all hover:shadow-md",
                    mode === "chat" ? "border-indigo-600 bg-indigo-50" : "border-slate-200 bg-white"
                  )}
                >
                  <Bot className="w-6 h-6 text-indigo-600 mb-2" />
                  <h3 className="font-semibold">General Chat</h3>
                  <p className="text-xs text-slate-500 mt-1">Ask anything, brainstorm ideas, or just talk.</p>
                </button>
                <button 
                  onClick={() => setMode("image")}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all hover:shadow-md",
                    mode === "image" ? "border-indigo-600 bg-indigo-50" : "border-slate-200 bg-white"
                  )}
                >
                  <ImageIcon className="w-6 h-6 text-indigo-600 mb-2" />
                  <h3 className="font-semibold">Image Gen</h3>
                  <p className="text-xs text-slate-500 mt-1">Describe an image and I'll create it for you.</p>
                </button>
                <button 
                  onClick={() => setMode("search")}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all hover:shadow-md",
                    mode === "search" ? "border-indigo-600 bg-indigo-50" : "border-slate-200 bg-white"
                  )}
                >
                  <Search className="w-6 h-6 text-indigo-600 mb-2" />
                  <h3 className="font-semibold">Search Mode</h3>
                  <p className="text-xs text-slate-500 mt-1">Get real-time info from the web with sources.</p>
                </button>
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-4 max-w-[85%]",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    msg.role === "user" ? "bg-indigo-600" : "bg-white border border-slate-200 shadow-sm"
                  )}>
                    {msg.role === "user" ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl shadow-sm",
                    msg.role === "user" 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                  )}>
                    {msg.type === "image" && msg.imageUrl ? (
                      <div className="space-y-3">
                        <img 
                          src={msg.imageUrl} 
                          alt="Generated" 
                          className="rounded-lg max-w-full h-auto shadow-md"
                          referrerPolicy="no-referrer"
                        />
                        <p className="text-sm italic opacity-80">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="markdown-body">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {isLoading && (
            <div className="flex gap-4 mr-auto max-w-[85%]">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                <Bot className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span className="text-sm text-slate-500">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Mode Selector (Inline) */}
            <div className="flex items-center gap-2 px-1">
              <button 
                onClick={() => setMode("chat")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full transition-all",
                  mode === "chat" ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100"
                )}
              >
                Chat
              </button>
              <button 
                onClick={() => setMode("image")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full transition-all",
                  mode === "image" ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100"
                )}
              >
                Image
              </button>
              <button 
                onClick={() => setMode("search")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full transition-all",
                  mode === "search" ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100"
                )}
              >
                Search
              </button>
            </div>

            <div className="relative flex items-end gap-2">
              <div className="relative flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    mode === "chat" ? "Ask Lumina anything..." :
                    mode === "image" ? "Describe an image to generate..." :
                    "Search for real-time information..."
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none max-h-32 min-h-[52px]"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-center text-slate-400">
              Lumina can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
