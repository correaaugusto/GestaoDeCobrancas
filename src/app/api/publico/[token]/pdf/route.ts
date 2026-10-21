import { gerarPdfOS } from "@/lib/pdf/gerar";

// Acesso pelo link enviado ao cliente: o token longo e aleatório é a autorização.
export async function GET(_: Request, { params }: RouteContext<"/api/publico/[token]/pdf">) {
  const { token } = await params;
  const pdf = await gerarPdfOS({ tokenPublico: token });
  if (!pdf) return new Response("Não encontrado", { status: 404 });

  return new Response(Buffer.from(pdf.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${pdf.nomeArquivo}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
