import { getUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { lerArquivo } from "@/lib/storage";

export async function GET(_: Request, { params }: RouteContext<"/api/arquivos/[id]">) {
  if (!(await getUsuario())) return new Response("Não autenticado", { status: 401 });
  const { id } = await params;
  const arquivo = await db.arquivo.findUnique({ where: { id } });
  if (!arquivo) return new Response("Não encontrado", { status: 404 });

  return new Response(new Uint8Array(await lerArquivo(arquivo.chave)), {
    headers: {
      "Content-Type": arquivo.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(arquivo.nome)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
