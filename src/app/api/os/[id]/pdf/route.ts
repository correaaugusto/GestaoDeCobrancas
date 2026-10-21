import { getUsuario } from "@/lib/auth";
import { gerarPdfOS } from "@/lib/pdf/gerar";

export async function GET(request: Request, { params }: RouteContext<"/api/os/[id]/pdf">) {
  if (!(await getUsuario())) return new Response("Não autenticado", { status: 401 });
  const { id } = await params;
  const pdf = await gerarPdfOS({ id });
  if (!pdf) return new Response("OS não encontrada", { status: 404 });

  const baixar = new URL(request.url).searchParams.has("baixar");
  return new Response(Buffer.from(pdf.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${baixar ? "attachment" : "inline"}; filename="${pdf.nomeArquivo}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
