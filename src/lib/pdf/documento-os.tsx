/* eslint-disable jsx-a11y/alt-text -- o <Image> do react-pdf não tem prop alt */
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatarCnpj, formatarData, formatarDataHora, formatarDia, formatarMoeda, formatarQuantidade } from "@/lib/formato";

export type DadosPdf = {
  empresa: { nome: string; cnpj: string; telefone: string; endereco: string };
  numero: number;
  dataServico: Date;
  cliente: { razaoSocial: string; nomeFantasia: string | null; cnpj: string | null };
  motoristaNome: string;
  motoristaDocumento: string | null;
  placa: string;
  veiculoDescricao: string | null;
  observacoes: string | null;
  itens: { tipo: "SERVICO" | "PECA"; descricao: string; quantidade: number; valorUnitarioCentavos: number; subtotalCentavos: number }[];
  totalCentavos: number;
  vencimento: Date | null;
  notaFiscalNumero: string | null;
  pago: { em: Date | null; valorCentavos: number | null } | null;
  cancelada: boolean;
  confirmacao: { status: "AGUARDANDO" | "CONFIRMADA" | "CONTESTADA"; nome: string | null; em: Date | null };
  linkConfirmacao: string;
  qrCode: string;
  assinatura: { data: Buffer; format: "png" | "jpg" } | null;
  documentoImagem: { data: Buffer; format: "png" | "jpg" } | null;
  documentoEhPdf: boolean;
};

const s = StyleSheet.create({
  pagina: { padding: 36, fontSize: 9.5, fontFamily: "Helvetica", color: "#18181b" },
  linha: { flexDirection: "row" },
  topo: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: "#18181b", paddingBottom: 10, marginBottom: 14 },
  empresa: { fontSize: 15, fontFamily: "Helvetica-Bold" },
  cinza: { color: "#71717a" },
  titulo: { fontSize: 11, fontFamily: "Helvetica-Bold", textAlign: "right" },
  numero: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "right" },
  caixas: { flexDirection: "row", gap: 10, marginBottom: 14 },
  caixa: { flex: 1, borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 4, padding: 8 },
  rotulo: { fontSize: 7.5, color: "#71717a", textTransform: "uppercase", marginBottom: 2 },
  negrito: { fontFamily: "Helvetica-Bold" },
  tabelaCab: { flexDirection: "row", backgroundColor: "#f4f4f5", paddingVertical: 5, paddingHorizontal: 6, fontFamily: "Helvetica-Bold", fontSize: 8.5 },
  tabelaLinha: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: "#f4f4f5" },
  colTipo: { width: 50 },
  colDesc: { flex: 1 },
  colQtd: { width: 40, textAlign: "right" },
  colValor: { width: 70, textAlign: "right" },
  total: { flexDirection: "row", justifyContent: "flex-end", paddingVertical: 8, paddingHorizontal: 6, gap: 20 },
  totalValor: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  rodape: { position: "absolute", bottom: 20, left: 36, right: 36, fontSize: 7.5, color: "#a1a1aa", flexDirection: "row", justifyContent: "space-between" },
  carimbo: { position: "absolute", top: 300, left: 120, fontSize: 60, fontFamily: "Helvetica-Bold", opacity: 0.12, transform: "rotate(-25deg)" },
});

function Rodape({ numero }: { numero: number }) {
  return (
    <View style={s.rodape} fixed>
      <Text>OS nº {numero} · gerado em {formatarDataHora(new Date())}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`} />
    </View>
  );
}

export function DocumentoOS({ d }: { d: DadosPdf }) {
  const situacaoPagamento = d.cancelada
    ? "CANCELADA"
    : d.pago
      ? `PAGO em ${formatarDia(d.pago.em)} · ${formatarMoeda(d.pago.valorCentavos ?? 0)}`
      : d.vencimento
        ? `Vencimento: ${formatarDia(d.vencimento)}`
        : "A combinar";

  return (
    <Document title={`OS ${d.numero} - ${d.cliente.razaoSocial}`} author={d.empresa.nome}>
      <Page size="A4" style={s.pagina}>
        {(d.pago || d.cancelada) && <Text style={s.carimbo}>{d.cancelada ? "CANCELADA" : "PAGO"}</Text>}

        <View style={s.topo}>
          <View>
            <Text style={s.empresa}>{d.empresa.nome}</Text>
            {d.empresa.cnpj && <Text style={s.cinza}>CNPJ {d.empresa.cnpj}</Text>}
            {d.empresa.endereco && <Text style={s.cinza}>{d.empresa.endereco}</Text>}
            {d.empresa.telefone && <Text style={s.cinza}>{d.empresa.telefone}</Text>}
          </View>
          <View>
            <Text style={s.titulo}>ORDEM DE SERVIÇO</Text>
            <Text style={s.numero}>nº {String(d.numero).padStart(5, "0")}</Text>
            <Text style={[s.cinza, { textAlign: "right" }]}>{formatarDataHora(d.dataServico)}</Text>
          </View>
        </View>

        <View style={s.caixas}>
          <View style={s.caixa}>
            <Text style={s.rotulo}>Cliente</Text>
            <Text style={s.negrito}>{d.cliente.razaoSocial}</Text>
            {d.cliente.nomeFantasia && <Text>{d.cliente.nomeFantasia}</Text>}
            {d.cliente.cnpj && <Text style={s.cinza}>CNPJ {formatarCnpj(d.cliente.cnpj)}</Text>}
          </View>
          <View style={s.caixa}>
            <Text style={s.rotulo}>Veículo e motorista</Text>
            <Text style={s.negrito}>
              Placa {d.placa}
              {d.veiculoDescricao ? ` · ${d.veiculoDescricao}` : ""}
            </Text>
            <Text>Motorista: {d.motoristaNome}</Text>
            {d.motoristaDocumento && <Text style={s.cinza}>Documento: {d.motoristaDocumento}</Text>}
          </View>
        </View>

        <View style={s.tabelaCab}>
          <Text style={s.colTipo}>Tipo</Text>
          <Text style={s.colDesc}>Descrição</Text>
          <Text style={s.colQtd}>Qtd</Text>
          <Text style={s.colValor}>Valor unit.</Text>
          <Text style={s.colValor}>Subtotal</Text>
        </View>
        {d.itens.map((item, i) => (
          <View key={i} style={s.tabelaLinha} wrap={false}>
            <Text style={s.colTipo}>{item.tipo === "SERVICO" ? "Serviço" : "Peça"}</Text>
            <Text style={s.colDesc}>{item.descricao}</Text>
            <Text style={s.colQtd}>{formatarQuantidade(item.quantidade)}</Text>
            <Text style={s.colValor}>{formatarMoeda(item.valorUnitarioCentavos)}</Text>
            <Text style={s.colValor}>{formatarMoeda(item.subtotalCentavos)}</Text>
          </View>
        ))}
        <View style={s.total}>
          <Text style={{ alignSelf: "center" }}>Total</Text>
          <Text style={s.totalValor}>{formatarMoeda(d.totalCentavos)}</Text>
        </View>

        <View style={[s.caixas, { marginTop: 4 }]}>
          <View style={s.caixa}>
            <Text style={s.rotulo}>Pagamento</Text>
            <Text style={s.negrito}>{situacaoPagamento}</Text>
            {d.notaFiscalNumero && <Text>Nota fiscal nº {d.notaFiscalNumero}</Text>}
          </View>
          {d.observacoes && (
            <View style={s.caixa}>
              <Text style={s.rotulo}>Observações</Text>
              <Text>{d.observacoes}</Text>
            </View>
          )}
        </View>

        <View style={[s.linha, { gap: 14, marginTop: 6 }]} wrap={false}>
          <View style={[s.caixa, { flex: 3 }]}>
            <Text style={s.rotulo}>Assinatura do motorista</Text>
            {d.assinatura ? (
              <Image src={d.assinatura} style={{ height: 70, objectFit: "contain", marginVertical: 4 }} />
            ) : (
              <View style={{ height: 70 }} />
            )}
            <View style={{ borderTopWidth: 1, borderTopColor: "#a1a1aa", paddingTop: 3 }}>
              <Text>{d.motoristaNome}</Text>
            </View>
            <Text style={[s.cinza, { fontSize: 7.5, marginTop: 4 }]}>
              Declaro que os serviços e peças acima foram realizados/fornecidos no veículo placa {d.placa} em{" "}
              {formatarData(d.dataServico)}.
            </Text>
          </View>
          <View style={[s.caixa, { flex: 2, alignItems: "center" }]}>
            <Text style={s.rotulo}>Confirmação da empresa</Text>
            <Image src={d.qrCode} style={{ width: 80, height: 80 }} />
            {d.confirmacao.status === "CONFIRMADA" ? (
              <Text style={[s.negrito, { color: "#15803d", textAlign: "center" }]}>
                Confirmado por {d.confirmacao.nome} em {d.confirmacao.em ? formatarDataHora(d.confirmacao.em) : ""}
              </Text>
            ) : d.confirmacao.status === "CONTESTADA" ? (
              <Text style={[s.negrito, { color: "#b91c1c", textAlign: "center" }]}>Contestado por {d.confirmacao.nome}</Text>
            ) : (
              <Text style={{ textAlign: "center", fontSize: 7.5 }}>
                Escaneie ou acesse o link para conferir e confirmar o serviço:{"\n"}
                {d.linkConfirmacao}
              </Text>
            )}
          </View>
        </View>

        {d.documentoEhPdf && (
          <Text style={[s.cinza, { marginTop: 10 }]}>Documento do veículo anexado nas páginas seguintes.</Text>
        )}
        <Rodape numero={d.numero} />
      </Page>

      {d.documentoImagem && (
        <Page size="A4" style={s.pagina}>
          <Text style={[s.negrito, { fontSize: 12, marginBottom: 4 }]}>Anexo · Documento do veículo</Text>
          <Text style={[s.cinza, { marginBottom: 12 }]}>
            Placa {d.placa} · OS nº {d.numero} · {formatarData(d.dataServico)}
          </Text>
          <Image src={d.documentoImagem} style={{ maxHeight: 680, objectFit: "contain" }} />
          <Rodape numero={d.numero} />
        </Page>
      )}
    </Document>
  );
}
