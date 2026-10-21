import type { Metadata } from "next";
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
      </div>
    </main>
  );
}
