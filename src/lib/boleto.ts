// Validacao deterministica da linha digitavel de boletos (padrao FEBRABAN).
// A Visao Computacional le os numeros da imagem; quem decide se o codigo e
// matematicamente valido e este modulo, nao o modelo de IA.

const BANCOS: Record<string, string> = {
  "001": "Banco do Brasil",
  "033": "Santander",
  "041": "Banrisul",
  "077": "Banco Inter",
  "104": "Caixa Econômica Federal",
  "197": "Stone",
  "208": "BTG Pactual",
  "212": "Banco Original",
  "237": "Bradesco",
  "260": "Nubank",
  "290": "PagBank",
  "323": "Mercado Pago",
  "336": "C6 Bank",
  "341": "Itaú",
  "380": "PicPay",
  "403": "Cora",
  "422": "Safra",
  "748": "Sicredi",
  "756": "Sicoob",
};

export type ConferenciaBoleto = {
  linha: string;
  formato: "bancario" | "arrecadacao" | "desconhecido";
  valido: boolean;
  problemas: string[];
  banco: string | null;
  codigoBanco: string | null;
  valor: number | null;
  vencimento: string | null; // AAAA-MM-DD
};

function mod10(num: string): number {
  let soma = 0;
  let peso = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    let p = Number(num[i]) * peso;
    if (p > 9) p = Math.floor(p / 10) + (p % 10);
    soma += p;
    peso = peso === 2 ? 1 : 2;
  }
  return (10 - (soma % 10)) % 10;
}

function mod11Bancario(num: string): number {
  let soma = 0;
  let peso = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    soma += Number(num[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const dv = 11 - (soma % 11);
  return dv === 0 || dv === 10 || dv === 11 ? 1 : dv;
}

function mod11Arrecadacao(num: string): number {
  let soma = 0;
  let peso = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    soma += Number(num[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  return resto === 0 || resto === 1 ? 0 : 11 - resto;
}

function vencimentoPorFator(fator: number): string | null {
  if (fator === 0) return null;
  // Fator conta dias desde 07/10/1997. Em 22/02/2025 o fator voltou a 1000.
  const base1 = Date.UTC(1997, 9, 7);
  const base2 = Date.UTC(2025, 1, 22) - 1000 * 86400000;
  const d1 = new Date(base1 + fator * 86400000);
  const d2 = new Date(base2 + fator * 86400000);
  // Escolhe a data mais proxima de hoje entre os dois ciclos.
  const hoje = Date.now();
  const d = Math.abs(d2.getTime() - hoje) < Math.abs(d1.getTime() - hoje) ? d2 : d1;
  return d.toISOString().slice(0, 10);
}

export function conferirBoleto(linhaBruta: string): ConferenciaBoleto {
  const linha = linhaBruta.replace(/\D/g, "");
  const r: ConferenciaBoleto = {
    linha,
    formato: "desconhecido",
    valido: false,
    problemas: [],
    banco: null,
    codigoBanco: null,
    valor: null,
    vencimento: null,
  };

  if (linha.length === 47) {
    r.formato = "bancario";
    const c1 = linha.slice(0, 9), dv1 = Number(linha[9]);
    const c2 = linha.slice(10, 20), dv2 = Number(linha[20]);
    const c3 = linha.slice(21, 31), dv3 = Number(linha[31]);
    const dvGeral = Number(linha[32]);
    const fator = linha.slice(33, 37);
    const valor = linha.slice(37, 47);

    if (mod10(c1) !== dv1) r.problemas.push("O dígito verificador do 1º bloco não confere.");
    if (mod10(c2) !== dv2) r.problemas.push("O dígito verificador do 2º bloco não confere.");
    if (mod10(c3) !== dv3) r.problemas.push("O dígito verificador do 3º bloco não confere.");

    // Reconstroi o codigo de barras (44 digitos) para conferir o DV geral.
    const barras = linha.slice(0, 4) + fator + valor + linha.slice(4, 9) + c2 + c3;
    if (mod11Bancario(barras) !== dvGeral) r.problemas.push("O dígito verificador geral do boleto não confere.");

    r.codigoBanco = linha.slice(0, 3);
    r.banco = BANCOS[r.codigoBanco] ?? null;
    if (!r.banco) r.problemas.push(`Código de banco ${r.codigoBanco} não reconhecido na nossa lista.`);
    if (linha[3] !== "9") r.problemas.push("O código da moeda não é o do Real.");
    r.valor = Number(valor) / 100 || null;
    r.vencimento = vencimentoPorFator(Number(fator));
    r.valido = r.problemas.filter((p) => !p.includes("não reconhecido")).length === 0;
    return r;
  }

  if (linha.length === 48 && linha[0] === "8") {
    r.formato = "arrecadacao";
    const usaMod10 = linha[2] === "6" || linha[2] === "7";
    const dv = usaMod10 ? mod10 : mod11Arrecadacao;
    for (let i = 0; i < 4; i++) {
      const bloco = linha.slice(i * 12, i * 12 + 11);
      if (dv(bloco) !== Number(linha[i * 12 + 11])) {
        r.problemas.push(`O dígito verificador do ${i + 1}º bloco não confere.`);
      }
    }
    const barras = [0, 1, 2, 3].map((i) => linha.slice(i * 12, i * 12 + 11)).join("");
    if (dv(barras.slice(0, 3) + barras.slice(4)) !== Number(barras[3])) {
      r.problemas.push("O dígito verificador geral não confere.");
    }
    if (linha[2] === "6" || linha[2] === "8") r.valor = Number(barras.slice(4, 15)) / 100 || null;
    r.valido = r.problemas.length === 0;
    return r;
  }

  r.problemas.push(
    `A linha digitável lida tem ${linha.length} números. Um boleto tem 47 (bancário) ou 48 (contas e tributos).`,
  );
  return r;
}

/** Monta uma linha digitavel bancaria valida (usada para gerar amostras de teste). */
export function montarLinhaBancaria(banco: string, campoLivre: string, fator: number, valorCentavos: number): string {
  const f = String(fator).padStart(4, "0");
  const v = String(valorCentavos).padStart(10, "0");
  const semDv = banco + "9" + f + v + campoLivre; // 43 digitos
  const dvGeral = mod11Bancario(semDv);
  const c1 = banco + "9" + campoLivre.slice(0, 5);
  const c2 = campoLivre.slice(5, 15);
  const c3 = campoLivre.slice(15, 25);
  return c1 + mod10(c1) + c2 + mod10(c2) + c3 + mod10(c3) + dvGeral + f + v;
}
