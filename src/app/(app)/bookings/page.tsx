import { redirect } from "next/navigation";

/** Canonical route is `/history`. */
export default function BookingsRedirectPage() {
  redirect("/history");
}
