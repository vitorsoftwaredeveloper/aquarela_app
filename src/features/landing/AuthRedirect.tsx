"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { HOME_BY_ROLE } from "@/types/user";

export function AuthRedirect() {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && role) {
      router.replace(HOME_BY_ROLE[role]);
    }
  }, [isAuthenticated, role, router]);

  return null;
}
