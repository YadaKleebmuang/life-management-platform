import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateThai(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "dd MMM yyyy", { locale: th });
  } catch {
    return dateString;
  }
}
