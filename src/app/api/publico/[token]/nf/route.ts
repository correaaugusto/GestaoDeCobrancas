import { db } from "@/lib/db";
import { lerArquivo } from "@/lib/storage";

export async function GET(_: Request, { params }: RouteContext<"/api/publico/[token]/nf">) {
  const { token } = await params;
  const os = await db.ordemServico.findUnique({
    where: { tokenPublico: token },
    select: { numero: true, notaFiscal: true },
  });
  if (!os?.notaFiscal) return new Response("Não encontrado", { status: 404 });

  const ext = os.notaFiscal.chave.split(".").pop();
  return new Response(new Uint8Array(await lerArquivo(os.notaFiscal.chave)), {
    headers: {
      "Content-Type": os.notaFiscal.mimeType,
      "Content-Disposition": `inline; filename="NF-OS-${os.numero}.${ext}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
