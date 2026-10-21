"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Papel } from "@prisma/client";
import { sair } from "@/app/actions/auth";
import { cn } from "./ui";

type Item = { href: string; rotulo: string; icone: keyof typeof ICONES; papeis?: Papel[] };

const ITENS: Item[] = [
  { href: "/painel", rotulo: "Painel", icone: "painel", papeis: ["DONO", "FINANCEIRO"] },
  { href: "/os/nova", rotulo: "Nova OS", icone: "mais" },
  { href: "/os", rotulo: "Ordens", icone: "lista" },
  { href: "/clientes", rotulo: "Clientes", icone: "predio" },
  { href: "/usuarios", rotulo: "Usuários", icone: "pessoas", papeis: ["DONO"] },
];

const ICONES = {
  painel: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z",
  mais: "M12 5v14M5 12h14",
  lista: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  predio: "M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2",
  pessoas: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
};

function Icone({ nome }: { nome: keyof typeof ICONES }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <path d={ICONES[nome]} />
    </svg>
  );
}

function ativo(pathname: string, href: string) {
  if (href === "/os") return pathname === "/os" || (pathname.startsWith("/os/") && !pathname.startsWith("/os/nova"));
  return pathname === href || pathname.startsWith(href + "/");
}

const ROTULO_PAPEL: Record<Papel, string> = { DONO: "Dono", FINANCEIRO: "Financeiro", ATENDENTE: "Atendente" };

export function Navegacao({ nome, papel }: { nome: string; papel: Papel }) {
  const pathname = usePathname();
  const itens = ITENS.filter((i) => !i.papeis || i.papeis.includes(papel));

  return (
    <>
      {/* Desktop: barra lateral */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-zinc-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white">OS</div>
          <span className="font-semibold">Controle de OS</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {itens.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                ativo(pathname, item.href) ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50",
              )}
            >
              <Icone nome={item.icone} />
              {item.rotulo}
            </Link>
          ))}
        </nav>
        <div className="border-t border-zinc-200 p-4">
          <p className="truncate text-sm font-medium">{nome}</p>
          <p className="text-xs text-zinc-500">{ROTULO_PAPEL[papel]}</p>
          <form action={sair} className="mt-2">
            <button className="text-sm text-zinc-600 hover:text-zinc-900">Sair</button>
          </form>
        </div>
      </aside>

      {/* Celular: barra superior + navegação inferior */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 md:hidden">
        <span className="font-semibold">Controle de OS</span>
        <form action={sair} className="flex items-center gap-3">
          <span className="max-w-32 truncate text-sm text-zinc-500">{nome}</span>
          <button className="text-sm font-medium text-zinc-700">Sair</button>
        </form>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {itens.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
              ativo(pathname, item.href) ? "text-zinc-900" : "text-zinc-400",
            )}
          >
            <Icone nome={item.icone} />
            {item.rotulo}
          </Link>
        ))}
      </nav>
    </>
  );
}
