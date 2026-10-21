import Link from "next/link";
import type { StatusCobranca, StatusConfirmacao } from "@prisma/client";
import { formatarData, formatarDia, formatarMoeda } from "@/lib/formato";
import { calcularSituacao } from "@/lib/situacao";
import { Badge, BadgeSituacao, Vazio } from "./ui";

export type LinhaOS = {
  id: string;
  numero: number;
  dataServico: Date;
  placa: string;
  totalCentavos: number;
  vencimento: Date | null;
  statusCobranca: StatusCobranca;
  statusConfirmacao: StatusConfirmacao;
  cliente: { razaoSocial: string; nomeFantasia: string | null };
};

export const selectLinhaOS = {
  id: true,
  numero: true,
  dataServico: true,
  placa: true,
  totalCentavos: true,
  vencimento: true,
  statusCobranca: true,
  statusConfirmacao: true,
  cliente: { select: { razaoSocial: true, nomeFantasia: true } },
} as const;

export function BadgeConfirmacao({ status }: { status: StatusConfirmacao }) {
  if (status === "CONFIRMADA") return <Badge cor="green">Confirmada</Badge>;
  if (status === "CONTESTADA") return <Badge cor="red">Contestada</Badge>;
  return <Badge cor="blue">Aguardando confirmação</Badge>;
}

export function ListaOS({ ordens, dataHoje, mostrarCliente = true }: { ordens: LinhaOS[]; dataHoje: Date; mostrarCliente?: boolean }) {
  if (ordens.length === 0) return <Vazio>Nenhuma ordem de serviço encontrada.</Vazio>;

  return (
    <ul className="divide-y divide-zinc-100">
      {ordens.map((os) => (
        <li key={os.id}>
          <Link href={`/os/${os.id}`} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 px-4 py-3 hover:bg-zinc-50 md:grid-cols-[5rem_1fr_7rem_7rem_8rem] md:items-center">
            <span className="font-mono text-sm text-zinc-500 md:order-none">#{os.numero}</span>
            <span className="text-right font-medium md:order-3 md:text-right">{formatarMoeda(os.totalCentavos)}</span>
            <span className="min-w-0 md:order-1">
              <span className="block truncate font-medium">
                {mostrarCliente ? os.cliente.nomeFantasia || os.cliente.razaoSocial : `Placa ${os.placa}`}
              </span>
              <span className="block text-xs text-zinc-500">
                {formatarData(os.dataServico)}
                {mostrarCliente && ` · ${os.placa}`}
                {os.statusConfirmacao !== "CONFIRMADA" && os.statusCobranca !== "CANCELADA" && (
                  <> · <BadgeConfirmacao status={os.statusConfirmacao} /></>
                )}
              </span>
            </span>
            <span className="text-right md:order-4 md:text-right">
              <BadgeSituacao situacao={calcularSituacao(os, dataHoje)} />
            </span>
            <span className="hidden text-sm text-zinc-500 md:order-2 md:block">
              {os.vencimento ? `Vence ${formatarDia(os.vencimento)}` : "—"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
