"use client";

import { useActionState, useState, useTransition } from "react";
import {
  atualizarCobranca,
  cancelarOS,
  desfazerPagamento,
  marcarCobrancaEnviada,
  registrarPagamento,
} from "@/app/actions/os";
import { BotaoEnviar } from "@/components/botao-enviar";
import { CampoArquivo } from "@/components/campo-arquivo";
import { Alerta, Campo, Input, Textarea, estiloBotao } from "@/components/ui";

export function BotaoWhatsApp({ osId, url, rotulo }: { osId: string; url: string; rotulo: string }) {
  const [, startTransition] = useTransition();
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={estiloBotao.whatsapp}
      onClick={() => startTransition(() => marcarCobrancaEnviada(osId))}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.7.5-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.7 15.6 2.2 13.8 2.2 12 2.2 6.6 6.6 2.2 12 2.2c2.6 0 5.1 1 6.9 2.9 1.8 1.8 2.9 4.3 2.9 6.9 0 5.4-4.4 9.8-9.8 9.8zm8.4-18.2C18.2 1.3 15.2 0 12 0 5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6c1.8 1 3.8 1.5 5.8 1.5 6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.6-8.3z" />
      </svg>
      {rotulo}
    </a>
  );
}

export function CopiarLink({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="flex gap-2">
      <Input readOnly value={link} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
      <button
        type="button"
        className={estiloBotao.secundario}
        onClick={async () => {
          await navigator.clipboard.writeText(link);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        }}
      >
        {copiado ? "Copiado!" : "Copiar"}
      </button>
    </div>
  );
}

export function FormCobranca({
  osId,
  vencimento,
  notaFiscalNumero,
  temNotaFiscal,
}: {
  osId: string;
  vencimento: string;
  notaFiscalNumero: string;
  temNotaFiscal: boolean;
}) {
  const [estado, acao] = useActionState(atualizarCobranca.bind(null, osId), {});
  return (
    <form action={acao} className="space-y-3">
      {estado.erro && <Alerta>{estado.erro}</Alerta>}
      {estado.ok && <Alerta tipo="sucesso">{estado.ok}</Alerta>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Vencimento" dica="Data combinada com a empresa">
          <Input type="date" name="vencimento" defaultValue={vencimento} />
        </Campo>
        <Campo label="Número da NF">
          <Input name="notaFiscalNumero" defaultValue={notaFiscalNumero} />
        </Campo>
      </div>
      <CampoArquivo
        name="notaFiscal"
        label={temNotaFiscal ? "Substituir arquivo da NF" : "Arquivo da NF"}
        dica="PDF ou foto. Fica disponível para a empresa no link."
      />
      <BotaoEnviar variante="secundario">Salvar cobrança</BotaoEnviar>
    </form>
  );
}

export function FormPagamento({ osId, total, hoje }: { osId: string; total: string; hoje: string }) {
  const [estado, acao] = useActionState(registrarPagamento.bind(null, osId), {});
  const e = estado.erros ?? {};
  return (
    <form action={acao} className="space-y-3">
      {estado.erro && <Alerta>{estado.erro}</Alerta>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Data do pagamento" erro={e.pagoEm}>
          <Input type="date" name="pagoEm" defaultValue={hoje} required />
        </Campo>
        <Campo label="Valor recebido (R$)" erro={e.valorPago}>
          <Input name="valorPago" inputMode="decimal" defaultValue={total} required />
        </Campo>
      </div>
      <CampoArquivo name="comprovante" label="Comprovante" obrigatorio erro={e.comprovante} dica="Print do PIX, comprovante de TED ou boleto pago." />
      <BotaoEnviar enviando="Registrando…">Registrar pagamento</BotaoEnviar>
    </form>
  );
}

export function BotaoDesfazerPagamento({ osId }: { osId: string }) {
  return (
    <form
      action={desfazerPagamento.bind(null, osId)}
      onSubmit={(e) => {
        if (!confirm("Desfazer o pagamento? A OS volta a ficar em aberto.")) e.preventDefault();
      }}
    >
      <button className="text-sm text-zinc-500 underline hover:text-zinc-800">Desfazer pagamento</button>
    </form>
  );
}

export function FormCancelar({ osId }: { osId: string }) {
  const [estado, acao] = useActionState(cancelarOS.bind(null, osId), {});
  return (
    <details className="group">
      <summary className="cursor-pointer text-sm text-zinc-500 underline">Cancelar esta OS</summary>
      <form action={acao} className="mt-3 space-y-3">
        <Campo label="Motivo do cancelamento" erro={estado.erros?.motivo}>
          <Textarea name="motivo" rows={2} required />
        </Campo>
        <BotaoEnviar variante="perigo" enviando="Cancelando…">
          Confirmar cancelamento
        </BotaoEnviar>
      </form>
    </details>
  );
}
