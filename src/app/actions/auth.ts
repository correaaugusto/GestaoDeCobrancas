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
