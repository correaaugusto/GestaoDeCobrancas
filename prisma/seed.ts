// Dados de demonstração. Rode com: npm run db:seed
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient, type TipoItem } from "@prisma/client";

const db = new PrismaClient();

const SERVICOS: [string, number][] = [
  ["Troca de óleo", 18000],
  ["Alinhamento e balanceamento", 32000],
  ["Revisão de freios", 45000],
  ["Lavagem completa", 15000],
  ["Troca de pastilhas", 28000],
  ["Regulagem de embreagem", 38000],
];
const PECAS: [string, number][] = [
  ["Óleo 15W40 (litro)", 4200],
  ["Filtro de óleo", 9500],
  ["Filtro de ar", 14000],
  ["Pastilha de freio (jogo)", 32000],
  ["Lâmpada farol H7", 4500],
];

function aleatorio<T>(lista: T[]) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function diaUtc(data: Date) {
  return new Date(`${data.toISOString().slice(0, 10)}T00:00:00Z`);
}

async function main() {
  const senha = await bcrypt.hash("123456", 10);
  const [dono] = await Promise.all([
    db.usuario.upsert({
      where: { email: "dono@exemplo.com" },
      update: {},
      create: { nome: "Carlos (Dono)", email: "dono@exemplo.com", senhaHash: senha, papel: "DONO" },
    }),
    db.usuario.upsert({
      where: { email: "financeiro@exemplo.com" },
      update: {},
      create: { nome: "Ana (Financeiro)", email: "financeiro@exemplo.com", senhaHash: senha, papel: "FINANCEIRO" },
    }),
    db.usuario.upsert({
      where: { email: "atendente@exemplo.com" },
      update: {},
      create: { nome: "João (Atendente)", email: "atendente@exemplo.com", senhaHash: senha, papel: "ATENDENTE" },
    }),
  ]);

  if ((await db.cliente.count()) > 0) {
    console.log("Banco já tem clientes; pulando dados de exemplo.");
    return;
  }

  const clientes = await Promise.all(
    [
      { razaoSocial: "Transportadora Rota Sul Ltda", nomeFantasia: "Rota Sul", cnpj: "12345678000190", telefone: "11988887777", prazoPagamentoDias: 30 },
      { razaoSocial: "Logística Horizonte S.A.", nomeFantasia: "Horizonte Log", cnpj: "98765432000110", telefone: "11977776666", prazoPagamentoDias: 15 },
      { razaoSocial: "Expresso Veloz Transportes ME", nomeFantasia: "Expresso Veloz", cnpj: "45678912000155", telefone: "11966665555", prazoPagamentoDias: 0 },
      { razaoSocial: "Frota Brasil Locações Ltda", nomeFantasia: null, cnpj: "32165498000177", telefone: null, prazoPagamentoDias: 28 },
    ].map((data) => db.cliente.create({ data })),
  );

  const motoristas = ["José Almeida", "Marcos Silva", "Paulo Souza", "Ricardo Lima", "Fernando Costa"];
  const placas = ["ABC1D23", "QWE4R56", "RTY7U89", "FGH2J34", "BRA2E19", "MNB5V67"];
  const agora = Date.now();

  for (let i = 0; i < 28; i++) {
    const cliente = aleatorio(clientes);
    const dataServico = new Date(agora - Math.floor(Math.random() * 85) * 86_400_000);
    const itens: { tipo: TipoItem; descricao: string; quantidade: number; valorUnitarioCentavos: number; subtotalCentavos: number }[] = [];
    const [servico, valorServico] = aleatorio(SERVICOS);
    itens.push({ tipo: "SERVICO", descricao: servico, quantidade: 1, valorUnitarioCentavos: valorServico, subtotalCentavos: valorServico });
    for (let p = 0; p < Math.floor(Math.random() * 3); p++) {
      const [peca, valorPeca] = aleatorio(PECAS);
      const qtd = peca.includes("litro") ? 30 : 1 + Math.floor(Math.random() * 2);
      itens.push({ tipo: "PECA", descricao: peca, quantidade: qtd, valorUnitarioCentavos: valorPeca, subtotalCentavos: qtd * valorPeca });
    }
    const total = itens.reduce((s, it) => s + it.subtotalCentavos, 0);
    const vencimento = diaUtc(new Date(dataServico.getTime() + cliente.prazoPagamentoDias * 86_400_000));
    const pago = vencimento.getTime() < agora - 10 * 86_400_000 ? Math.random() < 0.75 : Math.random() < 0.3;
    const confirmada = pago || Math.random() < 0.6;

    await db.ordemServico.create({
      data: {
        clienteId: cliente.id,
        criadoPorId: dono.id,
        dataServico,
        motoristaNome: aleatorio(motoristas),
        placa: aleatorio(placas),
        veiculoDescricao: aleatorio(["Volvo FH 540", "Scania R450", "Mercedes Actros", "VW Constellation"]),
        totalCentavos: total,
        itens: { create: itens },
        tokenPublico: randomBytes(18).toString("base64url"),
        vencimento,
        notaFiscalNumero: String(1000 + i),
        cobrancaEnviadaEm: dataServico,
        ...(confirmada && {
          statusConfirmacao: "CONFIRMADA",
          confirmacaoNome: "Financeiro " + (cliente.nomeFantasia ?? "cliente"),
          confirmacaoEm: new Date(dataServico.getTime() + 86_400_000),
        }),
        ...(pago && {
          statusCobranca: "PAGA",
          pagoEm: diaUtc(new Date(Math.min(agora, vencimento.getTime() + Math.random() * 5 * 86_400_000))),
          valorPagoCentavos: total,
          pagamentoPorId: dono.id,
        }),
      },
    });
  }

  console.log("Dados de exemplo criados. Logins (senha 123456): dono@, financeiro@, atendente@exemplo.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
