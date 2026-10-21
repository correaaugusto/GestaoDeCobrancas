"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { exigirUsuario, SO_DONO } from "@/lib/auth";

export type EstadoUsuario = { erro?: string; ok?: string };

const esquema = z.object({
  nome: z.string().trim().min(2, "Informe o nome"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres"),
  papel: z.enum(["DONO", "FINANCEIRO", "ATENDENTE"]),
});

export async function criarUsuario(_: EstadoUsuario, formData: FormData): Promise<EstadoUsuario> {
  await exigirUsuario(SO_DONO);
  const dados = esquema.safeParse(Object.fromEntries(formData));
  if (!dados.success) return { erro: dados.error.issues[0].message };

  const { senha, ...resto } = dados.data;
  try {
    await db.usuario.create({ data: { ...resto, senhaHash: await bcrypt.hash(senha, 10) } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { erro: "Já existe um usuário com este e-mail." };
    }
    throw e;
  }
  revalidatePath("/usuarios");
  return { ok: `Usuário ${resto.nome} criado.` };
}

export async function alternarAtivoUsuario(id: string) {
  const eu = await exigirUsuario(SO_DONO);
  if (id === eu.id) return; // não deixa o dono se trancar fora
  const u = await db.usuario.findUniqueOrThrow({ where: { id }, select: { ativo: true } });
  await db.usuario.update({ where: { id }, data: { ativo: !u.ativo } });
  revalidatePath("/usuarios");
}

export async function redefinirSenha(id: string, _: EstadoUsuario, formData: FormData): Promise<EstadoUsuario> {
  await exigirUsuario(SO_DONO);
  const senha = String(formData.get("senha") ?? "");
  if (senha.length < 6) return { erro: "Mínimo de 6 caracteres." };
  await db.usuario.update({ where: { id }, data: { senhaHash: await bcrypt.hash(senha, 10) } });
  return { ok: "Senha alterada." };
}
