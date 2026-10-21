import { connection } from "next/server";
import { db } from "@/lib/db";

const VARIAVEIS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "SESSION_SECRET",
  "STORAGE_DRIVER",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "EMPRESA_NOME",
];

// Diagnóstico público: diz o que está configurado e se o banco responde,
// sem expor nenhum valor (senhas em URLs são removidas das mensagens).
export async function GET() {
  await connection();

  const variaveis = Object.fromEntries(
    VARIAVEIS.map((nome) => {
      const valor = process.env[nome];
      if (!valor) return [nome, "FALTANDO"];
      if (valor !== valor.trim()) return [nome, "TEM ESPAÇO NO INÍCIO OU NO FIM"];
      return [nome, "ok"];
    }),
  );
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (url && !url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    variaveis.DATABASE_URL = "não começa com postgresql://";
  }
  if ((process.env.SESSION_SECRET ?? "").length > 0 && process.env.SESSION_SECRET!.length < 32) {
    variaveis.SESSION_SECRET = "curto demais (mínimo 32 caracteres)";
  }

  let banco: string;
  try {
    const usuarios = await db.usuario.count();
    banco = `ok (${usuarios} usuário(s))`;
  } catch (e) {
    banco = String(e instanceof Error ? e.message : e)
      .replace(/postgres(ql)?:\/\/[^\s"']+/g, "postgresql://***")
      .slice(0, 1500);
  }

  return Response.json({ variaveis, banco }, { headers: { "Cache-Control": "no-store" } });
}
