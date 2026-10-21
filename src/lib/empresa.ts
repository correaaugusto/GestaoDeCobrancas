// Dados da empresa que aparecem no PDF e nas mensagens.
export const empresa = {
  nome: process.env.EMPRESA_NOME ?? "Minha Empresa",
  cnpj: process.env.EMPRESA_CNPJ ?? "",
  telefone: process.env.EMPRESA_TELEFONE ?? "",
  endereco: process.env.EMPRESA_ENDERECO ?? "",
};

export function urlApp() {
  // Na Vercel, sem APP_URL definido, usa o domínio de produção do projeto.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = process.env.APP_URL || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}
