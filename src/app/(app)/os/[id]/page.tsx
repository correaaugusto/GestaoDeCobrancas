import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirUsuario, podeCobrar } from "@/lib/auth";
import { db } from "@/lib/db";
import { empresa, urlApp } from "@/lib/empresa";
import {
  centavosParaInput,
  diaParaInput,
  formatarCnpj,
  formatarDataHora,
  formatarDia,
  formatarMoeda,
  formatarQuantidade,
  hoje,
} from "@/lib/formato";
import { calcularSituacao } from "@/lib/situacao";
import { linkWhatsApp, mensagemCobranca } from "@/lib/whatsapp";
import { BadgeConfirmacao } from "@/components/lista-os";
import { Alerta, BadgeSituacao, Cartao, estiloBotao } from "@/components/ui";
import { BotaoDesfazerPagamento, BotaoWhatsApp, CopiarLink, FormCancelar, FormCobranca, FormPagamento } from "./acoes";

export default async function DetalheOS({ params, searchParams }: PageProps<"/os/[id]">) {
  const usuario = await exigirUsuario();
  const { id } = await params;
  const { criada } = await searchParams;

  const os = await db.ordemServico.findUnique({
    where: { id },
    include: {
      cliente: true,
      itens: { orderBy: { id: "asc" } },
      criadoPor: { select: { nome: true } },
      pagamentoPor: { select: { nome: true } },
      documentoVeiculo: true,
      notaFiscal: true,
      comprovante: true,
    },
  });
  if (!os) notFound();

  const dataHoje = hoje();
  const situacao = calcularSituacao(os, dataHoje);
  const financeiro = podeCobrar(usuario.papel);
  const aberta = os.statusCobranca === "ABERTA";
  const linkPublico = `${urlApp()}/confirmar/${os.tokenPublico}`;
  const whatsapp = linkWhatsApp(
    os.cliente.telefone,
    mensagemCobranca({
      numero: os.numero,
      placa: os.placa,
      totalCentavos: os.totalCentavos,
      vencimento: os.vencimento,
      notaFiscalNumero: os.notaFiscalNumero,
      link: linkPublico,
      empresa: empresa.nome,
      vencida: situacao === "VENCIDA",
    }),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/os" className="text-sm text-zinc-500 hover:text-zinc-800">
            ← Ordens
          </Link>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-xl font-semibold sm:text-2xl">
            OS nº {os.numero} <BadgeSituacao situacao={situacao} />
            {os.statusCobranca !== "CANCELADA" && <BadgeConfirmacao status={os.statusConfirmacao} />}
          </h1>
          <p className="text-sm text-zinc-500">
            {formatarDataHora(os.dataServico)} · registrada por {os.criadoPor.nome}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/os/${os.id}/pdf`} target="_blank" className={estiloBotao.secundario}>
            Ver PDF
          </a>
          {financeiro && aberta && (
            <BotaoWhatsApp osId={os.id} url={whatsapp} rotulo={situacao === "VENCIDA" ? "Cobrar atraso" : "Enviar cobrança"} />
          )}
        </div>
      </div>

      {criada && (
        <Alerta tipo="sucesso">
          OS registrada! {financeiro ? "Envie a cobrança pelo WhatsApp" : "O financeiro já pode enviar a cobrança"} — a
          empresa recebe um link para conferir o PDF e confirmar o serviço.
        </Alerta>
      )}
      {os.statusCobranca === "CANCELADA" && (
        <Alerta>
          Cancelada em {os.canceladaEm && formatarDataHora(os.canceladaEm)}: {os.cancelamentoMotivo}
        </Alerta>
      )}
      {os.statusConfirmacao === "CONTESTADA" && (
        <Alerta>
          <strong>{os.confirmacaoNome}</strong> contestou esta OS: “{os.contestacaoMotivo}”
        </Alerta>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Cartao titulo="Serviços e peças">
            <div className="-mx-4 overflow-x-auto sm:-mx-5">
              <table className="w-full min-w-[30rem] text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                    <th className="px-4 py-2 font-medium sm:px-5">Descrição</th>
                    <th className="px-2 py-2 text-right font-medium">Qtd</th>
                    <th className="px-2 py-2 text-right font-medium">Unit.</th>
                    <th className="px-4 py-2 text-right font-medium sm:px-5">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {os.itens.map((item) => (
                    <tr key={item.id} className="border-b border-zinc-100">
                      <td className="px-4 py-2 sm:px-5">
                        <span className="mr-2 text-xs text-zinc-400">{item.tipo === "SERVICO" ? "Serviço" : "Peça"}</span>
                        {item.descricao}
                      </td>
                      <td className="px-2 py-2 text-right">{formatarQuantidade(item.quantidade)}</td>
                      <td className="px-2 py-2 text-right">{formatarMoeda(item.valorUnitarioCentavos)}</td>
                      <td className="px-4 py-2 text-right sm:px-5">{formatarMoeda(item.subtotalCentavos)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="px-4 pt-3 text-right text-zinc-500 sm:px-5">
                      Total
                    </td>
                    <td className="px-4 pt-3 text-right text-lg font-semibold sm:px-5">{formatarMoeda(os.totalCentavos)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Cartao>

          <Cartao titulo="Veículo e comprovação">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Empresa</dt>
                <dd>
                  <Link href={`/clientes/${os.cliente.id}`} className="font-medium underline">
                    {os.cliente.nomeFantasia || os.cliente.razaoSocial}
                  </Link>
                  {os.cliente.cnpj && <span className="block text-xs text-zinc-500">{formatarCnpj(os.cliente.cnpj)}</span>}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Veículo</dt>
                <dd className="font-medium">
                  {os.placa}
                  {os.veiculoDescricao && <span className="font-normal"> · {os.veiculoDescricao}</span>}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Motorista</dt>
                <dd>
                  {os.motoristaNome}
                  {os.motoristaDocumento && <span className="block text-xs text-zinc-500">{os.motoristaDocumento}</span>}
                </dd>
              </div>
              {os.observacoes && (
                <div>
                  <dt className="text-zinc-500">Observações</dt>
                  <dd className="whitespace-pre-line">{os.observacoes}</dd>
                </div>
              )}
            </dl>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {os.assinaturaId && (
                <figure className="rounded-lg border border-zinc-200 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/arquivos/${os.assinaturaId}`} alt="Assinatura do motorista" className="h-28 w-full object-contain" />
                  <figcaption className="text-center text-xs text-zinc-500">Assinatura do motorista</figcaption>
                </figure>
              )}
              {os.documentoVeiculo && (
                <a href={`/api/arquivos/${os.documentoVeiculo.id}`} target="_blank" className="rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50">
                  {os.documentoVeiculo.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/arquivos/${os.documentoVeiculo.id}`} alt="Documento do veículo" className="h-28 w-full object-contain" />
                  ) : (
                    <div className="flex h-28 items-center justify-center text-sm font-medium text-zinc-600">PDF do documento</div>
                  )}
                  <p className="text-center text-xs text-zinc-500">Documento do veículo</p>
                </a>
              )}
            </div>
          </Cartao>
        </div>

        <div className="space-y-4">
          <Cartao titulo="Confirmação da empresa">
            {os.statusConfirmacao === "AGUARDANDO" ? (
              <p className="mb-3 text-sm text-zinc-600">
                A empresa ainda não confirmou. Ela confirma pelo link abaixo, que vai junto na mensagem de cobrança.
              </p>
            ) : (
              <p className="mb-3 text-sm">
                {os.statusConfirmacao === "CONFIRMADA" ? "Confirmada" : "Contestada"} por <strong>{os.confirmacaoNome}</strong> em{" "}
                {os.confirmacaoEm && formatarDataHora(os.confirmacaoEm)}
                {os.confirmacaoIp && <span className="block text-xs text-zinc-400">IP {os.confirmacaoIp}</span>}
              </p>
            )}
            <CopiarLink link={linkPublico} />
          </Cartao>

          {financeiro && (
            <Cartao titulo="Cobrança">
              {os.cobrancaEnviadaEm && (
                <p className="mb-3 text-xs text-zinc-500">Cobrança enviada em {formatarDataHora(os.cobrancaEnviadaEm)}</p>
              )}
              {!os.cliente.telefone && aberta && (
                <div className="mb-3">
                  <Alerta tipo="info">
                    Cliente sem WhatsApp cadastrado — o botão abrirá o WhatsApp para você escolher o contato.
                  </Alerta>
                </div>
              )}
              {aberta ? (
                <FormCobranca
                  osId={os.id}
                  vencimento={diaParaInput(os.vencimento)}
                  notaFiscalNumero={os.notaFiscalNumero ?? ""}
                  temNotaFiscal={!!os.notaFiscalId}
                />
              ) : (
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Vencimento</dt>
                    <dd>{formatarDia(os.vencimento)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">NF</dt>
                    <dd>{os.notaFiscalNumero ?? "—"}</dd>
                  </div>
                </dl>
              )}
              {os.notaFiscal && (
                <a href={`/api/arquivos/${os.notaFiscal.id}`} target="_blank" className="mt-3 block text-sm font-medium underline">
                  Ver arquivo da NF
                </a>
              )}
            </Cartao>
          )}

          {financeiro && os.statusCobranca !== "CANCELADA" && (
            <Cartao titulo="Pagamento">
              {os.statusCobranca === "PAGA" ? (
                <div className="space-y-2 text-sm">
                  <p className="text-lg font-semibold text-green-700">{formatarMoeda(os.valorPagoCentavos ?? 0)}</p>
                  <p>
                    Pago em {formatarDia(os.pagoEm)}
                    {os.pagamentoPor && <span className="text-zinc-500"> · baixa por {os.pagamentoPor.nome}</span>}
                  </p>
                  {os.valorPagoCentavos !== null && os.valorPagoCentavos !== os.totalCentavos && (
                    <Alerta tipo="info">
                      Valor recebido diferente do total ({formatarMoeda(os.valorPagoCentavos - os.totalCentavos)}).
                    </Alerta>
                  )}
                  {os.comprovante && (
                    <a href={`/api/arquivos/${os.comprovante.id}`} target="_blank" className="block font-medium underline">
                      Ver comprovante
                    </a>
                  )}
                  {usuario.papel === "DONO" && <BotaoDesfazerPagamento osId={os.id} />}
                </div>
              ) : (
                <FormPagamento osId={os.id} total={centavosParaInput(os.totalCentavos)} hoje={diaParaInput(dataHoje)} />
              )}
            </Cartao>
          )}

          {financeiro && aberta && (
            <Cartao>
              <FormCancelar osId={os.id} />
            </Cartao>
          )}
        </div>
      </div>
    </div>
  );
}
