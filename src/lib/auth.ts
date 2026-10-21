import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Papel } from "@prisma/client";
import { db } from "./db";
import { COOKIE_SESSAO, lerToken } from "./sessao";

export type UsuarioAtual = { id: string; nome: string; email: string; papel: Papel };

// Camada de acesso: toda página e action passa por aqui antes de tocar nos dados.
export const getUsuario = cache(async (): Promise<UsuarioAtual | null> => {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  const sessao = await lerToken(token);
  if (!sessao) return null;

  const usuario = await db.usuario.findUnique({
    where: { id: sessao.uid },
    select: { id: true, nome: true, email: true, papel: true, ativo: true },
  });
  if (!usuario?.ativo) return null;

  return { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel };
});

export async function exigirUsuario(papeis?: Papel[]): Promise<UsuarioAtual> {
  const usuario = await getUsuario();
  if (!usuario) redirect("/login");
  if (papeis && !papeis.includes(usuario.papel)) redirect("/sem-permissao");
  return usuario;
}

export const PODE_COBRAR: Papel[] = ["DONO", "FINANCEIRO"];
export const SO_DONO: Papel[] = ["DONO"];

export function podeCobrar(papel: Papel) {
  return PODE_COBRAR.includes(papel);
}
