import { redirect } from "next/navigation";

/**
 * Customers arrive at /review from the printed QR code. Nothing else lives at
 * the root, so send visitors straight there.
 */
export default function Home() {
  redirect("/review");
}
