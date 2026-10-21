import Link from "next/link";
import type { Metadata } from "next";
import type { TipoItem } from "@prisma/client";
import { exigirUsuario, PODE_COBRAR } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatarDia, formatarMoeda, formatarQuantidade, hoje } from "@/lib/formato";
import { Cabecalho, Cartao, Input, Vazio } from "@/components/ui";

export const metadata: Metadata = { title: "Painel" };

// Brasil não tem mais horário de verão, então -03:00 é seguro para os limites do mês.
function limitesMes(mes: string) {
  const [ano, m] = mes.split("-").map(Number);
  const proximo = m === 12 ? `${ano + 1}-01` : `${ano}-${String(m + 1).padStart(2, "0")}`;
  return {
    inicio: new Date(`${mes}-01T00:00:00-03:00`),
    fim: new Date(`${proximo}-01T00:00:00-03:00`),
    inicioDia: new Date(`${mes}-01T00:00:00Z`),
    fimDia: new Date(`${proximo}-01T00:00:00Z`),
  };
}

function Indicador({ rotulo, valor, detalhe, cor, href }: { rotulo: string; valor: string; detalhe: string; cor?: string; href?: string }) {
  const conteudo = (
    <Cartao className="h-full">
      <p className="text-xs font-medium text-zinc-500 uppercase">{rotulo}</p>
      <p className={`mt-1 text-xl font-semibold sm:text-2xl ${cor ?? ""}`}>{valor}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{detalhe}</p>
    </Cartao>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-80">
      {conteudo}
    </Link>
  ) : (
    conteudo
  );
}

async function maisVendidos(tipo: TipoItem, inicio: Date, fim: Date) {
  return db.itemOS.groupBy({
    by: ["descricao"],
    where: { tipo, os: { dataServico: { gte: inicio, lt: fim }, statusCobranca: { not: "CANCELADA" } } },
    _sum: { quantidade: true, subtotalCentavos: true },
    orderBy: { _sum: { subtotalCentavos: "desc" } },
    take: 8,
  });
}

function TabelaItens({ itens, vazio }: { itens: Awaited<ReturnType<typeof maisVendidos>>; vazio: string }) {
  if (itens.length === 0) return <Vazio>{vazio}</Vazio>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-zinc-500">
          <th className="pb-2 font-medium">Item</th>
          <th className="pb-2 text-right font-medium">Qtd</th>
          <th className="pb-2 text-right font-medium">Valor</th>
        </tr>
      </thead>
      <tbody>
        {itens.map((i) => (
          <tr key={i.descricao} className="border-t border-zinc-100">
            <td className="py-1.5 pr-2">{i.descricao}</td>
            <td className="py-1.5 text-right">{formatarQuantidade(i._sum.quantidade ?? 0)}</td>
            <td className="py-1.5 text-right">{formatarMoeda(i._sum.subtotalCentavos ?? 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function Painel({ searchParams }: PageProps<"/painel">) {
  await exigirUsuario(PODE_COBRAR);
  const { mes: mesParam } = await searchParams;
  const dataHoje = hoje();
  const mesAtual = dataHoje.toISOString().slice(0, 7);
  const mes = typeof mesParam === "string" && /^\d{4}-\d{2}$/.test(mesParam) ? mesParam : mesAtual;
  const { inicio, fim, inicioDia, fimDia } = limitesMes(mes);
  const nomeMes = inicioDia.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

  const [faturado, recebido, aberto, vencido, semConfirmacao, contestadas, vencidas, devedores, pecas, servicos] =
    await Promise.all([
      db.ordemServico.aggregate({
        where: { dataServico: { gte: inicio, lt: fim }, statusCobranca: { not: "CANCELADA" } },
        _sum: { totalCentavos: true },
        _count: true,
      }),
      db.ordemServico.aggregate({
        where: { statusCobranca: "PAGA", pagoEm: { gte: inicioDia, lt: fimDia } },
        _sum: { valorPagoCentavos: true },
        _count: true,
      }),
      db.ordemServico.aggregate({ where: { statusCobranca: "ABERTA" }, _sum: { totalCentavos: true }, _count: true }),
      db.ordemServico.aggregate({
        where: { statusCobranca: "ABERTA", vencimento: { lt: dataHoje } },
        _sum: { totalCentavos: true },
        _count: true,
      }),
      db.ordemServico.count({ where: { statusConfirmacao: "AGUARDANDO", statusCobranca: { not: "CANCELADA" } } }),
      db.ordemServico.count({ where: { statusConfirmacao: "CONTESTADA", statusCobranca: "ABERTA" } }),
      db.ordemServico.findMany({
        where: { statusCobranca: "ABERTA", vencimento: { lt: dataHoje } },
        select: { id: true, numero: true, totalCentavos: true, vencimento: true, cliente: { select: { razaoSocial: true, nomeFantasia: true } } },
        orderBy: { vencimento: "asc" },
        take: 8,
      }),
      db.ordemServico.groupBy({
        by: ["clienteId"],
        where: { statusCobranca: "ABERTA" },
        _sum: { totalCentavos: true },
        _count: true,
        orderBy: { _sum: { totalCentavos: "desc" } },
        take: 5,
      }),
      maisVendidos("PECA", inicio, fim),
      maisVendidos("SERVICO", inicio, fim),
    ]);

  const nomesClientes = new Map(
    (
      await db.cliente.findMany({
        where: { id: { in: devedores.map((d) => d.clienteId) } },
        select: { id: true, razaoSocial: true, nomeFantasia: true },
      })
    ).map((c) => [c.id, c.nomeFantasia || c.razaoSocial]),
  );

  const diasAtraso = (v: Date) => Math.round((dataHoje.getTime() - v.getTime()) / 86_400_000);

  return (
    <>
      <Cabecalho
        titulo="Painel"
        subtitulo={`Resumo de ${nomeMes}`}
        acao={
          <form className="flex items-center gap-2">
            <Input type="month" name="mes" defaultValue={mes} className="w-auto" />
            <button className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">Ver</button>
          </form>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador rotulo="Faturado no mês" valor={formatarMoeda(faturado._sum.totalCentavos ?? 0)} detalhe={`${faturado._count} OS`} />
        <Indicador
          rotulo="Recebido no mês"
          valor={formatarMoeda(recebido._sum.valorPagoCentavos ?? 0)}
          detalhe={`${recebido._count} pagamento(s)`}
          cor="text-green-700"
        />
        <Indicador
          rotulo="A receber"
          valor={formatarMoeda(aberto._sum.totalCentavos ?? 0)}
          detalhe={`${aberto._count} OS em aberto`}
          href="/os?situacao=A_VENCER"
        />
        <Indicador
          rotulo="Vencido"
          valor={formatarMoeda(vencido._sum.totalCentavos ?? 0)}
          detalhe={`${vencido._count} OS atrasada(s)`}
          cor="text-red-700"
          href="/os?situacao=VENCIDA"
        />
      </div>

      {(semConfirmacao > 0 || contestadas > 0) && (
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          {semConfirmacao > 0 && (
            <Link href="/os?situacao=AGUARDANDO_CONFIRMACAO" className="rounded-full bg-blue-50 px-3 py-1 text-blue-800 hover:bg-blue-100">
              {semConfirmacao} OS aguardando confirmação da empresa
            </Link>
          )}
          {contestadas > 0 && (
            <span className="rounded-full bg-red-50 px-3 py-1 text-red-800">{contestadas} OS contestada(s)</span>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao titulo="Cobranças vencidas" acao={<Link href="/os?situacao=VENCIDA" className="text-sm underline">Ver todas</Link>}>
          {vencidas.length === 0 ? (
            <Vazio>Nenhuma cobrança vencida. 🎉</Vazio>
          ) : (
            <ul className="divide-y divide-zinc-100 text-sm">
              {vencidas.map((os) => (
                <li key={os.id}>
                  <Link href={`/os/${os.id}`} className="flex items-center justify-between gap-2 py-2 hover:bg-zinc-50">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        #{os.numero} · {os.cliente.nomeFantasia || os.cliente.razaoSocial}
                      </span>
                      <span className="text-xs text-red-700">
                        venceu {formatarDia(os.vencimento)} · {diasAtraso(os.vencimento!)} dia(s) de atraso
                      </span>
                    </span>
                    <span className="shrink-0 font-medium">{formatarMoeda(os.totalCentavos)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        <Cartao titulo="Quem mais deve">
          {devedores.length === 0 ? (
            <Vazio>Nenhum valor em aberto.</Vazio>
          ) : (
            <ul className="divide-y divide-zinc-100 text-sm">
              {devedores.map((d) => (
                <li key={d.clienteId}>
                  <Link href={`/clientes/${d.clienteId}`} className="flex items-center justify-between gap-2 py-2 hover:bg-zinc-50">
                    <span className="truncate">
                      {nomesClientes.get(d.clienteId)} <span className="text-xs text-zinc-500">· {d._count} OS</span>
                    </span>
                    <span className="shrink-0 font-medium">{formatarMoeda(d._sum.totalCentavos ?? 0)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        <Cartao titulo={`Peças vendidas · ${nomeMes}`}>
          <TabelaItens itens={pecas} vazio="Nenhuma peça vendida no mês." />
        </Cartao>

        <Cartao titulo={`Serviços realizados · ${nomeMes}`}>
          <TabelaItens itens={servicos} vazio="Nenhum serviço no mês." />
        </Cartao>
      </div>
    </>
  );
}
