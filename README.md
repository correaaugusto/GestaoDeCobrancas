# Controle de OS

Sistema web que substitui o "fiado" em papel: o atendente registra a ordem de serviço no celular
(com assinatura do motorista e foto do documento do veículo), o financeiro cobra pelo WhatsApp com
um link onde a empresa cliente confere o PDF e confirma o serviço, e o dono acompanha no painel
quanto faturou, recebeu e quem está devendo.

## Funcionalidades

- **Ordem de serviço pelo celular** — empresa, placa, motorista, serviços e peças, foto/PDF do CRLV
  (fotos são comprimidas no próprio aparelho) e assinatura do motorista na tela.
- **PDF da OS** — dados, itens, assinatura, QR code de confirmação e o documento do veículo anexado
  (imagem vira uma página; CRLV em PDF tem as páginas juntadas ao final).
- **Link de confirmação** — a empresa abre o link (sem login), vê os itens, baixa o PDF e a NF e
  confirma ou contesta o serviço. Fica registrado nome, data/hora e IP.
- **Cobrança** — vencimento calculado pelo prazo de cada cliente, número e arquivo da NF, botão que
  abre o WhatsApp com a mensagem pronta (cobrança ou lembrete de atraso).
- **Pagamento** — anexar comprovante marca a OS como paga automaticamente.
- **Painel do dono** — faturado e recebido no mês, a receber, vencido, cobranças atrasadas,
  clientes que mais devem, peças vendidas e serviços realizados.
- **Perfis de acesso** — Atendente (registra OS), Financeiro (cobranças) e Dono (tudo + usuários).

## Stack

Next.js 16 (App Router, Server Actions, Cache Components) · TypeScript · Tailwind CSS 4 ·
PostgreSQL + Prisma · `@react-pdf/renderer` + `pdf-lib` · sessão com JWT (`jose`) em cookie httpOnly ·
armazenamento de arquivos em disco local ou Supabase Storage.

## Rodando localmente

Requisitos: Node 20+ e PostgreSQL.

```bash
cp .env.example .env        # preencha DATABASE_URL, DIRECT_URL e SESSION_SECRET
npm install
npm run db:migrate          # cria as tabelas
npm run db:seed             # usuários e dados de exemplo
npm run dev
```

Acesse http://localhost:3000. Usuários de exemplo (senha `123456`):
`dono@exemplo.com`, `financeiro@exemplo.com`, `atendente@exemplo.com`.

Para testar no celular na mesma rede, acesse pelo IP do computador e ajuste `APP_URL`.

## Deploy (Vercel + Supabase)

1. **Supabase** — crie um projeto (região *South America (São Paulo)*). Em *Connect*, copie:
   - *Transaction pooler* (porta 6543) → `DATABASE_URL`, acrescentando `?pgbouncer=true&connection_limit=1`
   - *Session pooler* (porta 5432) → `DIRECT_URL`
   - Em *Project Settings → API Keys*, a chave secreta (`service_role` / `sb_secret_…`) → `SUPABASE_SERVICE_ROLE_KEY`
   - A URL do projeto (`https://xxxx.supabase.co`) → `SUPABASE_URL`
2. **Vercel** — importe o repositório e configure as variáveis:
   `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, `STORAGE_DRIVER=supabase`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY` e os dados `EMPRESA_*`.
3. Faça o deploy. O build cria/atualiza as tabelas (`prisma migrate deploy`) e o bucket de arquivos
   é criado no primeiro upload.
4. Abra o site: na primeira visita aparece a tela de **primeiro acesso** para criar o usuário dono.

`APP_URL` é opcional na Vercel (usa o domínio de produção do projeto); defina-o se usar domínio próprio.

> A Vercel limita o corpo de cada requisição a ~4,5 MB. As fotos já são reduzidas no navegador,
> mas PDFs grandes de NF/comprovante podem passar disso.

## Estrutura

```
prisma/schema.prisma        modelo de dados (Usuário, Cliente, OrdemServico, ItemOS, Arquivo)
src/proxy.ts                redireciona quem não está logado / sem permissão
src/lib/auth.ts             sessão e checagem de papel (usado por páginas e actions)
src/lib/storage.ts          upload/leitura de arquivos (local ou Supabase)
src/lib/pdf/                geração do PDF da OS
src/app/actions/            Server Actions (login, clientes, OS, usuários)
src/app/(app)/              telas internas (painel, OS, clientes, usuários)
src/app/confirmar/[token]   página pública de confirmação
src/app/api/                download de PDF e arquivos
```

## Próximos passos

- Pagamento parcial e várias OS numa mesma cobrança (fatura mensal por cliente)
- Lembrete automático de vencimento
- Emissão de NFS-e integrada (ex.: Focus NFe / NFE.io)
- Relatórios exportáveis (Excel/PDF)
