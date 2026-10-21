import { redirect } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";

export default async function Inicio() {
  const usuario = await exigirUsuario();
  redirect(usuario.papel === "ATENDENTE" ? "/os/nova" : "/painel");
}
