// Dados da empresa que aparecem no PDF e nas mensagens.
export const empresa = {
  nome: process.env.EMPRESA_NOME ?? "Minha Empresa",
  cnpj: process.env.EMPRESA_CNPJ ?? "",
  telefone: process.env.EMPRESA_TELEFONE ?? "",
  endereco: process.env.EMPRESA_ENDERECO ?? "",
};

export function urlApp() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
