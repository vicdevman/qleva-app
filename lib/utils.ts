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
      const recurrence = schedule.recurrence || {};
      const freq = recurrence.frequency || frequency || "daily";
      const interval = recurrence.interval || 1;
      
      let freqText = "";
      if (interval > 1) {
        const unit = freq === "daily" ? "days" : freq === "weekly" ? "weeks" : freq === "monthly" ? "months" : freq;
        freqText = `${interval} ${unit}`;
      } else {
        freqText = freq === "daily" ? "day" : freq === "weekly" ? "week" : freq === "monthly" ? "month" : freq;
      }

      if (dateText) {
        let clean = dateText.trim();
        clean = clean.charAt(0).toUpperCase() + clean.slice(1);
        if (clean.toLowerCase().startsWith("every") || clean.toLowerCase().startsWith("daily") || clean.toLowerCase().startsWith("weekly") || clean.toLowerCase().startsWith("monthly")) {
          if (interval > 1 && !clean.includes(String(interval))) {
            // Bypass clean and format below to include the interval
          } else {
            return clean;
          }
        }
        return `Every ${freqText} starting ${clean}`;
      }
      
      return `Every ${freqText.charAt(0).toUpperCase() + freqText.slice(1)}`;
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
