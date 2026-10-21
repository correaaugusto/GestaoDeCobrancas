-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('DONO', 'FINANCEIRO', 'ATENDENTE');

-- CreateEnum
CREATE TYPE "TipoItem" AS ENUM ('SERVICO', 'PECA');

-- CreateEnum
CREATE TYPE "StatusConfirmacao" AS ENUM ('AGUARDANDO', 'CONFIRMADA', 'CONTESTADA');

-- CreateEnum
CREATE TYPE "StatusCobranca" AS ENUM ('ABERTA', 'PAGA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'ATENDENTE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpj" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "prazoPagamentoDias" INTEGER NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Arquivo" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Arquivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemServico" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "clienteId" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "dataServico" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,
    "motoristaNome" TEXT NOT NULL,
    "motoristaDocumento" TEXT,
    "placa" TEXT NOT NULL,
    "veiculoDescricao" TEXT,
    "totalCentavos" INTEGER NOT NULL,
    "assinaturaId" TEXT,
    "documentoVeiculoId" TEXT,
    "tokenPublico" TEXT NOT NULL,
    "statusConfirmacao" "StatusConfirmacao" NOT NULL DEFAULT 'AGUARDANDO',
    "confirmacaoEm" TIMESTAMP(3),
    "confirmacaoNome" TEXT,
    "confirmacaoIp" TEXT,
    "contestacaoMotivo" TEXT,
    "statusCobranca" "StatusCobranca" NOT NULL DEFAULT 'ABERTA',
    "vencimento" DATE,
    "notaFiscalNumero" TEXT,
    "notaFiscalId" TEXT,
    "cobrancaEnviadaEm" TIMESTAMP(3),
    "pagoEm" DATE,
    "valorPagoCentavos" INTEGER,
    "comprovanteId" TEXT,
    "pagamentoPorId" TEXT,
    "canceladaEm" TIMESTAMP(3),
    "cancelamentoMotivo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdemServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemOS" (
    "id" TEXT NOT NULL,
    "osId" TEXT NOT NULL,
    "tipo" "TipoItem" NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "valorUnitarioCentavos" INTEGER NOT NULL,
    "subtotalCentavos" INTEGER NOT NULL,

    CONSTRAINT "ItemOS_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_cnpj_key" ON "Cliente"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Arquivo_chave_key" ON "Arquivo"("chave");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemServico_numero_key" ON "OrdemServico"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemServico_assinaturaId_key" ON "OrdemServico"("assinaturaId");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemServico_documentoVeiculoId_key" ON "OrdemServico"("documentoVeiculoId");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemServico_tokenPublico_key" ON "OrdemServico"("tokenPublico");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemServico_notaFiscalId_key" ON "OrdemServico"("notaFiscalId");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemServico_comprovanteId_key" ON "OrdemServico"("comprovanteId");

-- CreateIndex
CREATE INDEX "OrdemServico_clienteId_idx" ON "OrdemServico"("clienteId");

-- CreateIndex
CREATE INDEX "OrdemServico_statusCobranca_vencimento_idx" ON "OrdemServico"("statusCobranca", "vencimento");

-- CreateIndex
CREATE INDEX "OrdemServico_dataServico_idx" ON "OrdemServico"("dataServico");

-- CreateIndex
CREATE INDEX "ItemOS_osId_idx" ON "ItemOS"("osId");

-- CreateIndex
CREATE INDEX "ItemOS_tipo_descricao_idx" ON "ItemOS"("tipo", "descricao");

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_assinaturaId_fkey" FOREIGN KEY ("assinaturaId") REFERENCES "Arquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_documentoVeiculoId_fkey" FOREIGN KEY ("documentoVeiculoId") REFERENCES "Arquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "Arquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_comprovanteId_fkey" FOREIGN KEY ("comprovanteId") REFERENCES "Arquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_pagamentoPorId_fkey" FOREIGN KEY ("pagamentoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemOS" ADD CONSTRAINT "ItemOS_osId_fkey" FOREIGN KEY ("osId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
