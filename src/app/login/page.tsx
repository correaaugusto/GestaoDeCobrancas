import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { FormLogin } from "./form-login";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaLogin() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-lg font-bold text-white">
            OS
          </div>
          <h1 className="text-xl font-semibold">Controle de OS</h1>
          <p className="text-sm text-zinc-500">Ordens de serviço e cobranças</p>
        </div>
        <FormLogin />
        <Suspense>
          <InstalacaoNova />
        </Suspense>
      </div>
    </main>
  );
}

// Banco recém-criado sem usuários: manda para o cadastro do dono.
async function InstalacaoNova() {
  if ((await db.usuario.count()) === 0) redirect("/primeiro-acesso");
  return null;
}
