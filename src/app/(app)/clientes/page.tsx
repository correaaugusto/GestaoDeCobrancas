import Link from "next/link";
import type { Metadata } from "next";
import { exigirUsuario, podeCobrar } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatarCnpj, formatarMoeda, hoje } from "@/lib/formato";
import { Badge, Cabecalho, Cartao, Input, Vazio, estiloBotao } from "@/components/ui";

export const metadata: Metadata = { title: "Clientes" };

export default async function Clientes({ searchParams }: PageProps<"/clientes">) {
  const usuario = await exigirUsuario();
  const { q } = await searchParams;
  const busca = typeof q === "string" ? q.trim() : "";

  const clientes = await db.cliente.findMany({
    where: busca
      ? {
          OR: [
            { razaoSocial: { contains: busca, mode: "insensitive" } },
            { nomeFantasia: { contains: busca, mode: "insensitive" } },
            { cnpj: { contains: busca.replace(/\D/g, "") || busca } },
          ],
        }
      : undefined,
    orderBy: [{ ativo: "desc" }, { razaoSocial: "asc" }],
  });

  const mostrarValores = podeCobrar(usuario.papel);
  const dataHoje = hoje();
  const emAberto = mostrarValores
    ? await db.ordemServico.groupBy({
        by: ["clienteId"],
        where: { statusCobranca: "ABERTA" },
        _sum: { totalCentavos: true },
      })
    : [];
  const vencidos = mostrarValores
    ? await db.ordemServico.groupBy({
        by: ["clienteId"],
        where: { statusCobranca: "ABERTA", vencimento: { lt: dataHoje } },
        _count: true,
      })
    : [];
  const abertoPorCliente = new Map(emAberto.map((g) => [g.clienteId, g._sum.totalCentavos ?? 0]));
  const vencidasPorCliente = new Map(vencidos.map((g) => [g.clienteId, g._count]));

  return (
    <>
      <Cabecalho
        titulo="Clientes"
        subtitulo={`${clientes.length} empresa(s)`}
        acao={
          <Link href="/clientes/novo" className={estiloBotao.primario}>
            Novo cliente
          </Link>
        }
      />
      <form className="mb-4">
        <Input name="q" type="search" placeholder="Buscar por nome ou CNPJ" defaultValue={busca} />
      </form>
      <Cartao className="p-0 sm:p-0">
        {clientes.length === 0 ? (
          <Vazio>Nenhum cliente encontrado.</Vazio>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {clientes.map((c) => (
              <li key={c.id}>
                <Link href={`/clientes/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {c.nomeFantasia || c.razaoSocial} {!c.ativo && <Badge>Inativo</Badge>}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {c.cnpj ? formatarCnpj(c.cnpj) : "Sem CNPJ"} · {c.prazoPagamentoDias ? `${c.prazoPagamentoDias} dias` : "À vista"}
                    </p>
                  </div>
                  {mostrarValores && (
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium">{formatarMoeda(abertoPorCliente.get(c.id) ?? 0)}</p>
                      {vencidasPorCliente.get(c.id) ? (
                        <Badge cor="red">{vencidasPorCliente.get(c.id)} vencida(s)</Badge>
                      ) : (
                        <p className="text-xs text-zinc-500">em aberto</p>
                      )}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </>
  );
}
