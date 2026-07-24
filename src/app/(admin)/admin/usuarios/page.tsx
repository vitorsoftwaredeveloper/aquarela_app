import type { Metadata } from "next";
import { UsuariosScreen } from "@/features/admin/usuarios/UsuariosScreen";

export const metadata: Metadata = { title: "Usuários" };

/** T-17 · Gestão de usuários (admin) — CAD-03. */
export default function UsuariosPage() {
  return <UsuariosScreen />;
}
