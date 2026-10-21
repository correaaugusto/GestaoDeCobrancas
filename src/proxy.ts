import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, lerToken } from "@/lib/sessao";

// Checagem otimista: só redireciona quem não tem sessão válida.
// A verificação definitiva (usuário ativo, papel) acontece em lib/auth.ts.
export async function proxy(request: NextRequest) {
  const sessao = await lerToken(request.cookies.get(COOKIE_SESSAO)?.value);
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    return sessao ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }

  if (!sessao) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Atalho de permissão por papel (a página também verifica).
  const soGerencia = pathname.startsWith("/painel") || /^\/clientes\/[^/]+\/editar/.test(pathname);
  const soDono = pathname.startsWith("/usuarios");
  if ((soGerencia && sessao.papel === "ATENDENTE") || (soDono && sessao.papel !== "DONO")) {
    return NextResponse.redirect(new URL("/sem-permissao", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Rotas públicas: página de confirmação do cliente e seus arquivos.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|confirmar|api/publico).*)"],
};
