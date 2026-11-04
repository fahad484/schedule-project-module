import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// export function formatDate(date: Date | string): string {
//   return new Date(date).toLocaleDateString("en-US", {
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });
// }

// export function formatTime(time: string): string {
//   const [hours, minutes] = time.split(":");
//   const h = parseInt(hours, 10);
//   const ampm = h >= 12 ? "PM" : "AM";
//   const hour12 = h % 12 || 12;
//   return `${hour12}:${minutes} ${ampm}`;
// }


export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "Date unavailable";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(value: string | null | undefined): string {
  if (!value || typeof value !== "string") {
    return "Time unavailable";
  }

  // Accept HH:mm and HH:mm:ss formats.
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/);

  if (!match) return "Time unavailable";

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return "Time unavailable";

  const hour12 = hours % 12 || 12;
  const ampm = hours >= 12 ? "PM" : "AM";

  return `${hour12}:${String(minutes).padStart(2, "0")} ${ampm}`;
}


export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const slotStartH = Math.floor(currentMinutes / 60);
    const slotStartM = currentMinutes % 60;
    const slotEndMinutes = currentMinutes + durationMinutes;
    const slotEndH = Math.floor(slotEndMinutes / 60);
    const slotEndM = slotEndMinutes % 60;

    slots.push({
      start: `${String(slotStartH).padStart(2, "0")}:${String(slotStartM).padStart(2, "0")}`,
      end: `${String(slotEndH).padStart(2, "0")}:${String(slotEndM).padStart(2, "0")}`,
    });

    currentMinutes += durationMinutes;
  }

  return slots;
}





export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// export function getDayOfWeek(date: Date | string): string {
//   const days = [
//     "sunday",
//     "monday",
//     "tuesday",
//     "wednesday",
//     "thursday",
//     "friday",
//     "saturday",
//   ];
//   return days[new Date(date).getDay()];
// }


export function getDayOfWeek(date: Date | string): string {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  let parsedDate: Date;

  if (typeof date === "string") {
    // Handle date-only strings as local dates, not UTC.
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (match) {
      const [, year, month, day] = match;
      parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
    } else {
      parsedDate = new Date(date);
    }
  } else {
    parsedDate = date;
  }

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Invalid date provided");
  }

  return days[parsedDate.getDay()];
}

//to display doctor appointment fee in INR
export function formatCurrency(amount: number | string): string {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return "₹0.00";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}