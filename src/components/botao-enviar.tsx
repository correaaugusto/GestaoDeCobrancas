"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { cn, estiloBotao } from "./ui";

export function BotaoEnviar({
  children,
  enviando = "Salvando…",
  variante = "primario",
  className,
  name,
  value,
}: {
  children: ReactNode;
  enviando?: string;
  variante?: keyof typeof estiloBotao;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={cn(estiloBotao[variante], className)}>
      {pending ? enviando : children}
    </button>
  );
}
