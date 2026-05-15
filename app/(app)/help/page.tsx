"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Lightbulb,
  Link2,
  Percent,
  Shield,
  DollarSign,
  Sparkles,
  ArrowRight,
  HelpCircle,
  BookOpen,
  MessageSquareText,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { SectionCard } from "@/components/shared/section-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiMemory } from "@/lib/query-hooks";
import { cn } from "@/lib/utils";

const iconMap = {
  link: <Link2 className="size-4" />,
  percent: <Percent className="size-4" />,
  shield: <Shield className="size-4" />,
  dollar: <DollarSign className="size-4" />,
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function HelpContent() {
  const { data: memory, isLoading } = useAiMemory();

  return (
    <AppShell>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item} className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Brain className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">AI Memory & Help</h1>
            <p className="text-sm text-muted-foreground">
              What Qleva knows, remembers, and suggests for you
            </p>
          </div>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Remembered Preferences */}
          <motion.div variants={item}>
            <SectionCard
              title="Remembered Preferences"
              description="Settings Qleva has learned from you"
              delay={0.1}
            >
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <div className="space-y-3">
                  {memory?.rememberedPreferences.map((pref) => (
                    <div
                      key={pref.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {iconMap[pref.icon as keyof typeof iconMap] || <Sparkles className="size-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{pref.label}</p>
                        <p className="text-xs text-muted-foreground">{pref.value}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        Auto
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </motion.div>

          {/* Saved Automation Styles */}
          <motion.div variants={item}>
            <SectionCard
              title="Saved Automation Styles"
              description="Your preferred automation patterns"
              delay={0.15}
            >
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <div className="space-y-3">
                  {memory?.savedStyles.map((style) => (
                    <div
                      key={style.id}
                      className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{style.name}</p>
                        <Button variant="ghost" size="xs" className="h-6">
                          Apply
                        </Button>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{style.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </motion.div>
        </div>

        {/* Suggested Commands */}
        <motion.div variants={item}>
          <SectionCard
            title="Suggested Commands"
            description="Try these to get started"
            delay={0.2}
          >
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {memory?.suggestedCommands.map((cmd, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="h-auto justify-start gap-2 p-3 text-sm"
                  >
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                    {cmd}
                  </Button>
                ))}
              </div>
            )}
          </SectionCard>
        </motion.div>

        {/* Onboarding / Tutorials */}
        <motion.div variants={item}>
          <SectionCard
            title="Learn Qleva"
            description="Tutorials and guides"
            delay={0.25}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: <BookOpen className="size-5" />,
                  title: "Getting Started",
                  desc: "Learn the basics of Qleva Smart Wallet",
                  progress: 100,
                },
                {
                  icon: <MessageSquareText className="size-5" />,
                  title: "Chat Commands",
                  desc: "Master conversational trading",
                  progress: 60,
                },
                {
                  icon: <Lightbulb className="size-5" />,
                  title: "Automation Guide",
                  desc: "Set up your first automation",
                  progress: 30,
                },
              ].map((tutorial) => (
                <Card
                  key={tutorial.title}
                  className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <CardContent className="space-y-3 pt-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {tutorial.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tutorial.title}</p>
                      <p className="text-xs text-muted-foreground">{tutorial.desc}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Progress</span>
                        <span>{tutorial.progress}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${tutorial.progress}%` }}
                          transition={{ duration: 0.6, delay: 0.3 }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </SectionCard>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}

export default function HelpPage() {
  return <HelpContent />;
}
