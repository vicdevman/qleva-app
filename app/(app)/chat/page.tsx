"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  TrendingUp,
  ArrowRightLeft,
  Fuel,
  Shield,
  Zap,
  MessageSquareText,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatMessages } from "@/lib/query-hooks";
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
}

const suggestionChips = [
  { label: "Buy ETH", icon: <TrendingUp className="size-3" /> },
  { label: "Bridge Funds", icon: <ArrowRight className="size-3" /> },
  { label: "DCA Setup", icon: <Zap className="size-3" /> },
  { label: "Swap Tokens", icon: <ArrowRightLeft className="size-3" /> },
];

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 px-4 py-3"
    >
      <div className="flex size-6 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="size-3 text-primary" />
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="size-1.5 rounded-full bg-muted-foreground"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <span className="ml-1 text-xs text-muted-foreground">Qleva is thinking...</span>
    </motion.div>
  );
}

function IntentPreviewCard({ preview }: { preview: NonNullable<ChatMessage["intentPreview"]> }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="mt-2 rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-4"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Zap className="size-4 text-primary" />
        Action Preview
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Action</p>
          <p className="text-sm font-medium">{preview.action}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Amount</p>
          <p className="text-sm font-medium">{preview.amount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Chain</p>
          <p className="text-sm font-medium">{preview.chain}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Est. Output</p>
          <p className="text-sm font-medium">{preview.estimatedOutput}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Fuel className="size-3" />
        Est. fee: {preview.estimatedFee}
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" className="flex-1">
          <CheckCircle2 className="size-3.5" />
          Confirm & Execute
        </Button>
        <Button size="sm" variant="outline">
          Modify
        </Button>
      </div>
    </motion.div>
  );
}

function ExecutionStatusBubble({ status }: { status: NonNullable<ChatMessage["executionStatus"]> }) {
  const config = {
    pending: { icon: <Clock className="size-3.5" />, label: "Pending", color: "text-yellow-500 bg-yellow-500/10" },
    executing: { icon: <Loader2 className="size-3.5 animate-spin" />, label: "Executing...", color: "text-blue-500 bg-blue-500/10" },
    completed: { icon: <CheckCircle2 className="size-3.5" />, label: "Completed", color: "text-green-500 bg-green-500/10" },
    failed: { icon: <XCircle className="size-3.5" />, label: "Failed", color: "text-red-500 bg-red-500/10" },
  }[status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", config.color)}
    >
      {config.icon}
      {config.label}
    </motion.div>
  );
}

function ChatContent() {
  const { data: messages, isLoading } = useChatMessages();
  const [input, setInput] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <AppShell>
   <div>chatt</div>
    </AppShell>
  );
}

export default function ChatPage() {
  return <ChatContent />;
}
