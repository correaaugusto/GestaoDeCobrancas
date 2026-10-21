import { SignJWT, jwtVerify } from "jose";
import type { Papel } from "@prisma/client";

// Usado tanto no proxy quanto no servidor, por isso não importa "server-only".
export const COOKIE_SESSAO = "sessao";
const DURACAO_SEGUNDOS = 60 * 60 * 24 * 7;

export type DadosSessao = { uid: string; papel: Papel };

function chave() {
  const segredo = process.env.SESSION_SECRET;
  if (!segredo || segredo.length < 32) {
    throw new Error("SESSION_SECRET precisa ter pelo menos 32 caracteres");
  }
  return new TextEncoder().encode(segredo);
}

export async function criarToken(dados: DadosSessao) {
  return new SignJWT(dados)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_SEGUNDOS}s`)
    .sign(chave());
}

export async function lerToken(token: string | undefined): Promise<DadosSessao | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave());
    return { uid: payload.uid as string, papel: payload.papel as Papel };
  } catch {
    return null;
  }
}

export const opcoesCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: DURACAO_SEGUNDOS,
};
