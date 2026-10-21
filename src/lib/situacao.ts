import type { Prisma, StatusCobranca } from "@prisma/client";

// Situação exibida para o usuário, derivada do status + vencimento.
export type Situacao = "PAGA" | "VENCIDA" | "A_VENCER" | "SEM_VENCIMENTO" | "CANCELADA";

export const ROTULO_SITUACAO: Record<Situacao, string> = {
  PAGA: "Paga",
  VENCIDA: "Vencida",
  A_VENCER: "A vencer",
  SEM_VENCIMENTO: "Sem vencimento",
  CANCELADA: "Cancelada",
};

export function calcularSituacao(
  os: { statusCobranca: StatusCobranca; vencimento: Date | null },
  dataHoje: Date,
): Situacao {
  if (os.statusCobranca === "CANCELADA") return "CANCELADA";
  if (os.statusCobranca === "PAGA") return "PAGA";
  if (!os.vencimento) return "SEM_VENCIMENTO";
  return os.vencimento < dataHoje ? "VENCIDA" : "A_VENCER";
}

export function filtroSituacao(situacao: Situacao, dataHoje: Date): Prisma.OrdemServicoWhereInput {
  switch (situacao) {
    case "PAGA":
      return { statusCobranca: "PAGA" };
    case "CANCELADA":
      return { statusCobranca: "CANCELADA" };
    case "VENCIDA":
      return { statusCobranca: "ABERTA", vencimento: { lt: dataHoje } };
    case "A_VENCER":
      return { statusCobranca: "ABERTA", vencimento: { gte: dataHoje } };
    case "SEM_VENCIMENTO":
      return { statusCobranca: "ABERTA", vencimento: null };
  }
}

export function ehSituacao(valor: unknown): valor is Situacao {
  return typeof valor === "string" && valor in ROTULO_SITUACAO;
}
