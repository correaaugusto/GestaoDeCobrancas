const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarMoeda(centavos: number) {
  return moeda.format(centavos / 100);
}

// "1.234,56" ou "1234.56" -> 123456
export function paraCentavos(valor: string): number {
  const limpo = valor.trim().replace(/[R$\s]/g, "");
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? Math.round(numero * 100) : NaN;
}

export function centavosParaInput(centavos: number) {
  return (centavos / 100).toFixed(2).replace(".", ",");
}

const FUSO = "America/Sao_Paulo";

export function formatarDataHora(data: Date) {
  return data.toLocaleString("pt-BR", { timeZone: FUSO, dateStyle: "short", timeStyle: "short" });
}

export function formatarData(data: Date) {
  return data.toLocaleDateString("pt-BR", { timeZone: FUSO });
}

// Campos @db.Date voltam como meia-noite UTC, então formatamos em UTC.
export function formatarDia(data: Date | null | undefined) {
  return data ? data.toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—";
}

// Data de hoje no fuso de Brasília como Date em meia-noite UTC (mesmo formato dos campos @db.Date).
export function hoje(): Date {
  const iso = new Date().toLocaleDateString("en-CA", { timeZone: FUSO });
  return new Date(`${iso}T00:00:00Z`);
}

export function somarDias(data: Date, dias: number) {
  return new Date(data.getTime() + dias * 86_400_000);
}

export function diaParaInput(data: Date | null | undefined) {
  return data ? data.toISOString().slice(0, 10) : "";
}

export function inputParaDia(valor: string): Date | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? new Date(`${valor}T00:00:00Z`) : null;
}

export function apenasDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function formatarCnpj(cnpj: string | null | undefined) {
  const d = apenasDigitos(cnpj ?? "");
  if (d.length !== 14) return cnpj ?? "";
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function formatarPlaca(placa: string) {
  return placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function formatarQuantidade(qtd: number) {
  return qtd.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}
