// Dates are formatted by hand (not `Intl`) so output is identical on every engine and locale.

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const startOfDay = (date: Date): number => {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
};

/** `"12 Oct 2026"` */
export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/** `"3:05 PM"` */
export const formatTime = (iso: string): string => {
  const d = new Date(iso);
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${minutes} ${suffix}`;
};

/** `"12 Oct 2026, 3:05 PM"` */
export const formatDateTime = (iso: string): string => {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
};

/** `"Today"`, `"Yesterday"` or a full date. */
export const formatDayLabel = (iso: string, now: Date = new Date()): string => {
  const diffDays = Math.round(
    (startOfDay(now) - startOfDay(new Date(iso))) / 86_400_000,
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return formatDate(iso);
};

/** Calendar day of an ISO timestamp, in local time. */
export const dayKey = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** `"1234567890"` → `"•••• 7890"`. */
export const maskAccountNumber = (accountNumber: string): string => {
  const digits = accountNumber.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  return `•••• ${digits.slice(-4)}`;
};

export const formatAccountNumber = (accountNumber: string): string => {
  return accountNumber.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");
};

/** `"0123456789"` → `"012-345 6789"`. */
export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("60") ? `0${digits.slice(2)}` : digits;
  if (local.length < 10) return local;
  return `${local.slice(0, 3)}-${local.slice(3, local.length - 4)} ${local.slice(-4)}`;
};

export const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
};

export const greeting = (now: Date = new Date()): string => {
  const h = now.getHours();
  if (typeof h !== "number") return "Hello";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

/** Trim + lower-case. Apply to both the query and the text being searched. */
export const normaliseSearchText = (text: string): string => {
  return text.trim().toLowerCase();
};
