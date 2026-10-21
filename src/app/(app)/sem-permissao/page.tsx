import Link from "next/link";
import { estiloBotao } from "@/components/ui";

export default function SemPermissao() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-semibold">Sem permissão</h1>
      <p className="mt-2 text-sm text-zinc-500">Seu usuário não tem acesso a esta página.</p>
      <Link href="/os" className={`${estiloBotao.secundario} mt-6`}>
        Voltar para as ordens
      </Link>
    </div>
  );
}
