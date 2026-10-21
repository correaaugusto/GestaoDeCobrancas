import { Suspense } from "react";
import { exigirUsuario } from "@/lib/auth";
import { Navegacao } from "@/components/navegacao";

async function NavegacaoUsuario() {
  const usuario = await exigirUsuario();
  return <Navegacao nome={usuario.nome} papel={usuario.papel} />;
}

export default function LayoutApp({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={<div className="h-14 border-b border-zinc-200 bg-white md:hidden" />}>
        <NavegacaoUsuario />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-24 md:pl-64 md:pr-6 md:pb-10 lg:pl-68">
        {children}
      </main>
    </div>
  );
}
