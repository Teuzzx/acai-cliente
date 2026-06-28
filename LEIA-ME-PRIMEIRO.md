# 🍇 Sistema Açaí — Dashboard + Site de Pedidos

## 📋 O que foi corrigido

### Site de Pedidos (`SITE AÇAÍ CORRETO/`)
- ✅ `site_orders.js` — Reescrito para usar tabelas corretas: `clientes`, `pedidos`, `pedido_itens`
- ✅ `cupons.js` — Corrigido para buscar na coluna `codigo` (e não `code`)
- ✅ `app.js` — Validação de cupom agora usa Supabase direto (sem precisar do backend local)
- ✅ `app.js` — Envio de pedido sempre via Supabase (sem precisar do backend local na porta 3334)
- ✅ `index.html` — Scripts carregados na ordem correta

### Dashboard (`Sistema AÇAÍ PHB/`)
- ✅ `supabase.js` — Tabela `pedido_itens` corrigida (era `itens_pedido`)
- ✅ `supabase.js` — `createVendaPresencial` com campos obrigatórios corretos
- ✅ `supabase.js` — `getProdutosMaisVendidos` corrigido para buscar em `pedido_itens`
- ✅ `supabase.js` — `createCoupon` envia `tipo_desconto` e `limite_uso`
- ✅ `supabase.js` — `getCupons` traz todos os cupons (ativos + inativos) para o dashboard
- ✅ `cupons.js` — Exibe tipo de desconto (percentual/fixo) e contagem de usos
- ✅ `cupons.js` — Modal de cupom com campos `tipo_desconto` e `limite_uso`
- ✅ `index.html` — Campos tipo de desconto e limite de uso adicionados ao modal

### SQL (`docs/SQL_BANCO_UNIFICADO_FINAL.sql`)
- ✅ Tabela `pedidos` com colunas corretas (`valor_subtotal`, `valor_entrega`, etc.)
- ✅ Tabela `pedido_itens` (nome correto)
- ✅ Triggers corrigidos e otimizados
- ✅ RLS configurado corretamente (anon pode criar pedidos/consultar cupons)
- ✅ Views para o dashboard

---

## 🚀 Como usar

### 1. Configurar o Banco de Dados
1. Acesse o seu projeto no [Supabase](https://supabase.com)
2. Vá em **SQL Editor**
3. Cole e execute o arquivo `docs/SQL_BANCO_UNIFICADO_FINAL.sql`

### 2. Abrir o Dashboard
- Abra `Sistema AÇAÍ PHB/acai-dashboard-html/index.html` no navegador
- Faça login com seu e-mail cadastrado no Supabase Auth

### 3. Abrir o Site de Pedidos
- Abra `SITE AÇAÍ CORRETO/index.html` no navegador (ou suba em um servidor)
- Nenhuma configuração adicional necessária

---

## 🔄 Como funciona a integração

```
SITE DE PEDIDOS                    SUPABASE (banco único)              DASHBOARD
    │                                      │                               │
    ├─ Cliente faz pedido ────────► tabela pedidos (tipo_venda='online')  │
    ├─ Usa cupom ─────────────────► valida em tabela cupons               │
    │                                      │                               │
    │                              tabela pedidos ◄──────── Cria pedido ──┤
    │                                      │           (tipo_venda='presencial')
    │                                      │                               │
    └─────────────────────────────► vw_todos_pedidos ◄───── Dashboard vê ─┘
                                   (presencial + online)
```

### Fluxo do Cupom (exemplo):
1. Gerente cria cupom `PROMO10` no **Dashboard** → salvo em `cupons`
2. Cliente acessa o **Site** e digita `PROMO10`
3. Site consulta tabela `cupons` no Supabase → cupom válido!
4. Desconto aplicado, pedido criado com `cupom_codigo = 'PROMO10'`
5. Dashboard mostra o pedido + uso do cupom em tempo real

---

## ⚙️ Credenciais Supabase

As credenciais já estão configuradas nos arquivos:
- `SITE AÇAÍ CORRETO/index.html` — `SUPABASE_URL` e `SUPABASE_ANON_KEY`
- `Sistema AÇAÍ PHB/js/supabase.js` — `DEFAULT_SUPABASE_URL` e `DEFAULT_SUPABASE_ANON_KEY`

**⚠️ Não compartilhe estas credenciais publicamente.**

---

## 🐛 Se algo não funcionar

1. Abra o Console do navegador (F12 → Console)
2. Procure erros em vermelho
3. Erros comuns:
   - `"relation does not exist"` → Execute o SQL no Supabase
   - `"violates row-level security"` → Execute o SQL (parte de RLS)
   - `"supabaseClient não inicializado"` → Verifique as credenciais no HTML
