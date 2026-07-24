"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/Button/Button";

/** Encerra a sessão do Cognito e volta ao login. */
export function SignOutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  async function handle() {
    await logout();
    router.replace("/login");
  }

  return (
    <Button variant="secondary" size="sm" onClick={handle}>
      <LogOut size={16} /> Sair
    </Button>
  );
}
