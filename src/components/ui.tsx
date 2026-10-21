import type { ComponentProps, ReactNode } from "react";
import { ROTULO_SITUACAO, type Situacao } from "@/lib/situacao";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export const estiloBotao = {
  primario:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50",
  secundario:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50",
  perigo:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50",
  whatsapp:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50",
};

export const estiloInput =
  "block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900";

export function Campo({
  label,
  erro,
  dica,
  children,
  className,
}: {
  label: string;
  erro?: string;
  dica?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1", className)}>
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      {children}
      {dica && !erro && <span className="block text-xs text-zinc-500">{dica}</span>}
      {erro && <span className="block text-xs text-red-600">{erro}</span>}
    </label>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={cn(estiloInput, props.className)} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={cn(estiloInput, props.className)} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea rows={3} {...props} className={cn(estiloInput, props.className)} />;
}

export function Cartao({
  titulo,
  acao,
  children,
  className,
}: {
  titulo?: ReactNode;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-zinc-200 bg-white p-4 sm:p-5", className)}>
      {(titulo || acao) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {titulo && <h2 className="text-base font-semibold text-zinc-900">{titulo}</h2>}
          {acao}
        </div>
      )}
      {children}
    </section>
  );
}

const CORES_SITUACAO: Record<Situacao, string> = {
  PAGA: "bg-green-100 text-green-800",
  VENCIDA: "bg-red-100 text-red-800",
  A_VENCER: "bg-amber-100 text-amber-800",
  SEM_VENCIMENTO: "bg-zinc-100 text-zinc-700",
  CANCELADA: "bg-zinc-200 text-zinc-500 line-through",
};

export function BadgeSituacao({ situacao }: { situacao: Situacao }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        CORES_SITUACAO[situacao],
      )}
    >
      {ROTULO_SITUACAO[situacao]}
    </span>
  );
}

export function Badge({ children, cor = "zinc" }: { children: ReactNode; cor?: "zinc" | "green" | "red" | "amber" | "blue" }) {
  const cores = {
    zinc: "bg-zinc-100 text-zinc-700",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-blue-100 text-blue-800",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", cores[cor])}>
      {children}
    </span>
  );
}

export function Cabecalho({ titulo, subtitulo, acao }: { titulo: string; subtitulo?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-zinc-500">{subtitulo}</p>}
      </div>
      {acao}
    </div>
  );
}

export function Alerta({ tipo = "erro", children }: { tipo?: "erro" | "sucesso" | "info"; children: ReactNode }) {
  const cores = {
    erro: "border-red-200 bg-red-50 text-red-800",
    sucesso: "border-green-200 bg-green-50 text-green-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };
  return <div className={cn("rounded-lg border px-3 py-2 text-sm", cores[tipo])}>{children}</div>;
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-zinc-500">{children}</p>;
}
