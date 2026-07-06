import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListOpenaiConversations, useCreateOpenaiConversation, useGetOpenaiConversation, getGetOpenaiConversationQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { BrainCircuit, MessageSquare, Send, Loader2, Plus, Clock, ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { MicButton } from "@/components/ui/mic-button";

export default function AiAssistant() {
  const { getToken } = useAuth();
  const { data: conversations, isLoading: convsLoading } = useListOpenaiConversations();
  const createConv = useCreateOpenaiConversation();
  const qc = useQueryClient();

  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  const { data: activeConv, isLoading: activeConvLoading } = useGetOpenaiConversation(activeConvId || 0, {
    query: { enabled: !!activeConvId, queryKey: getGetOpenaiConversationQueryKey(activeConvId || 0) }
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConvId) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConv?.messages, streamedResponse, isStreaming]);

  const handleNewConv = () => {
    createConv.mutate({ data: { title: "New Conversation" } }, {
      onSuccess: (newConv) => {
        setActiveConvId(newConv.id);
        setShowSidebar(false);
        qc.invalidateQueries({ queryKey: ["/api/openai/conversations"] });
      }
    });
  };

  const selectConv = (id: number) => {
    setActiveConvId(id);
    setShowSidebar(false);
  };

  const autoTitleConversation = async (convId: number, firstMessage: string) => {
    const raw = firstMessage.trim();
    const title = raw.length > 60 ? raw.slice(0, 57).trimEnd() + "…" : raw;
    try {
      const token = await getToken();
      await fetch(`/api/openai/conversations/${convId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title }),
      });
      qc.invalidateQueries({ queryKey: ["/api/openai/conversations"] });
    } catch {
      // non-critical
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeConvId) return;

    const message = inputValue;
    setInputValue("");
    setIsStreaming(true);
    setStreamedResponse("");

    const currentConv = conversations?.find(c => c.id === activeConvId);
    const isFirstMessage = currentConv?.title === "New Conversation";

    const oldConv = qc.getQueryData([`/api/openai/conversations/${activeConvId}`]) as any;
    if (oldConv) {
      qc.setQueryData([`/api/openai/conversations/${activeConvId}`], {
        ...oldConv,
        messages: [...(oldConv.messages ?? []), { id: Date.now(), role: "user", content: message }]
      });
    }

    try {
      const token = await getToken();
      const res = await fetch(`/api/openai/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: message })
      });

      if (!res.ok) throw new Error("Request failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          setStreamedResponse(prev => prev + decoder.decode(value, { stream: true }));
        }
      }

      if (isFirstMessage) await autoTitleConversation(activeConvId, message);
      qc.invalidateQueries({ queryKey: [`/api/openai/conversations/${activeConvId}`] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsStreaming(false);
      setStreamedResponse("");
    }
  };

  const SidebarPanel = () => (
    <div className="flex flex-col h-full bg-sidebar/80 backdrop-blur-xl border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
        <Button
          onClick={handleNewConv}
          className="flex-1 justify-start text-sm shadow-sm bg-[#D4A843]/20 text-[#D4A843] hover:bg-[#D4A843]/30 border-transparent transition-all"
          variant="outline"
          disabled={createConv.isPending}
        >
          {createConv.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          <span className="font-bold tracking-wide">New Chat</span>
        </Button>
        <button
          className="md:hidden p-2 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          onClick={() => setShowSidebar(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 scrollbar-none">
        <div className="px-2 pt-2 pb-3 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest flex items-center gap-1.5">
          <Clock className="h-3 w-3" /> Recent Chats
        </div>
        {convsLoading ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-10 w-full bg-sidebar-accent" />
            <Skeleton className="h-10 w-full bg-sidebar-accent" />
            <Skeleton className="h-10 w-full bg-sidebar-accent" />
          </div>
        ) : conversations?.length === 0 ? (
          <div className="p-4 text-center text-xs text-sidebar-foreground/40 font-medium">No conversations yet</div>
        ) : (
          <div className="space-y-1">
            {conversations?.map(conv => (
              <button
                key={conv.id}
                onClick={() => selectConv(conv.id)}
                className={`w-full text-left px-3 py-2.5 text-sm truncate rounded-lg transition-all ${
                  activeConvId === conv.id
                    ? "bg-[#D4A843] text-black shadow-md font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                {conv.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AppLayout title="AI Assistant">
      <div className="flex flex-1 overflow-hidden min-h-0 bg-background relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#D4A843]/5 via-background to-background pointer-events-none" />

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
              <MessageSquare className="h-4 w-4" />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Active Chat</span>
              <span className="text-sm font-bold text-foreground font-serif tracking-tight truncate max-w-[200px] md:max-w-md">
                {activeConv?.title || "Select a conversation"}
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-6 md:space-y-8" ref={scrollRef}>
            {activeConvLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 text-[#D4A843] animate-spin opacity-50" />
              </div>
            ) : !activeConv ? (
              <div className="flex items-center justify-center h-full flex-col gap-6 text-center px-4 max-w-md mx-auto">
                <div className="p-6 bg-muted/20 rounded-full">
                  <MessageSquare className="h-12 w-12 text-muted-foreground opacity-30" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-2xl text-foreground mb-2">Strategic Legal Assistant</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Start a chat to translate complex legal jargon or strategize your next move.</p>
                </div>
                <Button size="lg" onClick={handleNewConv} disabled={createConv.isPending} className="font-bold tracking-wide shadow-lg bg-[#D4A843] hover:bg-[#b58f38] text-black">
                  <Plus className="h-4 w-4 mr-2" /> Start Chat
                </Button>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                {(!activeConv.messages || activeConv.messages.length === 0) && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#D4A843]/20 flex items-center justify-center text-[#D4A843] shrink-0 shadow-sm border border-[#D4A843]/30">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm p-6 text-sm text-foreground flex-1 shadow-sm leading-relaxed">
                      <p className="font-serif font-bold text-lg mb-3">Hello. I am here to help you understand legal procedures and translate complex court documents into plain English.</p>
                      <p className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground mb-3 mt-4">I can help you:</p>
                      <ul className="text-sm text-foreground/80 space-y-2 list-none">
                        <li className="flex gap-2 items-start"><span className="text-[#D4A843]/50">—</span> Translate motions and orders into simple terms</li>
                        <li className="flex gap-2 items-start"><span className="text-[#D4A843]/50">—</span> Explain the difference between pleadings and motions</li>
                        <li className="flex gap-2 items-start"><span className="text-[#D4A843]/50">—</span> Help you organize facts before using the Story Builder</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeConv.messages?.map((msg, i) => (
                  <div key={i} className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {msg.role !== "user" && (
                      <div className="w-10 h-10 rounded-xl bg-[#D4A843]/20 flex items-center justify-center text-[#D4A843] shrink-0 shadow-sm border border-[#D4A843]/30">
                        <BrainCircuit className="h-5 w-5" />
                      </div>
                    )}
                    <div className={`px-5 py-4 rounded-2xl text-sm leading-relaxed max-w-[85%] shadow-sm
                      ${msg.role === "user"
                        ? "bg-[#D4A843] text-black rounded-br-sm shadow-[#D4A843]/20 font-medium"
                        : "bg-card border border-border/50 text-foreground rounded-tl-sm"}`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}

                {isStreaming && streamedResponse && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#D4A843]/20 flex items-center justify-center text-[#D4A843] shrink-0 shadow-sm border border-[#D4A843]/30">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-5 py-4 text-sm text-foreground flex-1 shadow-sm leading-relaxed">
                      <div className="whitespace-pre-wrap">{streamedResponse}</div>
                    </div>
                  </div>
                )}
                {isStreaming && !streamedResponse && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#D4A843]/20 flex items-center justify-center text-[#D4A843] shrink-0 shadow-sm border border-[#D4A843]/30">
                       <BrainCircuit className="h-5 w-5" />
                    </div>
                    <TypingIndicator className="[&>div]:bg-[#D4A843]" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 md:p-6 border-t border-border/50 bg-card/80 backdrop-blur-md shrink-0">
            <form onSubmit={handleSend} className="relative flex items-center max-w-4xl mx-auto">
              <Input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={isStreaming || !activeConvId}
                className="w-full h-14 rounded-full border-border/50 bg-background shadow-sm pr-28 pl-6 text-base focus-visible:ring-[#D4A843]/50 transition-shadow focus-visible:shadow-lg focus-visible:shadow-[#D4A843]/10"
                placeholder={activeConvId ? "Message AI Assistant…" : "Start a conversation first"}
              />
              <div className="absolute right-2 flex items-center gap-1">
                <MicButton
                  onTranscript={(text) => setInputValue(prev => prev ? `${prev} ${text}` : text)}
                  disabled={isStreaming || !activeConvId}
                  accentColor="#D4A843"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isStreaming || !inputValue.trim() || !activeConvId}
                  className="rounded-full h-10 w-10 shadow-md bg-[#D4A843] hover:bg-[#b58f38] text-black disabled:bg-[#D4A843]/50"
                >
                  <Send className="h-4 w-4 ml-0.5" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}