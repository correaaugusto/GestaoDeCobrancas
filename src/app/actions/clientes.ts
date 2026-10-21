"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { exigirUsuario, PODE_COBRAR } from "@/lib/auth";
import { apenasDigitos } from "@/lib/formato";

export type EstadoCliente = { erros?: Partial<Record<string, string>>; erro?: string };

const opcional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v));

const esquema = z.object({
  razaoSocial: z.string().trim().min(2, "Informe a razão social"),
  nomeFantasia: opcional,
  cnpj: opcional
    .transform((v) => (v ? apenasDigitos(v) : null))
    .refine((v) => !v || v.length === 14, "CNPJ deve ter 14 dígitos"),
  telefone: opcional
    .transform((v) => (v ? apenasDigitos(v) : null))
    .refine((v) => !v || v.length >= 10, "Telefone com DDD"),
  email: opcional.refine((v) => !v || z.string().email().safeParse(v).success, "E-mail inválido"),
  prazoPagamentoDias: z.coerce.number().int().min(0, "Prazo inválido").max(365, "Prazo inválido"),
  observacoes: opcional,
});

export async function salvarCliente(
  id: string | null,
  voltarPara: string | null,
  _: EstadoCliente,
  formData: FormData,
): Promise<EstadoCliente> {
  // Atendentes podem cadastrar empresas novas no balcão; só financeiro/dono editam.
  await exigirUsuario(id ? PODE_COBRAR : undefined);

  const dados = esquema.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    const erros: Record<string, string> = {};
    for (const issue of dados.error.issues) erros[String(issue.path[0])] ??= issue.message;
    return { erros };
  }

  let clienteId = id;
  try {
    if (id) {
      await db.cliente.update({ where: { id }, data: dados.data });
    } else {
      clienteId = (await db.cliente.create({ data: dados.data })).id;
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { erros: { cnpj: "Já existe um cliente com este CNPJ" } };
    }
    throw e;
  }

  revalidatePath("/clientes");
  if (voltarPara?.startsWith("/os/nova")) redirect(`/os/nova?cliente=${clienteId}`);
  redirect(`/clientes/${clienteId}`);
}

export async function alternarAtivoCliente(id: string) {
  await exigirUsuario(PODE_COBRAR);
  const cliente = await db.cliente.findUniqueOrThrow({ where: { id }, select: { ativo: true } });
  await db.cliente.update({ where: { id }, data: { ativo: !cliente.ativo } });
  revalidatePath(`/clientes/${id}`);
}
