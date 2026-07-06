import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListResearchSessions, useCreateResearchSession, useGetResearchSession, getGetResearchSessionQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, BookOpen, Send, Loader2, Plus, Clock, ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function LegalResearch() {
  const { data: sessions, isLoading: sessionsLoading } = useListResearchSessions();
  const createSession = useCreateResearchSession();
  const qc = useQueryClient();

  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  const { data: activeSession, isLoading: sessionLoading } = useGetResearchSession(activeSessionId || 0, {
    query: { enabled: !!activeSessionId, queryKey: getGetResearchSessionQueryKey(activeSessionId || 0) }
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessions && sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.messages, streamedResponse]);

  const handleNewSession = () => {
    createSession.mutate({ data: { title: "New Research Session" } }, {
      onSuccess: (newSession) => {
        setActiveSessionId(newSession.id);
        setShowSidebar(false);
        qc.invalidateQueries({ queryKey: ["/api/research/sessions"] });
      }
    });
  };

  const selectSession = (id: number) => {
    setActiveSessionId(id);
    setShowSidebar(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeSessionId) return;

    const question = inputValue;
    setInputValue("");
    setIsStreaming(true);
    setStreamedResponse("");

    const oldSession = qc.getQueryData([`/api/research/sessions/${activeSessionId}`]) as any;
    if (oldSession) {
      qc.setQueryData([`/api/research/sessions/${activeSessionId}`], {
        ...oldSession,
        messages: [...oldSession.messages, { id: Date.now(), role: "user", content: question }]
      });
    }

    try {
      const res = await fetch(`/api/research/${activeSessionId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });

      if (!res.ok) throw new Error("Request failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          setStreamedResponse(prev => prev + decoder.decode(value));
        }
      }

      qc.invalidateQueries({ queryKey: [`/api/research/sessions/${activeSessionId}`] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsStreaming(false);
      setStreamedResponse("");
    }
  };

  const SidebarPanel = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-3 border-b bg-slate-50/50 flex items-center gap-2">
        <Button
          onClick={handleNewSession}
          className="flex-1 justify-start text-sm shadow-sm"
          variant="outline"
          disabled={createSession.isPending}
        >
          {createSession.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          New Research Session
        </Button>
        <button
          className="md:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
          onClick={() => setShowSidebar(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="px-2 pt-2 pb-1 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Clock className="h-3 w-3" /> Recent Searches
        </div>
        {sessionsLoading ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : sessions?.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">No research sessions yet</div>
        ) : (
          <div className="space-y-0.5 mt-1">
            {sessions?.map(session => (
              <button
                key={session.id}
                onClick={() => selectSession(session.id)}
                className={`w-full text-left px-3 py-2 text-sm truncate rounded-md transition-colors ${
                  activeSessionId === session.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {session.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AppLayout title="Legal Research">
      <div className="flex h-[calc(100dvh-8rem)] md:h-[calc(100dvh-7rem)] overflow-hidden">

        {/* Mobile overlay */}
        {showSidebar && (
          <div
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Session sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-30 w-72 border-r shadow-lg
            transform transition-transform duration-200 ease-in-out
            md:relative md:inset-auto md:w-64 md:translate-x-0 md:shadow-none md:z-auto md:flex md:flex-col
            ${showSidebar ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <SidebarPanel />
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {/* Toolbar */}
          <div className="h-11 border-b bg-slate-50 flex items-center px-3 gap-2 shrink-0">
            <button
              className="md:hidden flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded-md hover:bg-slate-200 transition-colors"
              onClick={() => setShowSidebar(true)}
            >
              <BookOpen className="h-3.5 w-3.5" />
              {activeSession?.title
                ? <span className="max-w-[140px] truncate">{activeSession.title}</span>
                : "Sessions"}
              <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
            </button>
            <span className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-700">
              <BookOpen className="h-4 w-4 text-primary" />
              {activeSession?.title || "Select a research session"}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 md:p-6 overflow-y-auto space-y-4 md:space-y-6" ref={scrollRef}>
            {sessionLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 text-primary animate-spin opacity-50" />
              </div>
            ) : !activeSession ? (
              <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-4 text-center px-4">
                <BookOpen className="h-10 w-10 opacity-20" />
                <p className="text-sm">Tap <strong>Sessions</strong> above to start or pick a session.</p>
                <Button size="sm" onClick={handleNewSession} disabled={createSession.isPending}>
                  <Plus className="h-4 w-4 mr-1" /> New Research Session
                </Button>
              </div>
            ) : (
              <>
                {(!activeSession.messages || activeSession.messages.length === 0) && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                      <BrainCircuit className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </div>
                    <div className="bg-slate-50 border rounded-lg p-4 text-sm text-slate-800 flex-1 leading-relaxed shadow-sm">
                      <p className="font-medium mb-2">Hello. I am your Legal Research Assistant.</p>
                      <p className="mb-3 text-slate-600 text-xs md:text-sm">I provide cited, factual answers on case law, statutes, and procedural rules.</p>
                      <p className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">Example questions:</p>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 text-xs md:text-sm">
                        <li>Statute of limitations for a written contract in California?</li>
                        <li>Elements of a negligence claim?</li>
                        <li>How do I serve a corporate defendant under FRCP Rule 4?</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeSession.messages?.map((msg, i) => (
                  <div key={i} className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {msg.role !== "user" && (
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                        <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </div>
                    )}
                    <div className={`px-3 py-2.5 md:p-4 rounded-xl text-sm leading-relaxed max-w-[88%] shadow-sm
                      ${msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-slate-50 border text-slate-800 rounded-bl-sm"}`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}

                {isStreaming && streamedResponse && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                      <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
                    </div>
                    <div className="bg-slate-50 border rounded-xl rounded-bl-sm px-3 py-2.5 md:p-4 text-sm text-slate-800 flex-1 leading-relaxed shadow-sm">
                      <div className="whitespace-pre-wrap">{streamedResponse}</div>
                      <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5 align-middle rounded-sm" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-slate-50 shrink-0">
            <form onSubmit={handleSend} className="relative flex items-center max-w-3xl mx-auto">
              <Input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={isStreaming || !activeSessionId}
                className="w-full rounded-full border-slate-300 shadow-sm pr-11 py-5 pl-4 text-sm md:text-base"
                placeholder={activeSessionId ? "Ask a legal research question…" : "Start a session first"}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isStreaming || !inputValue.trim() || !activeSessionId}
                className="absolute right-1.5 rounded-full h-8 w-8 md:h-9 md:w-9"
              >
                <Send className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </form>
            <p className="text-center mt-2 text-xs text-slate-400">
              Always verify citations and rules before relying on them in court.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
