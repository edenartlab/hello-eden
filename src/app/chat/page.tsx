"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Session, SessionMessage, Agent } from "@/lib/eden";

export default function ChatPage() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedMessageIdRef = useRef<string | null>(null);
  const expectingNewMessageRef = useRef<boolean>(false);

  useEffect(() => {
    fetchAgent();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const fetchAgent = async () => {
    const agentId = process.env.NEXT_PUBLIC_EDEN_AGENT_ID;
    if (!agentId) {
      console.error("NEXT_PUBLIC_EDEN_AGENT_ID not configured");
      return;
    }

    try {
      const response = await axios.get(`/api/agents/${agentId}`);
      setAgent(response.data.agent);
    } catch (error) {
      console.error("Failed to fetch agent:", error);
    }
  };

  const pollSession = useCallback(async (sessionId: string) => {
    try {
      const response = await axios.get(`/api/sessions/${sessionId}`);
      const sessionData = response.data.session;
      
      setSession(sessionData);
      setMessages(sessionData.messages || []);
      
      // Check if the latest assistant message has finished
      const messages = sessionData.messages || [];
      const latestAssistantMessage = [...messages]
        .reverse()
        .find((msg: SessionMessage) => msg.role === 'assistant');
      
      // Check if this is a new message we haven't processed yet
      const isNewMessage = latestAssistantMessage && 
        latestAssistantMessage._id !== lastProcessedMessageIdRef.current;
      
      // Debug logging
      if (latestAssistantMessage) {
        console.log("Latest assistant message:", {
          id: latestAssistantMessage._id,
          isNew: isNewMessage,
          lastProcessedId: lastProcessedMessageIdRef.current,
          expectingNew: expectingNewMessageRef.current,
          finishReason: latestAssistantMessage.finish_reason,
          hasContent: !!latestAssistantMessage.content
        });
      }
      
      // Only stop polling if we have a NEW assistant message with finish_reason = 'stop'
      // or if we're not expecting a new message and session is idle
      const finishReason = latestAssistantMessage?.finish_reason || 
                           (latestAssistantMessage as any)?.finishReason;
      
      if (expectingNewMessageRef.current) {
        // We're expecting a new message after sending one
        const isMessageComplete = isNewMessage && (
          (finishReason === 'stop' && latestAssistantMessage.content) ||
          (finishReason === 'tool_calls' && latestAssistantMessage.tool_calls?.every(tc => tc.status === 'completed'))
        );
        
        if (isMessageComplete) {
          console.log("Stopping polling - new agent response complete");
          lastProcessedMessageIdRef.current = latestAssistantMessage._id;
          expectingNewMessageRef.current = false;
          setIsPolling(false);
          setIsLoading(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (isNewMessage && (latestAssistantMessage.content || latestAssistantMessage.tool_calls) && 
                   sessionData.status !== 'processing' && 
                   (!sessionData.active_requests || sessionData.active_requests.length === 0)) {
          // New message with content but no finish_reason, and session is idle
          console.log("Stopping polling - session no longer processing");
          lastProcessedMessageIdRef.current = latestAssistantMessage._id;
          expectingNewMessageRef.current = false;
          setIsPolling(false);
          setIsLoading(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else {
          console.log("Continuing to poll - waiting for new agent response");
        }
      } else {
        // Not expecting a new message - shouldn't be polling
        console.log("Not expecting new message - stopping poll");
        setIsPolling(false);
        setIsLoading(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } catch (error) {
      console.error("Failed to poll session:", error);
      setIsPolling(false);
      setIsLoading(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, []);

  const startPolling = useCallback((sessionId: string) => {
    console.log("Starting polling for session:", sessionId);
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Mark that we're expecting a new message
    expectingNewMessageRef.current = true;
    
    setIsPolling(true);
    setIsLoading(true);
    
    // Poll immediately
    pollSession(sessionId);
    
    // Then poll every 500ms for faster updates
    pollingIntervalRef.current = setInterval(() => {
      pollSession(sessionId);
    }, 500);
  }, [pollSession]);


  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const messageText = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      // If no session exists, create one with the first message
      if (!sessionId) {
        const agentId = process.env.NEXT_PUBLIC_EDEN_AGENT_ID;
        if (!agentId) {
          console.error("NEXT_PUBLIC_EDEN_AGENT_ID not configured");
          setIsLoading(false);
          return;
        }

        const response = await axios.post("/api/sessions", {
          agent_ids: [agentId],
          content: messageText,
          title: "Chat Session"
        });
        
        const newSessionId = response.data.session_id;
        setSessionId(newSessionId);
        setMessages([]);
        setSession(null);
        
        // Start polling for updates
        startPolling(newSessionId);
      } else {
        // Send message to existing session
        const agentId = process.env.NEXT_PUBLIC_EDEN_AGENT_ID;
        const response = await axios.post("/api/sessions", {
          session_id: sessionId,
          content: messageText,
          agent_ids: [agentId]
        });
        
        // Start polling for updates immediately after sending
        startPolling(sessionId);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    // Clear session and messages
    setSessionId("");
    setSession(null);
    setMessages([]);
    setInputMessage("");
    
    // Reset tracking refs
    lastProcessedMessageIdRef.current = null;
    expectingNewMessageRef.current = false;
    
    // Stop any ongoing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    setIsLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Agent Header */}
      {agent && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {(agent.userImage || agent.image) && (
                <img 
                  src={agent.userImage || agent.image} 
                  alt={agent.name} 
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold">{agent.name}</h1>
                {agent.description && (
                  <p className="text-gray-400 text-sm mt-1">{agent.description}</p>
                )}
              </div>
            </div>
            {sessionId && (
              <button
                onClick={startNewChat}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm"
              >
                New Chat
              </button>
            )}
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div className="bg-gray-800 rounded-lg h-[600px] flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 mt-8">
                  {agent?.greeting || `Start a conversation with ${agent?.name || 'the agent'}`}
                </div>
              )}
              
              {messages
                .filter((message) => message.role === 'user' || message.role === 'assistant')
                .map((message) => (
                  <div
                    key={message._id}
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
                      {message.content && <p className="text-sm">{message.content}</p>}
                      
                      {/* Display tool call outputs */}
                      {message.tool_calls && message.tool_calls.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.tool_calls.map((toolCall, toolIndex) => (
                            <div key={toolCall.id || toolIndex} className="border border-gray-600 rounded p-2">
                              {toolCall.status === 'completed' && toolCall.result && (
                                <div className="space-y-2">
                                  {toolCall.result.map((result, resultIndex) => (
                                    <div key={resultIndex}>
                                      {/* Display subtool outputs */}
                                      {result.subtool_calls?.map((subtool, subtoolIndex) => (
                                        <div key={subtoolIndex}>
                                          {subtool.output && (
                                            <div className="mt-2">
                                              {/* Check if output is an image URL */}
                                              {subtool.output.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
                                                <img 
                                                  src={subtool.output} 
                                                  alt={`Generated ${subtool.tool}`}
                                                  className="max-w-full h-auto rounded border border-gray-500"
                                                />
                                              ) : (
                                                <p className="text-xs text-gray-300">{subtool.output}</p>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                      
                                      {/* Display direct output if available */}
                                      {result.output?.map((output, outputIndex) => (
                                        <div key={outputIndex}>
                                          {output.filename && (
                                            <div className="mt-2">
                                              <img 
                                                src={`https://dtut5r9j4w7j4.cloudfront.net/${output.filename}`}
                                                alt="Generated content"
                                                className="max-w-full h-auto rounded border border-gray-500"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {toolCall.status !== 'completed' && (
                                <div className="text-xs text-gray-400">
                                  Tool: {toolCall.tool} - Status: {toolCall.status || 'processing'}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {(message.thinking || message.thought) && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-400 cursor-pointer">
                            Show thinking
                          </summary>
                          <p className="text-xs text-gray-300 mt-1 whitespace-pre-wrap">
                            {message.thinking || message.thought}
                          </p>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <span className="text-xs text-gray-400 ml-2">
                        Agent is typing...
                      </span>
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
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 p-2 bg-gray-700 rounded-md text-white disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </form>
      </div>
    </div>
  );
}