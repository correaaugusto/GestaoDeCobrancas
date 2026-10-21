import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { db } from "./db";

// Dois drivers: "local" grava em ./storage (desenvolvimento) e
// "supabase" usa o Supabase Storage (produção, ex.: Vercel, que não tem disco).
const driver = process.env.STORAGE_DRIVER ?? "local";
const pastaLocal = path.join(process.cwd(), "storage");
const bucket = process.env.SUPABASE_BUCKET ?? "arquivos";

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

const EXTENSOES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export const TIPOS_PERMITIDOS = Object.keys(EXTENSOES);
export const TAMANHO_MAXIMO = 8 * 1024 * 1024;

export async function salvarArquivo(file: File, prefixo: string) {
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    throw new Error("Formato não suportado. Envie JPG, PNG, WEBP ou PDF.");
  }
  if (file.size > TAMANHO_MAXIMO) {
    throw new Error("Arquivo muito grande (máximo 8 MB).");
  }

  const conteudo = Buffer.from(await file.arrayBuffer());
  const chave = `${prefixo}/${Date.now()}-${randomBytes(6).toString("hex")}.${EXTENSOES[file.type]}`;

  if (driver === "supabase") {
    const cliente = supabase();
    const enviar = () => cliente.storage.from(bucket).upload(chave, conteudo, { contentType: file.type });
    let { error } = await enviar();
    // Primeiro upload em um projeto novo: cria o bucket (privado) e tenta de novo.
    if (error && /bucket not found/i.test(error.message)) {
      await cliente.storage.createBucket(bucket, { public: false });
      ({ error } = await enviar());
    }
    if (error) throw new Error(`Falha ao enviar arquivo: ${error.message}`);
  } else {
    const destino = path.join(pastaLocal, chave);
    await mkdir(path.dirname(destino), { recursive: true });
    await writeFile(destino, conteudo);
  }

  return db.arquivo.create({
    data: { chave, nome: file.name || chave, mimeType: file.type, tamanho: file.size },
  });
}

export async function lerArquivo(chave: string): Promise<Buffer> {
  if (driver === "supabase") {
    const { data, error } = await supabase().storage.from(bucket).download(chave);
    if (error || !data) throw new Error("Arquivo não encontrado");
    return Buffer.from(await data.arrayBuffer());
  }
  // A chave é gerada por nós, mas garantimos que não sai da pasta.
  const caminho = path.resolve(pastaLocal, chave);
  if (!caminho.startsWith(pastaLocal + path.sep)) throw new Error("Chave inválida");
  return readFile(caminho);
}
