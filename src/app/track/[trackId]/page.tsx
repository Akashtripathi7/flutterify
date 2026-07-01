import { redirect } from "next/navigation";

// Tracks were replaced by the blended day-wise plan. Redirect any old links.
export default function LegacyTrack() {
  redirect("/dashboard");
}
