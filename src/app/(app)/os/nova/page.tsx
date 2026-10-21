import type { Metadata } from "next";
import { exigirUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { Cabecalho } from "@/components/ui";
import { FormNovaOS } from "./form-nova-os";

export const metadata: Metadata = { title: "Nova OS" };

async function descricoesFrequentes(tipo: "SERVICO" | "PECA") {
  const grupos = await db.itemOS.groupBy({
    by: ["descricao"],
    where: { tipo },
    _count: { descricao: true },
    orderBy: { _count: { descricao: "desc" } },
    take: 40,
  });
  return grupos.map((g) => g.descricao);
}

export default async function NovaOS({ searchParams }: PageProps<"/os/nova">) {
  await exigirUsuario();
  const { cliente } = await searchParams;

  const [clientes, servicos, pecas] = await Promise.all([
    db.cliente.findMany({
      where: { ativo: true },
      select: { id: true, razaoSocial: true, nomeFantasia: true, prazoPagamentoDias: true },
      orderBy: { razaoSocial: "asc" },
    }),
    descricoesFrequentes("SERVICO"),
    descricoesFrequentes("PECA"),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Cabecalho titulo="Nova ordem de serviço" subtitulo="Substitui o fiado em papel" />
      <FormNovaOS
        clientes={clientes.map((c) => ({ id: c.id, nome: c.nomeFantasia || c.razaoSocial, prazo: c.prazoPagamentoDias }))}
        clienteInicial={typeof cliente === "string" ? cliente : undefined}
        sugestoes={{ servicos, pecas }}
      />
    </div>
  );
}
