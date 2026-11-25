# Vistto Cidadão

Ferramenta gratuita para quem mora de aluguel em São Paulo conferir, antes de pagar ou assinar, se o aluguel é seguro.

Projeto acadêmico da FIAP (Sub Global Solution 2 — CitizenTech: Tecnologia a Serviço do Cidadão).
Guilherme Hideki Takara Chalita — RM 561845.

## O que o app faz

| Ferramenta | Tecnologia | O que entrega |
|---|---|---|
| **É golpe?** | Visão Computacional (Claude Sonnet 5.5, multimodal) | Lê foto de anúncio, boleto/PIX, documento do imóvel ou print de conversa e aponta sinais de golpe. No boleto, os dígitos verificadores da linha digitável são conferidos por código (módulos 10 e 11 da FEBRABAN). |
| **Entenda o contrato** | IA generativa com saída estruturada | Lê o contrato em foto ou PDF, explica em linguagem simples e avalia cláusulas à luz da Lei do Inquilinato (Lei 8.245/1991). |
| **Aluguel justo** | Análise de Dados | Compara o preço com a média do bairro (dados públicos), calcula o peso na renda e confere o reajuste pelo IGP-M ou IPCA, consultando a API do Banco Central. |
| **Painel** | Análise de Dados | Totais anônimos por tipo de sinal, bairro e mês. |

Acessibilidade: semáforo com cor + ícone + texto, leitura em voz alta (Web Speech API), alto contraste, aumento de fonte, navegação por teclado e linguagem simples.

Privacidade (LGPD): os arquivos enviados não são armazenados; só o resultado da análise vai para o histórico. O usuário pode baixar seus dados, apagar o histórico e apagar a conta.

## Arquitetura

- **Next.js 16** (App Router) + **Tailwind CSS 4**, hospedado na **Vercel** (cloud, funções serverless).
- **BetterAuth** (e-mail e senha) + **Drizzle ORM**.
- **Postgres**: Neon (nuvem) em produção, via `DATABASE_URL`. Sem essa variável, o app usa **PGlite** (Postgres embutido) e roda sem instalar banco.
- **API da Anthropic** (`claude-sonnet-5-5`) para visão computacional e leitura de contratos, com saída validada por schema (Zod).
- **API SGS do Banco Central** (séries 189 e 433) para os índices de reajuste, com tabela local de reserva.

```
src/
  app/            páginas e rotas de API (app/api/*)
  components/     interface, acessibilidade, envio de arquivos, telas de resultado
  lib/            banco, autenticação, Claude, boleto, índices, comparação de preço
  data/           preço por bairro (com fonte por linha) e reserva dos índices
```

## Rodando localmente

Requer Node.js 20 ou mais novo.

```bash
npm install
cp .env.example .env.local   # preencha BETTER_AUTH_SECRET e ANTHROPIC_API_KEY
npm run dev
```

Abra http://localhost:3000. Sem `ANTHROPIC_API_KEY`, o cadastro, o "Aluguel justo", o painel e o histórico funcionam; as análises por IA respondem que a chave não está configurada.

## Dados

- `src/data/aluguel_bairros.json`: preço de aluguel por m² em 37 bairros de São Paulo. Cada linha indica a fonte (Índice FipeZAP, Índice QuintoAndar Imovelweb, Loft) e a data de referência. As metodologias não são idênticas entre as fontes; o app mostra a fonte usada em cada comparação.
- O painel nasce com 200 registros **simulados** (`demo = true`), sempre identificados como demonstração na tela.

## Limites

O Vistto Cidadão dá uma orientação inicial. Ele não consulta cartórios, não faz busca reversa de imagens e não substitui o Procon, a Defensoria Pública ou um advogado.
