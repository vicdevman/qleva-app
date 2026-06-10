import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFriendlyScheduleDescription(schedule: any, frequency?: string, startDateText?: string): string {
  if (schedule) {
    const mode = schedule.mode;
    const dateText = startDateText || schedule.startDateText || "";
    
    if (mode === "once") {
      return `One-time: ${dateText || "Scheduled execution"}`;
    } else {
      if (dateText) {
        let clean = dateText.trim();
        clean = clean.charAt(0).toUpperCase() + clean.slice(1);
        if (clean.toLowerCase().startsWith("every") || clean.toLowerCase().startsWith("daily") || clean.toLowerCase().startsWith("weekly") || clean.toLowerCase().startsWith("monthly")) {
          return clean;
        }
        const freq = schedule.recurrence?.frequency || frequency || "daily";
        const freqText = freq === "daily" ? "day" : freq === "weekly" ? "week" : freq === "monthly" ? "month" : freq;
        return `Every ${freqText} starting ${clean}`;
      }
      
      const freq = schedule.recurrence?.frequency || frequency || "daily";
      const freqText = freq === "daily" ? "Day" : freq === "weekly" ? "Week" : freq === "monthly" ? "Month" : freq;
      return `Every ${freqText}`;
    }
  }

  if (frequency) {
    if (frequency === "once") {
      return `One-time: ${startDateText || "Scheduled"}`;
    }
    const freqText = frequency === "daily" ? "Day" : frequency === "weekly" ? "Week" : frequency === "monthly" ? "Month" : frequency;
    return `Every ${freqText} ${startDateText ? `starting ${startDateText}` : ""}`;
  }

  return "Not scheduled";
}
