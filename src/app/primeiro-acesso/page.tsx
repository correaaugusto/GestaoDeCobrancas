import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { FormPrimeiroAcesso } from "./form";

export const metadata: Metadata = { title: "Primeiro acesso" };

async function Conteudo() {
  if ((await db.usuario.count()) > 0) redirect("/login");
  return <FormPrimeiroAcesso />;
}

export default function PrimeiroAcesso() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Bem-vindo ao Controle de OS</h1>
          <p className="text-sm text-zinc-500">Crie o usuário do dono para começar.</p>
        </div>
        <Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-zinc-200/70" />}>
          <Conteudo />
        </Suspense>
      </div>
    </main>
  );
}
