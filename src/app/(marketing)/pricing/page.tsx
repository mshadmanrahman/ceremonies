import { redirect } from "next/navigation";

export const metadata = {
  title: "Pricing | Ceremonies",
  description: "Simple, transparent pricing for Ceremonies, the open-source agile ceremony toolkit.",
};

export default function PricingPage() {
  redirect("/#pricing");
}
