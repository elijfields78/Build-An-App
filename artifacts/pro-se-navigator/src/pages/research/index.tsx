import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListResearchSessions, useCreateResearchSession, useGetResearchSession, getGetResearchSessionQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { BrainCircuit, BookOpen, Send, Loader2, Plus, Clock, ChevronLeft, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { useBillingStatus } from "@/hooks/useBillingStatus";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { MicButton } from "@/components/ui/mic-button";

export default function LegalResearch() {
  const { getToken } = useAuth();
  const { data: sessions, isLoading: sessionsLoading } = useListResearchSessions();
  const createSession = useCreateResearchSession();
  const qc = useQueryClient();
  const { tier, usage } = useBillingStatus();

  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeRequiredTier, setUpgradeRequiredTier] = useState<"advocate" | "warroom">("advocate");

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
  }, [activeSession?.messages, streamedResponse, isStreaming]);

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

    const oldSession = qc.getQueryData([`/api/research/sessions/${activeSessionId}`]) as { messages?: { id: number; role: string; content: string }[] } | undefined;
    if (oldSession) {
      qc.setQueryData([`/api/research/sessions/${activeSessionId}`], {
        ...oldSession,
        messages: [...(oldSession.messages ?? []), { id: Date.now(), role: "user", content: question }]
      });
    }

    try {
      const token = await getToken();
      const res = await fetch(`/api/research/${activeSessionId}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question })
      });

      if (res.status === 403) {
        const body = await res.json() as { requiredTier?: "advocate" | "warroom" };
        setUpgradeRequiredTier(body.requiredTier ?? "advocate");
        setUpgradeOpen(true);
        setIsStreaming(false);
        setStreamedResponse("");
        return;
      }

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

  const researchUsage = usage?.research_ask;
  const atLimit = tier === "free" && researchUsage && researchUsage.used >= researchUsage.limit;

  const SidebarPanel = () => (
    <div className="flex flex-col h-full bg-sidebar/80 backdrop-blur-xl border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
        <Button
          onClick={handleNewSession}
          className="flex-1 justify-start text-sm shadow-sm bg-primary/20 text-primary hover:bg-primary/30 border-transparent transition-all"
          variant="outline"
          disabled={createSession.isPending}
        >
          {createSession.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          <span className="font-bold tracking-wide">New Session</span>
        </Button>
        <button
          className="md:hidden p-2 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          onClick={() => setShowSidebar(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {tier === "free" && researchUsage && (
        <div className="px-4 py-3 border-b border-sidebar-border bg-accent/5 text-accent-foreground text-xs">
          <div className="flex items-center justify-between font-bold mb-2">
            <span className="text-accent uppercase tracking-widest text-[10px]">Free Tier Usage</span>
            <span className="font-mono">{researchUsage.used}/{researchUsage.limit}</span>
          </div>
          <div className="h-1 bg-sidebar-accent rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${Math.min(100, (researchUsage.used / researchUsage.limit) * 100)}%` }}
            />
          </div>
          {atLimit && (
            <button
              onClick={() => setUpgradeOpen(true)}
              className="mt-3 w-full text-center text-[10px] uppercase tracking-widest font-bold text-accent hover:text-accent-foreground flex items-center justify-center gap-1.5 transition-colors"
            >
              <Zap className="h-3 w-3" /> Upgrade for unlimited
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 scrollbar-none">
        <div className="px-2 pt-2 pb-3 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest flex items-center gap-1.5">
          <Clock className="h-3 w-3" /> Recent Searches
        </div>
        {sessionsLoading ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-10 w-full bg-sidebar-accent" />
            <Skeleton className="h-10 w-full bg-sidebar-accent" />
            <Skeleton className="h-10 w-full bg-sidebar-accent" />
          </div>
        ) : sessions?.length === 0 ? (
          <div className="p-4 text-center text-xs text-sidebar-foreground/40 font-medium">No research sessions yet</div>
        ) : (
          <div className="space-y-1">
            {sessions?.map(session => (
              <button
                key={session.id}
                onClick={() => selectSession(session.id)}
                className={`w-full text-left px-3 py-2.5 text-sm truncate rounded-lg transition-all ${
                  activeSessionId === session.id
                    ? "bg-primary text-primary-foreground shadow-md font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        requiredTier={upgradeRequiredTier}
        featureName="Legal Research"
      />

      <div className="flex flex-1 overflow-hidden min-h-0 bg-background relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />

        {showSidebar && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
            onClick={() => setShowSidebar(false)}
          />
        )}

        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-72 
            transform transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
            md:relative md:inset-auto md:w-72 md:translate-x-0
            ${showSidebar ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <SidebarPanel />
        </aside>

        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <div className="h-14 border-b border-border/50 bg-card/50 backdrop-blur-md flex items-center px-4 gap-3 shrink-0">
            <button
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-md text-foreground/70 hover:bg-accent/20 hover:text-foreground transition-colors"
              onClick={() => setShowSidebar(true)}
            >
              <BookOpen className="h-4 w-4" />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Active Session</span>
              <span className="text-sm font-bold text-foreground font-serif tracking-tight truncate max-w-[200px] md:max-w-md">
                {activeSession?.title || "Select a session"}
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-6 md:space-y-8" ref={scrollRef}>
            {sessionLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 text-primary animate-spin opacity-50" />
              </div>
            ) : !activeSession ? (
              <div className="flex items-center justify-center h-full flex-col gap-6 text-center px-4 max-w-md mx-auto">
                <div className="p-6 bg-muted/20 rounded-full">
                  <BookOpen className="h-12 w-12 text-muted-foreground opacity-30" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-2xl text-foreground mb-2">Legal Research Assistant</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Create a new session to search case law, statutes, and procedural rules with AI-powered cited answers.</p>
                </div>
                <Button size="lg" onClick={handleNewSession} disabled={createSession.isPending} className="font-bold tracking-wide shadow-lg">
                  <Plus className="h-4 w-4 mr-2" /> Start Research
                </Button>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                {(!activeSession.messages || activeSession.messages.length === 0) && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/30">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm p-6 text-sm text-foreground flex-1 shadow-sm leading-relaxed">
                      <p className="font-serif font-bold text-lg mb-3">Hello. I am your Legal Research Assistant.</p>
                      <p className="mb-5 text-muted-foreground">I provide cited, factual answers on case law, statutes, and procedural rules.</p>
                      
                      {tier === "free" && researchUsage && (
                        <div className="mb-5 bg-accent/10 border border-accent/20 rounded-lg p-3 flex items-start gap-3">
                          <Zap className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">Free Plan Notice</p>
                            <p className="text-xs text-foreground/80">{researchUsage.limit - researchUsage.used} of {researchUsage.limit} questions remaining this month.</p>
                          </div>
                        </div>
                      )}
                      
                      <p className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Example queries:</p>
                      <div className="grid gap-2">
                        <div className="p-3 bg-muted/30 rounded-lg text-xs font-mono text-foreground/80 border border-border/30">"Statute of limitations for a written contract in California?"</div>
                        <div className="p-3 bg-muted/30 rounded-lg text-xs font-mono text-foreground/80 border border-border/30">"Elements of a negligence claim?"</div>
                        <div className="p-3 bg-muted/30 rounded-lg text-xs font-mono text-foreground/80 border border-border/30">"How do I serve a corporate defendant under FRCP Rule 4?"</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSession.messages?.map((msg, i) => (
                  <div key={i} className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {msg.role !== "user" && (
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/30">
                        <BookOpen className="h-5 w-5" />
                      </div>
                    )}
                    <div className={`px-5 py-4 rounded-2xl text-sm leading-relaxed max-w-[85%] shadow-sm
                      ${msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm shadow-primary/20 font-medium"
                        : "bg-card border border-border/50 text-foreground rounded-tl-sm"}`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}

                {isStreaming && streamedResponse && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/30">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-5 py-4 text-sm text-foreground flex-1 shadow-sm leading-relaxed">
                      <div className="whitespace-pre-wrap">{streamedResponse}</div>
                    </div>
                  </div>
                )}

                {isStreaming && !streamedResponse && (
                   <div className="flex items-start gap-4">
                     <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/30">
                        <BrainCircuit className="h-5 w-5" />
                     </div>
                     <TypingIndicator />
                   </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 md:p-6 border-t border-border/50 bg-card/80 backdrop-blur-md shrink-0">
            {atLimit ? (
              <div className="max-w-3xl mx-auto bg-accent/10 border border-accent/20 rounded-xl p-5 text-center">
                <p className="text-accent font-bold font-serif text-lg mb-2">Research Limit Reached</p>
                <p className="text-foreground/80 text-sm mb-4">You've used all {researchUsage?.limit} free questions this month.</p>
                <Button onClick={() => setUpgradeOpen(true)} className="bg-[#D4A843] hover:bg-[#b58f38] text-black font-bold shadow-md">
                  <Zap className="h-4 w-4 mr-2" /> Upgrade to Advocate
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSend} className="relative flex items-center max-w-4xl mx-auto">
                <Input
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  disabled={isStreaming || !activeSessionId}
                  className="w-full h-14 rounded-full border-border/50 bg-background shadow-sm pr-28 pl-6 text-base focus-visible:ring-primary/50 transition-shadow focus-visible:shadow-lg focus-visible:shadow-primary/10"
                  placeholder={activeSessionId ? "Ask a legal research question…" : "Start a session first"}
                />
                <div className="absolute right-2 flex items-center gap-1">
                  <MicButton
                    onTranscript={(text) => setInputValue(prev => prev ? `${prev} ${text}` : text)}
                    disabled={isStreaming || !activeSessionId}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isStreaming || !inputValue.trim() || !activeSessionId}
                    className="rounded-full h-10 w-10 shadow-md"
                  >
                    <Send className="h-4 w-4 ml-0.5" />
                  </Button>
                </div>
              </form>
            )}
            <p className="text-center mt-3 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              Always verify citations and rules before relying on them in court.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}