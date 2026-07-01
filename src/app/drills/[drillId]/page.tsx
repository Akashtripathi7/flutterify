import { redirect } from "next/navigation";

// Drills are locked for now — any deep link bounces to the locked drills page.
export default function DrillPage() {
  redirect("/drills");
}
