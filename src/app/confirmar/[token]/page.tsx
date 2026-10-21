import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { empresa } from "@/lib/empresa";
import { formatarDataHora, formatarDia, formatarMoeda, formatarQuantidade } from "@/lib/formato";
import { Cartao, estiloBotao } from "@/components/ui";
import { FormConfirmacao } from "./form-confirmacao";

export const metadata: Metadata = { title: "Confirmação de serviço", robots: { index: false } };

async function Conteudo({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const os = await db.ordemServico.findUnique({
    where: { tokenPublico: token },
    include: { cliente: true, itens: { orderBy: { id: "asc" } } },
  });
  if (!os) notFound();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-zinc-500">{empresa.nome}</p>
        <h1 className="text-xl font-semibold">Ordem de serviço nº {os.numero}</h1>
        <p className="text-sm text-zinc-500">
          {os.cliente.razaoSocial} · {formatarDataHora(os.dataServico)}
        </p>
      </div>

      <Cartao>
        <dl className="mb-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-zinc-500">Placa</dt>
            <dd className="font-medium">{os.placa}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Motorista</dt>
            <dd className="font-medium">{os.motoristaNome}</dd>
          </div>
        </dl>
        <ul className="divide-y divide-zinc-100 text-sm">
          {os.itens.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 py-2">
              <span>
                {formatarQuantidade(i.quantidade)}× {i.descricao}
              </span>
              <span className="shrink-0">{formatarMoeda(i.subtotalCentavos)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-zinc-200 pt-3">
          <span className="text-zinc-500">Total</span>
          <span className="text-lg font-semibold">{formatarMoeda(os.totalCentavos)}</span>
        </div>
        {os.statusCobranca === "ABERTA" && os.vencimento && (
          <p className="mt-2 text-sm text-zinc-600">Vencimento: {formatarDia(os.vencimento)}</p>
        )}
        {os.statusCobranca === "PAGA" && <p className="mt-2 text-sm font-medium text-green-700">Pagamento recebido. Obrigado!</p>}
      </Cartao>

      <div className="grid gap-2 sm:grid-cols-2">
        <a href={`/api/publico/${token}/pdf`} target="_blank" className={estiloBotao.secundario}>
          Ver OS em PDF (com assinatura e documento)
        </a>
        {os.notaFiscalId && (
          <a href={`/api/publico/${token}/nf`} target="_blank" className={estiloBotao.secundario}>
            Ver nota fiscal{os.notaFiscalNumero ? ` nº ${os.notaFiscalNumero}` : ""}
          </a>
        )}
      </div>

      {os.statusCobranca === "CANCELADA" ? (
        <Cartao>
          <p className="text-sm">Esta ordem de serviço foi cancelada.</p>
        </Cartao>
      ) : os.statusConfirmacao === "AGUARDANDO" ? (
        <Cartao titulo="Confirme o serviço">
          <FormConfirmacao token={token} />
        </Cartao>
      ) : (
        <Cartao>
          <p className={`text-sm font-medium ${os.statusConfirmacao === "CONFIRMADA" ? "text-green-700" : "text-red-700"}`}>
            {os.statusConfirmacao === "CONFIRMADA" ? "Serviço confirmado" : "Serviço contestado"} por {os.confirmacaoNome} em{" "}
            {os.confirmacaoEm && formatarDataHora(os.confirmacaoEm)}.
          </p>
          {os.contestacaoMotivo && <p className="mt-1 text-sm text-zinc-600">“{os.contestacaoMotivo}”</p>}
        </Cartao>
      )}

      {empresa.telefone && <p className="text-center text-xs text-zinc-500">Dúvidas: {empresa.telefone}</p>}
    </div>
  );
}

export default function Confirmar({ params }: PageProps<"/confirmar/[token]">) {
  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-zinc-200/70" />}>
        <Conteudo params={params} />
      </Suspense>
    </main>
  );
}
