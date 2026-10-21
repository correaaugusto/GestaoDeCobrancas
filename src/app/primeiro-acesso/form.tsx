"use client";

import { useActionState } from "react";
import { criarPrimeiroDono } from "@/app/actions/auth";
import { BotaoEnviar } from "@/components/botao-enviar";
import { Alerta, Campo, Input } from "@/components/ui";

export function FormPrimeiroAcesso() {
  const [estado, acao] = useActionState(criarPrimeiroDono, {});
  return (
    <form action={acao} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
      {estado.erro && <Alerta>{estado.erro}</Alerta>}
      <Campo label="Seu nome">
        <Input name="nome" required autoComplete="name" />
      </Campo>
      <Campo label="E-mail">
        <Input name="email" type="email" required autoComplete="email" />
      </Campo>
      <Campo label="Senha" dica="Mínimo de 8 caracteres">
        <Input name="senha" type="password" required minLength={8} autoComplete="new-password" />
      </Campo>
      <BotaoEnviar className="w-full" enviando="Criando…">
        Criar usuário e entrar
      </BotaoEnviar>
    </form>
  );
}
