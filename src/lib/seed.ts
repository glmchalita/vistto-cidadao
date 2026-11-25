import type { Risco } from "./tipos";

// Registros de DEMONSTRACAO para o Painel. Sao dados simulados (coluna
// demo = true, sem usuario associado) e o painel sempre informa quantos sao.
// Gerador deterministico: a mesma semente produz sempre os mesmos registros.

const BAIRROS = [
  "Itaquera", "Capão Redondo", "Grajaú", "São Mateus", "Brasilândia",
  "Cidade Tiradentes", "Sapopemba", "Jardim Ângela", "Guaianases", "Itaim Paulista",
  "São Miguel Paulista", "Campo Limpo", "Jabaquara", "Tatuapé", "Mooca",
  "Santana", "Lapa", "Butantã", "Bela Vista", "República", "Vila Mariana", "Pinheiros",
];

const TIPOS: { tipo: string; peso: number; sinais: string[]; titulo: string }[] = [
  { tipo: "anuncio", peso: 30, titulo: "Anúncio analisado",
    sinais: ["preco_abaixo_mercado", "foto_suspeita", "contato_fora_plataforma", "urgencia_pressao"] },
  { tipo: "conversa", peso: 24, titulo: "Conversa analisada",
    sinais: ["pagamento_antecipado", "urgencia_pressao", "recusa_visita", "dados_pessoais_excessivos", "contato_fora_plataforma"] },
  { tipo: "boleto", peso: 14, titulo: "Boleto ou PIX analisado",
    sinais: ["beneficiario_divergente", "boleto_invalido", "pagamento_antecipado"] },
  { tipo: "documento", peso: 8, titulo: "Documento analisado",
    sinais: ["documento_inconsistente", "beneficiario_divergente"] },
  { tipo: "contrato", peso: 12, titulo: "Contrato analisado",
    sinais: ["clausula_abusiva", "reajuste_acima_indice"] },
  { tipo: "preco", peso: 8, titulo: "Preço comparado",
    sinais: ["preco_acima_mercado", "renda_comprometida"] },
  { tipo: "reajuste", peso: 4, titulo: "Reajuste conferido",
    sinais: ["reajuste_acima_indice"] },
  { tipo: "his", peso: 6, titulo: "Teto de aluguel HIS/HMP conferido",
    sinais: ["aluguel_acima_teto_his", "renda_fora_da_faixa_his"] },
];

function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gerarSeed(total = 200) {
  const r = prng(561845);
  const somaPesos = TIPOS.reduce((s, t) => s + t.peso, 0);
  const agora = Date.UTC(2026, 10, 25, 12, 0, 0);
  const linhas = [];
  for (let i = 0; i < total; i++) {
    let alvo = r() * somaPesos;
    let t = TIPOS[0];
    for (const c of TIPOS) {
      alvo -= c.peso;
      if (alvo <= 0) {
        t = c;
        break;
      }
    }
    // Todas as regioes da cidade aparecem com a mesma chance.
    const bairro = BAIRROS[Math.floor(r() * BAIRROS.length)];
    const x = r();
    const risco: Risco = x < 0.38 ? "vermelho" : x < 0.72 ? "amarelo" : "verde";
    const qtd = risco === "verde" ? 0 : risco === "amarelo" ? 1 + Math.floor(r() * 2) : 2 + Math.floor(r() * 2);
    const sinais: string[] = [];
    while (sinais.length < Math.min(qtd, t.sinais.length)) {
      const s = t.sinais[Math.floor(r() * t.sinais.length)];
      if (!sinais.includes(s)) sinais.push(s);
    }
    const diasAtras = Math.floor(r() * 180);
    linhas.push({
      id: `demo2-${String(i + 1).padStart(4, "0")}`,
      userId: null,
      tipo: t.tipo,
      risco,
      titulo: `${t.titulo} (demonstração)`,
      bairro,
      sinais,
      resultado: { demo: true },
      demo: true,
      createdAt: new Date(agora - diasAtras * 86400000 - Math.floor(r() * 86400000)),
    });
  }
  return linhas;
}
