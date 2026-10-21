"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { COOKIE_SESSAO, criarToken, opcoesCookie } from "@/lib/sessao";

export type EstadoLogin = { erro?: string; email?: string };

const esquema = z.object({
  email: z.string().trim().toLowerCase().email(),
  senha: z.string().min(1),
});

export async function entrar(_: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const dados = esquema.safeParse(Object.fromEntries(formData));
  const email = String(formData.get("email") ?? "");
  if (!dados.success) return { erro: "Informe e-mail e senha.", email };

  const usuario = await db.usuario.findUnique({ where: { email: dados.data.email } });
  const senhaOk = usuario ? await bcrypt.compare(dados.data.senha, usuario.senhaHash) : false;
  if (!usuario || !senhaOk || !usuario.ativo) {
    return { erro: "E-mail ou senha inválidos.", email };
  }

  const token = await criarToken({ uid: usuario.id, papel: usuario.papel });
  (await cookies()).set(COOKIE_SESSAO, token, opcoesCookie);
  redirect(usuario.papel === "ATENDENTE" ? "/os/nova" : "/painel");
}

export async function sair() {
  (await cookies()).delete(COOKIE_SESSAO);
  redirect("/login");
}

export type EstadoPrimeiroAcesso = { erro?: string };

const esquemaDono = z.object({
  nome: z.string().trim().min(2, "Informe seu nome"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
});

// Só funciona enquanto o banco não tem nenhum usuário (instalação nova).
export async function criarPrimeiroDono(_: EstadoPrimeiroAcesso, formData: FormData): Promise<EstadoPrimeiroAcesso> {
  const dados = esquemaDono.safeParse(Object.fromEntries(formData));
  if (!dados.success) return { erro: dados.error.issues[0].message };

  const { senha, ...resto } = dados.data;
  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await db.$transaction(async (tx) => {
    if ((await tx.usuario.count()) > 0) return null;
    return tx.usuario.create({ data: { ...resto, senhaHash, papel: "DONO" } });
  });
  if (!usuario) redirect("/login");

  const token = await criarToken({ uid: usuario.id, papel: usuario.papel });
  (await cookies()).set(COOKIE_SESSAO, token, opcoesCookie);
  redirect("/painel");
}
