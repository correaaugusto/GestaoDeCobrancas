"use client";

import { useActionState } from "react";
import type { Cliente } from "@prisma/client";
import { salvarCliente } from "@/app/actions/clientes";
import { BotaoEnviar } from "@/components/botao-enviar";
import { Alerta, Campo, Input, Textarea } from "@/components/ui";
import { formatarCnpj } from "@/lib/formato";

export function FormCliente({ cliente, voltarPara }: { cliente?: Cliente; voltarPara?: string }) {
  const [estado, acao] = useActionState(salvarCliente.bind(null, cliente?.id ?? null, voltarPara ?? null), {});
  const e = estado.erros ?? {};

  return (
    <form action={acao} className="space-y-4">
      {estado.erro && <Alerta>{estado.erro}</Alerta>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Razão social *" erro={e.razaoSocial} className="sm:col-span-2">
          <Input name="razaoSocial" required defaultValue={cliente?.razaoSocial} />
        </Campo>
        <Campo label="Nome fantasia" erro={e.nomeFantasia}>
          <Input name="nomeFantasia" defaultValue={cliente?.nomeFantasia ?? ""} />
        </Campo>
        <Campo label="CNPJ" erro={e.cnpj}>
          <Input name="cnpj" inputMode="numeric" placeholder="00.000.000/0000-00" defaultValue={formatarCnpj(cliente?.cnpj)} />
        </Campo>
        <Campo label="WhatsApp do financeiro" erro={e.telefone} dica="Com DDD. Usado para enviar as cobranças.">
          <Input name="telefone" type="tel" placeholder="(11) 98888-7777" defaultValue={cliente?.telefone ?? ""} />
        </Campo>
        <Campo label="E-mail" erro={e.email}>
          <Input name="email" type="email" defaultValue={cliente?.email ?? ""} />
        </Campo>
        <Campo
          label="Prazo de pagamento (dias)"
          erro={e.prazoPagamentoDias}
          dica="0 = à vista. O vencimento das novas OS é calculado com esse prazo."
        >
          <Input name="prazoPagamentoDias" type="number" min={0} max={365} defaultValue={cliente?.prazoPagamentoDias ?? 0} />
        </Campo>
        <Campo label="Observações" erro={e.observacoes} className="sm:col-span-2">
          <Textarea name="observacoes" defaultValue={cliente?.observacoes ?? ""} />
        </Campo>
      </div>
      <BotaoEnviar className="w-full sm:w-auto">{cliente ? "Salvar alterações" : "Cadastrar cliente"}</BotaoEnviar>
    </form>
  );
}
