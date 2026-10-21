import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirUsuario, podeCobrar } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatarCnpj, formatarMoeda, hoje } from "@/lib/formato";
import { alternarAtivoCliente } from "@/app/actions/clientes";
import { ListaOS, selectLinhaOS } from "@/components/lista-os";
import { Badge, Cabecalho, Cartao, estiloBotao } from "@/components/ui";

export default async function DetalheCliente({ params }: PageProps<"/clientes/[id]">) {
  const usuario = await exigirUsuario();
  const { id } = await params;
  const cliente = await db.cliente.findUnique({ where: { id } });
  if (!cliente) notFound();

  const dataHoje = hoje();
  const [ordens, aberto, vencido, pago] = await Promise.all([
    db.ordemServico.findMany({
      where: { clienteId: id },
      select: selectLinhaOS,
      orderBy: { numero: "desc" },
      take: 50,
    }),
    db.ordemServico.aggregate({ where: { clienteId: id, statusCobranca: "ABERTA" }, _sum: { totalCentavos: true } }),
    db.ordemServico.aggregate({
      where: { clienteId: id, statusCobranca: "ABERTA", vencimento: { lt: dataHoje } },
      _sum: { totalCentavos: true },
    }),
    db.ordemServico.aggregate({ where: { clienteId: id, statusCobranca: "PAGA" }, _sum: { valorPagoCentavos: true } }),
  ]);

  const gerencia = podeCobrar(usuario.papel);

  return (
    <>
      <Cabecalho
        titulo={cliente.nomeFantasia || cliente.razaoSocial}
        subtitulo={
          <>
            {cliente.razaoSocial}
            {cliente.cnpj && ` · ${formatarCnpj(cliente.cnpj)}`} {!cliente.ativo && <Badge>Inativo</Badge>}
          </>
        }
        acao={
          <div className="flex gap-2">
            <Link href={`/os/nova?cliente=${cliente.id}`} className={estiloBotao.primario}>
              Nova OS
            </Link>
            {gerencia && (
              <Link href={`/clientes/${cliente.id}/editar`} className={estiloBotao.secundario}>
                Editar
              </Link>
            )}
          </div>
        }
      />

      {gerencia && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <Cartao>
            <p className="text-xs text-zinc-500">Em aberto</p>
            <p className="text-lg font-semibold">{formatarMoeda(aberto._sum.totalCentavos ?? 0)}</p>
          </Cartao>
          <Cartao>
            <p className="text-xs text-zinc-500">Vencido</p>
            <p className="text-lg font-semibold text-red-700">{formatarMoeda(vencido._sum.totalCentavos ?? 0)}</p>
          </Cartao>
          <Cartao>
            <p className="text-xs text-zinc-500">Total recebido</p>
            <p className="text-lg font-semibold text-green-700">{formatarMoeda(pago._sum.valorPagoCentavos ?? 0)}</p>
          </Cartao>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <Cartao titulo="Ordens de serviço" className="p-0 sm:p-0 [&>div]:px-4 [&>div]:pt-4">
          <ListaOS ordens={ordens} dataHoje={dataHoje} mostrarCliente={false} />
        </Cartao>
        <Cartao titulo="Dados">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-zinc-500">WhatsApp</dt>
              <dd>{cliente.telefone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">E-mail</dt>
              <dd className="break-all">{cliente.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Prazo de pagamento</dt>
              <dd>{cliente.prazoPagamentoDias ? `${cliente.prazoPagamentoDias} dias` : "À vista"}</dd>
            </div>
            {cliente.observacoes && (
              <div>
                <dt className="text-zinc-500">Observações</dt>
                <dd className="whitespace-pre-line">{cliente.observacoes}</dd>
              </div>
            )}
          </dl>
          {gerencia && (
            <form action={alternarAtivoCliente.bind(null, cliente.id)} className="mt-4">
              <button className="text-sm text-zinc-500 underline hover:text-zinc-800">
                {cliente.ativo ? "Desativar cliente" : "Reativar cliente"}
              </button>
            </form>
          )}
        </Cartao>
      </div>
    </>
  );
}
