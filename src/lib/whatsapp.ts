import { formatarDia, formatarMoeda } from "./formato";

export function linkWhatsApp(telefone: string | null, mensagem: string) {
  const digitos = (telefone ?? "").replace(/\D/g, "");
  const numero = digitos && !digitos.startsWith("55") ? `55${digitos}` : digitos;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

export function mensagemCobranca(os: {
  numero: number;
  placa: string;
  totalCentavos: number;
  vencimento: Date | null;
  notaFiscalNumero: string | null;
  link: string;
  empresa: string;
  vencida: boolean;
}) {
  const abertura = os.vencida
    ? `Lembrete: a OS nº ${os.numero} (placa ${os.placa}) no valor de ${formatarMoeda(os.totalCentavos)} venceu em ${formatarDia(os.vencimento)}.`
    : `Segue a cobrança da OS nº ${os.numero} (placa ${os.placa}) no valor de ${formatarMoeda(os.totalCentavos)}` +
      (os.vencimento ? `, com vencimento em ${formatarDia(os.vencimento)}.` : ".");

  const linhas = [`Olá! Aqui é da ${os.empresa}.`, abertura];
  if (os.notaFiscalNumero) linhas.push(`Nota fiscal nº ${os.notaFiscalNumero}.`);
  linhas.push("", `Ordem de serviço${os.notaFiscalNumero ? ", nota fiscal" : ""} e confirmação do serviço:`, os.link);
  return linhas.join("\n");
}
