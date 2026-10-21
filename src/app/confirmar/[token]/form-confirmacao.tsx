"use client";

import { useActionState, useState } from "react";
import { responderConfirmacao } from "@/app/actions/os";
import { BotaoEnviar } from "@/components/botao-enviar";
import { Alerta, Campo, Input, Textarea } from "@/components/ui";

export function FormConfirmacao({ token }: { token: string }) {
  const [estado, acao] = useActionState(responderConfirmacao.bind(null, token), {});
  const [contestar, setContestar] = useState(false);
  const e = estado.erros ?? {};

  if (estado.ok) return <Alerta tipo="sucesso">{estado.ok}</Alerta>;

  return (
    <form action={acao} className="space-y-3">
      {estado.erro && <Alerta>{estado.erro}</Alerta>}
      <p className="text-sm text-zinc-600">Confira os itens e o PDF. Se estiver tudo certo, confirme abaixo.</p>
      <Campo label="Seu nome" erro={e.nome}>
        <Input name="nome" required autoComplete="name" />
      </Campo>
      {contestar && (
        <Campo label="O que está incorreto?" erro={e.motivo}>
          <Textarea name="motivo" required />
        </Campo>
      )}
      {contestar ? (
        <div className="flex flex-wrap gap-2">
          <BotaoEnviar name="resposta" value="CONTESTADA" variante="perigo" enviando="Enviando…">
            Enviar contestação
          </BotaoEnviar>
          <button type="button" className="text-sm text-zinc-500 underline" onClick={() => setContestar(false)}>
            Voltar
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <BotaoEnviar name="resposta" value="CONFIRMADA" enviando="Confirmando…" className="flex-1 sm:flex-none">
            Confirmo que o serviço foi realizado
          </BotaoEnviar>
          <button type="button" className="text-sm text-zinc-500 underline" onClick={() => setContestar(true)}>
            Algo está errado
          </button>
        </div>
      )}
    </form>
  );
}
