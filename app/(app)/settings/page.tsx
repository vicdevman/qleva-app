"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Shield,
  Zap,
  DollarSign,
  AlertTriangle,
  Save,
  Settings,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { SectionCard } from "@/components/shared/section-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/lib/query-hooks";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function SettingsContent() {
  const { data: settings, isLoading } = useSettings();
  const [localSettings, setLocalSettings] = React.useState(settings);

  React.useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  const updateNotifications = (key: string, value: boolean) => {
    setLocalSettings((prev) => ({
      ...prev!,
      notifications: { ...prev!.notifications, [key]: value },
    }));
  };

  const updateApprovals = (key: string, value: number | boolean) => {
    setLocalSettings((prev) => ({
      ...prev!,
      approvals: { ...prev!.approvals, [key]: value },
    }));
  };

  const updateAutomation = (key: string, value: number | boolean) => {
    setLocalSettings((prev) => ({
      ...prev!,
      automation: { ...prev!.automation, [key]: value },
    }));
  };

  const updateSpendingLimits = (key: string, value: number) => {
    setLocalSettings((prev) => ({
      ...prev!,
      spendingLimits: { ...prev!.spendingLimits, [key]: value },
    }));
  };

  return (
    <AppShell>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
              User preferences, security, and automation controls
            </p>
          </div>
          <Button size="sm" className="gap-2">
            <Save className="size-3.5" />
            Save Changes
          </Button>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Notifications */}
          <motion.div variants={item}>
            <SectionCard
              title="Notifications"
              description="Configure how you receive alerts"
              delay={0.1}
            >
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="space-y-4">
                  {[
                    { key: "executionAlerts", label: "Execution Alerts", desc: "When automations execute" },
                    { key: "failureAlerts", label: "Failure Alerts", desc: "When automations fail" },
                    { key: "priceAlerts", label: "Price Alerts", desc: "Market price triggers" },
                    { key: "weeklyDigest", label: "Weekly Digest", desc: "Summary every Monday" },
                    { key: "emailNotifications", label: "Email Notifications", desc: "Receive via email" },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{setting.label}</p>
                        <p className="text-xs text-muted-foreground">{setting.desc}</p>
                      </div>
                      <Switch
                        checked={
                          localSettings?.notifications[
                            setting.key as keyof typeof localSettings.notifications
                          ] ?? false
                        }
                        onCheckedChange={(v) => updateNotifications(setting.key, v)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </motion.div>

          {/* Approval Settings */}
          <motion.div variants={item}>
            <SectionCard
              title="Approval Settings"
              description="Control when approvals are required"
              delay={0.15}
            >
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Require approval above</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        className="h-8 w-24"
                        value={localSettings?.approvals.requireApprovalAbove ?? 100}
                        onChange={(e) => updateApprovals("requireApprovalAbove", Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Auto-approve below</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        className="h-8 w-24"
                        value={localSettings?.approvals.autoApproveBelow ?? 50}
                        onChange={(e) => updateApprovals("autoApproveBelow", Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Require Confirmation</p>
                      <p className="text-xs text-muted-foreground">Confirm before every execution</p>
                    </div>
                    <Switch
                      checked={localSettings?.approvals.requireConfirmation ?? true}
                      onCheckedChange={(v) => updateApprovals("requireConfirmation", v)}
                    />
                  </div>
                </div>
              )}
            </SectionCard>
          </motion.div>

          {/* Automation Permissions */}
          <motion.div variants={item}>
            <SectionCard
              title="Automation Limits"
              description="Safety controls for automations"
              delay={0.2}
            >
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Max daily executions</Label>
                    <Input
                      type="number"
                      className="mt-1 h-8 w-24"
                      value={localSettings?.automation.maxDailyExecutions ?? 10}
                      onChange={(e) => updateAutomation("maxDailyExecutions", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Max daily spend</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        className="h-8 w-24"
                        value={localSettings?.automation.maxDailySpend ?? 500}
                        onChange={(e) => updateAutomation("maxDailySpend", Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-destructive" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Emergency Pause</p>
                        <p className="text-xs text-muted-foreground">Stop all automations immediately</p>
                      </div>
                    </div>
                    <Switch
                      checked={localSettings?.automation.emergencyPause ?? false}
                      onCheckedChange={(v) => updateAutomation("emergencyPause", v)}
                    />
                  </div>
                </div>
              )}
            </SectionCard>
          </motion.div>

          {/* Spending Limits */}
          <motion.div variants={item}>
            <SectionCard
              title="Spending Limits"
              description="Set your spending boundaries"
              delay={0.25}
            >
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="space-y-4">
                  {[
                    { key: "daily", label: "Daily Limit" },
                    { key: "weekly", label: "Weekly Limit" },
                    { key: "monthly", label: "Monthly Limit" },
                  ].map((limit) => (
                    <div key={limit.key}>
                      <Label className="text-sm">{limit.label}</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                          type="number"
                          className="h-8 w-32"
                          value={
                            localSettings?.spendingLimits[
                              limit.key as keyof typeof localSettings.spendingLimits
                            ] ?? 0
                          }
                          onChange={(e) => updateSpendingLimits(limit.key, Number(e.target.value))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </motion.div>
        </div>
      </motion.div>
    </AppShell>
  );
}

export default function SettingsPage() {
  return <SettingsContent />;
}
