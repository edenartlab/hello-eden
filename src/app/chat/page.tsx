"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface Agent {
  id: string;
  name: string;
  description?: string;
}

export default function ChatPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchAgents = async () => {
    try {
      const response = await axios.get("/api/agents");
      setAgents(response.data.agents);
      if (response.data.agents.length > 0) {
        setSelectedAgent(response.data.agents[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    }
  };

  const startNewSession = async () => {
    if (!selectedAgent) return;
    
    try {
      const response = await axios.post("/api/chat", {
        agentId: selectedAgent,
      });
      setSessionId(response.data.session.id);
      setMessages([]);
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !sessionId) return;

    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      content: inputMessage,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post("/api/chat", {
        sessionId,
        message: inputMessage,
      });
      
      const assistantMessage = response.data.message;
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold text-center mb-8">Chat with AI Agents</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Agent Selection Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Select Agent</h2>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded mb-4"
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            
            {selectedAgent && (
              <div className="mb-4">
                <p className="text-sm text-gray-400">
                  {agents.find(a => a.id === selectedAgent)?.description}
                </p>
              </div>
            )}
            
            <button
              onClick={startNewSession}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Start New Chat
            </button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <div className="bg-gray-800 rounded-lg h-[600px] flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && sessionId && (
                <div className="text-center text-gray-400 mt-8">
                  Start a conversation with the agent
                </div>
              )}
              {messages.length === 0 && !sessionId && (
                <div className="text-center text-gray-400 mt-8">
                  Select an agent and start a new chat session
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-100"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="border-t border-gray-700 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={sessionId ? "Type your message..." : "Start a new chat session first"}
                  disabled={!sessionId || isLoading}
                  className="flex-1 p-2 bg-gray-700 rounded-md text-white disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!sessionId || isLoading || !inputMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}