"use client";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import {
  Send,
  Sparkles,
  ArrowUp,
  Image as ImageIcon,
  Paperclip,
  Plus,
  TrendingUp,
  ArrowRight,
  Zap,
  ArrowRightLeft,
  Fuel,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Brain,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useChatMessages, useSendMessage } from "@/lib/query-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  intentPreview?: {
    id: string;
    status: "preview" | "active" | "completed";
    trigger: {
      type: "schedule" | "price_condition";
      config: any;
    };
    actions: Array<{
      type: "swap" | "transfer";
      config: any;
    }>;
    risk: {
      maxSlippage: number;
      maxTradeUsd: number;
      dailyVolumeLimit: number;
      estimatedGasUsd: number;
    };
    preview: {
      humanReadable: string;
      estimatedOutput: string;
      estimatedFee: string;
      permissionsRequired: Array<{ token: string; amount: string }>;
      riskSummary: string;
    };
  };
  executionStatus?: "pending" | "executing" | "completed" | "failed";
  automationPreview?: any;
  image?: string;
}

const suggestionChips = [
  { label: "Buy $100 ETH", icon: <TrendingUp className="size-3" /> },
  { label: "Setup DCA", icon: <Zap className="size-3" /> },
  { label: "Setup DCA", icon: <Zap className="size-3" /> },
  { label: "Swap USDC/ETH", icon: <ArrowRightLeft className="size-3" /> },
];

function MessageBubble({ message, onConfirm }: { message: ChatMessage; onConfirm?: () => void }) {
  const isUser = message.role === "user";

  console.log(message.intentPreview)
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      // fallback
      try {
        const ta = document.createElement("textarea");
        ta.value = message.content || "";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      } catch (err) {
        console.error("Copy failed", err);
      }
    }
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 px-0 py-5 md:px-6",
        isUser ? "items-end" : "items-start",
      )}
    >
      <div className="flex items-center gap-3 w-full max-w-3xl mx-auto">
        <div
          className={cn(
            "flex flex-col gap-2 w-full",
            isUser ? "items-end" : "items-start",
          )}
        >
          <div
            className={cn(
              "relative group max-w-[98%] rounded-3xl rounded-br-none p-4 py-2 text-sm transition-all",
              isUser
                ? "bg-muted/30"
                : "p-0",
            )}
          >
            {message.image && (
              <div className="mb-3 overflow-hidden rounded-xl border border-white/10 shadow-sm">
                <img
                  src={message.image}
                  alt="Uploaded"
                  className="max-h-72 w-full object-cover"
                />
              </div>
            )}
            {isUser ? (
              <div className="whitespace-pre-wrap py-1 leading-relaxed break-words text-[16px]">
                {message.content}
              </div>
            ) : (
              <div className="break-words max-w-full">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold mt-4 mb-2 text-foreground">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-bold mt-4 mb-2 text-foreground">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-semibold mt-3 mb-2 text-foreground">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-[16px] leading-relaxed text-foreground/90 mb-3 last:mb-0">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-outside space-y-1 mb-3 ml-4 pl-2 text-[16px] text-foreground/90">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-outside space-y-1 mb-3 ml-4 pl-2 text-[16px] text-foreground/90">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li className="pl-1">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-primary/60 bg-primary/5 pl-3 pr-2 py-2 my-3 rounded-r-md italic text-foreground/70 text-[16px]">
                        {children}
                      </blockquote>
                    ),
                    code: ({ inline, className, children, ...props }: any) =>
                      inline ? (
                        <code className="bg-foreground/5 text-primary font-mono text-xs px-1 py-0.5 rounded">
                          {children}
                        </code>
                      ) : (
                        <div className="my-3 overflow-hidden rounded-xl bg-zinc-950 border border-white/10 w-full max-w-full overflow-x-auto">
                          <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-white/5 min-w-max">
                            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Code</span>
                            <div className="flex gap-1.5">
                              <div className="size-2 rounded-full bg-zinc-700" />
                              <div className="size-2 rounded-full bg-zinc-700" />
                              <div className="size-2 rounded-full bg-zinc-700" />
                            </div>
                          </div>
                          <pre className="p-4 overflow-x-auto min-w-max">
                            <code className="font-mono text-xs leading-relaxed text-emerald-400" {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                      >
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-foreground">
                        {children}
                      </strong>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto w-full my-4 border border-border/30 rounded-lg">
                        <table className="w-full border-collapse text-sm text-left whitespace-nowrap md:whitespace-normal">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-muted/50 border-b border-border/30">
                        {children}
                      </thead>
                    ),
                    th: ({ children }) => (
                      <th className="px-3 py-2 font-semibold text-foreground">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3 py-2 text-foreground/80 border-b border-border/10">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Copy button (desktop only, appears on hover) */}
            <div  className={cn(
            "absolute -bottom-7.5 flex items-center",
            isUser ? "right-0" : "left-0",
          )}>
              <button
                onClick={handleCopy}
                className= {cn(
            "group-hover:opacity-100 transition-opacity bg-transparent flex items-center justify-center p-1 rounded-full text-muted-foreground hover:text-foreground",
            isUser ? "opacity-0" : "md:opacity-0",
          )}
                aria-label="Copy message"
                title="Copy message"
              >
                {copied ? (
                  <Check className="size-4 text-emerald-500" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>

             {!isUser && <>
             
             <button
                className="md:opacity-0 ml-2 group-hover:opacity-100 transition-opacity bg-transparent flex items-center justify-center p-1 rounded-full text-muted-foreground hover:text-foreground"
                aria-label="Like message"
                title="Like message"
              >
               
                  <ThumbsUp className="size-4" />
              
              </button>
             <button
                className="md:opacity-0 ml-1 group-hover:opacity-100 transition-opacity bg-transparent flex items-center justify-center p-1 rounded-full text-muted-foreground hover:text-foreground"
                aria-label="Dislike message"
                title="Dislike message"
              >
               
                  <ThumbsDown className="size-4" />
              
              </button>
              
              
              </> }
            </div>
          </div>

          {message.intentPreview && (
            <div
              className="mt-8 w-full max-w-[calc(100vw)] sm:max-w-md px-0.5"
            >
              <Card className="overflow-hidden bg-background border-border shadow-sm backdrop-blur-md">
                <CardContent className="">
                  <div className="flex items-center gap-2 font-semibold mb-4 text-md">
                    <span>Summary</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Action</span>
                      <span className="font-medium text-right max-w-[180px]">
                        {message.intentPreview.preview.humanReadable}
                      </span>
                    </div>
                    {message.intentPreview.trigger && (
                      <><div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Trigger ({message.intentPreview.trigger.type})</span>
                        <span className="font-medium text-right max-w-[180px]">
                          {
                          message.intentPreview.trigger.config.frequency ||
                           <span>{message.intentPreview.trigger.config.conditionType.split('_').join(" ")} &nbsp; 
                           ${message.intentPreview.trigger.config.targetValue}</span>
                           }
                        </span>
                      </div>

                        <div className="flex justify-between items-center text-xs pt-2">
                          <span className="text-muted-foreground">Buy</span>
                          <span className="font-medium text-right max-w-[180px]">
                            ${message.intentPreview.trigger.config.amountUsd} &nbsp;
                            {message.intentPreview.trigger.config.toToken || message.intentPreview.trigger.config.targetToken}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-2">
                          <span className="text-muted-foreground">Pay with</span>
                          <span className="font-medium text-right max-w-[180px]">
                            {message.intentPreview.trigger.config.fromToken}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Est. Fee</span>
                      <span className="font-medium">
                        {message.intentPreview.preview.estimatedFee}
                      </span>
                    </div>

                    {/* {message.intentPreview.preview.permissionsRequired && message.intentPreview.preview.permissionsRequired.length > 0 && (
                      <div className="flex justify-between items-start text-xs border-t border-primary/10 pt-2">
                        <span className="text-muted-foreground">Permissions</span>
                        <div className="flex flex-col items-end gap-1">
                          {message.intentPreview.preview.permissionsRequired.map((perm, idx) => (
                            <span key={idx} className="font-medium">
                              {perm.amount} {perm.token}
                            </span>
                          ))}
                        </div>
                      </div>
                    )} */}

                    {message.intentPreview.preview.riskSummary && (
                      <div className="flex justify-between items-center text-xs border-t border-primary/10 pt-2">
                        <span className="font-medium text-left mt-6 italic">
                          {message.intentPreview.preview.riskSummary}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="lg"
                      className="flex-1 h-10 text-[15px] font-bold"
                      onClick={() => onConfirm?.()}
                    >
                      Confirm
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {message.automationPreview && (
            <div
              className="mt-2 w-full max-w-[calc(100vw)] sm:max-w-md"
            >
              <Card className="overflow-hidden border-primary/20 bg-card backdrop-blur-md">
                <CardContent className="">
                  <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      {/* <div className="size-2 rounded-full bg-emerald-500 animate-pulse" /> */}
                      <span className="font-bold text-xs tracking-wider uppercase">Active Automation</span>
                    </div>
                    <Badge variant="outline" className=" text-[10px] h-5">
                      {message.automationPreview.status}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Strategy</span>
                      <span className="font-medium text-sm text-foreground">
                        {message.automationPreview.preview?.humanReadable || "Custom Strategy"}
                      </span>
                    </div>

                    {message.automationPreview.trigger && (
                      <div className="flex justify-between items-center text-xs border-t border-primary/20 pt-2">
                        <span className="text-muted-foreground">Trigger</span>
                        <span className="font-medium text-right">
                          {message.automationPreview.trigger.type}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs border-t border-primary/20 pt-2">
                      <span className="text-muted-foreground">ID</span>
                      <span className="font-mono text-emerald-500/80">
                        {message.automationPreview.id?.slice(0, 8)}...
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-[11px] font-bold border-white/10 hover:bg-white/5">
                      Pause
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-[11px] font-bold border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400">
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {message.executionStatus && (
            <div className="mt-2">
              <Badge
                variant="outline"
                className={cn(
                  "gap-1.5 py-0.5 px-2.5 text-[10px] font-semibold tracking-tight",
                  message.executionStatus === "completed" &&
                  "border-emerald-500/50 bg-emerald-500/5 text-emerald-500",
                  message.executionStatus === "executing" &&
                  "border-blue-500/50 bg-blue-500/5 text-blue-500",
                  message.executionStatus === "failed" &&
                  "border-red-500/50 bg-red-500/5 text-red-500",
                )}
              >
                {message.executionStatus === "completed" && (
                  <CheckCircle2 className="size-3" />
                )}
                {message.executionStatus === "executing" && (
                  <Loader2 className="size-3 animate-spin" />
                )}
                {message.executionStatus === "failed" && (
                  <XCircle className="size-3" />
                )}
                {message.executionStatus.toUpperCase()}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChatContentProps {
  chatId?: string;
}

export function ChatContent({ chatId }: ChatContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getAccessToken } = usePrivy();
  const { data: dummyMessages } = useChatMessages(chatId);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [streamingSteps, setStreamingSteps] = React.useState<{ id: string; message: string; status: string; completed: boolean }[]>([]);
  const [streamingCollapsed, setStreamingCollapsed] = React.useState(true);
  const [isThinking, setIsThinking] = React.useState(false);
  const [attachedImage, setAttachedImage] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const socket = io(baseUrl, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Connected to agent event stream");
    });

    socket.on("qleva_event", (event: any) => {
      if (event.type === "AGENT_STATUS_UPDATE") {
        const { status, message } = event.payload;
        setStreamingSteps(prev => {
          const prevSteps = prev.map(s => ({ ...s, completed: true }));
          if (prevSteps.length > 0 && prevSteps[prevSteps.length - 1].message === message) {
            return prevSteps;
          }
          return [...prevSteps, { id: Date.now().toString() + Math.random().toString(), message, status, completed: false }];
        });
      } else if (event.type === "AGENT_EXECUTION_DONE") {
        setIsThinking(false);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  React.useEffect(() => {
    // Only load messages if we are viewing an existing chat
    if (chatId && dummyMessages) {
      setMessages(dummyMessages);
    } else {
      setMessages([]);
    }
  }, [chatId, dummyMessages]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingSteps, isThinking]);

  const handleSend = async (
    text: string = input,
    img: string | null = attachedImage,
  ) => {
    if (!text.trim() && !img) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
      image: img || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachedImage(null);
    setStreamingSteps([{ id: "init", message: "Qleva is formulating execution script...", status: "init", completed: false }]);
    setIsThinking(true);

    try {
      const token = await getAccessToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      if (!chatId) {
        // Start a brand new chat session
        const response = await fetch(`${baseUrl}/api/chats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: text }),
        });

        if (!response.ok) {
          throw new Error("Failed to start chat session");
        }

        const data = await response.json();
        const returnedChatId = data.chatId;
        const returnedMessages = data.messages;

        setIsThinking(false);
        setStreamingSteps([]);

        // Cache the returned database messages and route to the new ID!
        queryClient.setQueryData(["chat-messages", returnedChatId], returnedMessages);

        // Set local state to show response instantly before transition
        setMessages(returnedMessages);

        router.push(`/chat/${returnedChatId}`);
      } else {
        // Post message to existing chat session
        const response = await fetch(`${baseUrl}/api/chats/${chatId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: text }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const aiMessage = await response.json();

        setIsThinking(false);
        setStreamingSteps([]);
        setMessages((prev) => {
          const finalMessages = [...prev, aiMessage];
          // Update Query cache for this chat session
          queryClient.setQueryData(["chat-messages", chatId], finalMessages);
          return finalMessages;
        });
      }
    } catch (error) {
      console.error("[ChatContent] API execution error:", error);
      setIsThinking(false);
      setStreamingSteps([]);

      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: "⚠️ **System Communication Issue**\n\nI was unable to establish a secure link with the decentralized execution node. Please make sure the service is online and try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <AppShell>
      <div className="relative flex md:h-[calc(100svh-6rem)] w-full flex-col overflow-hidden bg-background">
        <AnimatePresence>
          {!hasMessages && !chatId ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center p-6 text-center z-0"
            >
              <motion.div className="mt-20 md:16">
                <h1 className="text-3xl font-bold tracking-tight mb-2">How can I help you?</h1>
                <p className="text-muted-foreground max-w-md mx-auto text-md">
                  I'm your decentralized agent. I can help with swaps
                  and complex automations.
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <div className="flex-1 overflow-y-auto scroll-smooth no-scrollbar">
              <div className="mx-auto max-w-4xl pb-40">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} onConfirm={() => handleSend("Confirm")} />
                ))}
                {isThinking && streamingSteps.length > 0 && (
                  <div className="flex flex-col gap-2 w-full max-w-3xl mx-auto mt-4 px-0 md:px-0">
                    <div className="flex items-center justify-between gap-3 max-w-[80%]">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                        <Brain className="size-4 text-primary" />
                        <span>Thinking</span>
                      </div>
                      <button
                        aria-label={streamingCollapsed ? "Expand thinking steps" : "Collapse thinking steps"}
                        title={streamingCollapsed ? "Show all steps" : "Show only last two"}
                        onClick={() => setStreamingCollapsed((s) => !s)}
                        className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {streamingCollapsed ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronUp className="size-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 border-white/5 max-w-[80%]">
                      {(streamingCollapsed ? streamingSteps.slice(-2) : streamingSteps).map((step) => (
                        <div key={step.id} className="flex items-start gap-3">
                          {step.completed ? (
                            <CheckCircle2 className="size-4 text-emerald-500 mt-0.5" />
                          ) : (
                            <Loader2 className="size-4 animate-spin text-primary mt-0.5" />
                          )}
                          <span className={cn(
                            "text-sm font-medium tracking-tight",
                            step.completed ? "text-muted-foreground" : "text-foreground"
                          )}>
                            {step.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={scrollRef} className="h-4" />
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div
          className={cn(
            "fixed md:absolute left-0 right-0 z-20 px-3",
            hasMessages || chatId ? "bottom-2 md:bottom-0.5" : "top-100 md:top-80 -translate-y-1/2"
          )}
        >
          <div className="mx-auto w-full max-w-3xl">
            <Card className="overflow-hidden border border-border/50 backdrop-blur-xl bg-card/80 rounded-2xl ">
              <CardContent className="p-0">
                <div className="flex items-end gap-3 px-3">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Qleva anything..."
                    className="max-h-[180px] -mt-1 overflow-y-auto focus-visible:ring-0 rounded-xs resize-none p-1 custom-scrollbar text-base"
                    style={{
                      backgroundColor: "transparent",
                      border: "0",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <div className="flex items-center gap-4 -mb-1">
                    <Button
                      size="icon-lg"
                      onClick={() => handleSend()}
                      disabled={!input.trim() && !attachedImage || isThinking}
                    >
                      <ArrowUp className="size-5 font-bold" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {hasMessages || chatId ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className=""
              >
              </motion.p>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto"
              >
                {suggestionChips.map((chip, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="h-10 md:h-9 rounded-xl bg-card/50 backdrop-blur-md border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all gap-2"
                    onClick={() => handleSend(chip.label)}
                  >
                    <span className="text-primary">{chip.icon}</span>
                    <span className="text-[11px] font-semibold">{chip.label}</span>
                  </Button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
