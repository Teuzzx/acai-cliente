/*
  Integração do site de pedidos com o schema Supabase.
  - Requer que `js/supabase.js` seja carregado antes (fornece `supabaseClient` compatível).
  - Usa as coleçÃµes canônicas: `clientes`, `pedidos` e `pedido_itens`.
  - Calcula subtotal e total no frontend e salva dados no Supabase.

  Uso mínimo:
    const result = await submitOrder({ customer, cart, deliveryInfo, tipo_entrega: 'delivery' });

  `cart` esperado (exemplo):
    [{ product_id: 'abc123', name: 'Açaí 500ml', qty: 2, unit_price: 15.00, options: { tamanho: '500ml' } }, ...]
*/

function toCents(amount) {
  return Math.round(Number(amount) * 100);
}

/**
 * Garante que o cliente Supabase esteja inicializado antes de continuar.
 * Faz polling por `window.pb` por um tempo limitado e lança erro se não estiver pronto.
 */
async function ensureDatabaseReady(timeout = 5000) {
  if (window.supabaseClient) return;
  const interval = 100;
  let waited = 0;
  while (!window.supabaseClient && waited < timeout) {
    await new Promise(r => setTimeout(r, interval));
    waited += interval;
  }
  if (!window.supabaseClient) throw new Error('Supabase não inicializado');
}

async function ensureCustomer(customer) {
  if (!customer) return null;
  if (customer.id) return customer;

  try {
    await ensureDatabaseReady();
    const client = window.supabaseClient;

    const payload = {
      nome: customer.name || customer.nome || 'Cliente',
      telefone: customer.phone || customer.telefone || null,
      email: customer.email || null,
      endereco: customer.address || customer.endereco || null,
      tipo: customer.tipo || 'online'
    };
    Object.keys(payload).forEach(key => payload[key] === null && delete payload[key]);

    let existing = null;
    if (payload.telefone) {
      const result = await client.from('clientes').select('*').eq('telefone', payload.telefone).maybeSingle();
      if (result && result.data) existing = result.data;
    }
    if (!existing && payload.email) {
      const result = await client.from('clientes').select('*').eq('email', payload.email).maybeSingle();
      if (result && result.data) existing = result.data;
    }

    if (existing) {
      // Atualiza nome/email/endereço se o cliente existente tiver dados divergentes,
      // garantindo que pedidos futuros usem o nome atual informado pelo cliente.
      const updatePayload = {};
      if (payload.nome && payload.nome !== existing.nome) updatePayload.nome = payload.nome;
      if (payload.email && payload.email !== existing.email) updatePayload.email = payload.email;
      if (payload.endereco && payload.endereco !== existing.endereco) updatePayload.endereco = payload.endereco;
      if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await client.from('clientes').update(updatePayload).eq('id', existing.id);
        if (updateError) console.warn('Falha ao atualizar cliente existente:', updateError);
        else existing = { ...existing, ...updatePayload };
      }
      return existing;
    }

    const { data, error } = await client.from('clientes').insert([payload]).select();
    if (error) throw error;
    return (Array.isArray(data) ? data[0] : data) || null;
  } catch (err) {
    console.error('Erro ao criar/garantir cliente:', err);
    throw err;
  }
}

async function submitOrder({ customer = null, cart = [], deliveryInfo = {}, tipo_entrega = 'delivery', cupom_codigo = null, valor_desconto = 0, origem = 'site' }) {
  if (!Array.isArray(cart) || cart.length === 0) throw new Error('Carrinho vazio');

  await ensureDatabaseReady();
  const client = window.supabaseClient;

  const totalCents = cart.reduce((sum, item) => {
    const qty = Number(item.qty || item.quantity || 1);
    const priceCents = Number(item.unit_price_cents ?? toCents(item.unit_price ?? item.price ?? 0));
    return sum + qty * priceCents;
  }, 0);

  const subtotal = totalCents / 100;
  let desconto = Number(valor_desconto || 0) || 0;
  const entrega = Number(deliveryInfo.valor_entrega || deliveryInfo.valorEntrega || 0) || 0;
  if (desconto > subtotal) desconto = subtotal;
  const total = subtotal - desconto + entrega;

  try {
    const cust = await ensureCustomer(customer);
    const clienteId = cust ? cust.id : null;

    const orderPayload = {
      cliente_id: clienteId,
      cliente_nome: customer?.name || customer?.nome || cust?.nome || cust?.name || 'Cliente',
      telefone_contato: customer?.phone || customer?.telefone || cust?.telefone || (deliveryInfo.phone || null),
      cliente_email: customer?.email || cust?.email || null,
      tipo_venda: 'online',
      tipo_entrega,
      valor_subtotal: subtotal,
      valor_desconto: desconto,
      valor_entrega: entrega,
      status: 'pendente',
      cupom_codigo: cupom_codigo || null,
      cupom_desconto_aplicado: desconto,
      endereco_entrega: tipo_entrega === 'delivery' ? (deliveryInfo.endereco || deliveryInfo.address || customer?.endereco || null) : null,
      origem: origem
    };
    Object.keys(orderPayload).forEach(key => orderPayload[key] === null && delete orderPayload[key]);

    console.log('CRIANDO PEDIDO...', orderPayload);
    const { data: orderData, error: orderError } = await client.from('pedidos').insert([orderPayload]).select();
    if (orderError) throw orderError;
    const order = Array.isArray(orderData) ? orderData[0] : orderData;
    console.log('PEDIDO CRIADO:', order);
    const orderId = order?.id;
    if (!orderId) {
      throw new Error('Pedido criado sem id. Verifique se a tabela pedidos retorna a coluna id e se a inserção foi bem sucedida.');
    }

    const itemsPayload = cart.map(item => {
      const quantidade = Number(item.qty || item.quantity || 1);
      const valorUnitario = Number(item.unit_price ?? (item.unit_price_cents ? item.unit_price_cents / 100 : item.price || 0));
      const itemPayload = {
        pedido_id: orderId,
        produto_sku: item.sku || item.product_id || item.produto_id || item.produto_sku || null,
        produto_nome: item.name || item.produto_nome || 'Produto',
        quantidade,
        preco_unitario: valorUnitario,
        opcoes: item.options ? JSON.stringify(item.options) : null,
        observacao_item: item.obs || item.observacao || null
      };
      Object.keys(itemPayload).forEach(key => itemPayload[key] === null && delete itemPayload[key]);
      return itemPayload;
    });

    const { data: itemsData, error: itemsError } = await client.from('pedido_itens').insert(itemsPayload).select();
    if (itemsError) throw itemsError;

    return { order, items: itemsData };
  } catch (err) {
    console.log('ERRO COMPLETO:', err);
    throw err;
  }
}

async function testSubmitExample() {
  const exampleCustomer = { name: 'Teste Cliente', phone: '11999999999', email: 'teste@example.com', tipo: 'online' };
  const exampleCart = [
    { product_id: 'produto-exemplo', name: 'Açaí 500ml', qty: 1, unit_price: 15.00 },
  ];

  return submitOrder({ customer: exampleCustomer, cart: exampleCart, deliveryInfo: { endereco: 'Rua X, 123', valor_entrega: 5.00 }, tipo_entrega: 'delivery', origem: 'site' });
}

// Exportar para uso global
window.submitOrder = submitOrder;
window.testSubmitExample = testSubmitExample;
// Compatibilidade com implementaçÃµes que esperam `window.siteOrders.submitOrder`
window.siteOrders = { submitOrder };






