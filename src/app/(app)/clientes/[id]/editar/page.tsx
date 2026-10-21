import { notFound } from "next/navigation";
import { exigirUsuario, PODE_COBRAR } from "@/lib/auth";
import { db } from "@/lib/db";
import { Cabecalho, Cartao } from "@/components/ui";
import { FormCliente } from "../../form-cliente";

export default async function EditarCliente({ params }: PageProps<"/clientes/[id]/editar">) {
  await exigirUsuario(PODE_COBRAR);
  const { id } = await params;
  const cliente = await db.cliente.findUnique({ where: { id } });
  if (!cliente) notFound();

  return (
    <div className="max-w-2xl">
      <Cabecalho titulo="Editar cliente" subtitulo={cliente.razaoSocial} />
      <Cartao>
        <FormCliente cliente={cliente} />
      </Cartao>
    </div>
  );
}
