"use client";

import { useActionState } from "react";
import { entrar } from "@/app/actions/auth";
import { BotaoEnviar } from "@/components/botao-enviar";
import { Alerta, Campo, Input } from "@/components/ui";

export function FormLogin() {
  const [estado, acao] = useActionState(entrar, {});

  return (
    <form action={acao} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
      {estado.erro && <Alerta>{estado.erro}</Alerta>}
      <Campo label="E-mail">
        <Input name="email" type="email" autoComplete="email" required defaultValue={estado.email} />
      </Campo>
      <Campo label="Senha">
        <Input name="senha" type="password" autoComplete="current-password" required />
      </Campo>
      <BotaoEnviar className="w-full" enviando="Entrando…">
        Entrar
      </BotaoEnviar>
    </form>
  );
}
