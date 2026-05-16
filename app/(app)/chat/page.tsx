"use client";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useChatMessages, useSendMessage } from "@/lib/query-hooks";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  intentPreview?: {
    action: string;
    amount: string;
    chain: string;
    estimatedOutput: string;
    estimatedFee: string;
  };
  executionStatus?: "pending" | "executing" | "completed" | "failed";
  image?: string;
}

const suggestionChips = [
  { label: "Buy $100 ETH", icon: <TrendingUp className="size-3" /> },
  { label: "Bridge to Base", icon: <ArrowRight className="size-3" /> },
  { label: "Setup DCA", icon: <Zap className="size-3" /> },
  { label: "Swap USDC/ETH", icon: <ArrowRightLeft className="size-3" /> },
];

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full flex-col gap-2 px-0 py-2 md:px-6",
        isUser ? "items-end" : "items-start",
      )}
    >
      <div className="flex items-center gap-3 w-full max-w-3xl mx-auto">
        <div
          className={cn(
            "flex flex-col gap-2 w-full",
            isUser ? "items-end text-right" : "items-start text-left",
          )}
        >
          <div
            className={cn(
              "relative group max-w-[90%] rounded-xl p-4 py-2 text-sm transition-all",
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
            <div className="whitespace-pre-wrap leading-relaxed break-words">
              {message.content.includes("```") ? (
                <div className="my-3 overflow-x-auto rounded-xl bg-zinc-950 p-4 font-mono text-[11px] leading-relaxed text-emerald-400 border border-white/5">
                  <div className="flex items-center justify-between mb-2 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                    <span>Output</span>
                    <div className="flex gap-1.5">
                      <div className="size-2 rounded-full bg-zinc-800" />
                      <div className="size-2 rounded-full bg-zinc-800" />
                    </div>
                  </div>
                  {message.content.replace(/```/g, "")}
                </div>
              ) : (
                message.content
              )}
            </div>
          </div>

          {message.intentPreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-2 w-full max-w-[calc(100vw-5rem)] sm:max-w-sm"
            >
              <Card className="overflow-hidden border-primary/20 bg-primary/5 backdrop-blur-md">
                <CardContent className="">
                  <div className="flex items-center gap-2 font-semibold text-primary mb-4 text-xs uppercase tracking-tight">
                    <span>Transaction Preview</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Action</span>
                      <span className="font-medium">
                        {message.intentPreview.action}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Estimate</span>
                      <span className="font-medium text-emerald-500">
                        {message.intentPreview.estimatedOutput}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-primary/10 pt-2">
                      <span className="text-muted-foreground">Est. Gas</span>
                      <span className="font-medium">
                        {message.intentPreview.estimatedFee}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="lg"
                      className="flex-1 h-8 text-[11px] font-bold"
                    >
                      Confirm
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 h-8 text-[11px]"
                    >
                      Modify
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
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
    </motion.div>
  );
}

function ChatContent() {
  const { data: initialMessages } = useChatMessages();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [attachedImage, setAttachedImage] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

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
    setIsTyping(true);

    setTimeout(() => {
      const responses = [
        "I've analyzed your request. I can help you execute that trade on Base.",
        "That sounds like a solid plan. Should I monitor the price for you?",
        "I've updated your automations. You'll get a notification when the next one runs.",
        "Here is the detailed breakdown of your portfolio across chains:\n```\nBase: $2,100.50 (56.3%)\nEthereum: $1,200.25 (32.2%)\nArbitrum: $430.30 (11.5%)\n```",
      ];
      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: randomResponse,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const hasMessages = messages.length > 0;

  return (
    <AppShell>
      <div className="relative flex h-100svh md:h-[calc(100svh-6rem)] w-full flex-col overflow-hidden bg-background">
        <AnimatePresence>
          {!hasMessages ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center z-0"
            >
              <motion.div className="mb-18">
                <h1 className="text-3xl font-bold tracking-tight mb-3">
                  How can I help you?
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto text-md">
                  I'm your decentralized agent. I can help with swaps, bridges,
                  and complex automations.
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <div className="flex-1 overflow-y-auto scroll-smooth no-scrollbar">
              <div className="mx-auto max-w-4xl pb-40">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isTyping && (
                  <div className="flex items-center gap-2 animate-pulse max-w-3xl mx-auto pl-4">
                 <Brain className="size-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      Qleva is thinking...
                    </span>
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
            "fixed md:absolute left-0 right-0 z-20 px-3 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]",
            hasMessages ? "bottom-3 md:bottom-1" : "top-1/2 -translate-y-1/2"
          )}
        >
          <div className="mx-auto w-full max-w-3xl">
            <Card className="overflow-hidden border border-border/50 backdrop-blur-xl bg-card/60 rounded-2xl">
              <CardContent className="p-0">
                <div className="flex items-end gap-3 px-4">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Qleva anything..."
                    className="max-h-[150px] -mt-2 overflow-y-auto focus-visible:ring-0 rounded-xs resize-none p-1 custom-scrollbar"
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
                  <div className="flex items-center gap-4">
                    <Button
                      size="icon-lg"
                      onClick={() => handleSend()}
                      disabled={!input.trim() && !attachedImage}
                    >
                      <ArrowUp className="size-5 font-bold" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {hasMessages ? (
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
                className="mt-6 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto"
              >
                {suggestionChips.map((chip, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl bg-card/50 backdrop-blur-md border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all gap-2"
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

export default function ChatPage() {
  return <ChatContent />;
}
