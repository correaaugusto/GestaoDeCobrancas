"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigirUsuario, PODE_COBRAR, SO_DONO } from "@/lib/auth";
import { salvarArquivo } from "@/lib/storage";
import { formatarPlaca, hoje, inputParaDia, paraCentavos, somarDias } from "@/lib/formato";

export type EstadoForm = { erro?: string; erros?: Partial<Record<string, string>>; ok?: string };

function arquivoEnviado(valor: FormDataEntryValue | null): File | null {
  return valor instanceof File && valor.size > 0 ? valor : null;
}

const esquemaItem = z.object({
  tipo: z.enum(["SERVICO", "PECA"]),
  descricao: z.string().trim().min(1, "Descreva o item"),
  quantidade: z.coerce.number().positive("Quantidade inválida"),
  valorUnitario: z.string(),
});

const esquemaOS = z.object({
  clienteId: z.string().min(1, "Escolha a empresa"),
  motoristaNome: z.string().trim().min(2, "Informe o nome do motorista"),
  motoristaDocumento: z.string().trim(),
  placa: z
    .string()
    .transform(formatarPlaca)
    .refine((p) => /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(p), "Placa inválida"),
  veiculoDescricao: z.string().trim(),
  observacoes: z.string().trim(),
});

export async function criarOS(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const usuario = await exigirUsuario();

  const campos = esquemaOS.safeParse({
    clienteId: formData.get("clienteId") ?? "",
    motoristaNome: formData.get("motoristaNome") ?? "",
    motoristaDocumento: formData.get("motoristaDocumento") ?? "",
    placa: formData.get("placa") ?? "",
    veiculoDescricao: formData.get("veiculoDescricao") ?? "",
    observacoes: formData.get("observacoes") ?? "",
  });
  const erros: Record<string, string> = {};
  if (!campos.success) {
    for (const issue of campos.error.issues) erros[String(issue.path[0])] ??= issue.message;
  }

  let itensBrutos: unknown = [];
  try {
    itensBrutos = JSON.parse(String(formData.get("itens") ?? "[]"));
  } catch {}
  const itens = z.array(esquemaItem).min(1, "Adicione pelo menos um serviço ou peça").safeParse(itensBrutos);
  const itensCalculados = itens.success
    ? itens.data.map((i) => {
        const valorUnitarioCentavos = paraCentavos(i.valorUnitario);
        return {
          tipo: i.tipo,
          descricao: i.descricao,
          quantidade: i.quantidade,
          valorUnitarioCentavos,
          subtotalCentavos: Math.round(i.quantidade * valorUnitarioCentavos),
        };
      })
    : [];
  if (!itens.success) erros.itens = itens.error.issues[0].message;
  else if (itensCalculados.some((i) => !Number.isFinite(i.valorUnitarioCentavos) || i.valorUnitarioCentavos < 0)) {
    erros.itens = "Confira os valores dos itens";
  }

  const assinatura = arquivoEnviado(formData.get("assinatura"));
  const documento = arquivoEnviado(formData.get("documentoVeiculo"));
  if (!assinatura) erros.assinatura = "Peça para o motorista assinar";
  if (!documento) erros.documentoVeiculo = "Fotografe ou anexe o documento do veículo";

  if (Object.keys(erros).length > 0 || !campos.success) {
    return { erros, erro: "Confira os campos destacados." };
  }

  const cliente = await db.cliente.findUnique({ where: { id: campos.data.clienteId } });
  if (!cliente) return { erros: { clienteId: "Empresa não encontrada" } };

  let arquivoAssinatura, arquivoDocumento;
  try {
    const pasta = `os/${new Date().toISOString().slice(0, 7)}`;
    arquivoAssinatura = await salvarArquivo(assinatura!, `${pasta}/assinatura`);
    arquivoDocumento = await salvarArquivo(documento!, `${pasta}/documento`);
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao salvar arquivos" };
  }

  const { motoristaDocumento, veiculoDescricao, observacoes, ...resto } = campos.data;
  const os = await db.ordemServico.create({
    data: {
      ...resto,
      motoristaDocumento: motoristaDocumento || null,
      veiculoDescricao: veiculoDescricao || null,
      observacoes: observacoes || null,
      criadoPorId: usuario.id,
      totalCentavos: itensCalculados.reduce((soma, i) => soma + i.subtotalCentavos, 0),
      itens: { create: itensCalculados },
      assinaturaId: arquivoAssinatura.id,
      documentoVeiculoId: arquivoDocumento.id,
      tokenPublico: randomBytes(18).toString("base64url"),
      vencimento: somarDias(hoje(), cliente.prazoPagamentoDias),
    },
  });

  revalidatePath("/os");
  redirect(`/os/${os.id}?criada=1`);
}

export async function atualizarCobranca(osId: string, _: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirUsuario(PODE_COBRAR);

  const vencimento = inputParaDia(String(formData.get("vencimento") ?? ""));
  const notaFiscalNumero = String(formData.get("notaFiscalNumero") ?? "").trim() || null;
  const nf = arquivoEnviado(formData.get("notaFiscal"));

  let notaFiscalId: string | undefined;
  if (nf) {
    try {
      notaFiscalId = (await salvarArquivo(nf, `os/${osId}/nf`)).id;
    } catch (e) {
      return { erro: e instanceof Error ? e.message : "Falha ao salvar a NF" };
    }
  }

  await db.ordemServico.update({
    where: { id: osId, statusCobranca: "ABERTA" },
    data: { vencimento, notaFiscalNumero, ...(notaFiscalId && { notaFiscalId }) },
  });
  revalidatePath(`/os/${osId}`);
  return { ok: "Cobrança atualizada." };
}

export async function marcarCobrancaEnviada(osId: string) {
  await exigirUsuario(PODE_COBRAR);
  await db.ordemServico.updateMany({
    where: { id: osId, cobrancaEnviadaEm: null },
    data: { cobrancaEnviadaEm: new Date() },
  });
  revalidatePath(`/os/${osId}`);
}

export async function registrarPagamento(osId: string, _: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const usuario = await exigirUsuario(PODE_COBRAR);

  const pagoEm = inputParaDia(String(formData.get("pagoEm") ?? ""));
  const valor = paraCentavos(String(formData.get("valorPago") ?? ""));
  const comprovante = arquivoEnviado(formData.get("comprovante"));

  const erros: Record<string, string> = {};
  if (!pagoEm) erros.pagoEm = "Informe a data do pagamento";
  if (!Number.isFinite(valor) || valor <= 0) erros.valorPago = "Informe o valor recebido";
  if (!comprovante) erros.comprovante = "Anexe o comprovante";
  if (Object.keys(erros).length) return { erros };

  let comprovanteId: string;
  try {
    comprovanteId = (await salvarArquivo(comprovante!, `os/${osId}/comprovante`)).id;
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao salvar o comprovante" };
  }

  await db.ordemServico.update({
    where: { id: osId, statusCobranca: "ABERTA" },
    data: {
      statusCobranca: "PAGA",
      pagoEm,
      valorPagoCentavos: valor,
      comprovanteId,
      pagamentoPorId: usuario.id,
    },
  });
  revalidatePath(`/os/${osId}`);
  return { ok: "Pagamento registrado." };
}

export async function desfazerPagamento(osId: string) {
  await exigirUsuario(SO_DONO);
  await db.ordemServico.update({
    where: { id: osId, statusCobranca: "PAGA" },
    data: { statusCobranca: "ABERTA", pagoEm: null, valorPagoCentavos: null, comprovanteId: null, pagamentoPorId: null },
  });
  revalidatePath(`/os/${osId}`);
}

export async function cancelarOS(osId: string, _: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirUsuario(PODE_COBRAR);
  const motivo = String(formData.get("motivo") ?? "").trim();
  if (motivo.length < 3) return { erros: { motivo: "Informe o motivo do cancelamento" } };

  await db.ordemServico.update({
    where: { id: osId, statusCobranca: "ABERTA" },
    data: { statusCobranca: "CANCELADA", canceladaEm: new Date(), cancelamentoMotivo: motivo },
  });
  revalidatePath(`/os/${osId}`);
  return { ok: "OS cancelada." };
}

// Ação pública: chamada pela empresa cliente a partir do link enviado no WhatsApp.
export async function responderConfirmacao(token: string, _: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const nome = String(formData.get("nome") ?? "").trim();
  const resposta = formData.get("resposta");
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (nome.length < 3) return { erros: { nome: "Informe seu nome" } };
  if (resposta === "CONTESTADA" && motivo.length < 5) {
    return { erros: { motivo: "Explique o que está incorreto" } };
  }
  if (resposta !== "CONFIRMADA" && resposta !== "CONTESTADA") return { erro: "Resposta inválida" };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? null;

  const { count } = await db.ordemServico.updateMany({
    where: { tokenPublico: token, statusConfirmacao: "AGUARDANDO", statusCobranca: { not: "CANCELADA" } },
    data: {
      statusConfirmacao: resposta,
      confirmacaoNome: nome,
      confirmacaoEm: new Date(),
      confirmacaoIp: ip,
      contestacaoMotivo: resposta === "CONTESTADA" ? motivo : null,
    },
  });
  if (count === 0) return { erro: "Esta ordem de serviço já foi respondida." };

  revalidatePath(`/confirmar/${token}`);
  return { ok: resposta === "CONFIRMADA" ? "Serviço confirmado. Obrigado!" : "Contestação registrada. Entraremos em contato." };
}
