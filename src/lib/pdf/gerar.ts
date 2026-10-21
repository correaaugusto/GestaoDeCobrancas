import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { empresa, urlApp } from "@/lib/empresa";
import { lerArquivo } from "@/lib/storage";
import { DocumentoOS } from "./documento-os";

type Arq = { chave: string; mimeType: string } | null;

async function imagem(arquivo: Arq) {
  if (!arquivo) return null;
  if (arquivo.mimeType === "image/png") return { data: await lerArquivo(arquivo.chave), format: "png" as const };
  if (arquivo.mimeType === "image/jpeg") return { data: await lerArquivo(arquivo.chave), format: "jpg" as const };
  return null; // webp não é suportado pelo react-pdf; o arquivo continua disponível no sistema
}

export async function gerarPdfOS(where: { id: string } | { tokenPublico: string }) {
  const os = await db.ordemServico.findUnique({
    where,
    include: {
      cliente: true,
      itens: { orderBy: { id: "asc" } },
      assinatura: true,
      documentoVeiculo: true,
    },
  });
  if (!os) return null;

  const linkConfirmacao = `${urlApp()}/confirmar/${os.tokenPublico}`;
  const documentoEhPdf = os.documentoVeiculo?.mimeType === "application/pdf";

  const pdf = await renderToBuffer(
    DocumentoOS({
      d: {
        empresa,
        numero: os.numero,
        dataServico: os.dataServico,
        cliente: os.cliente,
        motoristaNome: os.motoristaNome,
        motoristaDocumento: os.motoristaDocumento,
        placa: os.placa,
        veiculoDescricao: os.veiculoDescricao,
        observacoes: os.observacoes,
        itens: os.itens,
        totalCentavos: os.totalCentavos,
        vencimento: os.vencimento,
        notaFiscalNumero: os.notaFiscalNumero,
        pago: os.statusCobranca === "PAGA" ? { em: os.pagoEm, valorCentavos: os.valorPagoCentavos } : null,
        cancelada: os.statusCobranca === "CANCELADA",
        confirmacao: { status: os.statusConfirmacao, nome: os.confirmacaoNome, em: os.confirmacaoEm },
        linkConfirmacao,
        qrCode: await QRCode.toDataURL(linkConfirmacao, { margin: 0, width: 240 }),
        assinatura: await imagem(os.assinatura),
        documentoImagem: documentoEhPdf ? null : await imagem(os.documentoVeiculo),
        documentoEhPdf,
      },
    }),
  );

  let bytes: Uint8Array = pdf;
  // CRLV digital normalmente vem em PDF: juntamos as páginas no final.
  if (documentoEhPdf && os.documentoVeiculo) {
    const final = await PDFDocument.load(pdf);
    const anexo = await PDFDocument.load(await lerArquivo(os.documentoVeiculo.chave), { ignoreEncryption: true });
    const paginas = await final.copyPages(anexo, anexo.getPageIndices());
    paginas.forEach((p) => final.addPage(p));
    bytes = await final.save();
  }

  return { bytes, nomeArquivo: `OS-${os.numero}-${os.placa}.pdf` };
}
