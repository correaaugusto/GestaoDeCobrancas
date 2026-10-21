"use client";

import { useEffect, useRef, useState } from "react";

// Lê a assinatura desenhada no form como PNG (null se ninguém assinou).
// Feito no envio para não depender de um toBlob assíncrono ainda pendente.
export async function lerAssinatura(form: HTMLFormElement): Promise<File | null> {
  const canvas = form.querySelector<HTMLCanvasElement>("canvas[data-assinatura]");
  if (!canvas || canvas.dataset.assinatura !== "preenchida") return null;
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  return blob ? new File([blob], "assinatura.png", { type: "image/png" }) : null;
}

// Quadro de assinatura com o dedo/mouse.
export function Assinatura({ erro }: { erro?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);
  const [vazia, setVazia] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current!;
    let larguraAnterior = 0;
    // No celular o "resize" dispara quando a barra de endereço ou o teclado aparecem.
    // Só redimensionamos (e limpamos) quando a largura muda de verdade, ex.: ao girar a tela.
    const ajustar = () => {
      const escala = window.devicePixelRatio || 1;
      const { width, height } = canvas.getBoundingClientRect();
      if (width === larguraAnterior) return;
      larguraAnterior = width;
      canvas.width = width * escala;
      canvas.height = height * escala;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(escala, escala);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111827";
      setVazia(true);
    };
    ajustar();
    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, []);

  function ponto(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function iniciar(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    desenhando.current = true;
    const ctx = e.currentTarget.getContext("2d")!;
    const { x, y } = ponto(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
  }

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!desenhando.current) return;
    const ctx = e.currentTarget.getContext("2d")!;
    const { x, y } = ponto(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function terminar() {
    if (!desenhando.current) return;
    desenhando.current = false;
    setVazia(false);
  }

  function limpar() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setVazia(true);
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700">Assinatura do motorista *</span>
        {!vazia && (
          <button type="button" onClick={limpar} className="text-sm text-zinc-500 underline">
            Limpar
          </button>
        )}
      </div>
      <div className={`relative rounded-lg border-2 border-dashed bg-white ${erro ? "border-red-400" : "border-zinc-300"}`}>
        <canvas
          ref={canvasRef}
          data-assinatura={vazia ? "vazia" : "preenchida"}
          className="block h-44 w-full touch-none"
          onPointerDown={iniciar}
          onPointerMove={mover}
          onPointerUp={terminar}
          onPointerCancel={terminar}
        />
        {vazia && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
            Assine aqui com o dedo
          </span>
        )}
        <div className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-zinc-300" />
      </div>
      {erro && <span className="block text-xs text-red-600">{erro}</span>}
    </div>
  );
}
