import type { Metadata } from "next";
import { LoginScreen } from "@/features/auth/LoginScreen";

export const metadata: Metadata = { title: "Entrar" };

/** T-03 · Login (Cognito/Amplify v6) — épico 0 (INF-08). */
export default function LoginPage() {
  return <LoginScreen />;
}
