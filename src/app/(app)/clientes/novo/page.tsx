import { exigirUsuario } from "@/lib/auth";
import { Cabecalho, Cartao } from "@/components/ui";
import { FormCliente } from "../form-cliente";

export default async function NovoCliente({ searchParams }: PageProps<"/clientes/novo">) {
  await exigirUsuario();
  const { voltar } = await searchParams;

  return (
    <div className="max-w-2xl">
      <Cabecalho titulo="Novo cliente" subtitulo="Empresa que contrata os serviços" />
      <Cartao>
        <FormCliente voltarPara={typeof voltar === "string" ? voltar : undefined} />
      </Cartao>
    </div>
  );
}
