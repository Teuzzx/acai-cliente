/*
  ============================================================
  CUPONS.JS - Validação de Cupons no Site de Pedidos
  ============================================================
  Busca cupons diretamente do Supabase via supabaseClient compatível.
  Tabela: 'cupons' — campo: 'codigo'
  ============================================================
*/

window.cuponsService = {

  // Validar cupom pelo código — retorna o cupom ou null
  async validar(codigo) {
    if (!codigo || codigo.trim() === '') return null;

    const client = window.supabaseClient;
    if (!client) {
      console.warn('❌ supabaseClient não disponível para validar cupom');
      return null;
    }

    try {
      // Tentativas em ordem: UPPERCASE exato, original, lowercase
      const raw = codigo.trim();
      const attempts = [raw.toUpperCase(), raw, raw.toLowerCase()];
      let data = null;
      let error = null;

      for (const attempt of attempts) {
        const res = await client
          .from('cupons')
          .select('*')
          .eq('codigo', attempt)
          .eq('ativo', true)
          .maybeSingle();
        if (res && res.data) {
          data = res.data;
          error = res.error || null;
          break;
        }
      }

      // Fallback: buscar lista de cupons ativos e comparar localmente (case-insensitive, sem acentos)
      if (!data) {
        const { data: listData, error: listErr } = await client
          .from('cupons')
          .select('*')
          .eq('ativo', true)
          .limit(200);

        if (!listErr && Array.isArray(listData)) {
          const normalize = s => (s || '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
          const target = normalize(raw);
          data = listData.find(item => normalize(item.codigo) === target) || null;
          if (!data) {
            // tentar contains
            data = listData.find(item => normalize(item.codigo).includes(target)) || null;
          }
        } else {
          error = listErr || error;
        }
      }

      if (error || !data) {
        console.log('❌ Cupom não encontrado ou inativo:', codigo);
        return null;
      }

      const agora = new Date();
      if (data.validar_de && new Date(data.validar_de) > agora) {
        console.log('❌ Cupom ainda não está válido');
        return null;
      }
      if (data.validar_ate && new Date(data.validar_ate) < agora) {
        console.log('❌ Cupom expirado');
        return null;
      }
      if (data.limite_uso !== null && data.uso_atual >= data.limite_uso) {
        console.log('❌ Limite de uso do cupom atingido');
        return null;
      }

      console.log('✓ Cupom válido:', data.codigo, '- Desconto:', data.desconto, data.tipo_desconto);
      return data;
    } catch (err) {
      console.error('❌ Erro ao validar cupom:', err);
      return null;
    }
  },

  // Calcular valor do desconto
  calcularDesconto(cupom, valorTotal) {
    if (!cupom) return 0;
    let desconto = 0;
    if (cupom.tipo_desconto === 'percentual') {
      desconto = (cupom.desconto / 100) * valorTotal;
    } else if (cupom.tipo_desconto === 'fixo') {
      desconto = cupom.desconto;
    }
    return Math.min(desconto, valorTotal);
  }
};

console.log('✓ cupons.js carregado — Integrado com Supabase via supabaseClient wrapper');

