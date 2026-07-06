import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListResearchSessions, useCreateResearchSession, useGetResearchSession, getGetResearchSessionQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, BookOpen, Send, Loader2, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function LegalResearch() {
  const { data: sessions, isLoading: sessionsLoading } = useListResearchSessions();
  const createSession = useCreateResearchSession();
  const qc = useQueryClient();
  
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");

  const { data: activeSession, isLoading: sessionLoading } = useGetResearchSession(activeSessionId || 0, {
    query: { enabled: !!activeSessionId, queryKey: getGetResearchSessionQueryKey(activeSessionId || 0) }
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-select first session if none selected
  useEffect(() => {
    if (sessions && sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.messages, streamedResponse]);

  const handleNewSession = () => {
    createSession.mutate({ data: { title: "New Research Session" } }, {
      onSuccess: (newSession) => {
        setActiveSessionId(newSession.id);
        qc.invalidateQueries({ queryKey: [`/api/research/sessions`] });
      }
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeSessionId) return;

    const question = inputValue;
    setInputValue("");
    setIsStreaming(true);
    setStreamedResponse("");

    // Optimistically update UI to show user's message
    const oldSession = qc.getQueryData([`/api/research/sessions/${activeSessionId}`]) as any;
    if (oldSession) {
      qc.setQueryData([`/api/research/sessions/${activeSessionId}`], {
        ...oldSession,
        messages: [...oldSession.messages, { id: Date.now(), role: 'user', content: question }]
      });
    }

    try {
      const res = await fetch(`/api/research/${activeSessionId}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });

      if (!res.ok) throw new Error("Request failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          setStreamedResponse(prev => prev + chunk);
        }
      }
      
      // Refetch the full session to get the saved messages
      qc.invalidateQueries({ queryKey: [`/api/research/sessions/${activeSessionId}`] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsStreaming(false);
      setStreamedResponse("");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-slate-50">
      <header className="h-14 border-b bg-white flex items-center px-6 shadow-sm z-10 shrink-0">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          AI Legal Research
        </h2>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Session Sidebar */}
        <div className="w-64 bg-white border-r flex flex-col">
          <div className="p-4 border-b bg-slate-50/50">
            <Button onClick={handleNewSession} className="w-full justify-start text-sm shadow-sm" variant="outline" disabled={createSession.isPending}>
              {createSession.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              New Search Session
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="px-2 pt-2 pb-1 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="h-3 w-3" /> Recent Searches
            </div>
            {sessionsLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : sessions?.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No previous sessions</div>
            ) : (
              <div className="space-y-0.5 mt-1">
                {sessions?.map(session => (
                  <div 
                    key={session.id} 
                    onClick={() => setActiveSessionId(session.id)}
                    className={`px-3 py-2 text-sm truncate rounded-md cursor-pointer transition-colors ${activeSessionId === session.id ? 'bg-primary/10 text-primary font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                  >
                    {session.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex-1 p-6 overflow-y-auto space-y-6" ref={scrollRef}>
            {sessionLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 text-primary animate-spin opacity-50" />
              </div>
            ) : !activeSession ? (
              <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-4">
                <BookOpen className="h-12 w-12 opacity-20" />
                <p>Select a session or create a new one to begin researching.</p>
              </div>
            ) : (
              <>
                {/* Intro message for empty sessions */}
                {(!activeSession.messages || activeSession.messages.length === 0) && (
                  <div className="flex items-start gap-4 max-w-4xl mx-auto">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                      <BrainCircuit className="h-4 w-4" />
                    </div>
                    <div className="bg-slate-50 border rounded-lg p-5 text-sm text-slate-800 flex-1 leading-relaxed shadow-sm">
                      <p className="font-medium text-base mb-2">Hello. I am your Legal Research Assistant.</p>
                      <p className="mb-4 text-slate-600">I can search legal databases and provide cited, factual answers regarding case law, statutes, and procedural rules.</p>
                      <p className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">Example questions:</p>
                      <ul className="list-disc list-inside space-y-1.5 text-slate-700">
                        <li>What is the statute of limitations for a written contract in California?</li>
                        <li>What are the elements of a negligence claim?</li>
                        <li>How do I serve a corporate defendant under FRCP Rule 4?</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Message History */}
                {activeSession.messages?.map((msg, i) => (
                  <div key={i} className={`flex items-start gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role !== 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                        <BookOpen className="h-4 w-4" />
                      </div>
                    )}
                    <div className={`p-4 rounded-lg text-sm leading-relaxed max-w-[85%] shadow-sm
                      ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-slate-50 border text-slate-800'}`}>
                      {/* Very basic markdown formatting for citations/bolding could be applied here */}
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}

                {/* Streaming Response */}
                {isStreaming && streamedResponse && (
                  <div className="flex items-start gap-4 max-w-4xl mx-auto">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="bg-slate-50 border rounded-lg p-4 text-sm text-slate-800 flex-1 leading-relaxed shadow-sm">
                      <div className="whitespace-pre-wrap">{streamedResponse}</div>
                      <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-slate-50">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center">
              <Input 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={isStreaming || !activeSessionId}
                className="w-full rounded-full border-slate-300 shadow-sm pr-12 py-6 pl-6 text-base"
                placeholder="Ask a legal research question..."
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={isStreaming || !inputValue.trim() || !activeSessionId} 
                className="absolute right-2 rounded-full h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <div className="text-center mt-2 text-xs text-slate-400">
              AI can make mistakes. Always verify citations and rules before relying on them in court.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
