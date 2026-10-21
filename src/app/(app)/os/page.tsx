import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { exigirUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatarMoeda, formatarPlaca, hoje } from "@/lib/formato";
import { ROTULO_SITUACAO, ehSituacao, filtroSituacao, type Situacao } from "@/lib/situacao";
import { ListaOS, selectLinhaOS } from "@/components/lista-os";
import { Cabecalho, Cartao, Input, cn, estiloBotao } from "@/components/ui";

export const metadata: Metadata = { title: "Ordens de serviço" };

const POR_PAGINA = 30;
const ABAS: (Situacao | "TODAS" | "AGUARDANDO_CONFIRMACAO")[] = ["TODAS", "VENCIDA", "A_VENCER", "SEM_VENCIMENTO", "AGUARDANDO_CONFIRMACAO", "PAGA", "CANCELADA"];

function rotuloAba(aba: (typeof ABAS)[number]) {
  if (aba === "TODAS") return "Todas";
  if (aba === "AGUARDANDO_CONFIRMACAO") return "Sem confirmação";
  return ROTULO_SITUACAO[aba];
}

export default async function ListaOrdens({ searchParams }: PageProps<"/os">) {
  await exigirUsuario();
  const sp = await searchParams;
  const aba = typeof sp.situacao === "string" && (ehSituacao(sp.situacao) || sp.situacao === "AGUARDANDO_CONFIRMACAO") ? sp.situacao : "TODAS";
  const busca = typeof sp.q === "string" ? sp.q.trim() : "";
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const dataHoje = hoje();

  const filtros: Prisma.OrdemServicoWhereInput[] = [];
  if (aba === "AGUARDANDO_CONFIRMACAO") filtros.push({ statusConfirmacao: "AGUARDANDO", statusCobranca: { not: "CANCELADA" } });
  else if (aba !== "TODAS") filtros.push(filtroSituacao(aba, dataHoje));
  if (busca) {
    const numero = Number(busca.replace(/^#/, ""));
    filtros.push({
      OR: [
        { cliente: { razaoSocial: { contains: busca, mode: "insensitive" } } },
        { cliente: { nomeFantasia: { contains: busca, mode: "insensitive" } } },
        { placa: { contains: formatarPlaca(busca) || busca } },
        { motoristaNome: { contains: busca, mode: "insensitive" } },
        ...(Number.isInteger(numero) && numero > 0 ? [{ numero }] : []),
      ],
    });
  }
  const where: Prisma.OrdemServicoWhereInput = { AND: filtros };

  const [ordens, resumo] = await Promise.all([
    db.ordemServico.findMany({
      where,
      select: selectLinhaOS,
      orderBy: aba === "VENCIDA" || aba === "A_VENCER" ? { vencimento: "asc" } : { numero: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    db.ordemServico.aggregate({ where, _count: true, _sum: { totalCentavos: true } }),
  ]);
  const totalPaginas = Math.max(1, Math.ceil(resumo._count / POR_PAGINA));

  const url = (mudancas: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const atual = { situacao: aba === "TODAS" ? undefined : aba, q: busca || undefined, pagina: undefined, ...mudancas };
    for (const [k, v] of Object.entries(atual)) if (v !== undefined && v !== "") p.set(k, String(v));
    const qs = p.toString();
    return qs ? `/os?${qs}` : "/os";
  };

  return (
    <>
      <Cabecalho
        titulo="Ordens de serviço"
        subtitulo={`${resumo._count} OS · ${formatarMoeda(resumo._sum.totalCentavos ?? 0)}`}
        acao={
          <Link href="/os/nova" className={estiloBotao.primario}>
            Nova OS
          </Link>
        }
      />

      <div className="-mx-4 mb-3 overflow-x-auto px-4">
        <div className="flex gap-1.5">
          {ABAS.map((a) => (
            <Link
              key={a}
              href={url({ situacao: a === "TODAS" ? undefined : a })}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm whitespace-nowrap",
                a === aba ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
              )}
            >
              {rotuloAba(a)}
            </Link>
          ))}
        </div>
      </div>

      <form className="mb-4">
        {aba !== "TODAS" && <input type="hidden" name="situacao" value={aba} />}
        <Input name="q" type="search" placeholder="Buscar por empresa, placa, motorista ou nº da OS" defaultValue={busca} />
      </form>

      <Cartao className="p-0 sm:p-0">
        <ListaOS ordens={ordens} dataHoje={dataHoje} />
      </Cartao>

      {totalPaginas > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          {pagina > 1 ? (
            <Link href={url({ pagina: pagina - 1 })} className={estiloBotao.secundario}>
              Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-zinc-500">
            Página {pagina} de {totalPaginas}
          </span>
          {pagina < totalPaginas ? (
            <Link href={url({ pagina: pagina + 1 })} className={estiloBotao.secundario}>
              Próxima
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </>
  );
}
