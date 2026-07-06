import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListOpenaiConversations, useCreateOpenaiConversation, useGetOpenaiConversation, getGetOpenaiConversationQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, MessageSquare, Send, Loader2, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function AiAssistant() {
  const { data: conversations, isLoading: convsLoading } = useListOpenaiConversations();
  const createConv = useCreateOpenaiConversation();
  const qc = useQueryClient();
  
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");

  const { data: activeConv, isLoading: activeConvLoading } = useGetOpenaiConversation(activeConvId || 0, {
    query: { enabled: !!activeConvId, queryKey: getGetOpenaiConversationQueryKey(activeConvId || 0) }
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-select first if none selected
  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConvId) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConv?.messages, streamedResponse]);

  const handleNewConv = () => {
    createConv.mutate({ data: { title: "New Conversation" } }, {
      onSuccess: (newConv) => {
        setActiveConvId(newConv.id);
        qc.invalidateQueries({ queryKey: [`/api/openai/conversations`] });
      }
    });
  };

  const autoTitleConversation = async (convId: number, firstMessage: string) => {
    // Generate a clean title from the first message (max 60 chars)
    const raw = firstMessage.trim();
    const title = raw.length > 60 ? raw.slice(0, 57).trimEnd() + "…" : raw;
    try {
      await fetch(`/api/openai/conversations/${convId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      qc.invalidateQueries({ queryKey: ["/api/openai/conversations"] });
    } catch {
      // non-critical, ignore
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeConvId) return;

    const message = inputValue;
    setInputValue("");
    setIsStreaming(true);
    setStreamedResponse("");

    // Check if this is the first message in the conversation (so we can auto-title it)
    const currentConv = conversations?.find(c => c.id === activeConvId);
    const isFirstMessage = currentConv?.title === "New Conversation";

    // Optimistically update UI
    const oldConv = qc.getQueryData([`/api/openai/conversations/${activeConvId}`]) as any;
    if (oldConv) {
      qc.setQueryData([`/api/openai/conversations/${activeConvId}`], {
        ...oldConv,
        messages: [...(oldConv.messages ?? []), { id: Date.now(), role: 'user', content: message }]
      });
    }

    try {
      const res = await fetch(`/api/openai/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message })
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

      // Auto-title the conversation using the first message text
      if (isFirstMessage) {
        await autoTitleConversation(activeConvId, message);
      }

      qc.invalidateQueries({ queryKey: [`/api/openai/conversations/${activeConvId}`] });
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
          <MessageSquare className="h-5 w-5" />
          General AI Assistant
        </h2>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r flex flex-col">
          <div className="p-4 border-b bg-slate-50/50">
            <Button onClick={handleNewConv} className="w-full justify-start text-sm shadow-sm" variant="outline" disabled={createConv.isPending}>
              {createConv.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              New Conversation
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="px-2 pt-2 pb-1 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="h-3 w-3" /> Recent Chats
            </div>
            {convsLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : conversations?.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No previous conversations</div>
            ) : (
              <div className="space-y-0.5 mt-1">
                {conversations?.map(conv => (
                  <div 
                    key={conv.id} 
                    onClick={() => setActiveConvId(conv.id)}
                    className={`px-3 py-2 text-sm truncate rounded-md cursor-pointer transition-colors ${activeConvId === conv.id ? 'bg-primary/10 text-primary font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                  >
                    {conv.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex-1 p-6 overflow-y-auto space-y-6" ref={scrollRef}>
            {activeConvLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 text-primary animate-spin opacity-50" />
              </div>
            ) : !activeConv ? (
              <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-4">
                <MessageSquare className="h-12 w-12 opacity-20" />
                <p>Select a conversation or create a new one.</p>
              </div>
            ) : (
              <>
                {(!activeConv.messages || activeConv.messages.length === 0) && (
                  <div className="flex items-start gap-4 max-w-4xl mx-auto">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                      <BrainCircuit className="h-4 w-4" />
                    </div>
                    <div className="bg-slate-50 border rounded-lg p-5 text-sm text-slate-800 flex-1 leading-relaxed shadow-sm">
                      <p className="font-medium text-base mb-2">Hello. I am here to help you understand legal procedures and translate complex court documents into plain English.</p>
                      <p className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2 mt-4">Examples of what I can do:</p>
                      <ul className="list-disc list-inside space-y-1.5 text-slate-700">
                        <li>Translate a motion to dismiss into simple terms</li>
                        <li>Explain the difference between a motion and a pleading</li>
                        <li>Help you organize your thoughts before using the Story Builder</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Messages */}
                {activeConv.messages?.map((msg, i) => (
                  <div key={i} className={`flex items-start gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role !== 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                        <BrainCircuit className="h-4 w-4" />
                      </div>
                    )}
                    <div className={`p-4 rounded-lg text-sm leading-relaxed max-w-[85%] shadow-sm
                      ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-slate-50 border text-slate-800'}`}>
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
                disabled={isStreaming || !activeConvId}
                className="w-full rounded-full border-slate-300 shadow-sm pr-12 py-6 pl-6 text-base"
                placeholder="Message AI Assistant..."
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={isStreaming || !inputValue.trim() || !activeConvId} 
                className="absolute right-2 rounded-full h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
