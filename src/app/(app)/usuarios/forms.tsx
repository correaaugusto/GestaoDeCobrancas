"use client";

import { useActionState } from "react";
import { criarUsuario, redefinirSenha } from "@/app/actions/usuarios";
import { BotaoEnviar } from "@/components/botao-enviar";
import { Alerta, Campo, Input, Select } from "@/components/ui";

export function FormNovoUsuario() {
  const [estado, acao] = useActionState(criarUsuario, {});
  return (
    <form action={acao} className="space-y-3">
      {estado.erro && <Alerta>{estado.erro}</Alerta>}
      {estado.ok && <Alerta tipo="sucesso">{estado.ok}</Alerta>}
      <Campo label="Nome">
        <Input name="nome" required />
      </Campo>
      <Campo label="E-mail">
        <Input name="email" type="email" required />
      </Campo>
      <Campo label="Senha inicial">
        <Input name="senha" type="text" minLength={6} required autoComplete="off" />
      </Campo>
      <Campo label="Função">
        <Select name="papel" defaultValue="ATENDENTE">
          <option value="ATENDENTE">Atendente — registra OS</option>
          <option value="FINANCEIRO">Financeiro — cobranças e pagamentos</option>
          <option value="DONO">Dono — acesso total</option>
        </Select>
      </Campo>
      <BotaoEnviar>Criar usuário</BotaoEnviar>
    </form>
  );
}

export function FormSenha({ id }: { id: string }) {
  const [estado, acao] = useActionState(redefinirSenha.bind(null, id), {});
  return (
    <details>
      <summary className="cursor-pointer text-xs text-zinc-500 underline">Redefinir senha</summary>
      <form action={acao} className="mt-2 flex gap-2">
        <Input name="senha" type="text" placeholder="Nova senha" minLength={6} required autoComplete="off" />
        <BotaoEnviar variante="secundario">OK</BotaoEnviar>
      </form>
      {estado.erro && <p className="mt-1 text-xs text-red-600">{estado.erro}</p>}
      {estado.ok && <p className="mt-1 text-xs text-green-700">{estado.ok}</p>}
    </details>
  );
}
