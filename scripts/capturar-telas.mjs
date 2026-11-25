// Captura as telas do app para a documentacao (usa o Chrome instalado).
// Uso: node scripts/capturar-telas.mjs [url-base] [pasta-saida]
//
// As telas de resultado de "E golpe?" e "Contrato" dependem da API de IA. Para
// que a captura nao dependa de chave nem gaste creditos, as respostas dessas
// duas rotas sao substituidas por exemplos ILUSTRATIVOS (abaixo). Com a chave
// configurada, rode com REAL=1 para capturar respostas reais do modelo.
import { chromium } from "playwright-core";
import path from "node:path";
import fs from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = path.resolve(process.argv[3] ?? "../visuais/telas");
const REAL = process.env.REAL === "1";
const EMAIL = "demo@vistto-cidadao.local";
const SENHA = "demonstracao-2026";
fs.mkdirSync(OUT, { recursive: true });

const EXEMPLO_GOLPE = {
  id: "exemplo",
  tipo: "boleto",
  resultado: {
    risco: "vermelho",
    resumo_simples:
      "Não pague este boleto. O dinheiro vai para uma pessoa diferente de quem disse ser o dono do imóvel, e o código do boleto tem erro.",
    o_que_foi_visto:
      "Boleto de R$ 3.600,00 com vencimento em 01/12/2026, referente a caução e primeiro aluguel de um apartamento em Pinheiros.",
    sinais: [
      { categoria: "beneficiario_divergente", gravidade: "alta", descricao: "O boleto está em nome de “Jefferson K. Souza Pagamentos”, mas você informou que o dono é Roberto Almeida." },
      { categoria: "pagamento_antecipado", gravidade: "alta", descricao: "O boleto cobra caução e primeiro aluguel juntos, antes de contrato assinado e de visita ao imóvel." },
      { categoria: "boleto_invalido", gravidade: "alta", descricao: "Os números da linha digitável não passam na conferência matemática." },
    ],
    dados_extraidos: {
      beneficiario: "Jefferson K. Souza Pagamentos",
      valor: "R$ 3.600,00",
      linha_digitavel: "26090001918795432109787654300000416470000360000",
      chave_pix: null,
      nomes_encontrados: ["Jefferson K. Souza Pagamentos", "Maria Aparecida dos Santos"],
    },
    recomendacoes: [
      "Não pague este boleto.",
      "Peça para visitar o imóvel por dentro antes de qualquer pagamento.",
      "Peça a matrícula do imóvel e confira no cartório de registro de imóveis se Roberto Almeida é mesmo o dono.",
      "Só pague depois de assinar o contrato, e para uma conta no nome do proprietário.",
      "Se já pagou, avise seu banco agora e registre um boletim de ocorrência.",
    ],
    limitacoes:
      "Esta análise olha só para a imagem enviada. Ela não consulta o cartório nem confirma a identidade de quem emitiu o boleto.",
    boleto: {
      linha: "26090001918795432109787654300000416470000360000",
      formato: "bancario",
      valido: false,
      problemas: ["O dígito verificador do 2º bloco não confere.", "O dígito verificador geral do boleto não confere."],
      banco: "Nubank",
      codigoBanco: "260",
      valor: 3600,
      vencimento: "2026-12-01",
    },
  },
};

const EXEMPLO_CONTRATO = {
  id: "exemplo",
  tipo: "contrato",
  resultado: {
    risco: "vermelho",
    resumo_simples:
      "Este contrato tem várias cláusulas que a lei não permite. Do jeito que está, não assine. As principais são: pedir duas garantias ao mesmo tempo, caução de cinco aluguéis e reajuste a cada seis meses.",
    dados_principais: {
      valor_aluguel: "R$ 1.500,00 por mês",
      prazo: "30 meses (01/12/2026 a 31/05/2029)",
      garantia: "Caução de 5 aluguéis e fiador",
      indice_reajuste: "Salário mínimo ou IGP-M, a cada 6 meses",
      multa_rescisao: "3 aluguéis, sem desconto pelo tempo cumprido",
      dia_vencimento: "Dia 5",
    },
    clausulas: [
      { titulo: "Duas garantias ao mesmo tempo", avaliacao: "abusiva", trecho: "o LOCATÁRIO oferece, cumulativamente: (a) caução em dinheiro [...] e (b) fiador", explicacao_simples: "O dono só pode pedir um tipo de garantia: ou caução, ou fiador, ou seguro. Pedir dois é proibido.", base_legal: "Lei 8.245/1991, art. 37, parágrafo único, e art. 43, II" },
      { titulo: "Caução de cinco aluguéis", avaliacao: "abusiva", trecho: "caução em dinheiro no valor de 5 (cinco) aluguéis [...] sem correção", explicacao_simples: "A caução em dinheiro pode ser de no máximo três aluguéis e precisa ficar em poupança. No fim, ela volta para você com os rendimentos.", base_legal: "Lei 8.245/1991, art. 38, § 2º" },
      { titulo: "Reajuste a cada seis meses pelo salário mínimo", avaliacao: "abusiva", trecho: "reajustado a cada 6 (seis) meses, na mesma proporção do aumento do salário mínimo", explicacao_simples: "O aluguel só pode subir uma vez por ano, e não pode ser ligado ao salário mínimo.", base_legal: "Lei 8.245/1991, art. 17; Lei 10.192/2001, art. 2º, § 1º" },
      { titulo: "Multa cheia para sair antes", avaliacao: "abusiva", trecho: "pagará multa integral equivalente a 3 (três) aluguéis, independentemente do tempo", explicacao_simples: "Se você sair antes, a multa tem que diminuir conforme o tempo que já morou. Multa cheia não vale.", base_legal: "Lei 8.245/1991, art. 4º" },
      { titulo: "Dois aluguéis adiantados", avaliacao: "abusiva", trecho: "O primeiro e o segundo aluguel serão pagos antecipadamente", explicacao_simples: "Aluguel adiantado só pode ser cobrado quando o contrato não tem nenhuma garantia. Aqui tem duas.", base_legal: "Lei 8.245/1991, art. 20 e art. 42" },
      { titulo: "Você paga obras do prédio", avaliacao: "atencao", trecho: "despesas ordinárias e extraordinárias de condomínio, inclusive fundo de reserva", explicacao_simples: "Obras estruturais e fundo de reserva são despesas do dono. Peça para tirar essa parte.", base_legal: "Lei 8.245/1991, art. 22, X" },
    ],
    perguntas_para_fazer: [
      "Qual garantia você prefere: só a caução de até três aluguéis ou só o fiador?",
      "A caução vai ficar em uma conta poupança no nome de quem?",
      "Podemos fazer a vistoria de entrada com fotos antes de eu assinar?",
    ],
    recomendacoes: [
      "Não assine o contrato como está.",
      "Peça por escrito a correção das cláusulas marcadas como abusivas.",
      "Se o proprietário se recusar, procure a Defensoria Pública ou o Procon-SP. O atendimento é gratuito.",
    ],
    limitacoes: "Esta é uma orientação inicial e não substitui a Defensoria Pública, o Procon ou um advogado.",
  },
};

const navegador = await chromium.launch({ channel: "chrome" });

async function sessao(viewport, sufixo) {
  const ctx = await navegador.newContext({ viewport, deviceScaleFactor: 2, locale: "pt-BR" });
  const page = await ctx.newPage();
  const foto = async (nome, full = true) => {
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, `${nome}${sufixo}.png`), fullPage: full });
    console.log("ok", nome + sufixo);
  };

  await page.goto(BASE + "/");
  await foto("01-inicio-publico");

  // Cria a conta de demonstracao (ou entra, se ja existir).
  await page.goto(BASE + "/cadastro");
  await page.getByLabel("Seu nome").fill("Maria Aparecida");
  await page.getByLabel("E-mail").fill(EMAIL);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Criar conta" }).click();
  try {
    await page.waitForURL("**/app", { timeout: 8000 });
  } catch {
    await page.goto(BASE + "/entrar");
    await page.getByLabel("E-mail").fill(EMAIL);
    await page.getByLabel("Senha").fill(SENHA);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL("**/app", { timeout: 15000 });
  }

  if (!REAL) {
    await page.route("**/api/analises/golpe", (r) => r.fulfill({ json: EXEMPLO_GOLPE }));
    await page.route("**/api/analises/contrato", (r) => r.fulfill({ json: EXEMPLO_CONTRATO }));
  }

  // Aluguel justo: preco (dados reais)
  await page.goto(BASE + "/app/aluguel");
  await page.getByLabel("Bairro").selectOption("Itaquera");
  await page.getByLabel("Tamanho do imóvel (m²)").fill("45");
  await page.getByLabel("Aluguel pedido (R$ por mês)").fill("2.100");
  await page.getByLabel("Renda da casa por mês (opcional)").fill("3.200");
  await page.getByRole("button", { name: "Comparar preço" }).click();
  await page.getByRole("heading", { name: "Comparação com o bairro" }).waitFor();
  await foto("05-aluguel-preco");

  // Aluguel justo: reajuste (API do Banco Central)
  await page.getByRole("tab", { name: "O reajuste está certo?" }).click();
  await page.getByLabel("Aluguel antes do reajuste (R$)").fill("1.500");
  await page.getByLabel("Novo valor que estão cobrando (opcional)").fill("1.680");
  await page.getByRole("button", { name: "Conferir reajuste" }).click();
  await page.getByText("Como a conta foi feita").waitFor();
  await foto("06-aluguel-reajuste");

  // E golpe? (formulario e resultado)
  await page.goto(BASE + "/app/golpe");
  await page.getByText("Boleto ou PIX", { exact: true }).click();
  await page.setInputFiles("#envio-arquivo", path.resolve("amostras/boleto-suspeito.png"));
  await page.getByLabel("Nome de quem diz ser o dono").fill("Roberto Almeida");
  await page.getByLabel("Valor pedido").fill("R$ 3.600");
  await page.getByRole("checkbox").check();
  await foto("03-golpe-formulario");
  await page.getByRole("button", { name: "Analisar agora" }).click();
  await page.getByText("Sinais encontrados").waitFor({ timeout: 150000 });
  await foto("04-golpe-resultado");

  // Contrato
  await page.goto(BASE + "/app/contrato");
  await page.setInputFiles("#envio-arquivo", path.resolve("amostras/contrato-exemplo.pdf"));
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Explicar meu contrato" }).click();
  await page.getByText("Cláusulas explicadas").waitFor({ timeout: 200000 });
  await foto("07-contrato-resultado");

  await page.goto(BASE + "/app/painel");
  await page.getByRole("heading", { name: "Sinais mais encontrados" }).waitFor();
  await foto("08-painel");

  await page.goto(BASE + "/app/privacidade");
  await page.getByRole("heading", { name: "O que guardamos" }).waitFor();
  await foto("09-meus-dados");

  await page.goto(BASE + "/app");
  await page.getByRole("heading", { name: "Suas últimas análises" }).waitFor();
  await foto("02-inicio-app");

  // Acessibilidade: alto contraste + fonte maior
  await page.getByRole("button", { name: "Alto contraste" }).click();
  await page.getByRole("button", { name: "Aumentar o tamanho do texto" }).click();
  await page.goto(BASE + "/app/aluguel");
  await page.getByLabel("Bairro").selectOption("Itaquera");
  await page.getByLabel("Tamanho do imóvel (m²)").fill("45");
  await page.getByLabel("Aluguel pedido (R$ por mês)").fill("2.100");
  await page.getByRole("button", { name: "Comparar preço" }).click();
  await page.getByRole("heading", { name: "Comparação com o bairro" }).waitFor();
  await foto("10-alto-contraste");
  await ctx.close();
}

await sessao({ width: 1280, height: 800 }, "");
await sessao({ width: 390, height: 844 }, "-celular");
await navegador.close();
