"use client";

import { useRef, useState } from "react";
import { cn } from "./ui";

const LADO_MAXIMO = 1800;

// Reduz fotos tiradas pelo celular (que costumam ter 4–12 MB) para um JPEG leve.
async function comprimirImagem(arquivo: File): Promise<File> {
  if (!arquivo.type.startsWith("image/") || arquivo.size < 400_000) return arquivo;
  try {
    const bitmap = await createImageBitmap(arquivo);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    if (!blob) return arquivo;
    return new File([blob], arquivo.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return arquivo;
  }
}

export function CampoArquivo({
  name,
  label,
  erro,
  dica,
  camera = false,
  obrigatorio = false,
}: {
  name: string;
  label: string;
  erro?: string;
  dica?: string;
  camera?: boolean;
  obrigatorio?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previa, setPrevia] = useState<{ url?: string; nome: string } | null>(null);
  const [processando, setProcessando] = useState(false);

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const original = e.target.files?.[0];
    if (!original) return setPrevia(null);
    setProcessando(true);
    const arquivo = await comprimirImagem(original);
    if (arquivo !== original) {
      const dt = new DataTransfer();
      dt.items.add(arquivo);
      e.target.files = dt.files;
    }
    setPrevia({
      url: arquivo.type.startsWith("image/") ? URL.createObjectURL(arquivo) : undefined,
      nome: `${arquivo.name} (${(arquivo.size / 1024).toFixed(0)} KB)`,
    });
    setProcessando(false);
  }

  return (
    <div className="space-y-1">
      <span className="text-sm font-medium text-zinc-700">
        {label}
        {obrigatorio && " *"}
      </span>
      <label
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-white p-4 text-center text-sm hover:bg-zinc-50",
          erro ? "border-red-400" : "border-zinc-300",
        )}
      >
        {previa?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previa.url} alt="Prévia" className="max-h-48 rounded object-contain" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-zinc-400" aria-hidden>
            <path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.66-.9l.82-1.2A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        )}
        <span className="text-zinc-600">
          {processando ? "Processando imagem…" : previa ? previa.nome : camera ? "Tirar foto ou escolher arquivo" : "Escolher arquivo"}
        </span>
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={aoEscolher}
          className="sr-only"
        />
      </label>
      {dica && !erro && <span className="block text-xs text-zinc-500">{dica}</span>}
      {erro && <span className="block text-xs text-red-600">{erro}</span>}
    </div>
  );
}
