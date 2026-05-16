"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { SectionCard } from "@/components/shared/section-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/lib/query-hooks";
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const typeConfig = {
  execution: { icon: <CheckCircle2 className="size-4" />, color: "bg-green-500/10 text-green-500" },
  failure: { icon: <XCircle className="size-4" />, color: "bg-red-500/10 text-red-500" },
  alert: { icon: <TrendingUp className="size-4" />, color: "bg-yellow-500/10 text-yellow-500" },
  approval: { icon: <ShieldCheck className="size-4" />, color: "bg-blue-500/10 text-blue-500" },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

function NotificationsContent() {
  const { data: notifications, isLoading } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <AppShell>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <CheckCheck className="size-3.5" />
            Mark all read
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 ">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-heading text-lg font-semibold">{notifications?.length ?? 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 ">
              <div className="flex size-9 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="size-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="font-heading text-lg font-semibold">
                  {notifications?.filter((n) => n.type === "execution").length ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 ">
              <div className="flex size-9 items-center justify-center rounded-lg bg-red-500/10">
                <XCircle className="size-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="font-heading text-lg font-semibold">
                  {notifications?.filter((n) => n.type === "failure").length ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 ">
              <div className="flex size-9 items-center justify-center rounded-lg bg-yellow-500/10">
                <Clock className="size-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unread</p>
                <p className="font-heading text-lg font-semibold">{unreadCount}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification List */}
        <motion.div variants={item}>
          <SectionCard title="All Notifications" delay={0.1}>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {notifications?.map((notif) => {
                  const type = typeConfig[notif.type as keyof typeof typeConfig];
                  return (
                    <motion.div
                      key={notif.id}
                      variants={item}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50",
                        !notif.read && "border-primary/20 bg-primary/5"
                      )}
                    >
                      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", type.color)}>
                        {type.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{notif.title}</p>
                          {!notif.read && (
                            <span className="size-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{notif.description}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {timeAgo(notif.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}

export default function NotificationsPage() {
  return <NotificationsContent />;
}
