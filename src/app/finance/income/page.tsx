import { redirect } from "next/navigation";

export default function IncomePage() {
  redirect("/finance/transactions?type=income");
}
