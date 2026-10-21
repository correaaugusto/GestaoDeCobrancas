import type { Metadata } from "next";
import { exigirUsuario, SO_DONO } from "@/lib/auth";
import { db } from "@/lib/db";
import { alternarAtivoUsuario } from "@/app/actions/usuarios";
import { Badge, Cabecalho, Cartao } from "@/components/ui";
import { FormNovoUsuario, FormSenha } from "./forms";

export const metadata: Metadata = { title: "Usuários" };

const ROTULO = { DONO: "Dono", FINANCEIRO: "Financeiro", ATENDENTE: "Atendente" } as const;

export default async function Usuarios() {
  const eu = await exigirUsuario(SO_DONO);
  const usuarios = await db.usuario.findMany({ orderBy: [{ ativo: "desc" }, { nome: "asc" }] });

  return (
    <>
      <Cabecalho titulo="Usuários" subtitulo="Quem pode acessar o sistema" />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Cartao className="p-0 sm:p-0">
          <ul className="divide-y divide-zinc-100">
            {usuarios.map((u) => (
              <li key={u.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium">
                    {u.nome} <Badge cor={u.papel === "DONO" ? "blue" : "zinc"}>{ROTULO[u.papel]}</Badge>{" "}
                    {!u.ativo && <Badge cor="red">Inativo</Badge>}
                  </p>
                  <p className="text-sm text-zinc-500">{u.email}</p>
                  <FormSenha id={u.id} />
                </div>
                {u.id !== eu.id && (
                  <form action={alternarAtivoUsuario.bind(null, u.id)}>
                    <button className="text-sm text-zinc-600 underline">{u.ativo ? "Desativar" : "Reativar"}</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </Cartao>
        <Cartao titulo="Novo usuário">
          <FormNovoUsuario />
        </Cartao>
      </div>
    </>
  );
}
