"use client";

import Link from "next/link";
import { useActionState, useState, startTransition } from "react";
import { criarOS } from "@/app/actions/os";
import { Assinatura, lerAssinatura } from "@/components/assinatura";
import { CampoArquivo } from "@/components/campo-arquivo";
import { Alerta, Campo, Cartao, Input, Select, Textarea, cn, estiloBotao } from "@/components/ui";
import { formatarMoeda, paraCentavos } from "@/lib/formato";

type Item = { chave: number; tipo: "SERVICO" | "PECA"; descricao: string; quantidade: string; valorUnitario: string };
type ClienteOpcao = { id: string; nome: string; prazo: number };

let proximaChave = 1;
const novoItem = (tipo: Item["tipo"] = "SERVICO"): Item => ({
  chave: proximaChave++,
  tipo,
  descricao: "",
  quantidade: "1",
  valorUnitario: "",
});

function subtotal(item: Item) {
  const qtd = Number(item.quantidade.replace(",", "."));
  const valor = paraCentavos(item.valorUnitario || "0");
  return Number.isFinite(qtd) && Number.isFinite(valor) ? Math.round(qtd * valor) : 0;
}

export function FormNovaOS({
  clientes,
  clienteInicial,
  sugestoes,
}: {
  clientes: ClienteOpcao[];
  clienteInicial?: string;
  sugestoes: { servicos: string[]; pecas: string[] };
}) {
  const [estado, acao, enviando] = useActionState(criarOS, {});
  const [itens, setItens] = useState<Item[]>([novoItem()]);
  const [clienteId, setClienteId] = useState(clienteInicial ?? "");
  const e = estado.erros ?? {};

  const total = itens.reduce((s, i) => s + subtotal(i), 0);
  const cliente = clientes.find((c) => c.id === clienteId);

  function alterar(chave: number, campo: keyof Item, valor: string) {
    setItens((atual) => atual.map((i) => (i.chave === chave ? { ...i, [campo]: valor } : i)));
  }

  // Envio manual (sem o reset automático do <form action>) para não perder
  // a foto e a assinatura caso o servidor devolva algum erro de validação.
  async function enviar(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const dados = new FormData(form);
    const assinatura = await lerAssinatura(form);
    if (assinatura) dados.set("assinatura", assinatura);
    dados.set(
      "itens",
      JSON.stringify(
        itens
          .filter((i) => i.descricao.trim() || i.valorUnitario)
          .map(({ tipo, descricao, quantidade, valorUnitario }) => ({
            tipo,
            descricao,
            quantidade: quantidade.replace(",", "."),
            valorUnitario: valorUnitario || "0",
          })),
      ),
    );
    startTransition(() => acao(dados));
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      {estado.erro && <Alerta>{estado.erro}</Alerta>}

      <Cartao titulo="Empresa">
        <div className="space-y-3">
          <Campo label="Empresa cliente *" erro={e.clienteId}>
            <Select name="clienteId" value={clienteId} onChange={(ev) => setClienteId(ev.target.value)} required>
              <option value="">Selecione…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </Campo>
          {cliente && (
            <p className="text-xs text-zinc-500">
              Prazo de pagamento: {cliente.prazo ? `${cliente.prazo} dias` : "à vista"}
            </p>
          )}
          <Link href="/clientes/novo?voltar=/os/nova" className="inline-block text-sm font-medium text-zinc-700 underline">
            + Cadastrar empresa nova
          </Link>
        </div>
      </Cartao>

      <Cartao titulo="Veículo e motorista">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Placa *" erro={e.placa}>
            <Input name="placa" required autoCapitalize="characters" placeholder="ABC1D23" className="uppercase" maxLength={8} />
          </Campo>
          <Campo label="Veículo" erro={e.veiculoDescricao}>
            <Input name="veiculoDescricao" placeholder="Ex.: Volvo FH 540 branco" />
          </Campo>
          <Campo label="Nome do motorista *" erro={e.motoristaNome}>
            <Input name="motoristaNome" required autoComplete="off" />
          </Campo>
          <Campo label="CPF/CNH do motorista" erro={e.motoristaDocumento}>
            <Input name="motoristaDocumento" inputMode="numeric" autoComplete="off" />
          </Campo>
        </div>
      </Cartao>

      <Cartao titulo="Serviços e peças">
        <datalist id="sugestoes-servico">
          {sugestoes.servicos.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <datalist id="sugestoes-peca">
          {sugestoes.pecas.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <div className="space-y-3">
          {itens.map((item) => (
            <div key={item.chave} className="space-y-2 rounded-lg border border-zinc-200 p-3">
              <div className="flex items-center justify-between">
                <div className="inline-flex rounded-lg bg-zinc-100 p-0.5 text-sm">
                  {(["SERVICO", "PECA"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => alterar(item.chave, "tipo", t)}
                      className={cn("rounded-md px-3 py-1", item.tipo === t ? "bg-white font-medium shadow-sm" : "text-zinc-500")}
                    >
                      {t === "SERVICO" ? "Serviço" : "Peça"}
                    </button>
                  ))}
                </div>
                {itens.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setItens((a) => a.filter((i) => i.chave !== item.chave))}
                    className="text-sm text-red-600"
                  >
                    Remover
                  </button>
                )}
              </div>
              <Input
                placeholder={item.tipo === "SERVICO" ? "Descrição do serviço" : "Nome da peça"}
                list={item.tipo === "SERVICO" ? "sugestoes-servico" : "sugestoes-peca"}
                value={item.descricao}
                onChange={(ev) => alterar(item.chave, "descricao", ev.target.value)}
              />
              <div className="grid grid-cols-[5rem_1fr_auto] items-center gap-2">
                <Input
                  aria-label="Quantidade"
                  inputMode="decimal"
                  value={item.quantidade}
                  onChange={(ev) => alterar(item.chave, "quantidade", ev.target.value)}
                />
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-zinc-400">R$</span>
                  <Input
                    aria-label="Valor unitário"
                    inputMode="decimal"
                    placeholder="0,00"
                    className="pl-9"
                    value={item.valorUnitario}
                    onChange={(ev) => alterar(item.chave, "valorUnitario", ev.target.value)}
                  />
                </div>
                <span className="w-24 text-right text-sm font-medium">{formatarMoeda(subtotal(item))}</span>
              </div>
            </div>
          ))}
          {e.itens && <p className="text-xs text-red-600">{e.itens}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setItens((a) => [...a, novoItem("SERVICO")])} className={estiloBotao.secundario}>
              + Serviço
            </button>
            <button type="button" onClick={() => setItens((a) => [...a, novoItem("PECA")])} className={estiloBotao.secundario}>
              + Peça
            </button>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-200 pt-3">
            <span className="text-sm text-zinc-500">Total</span>
            <span className="text-xl font-semibold">{formatarMoeda(total)}</span>
          </div>
        </div>
      </Cartao>

      <Cartao titulo="Comprovação">
        <div className="space-y-4">
          <CampoArquivo
            name="documentoVeiculo"
            label="Documento do veículo (CRLV)"
            obrigatorio
            camera
            erro={e.documentoVeiculo}
            dica="Foto do documento ou o PDF do CRLV digital. Vai anexado ao PDF da OS."
          />
          <Campo label="Observações">
            <Textarea name="observacoes" placeholder="Opcional" />
          </Campo>
          <Assinatura erro={e.assinatura} />
          <p className="text-xs text-zinc-500">
            Ao assinar, o motorista declara que o serviço acima foi realizado no veículo informado.
          </p>
        </div>
      </Cartao>

      <button type="submit" disabled={enviando} className={cn(estiloBotao.primario, "w-full py-3 text-base")}>
        {enviando ? "Salvando…" : `Registrar OS · ${formatarMoeda(total)}`}
      </button>
    </form>
  );
}
