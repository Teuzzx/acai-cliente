/* SUPABASE WRAPPER — compat layer for legacy code
   Exposes: window.supabaseClient, window.pbClient, auth helpers, data helpers
   Security: use only anon/public key in frontend (NEXT_PUBLIC_SUPABASE_ANON_KEY)
*/

function getSupabaseSettings() {
    // For security, prefer injected public env vars or a secure config object.
    const url = window.NEXT_PUBLIC_SUPABASE_URL || (window.CONFIG && window.CONFIG.supabase && window.CONFIG.supabase.url) || '';
    const key = window.NEXT_PUBLIC_SUPABASE_ANON_KEY || (window.CONFIG && window.CONFIG.supabase && window.CONFIG.supabase.key) || '';
    const isPlaceholderUrl = typeof url === 'string' && /YOUR_PROJECT|seu_projeto|YOUR_PROJECT\.supabase\.co|YOUR_PROJECT\.supabase\.co/i.test(url);
    const isPlaceholderKey = typeof key === 'string' && /YOUR_ANON_KEY|sua_chave|sb_publishable_YOUR/i.test(key);
    return { url, key, isPlaceholderUrl, isPlaceholderKey };
}

var supabase = null;
var supabaseClient = null; // kept name for compatibility

function ensureSupabaseLibLoaded() {
    if (typeof window.supabase !== 'undefined' || typeof window.createClient !== 'undefined') return Promise.resolve();
    return new Promise((resolve, reject) => {
        const existing = document.querySelector('script[src*="supabase"]');
        if (existing) {
            existing.addEventListener('load', () => setTimeout(resolve, 10));
            existing.addEventListener('error', () => reject(new Error('Falha ao carregar Supabase JS')));
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/umd/supabase.min.js';
        script.async = true;
        script.onload = () => setTimeout(resolve, 10);
        script.onerror = () => reject(new Error('Falha ao carregar Supabase JS'));
        document.head.appendChild(script);
    });
}

async function ensureSupabaseReady() {
    await ensureSupabaseLibLoaded();
    if (typeof window.supabase === 'undefined' && typeof window.createClient === 'undefined') {
        throw new Error('Supabase JS não disponível');
    }

    if (!supabase) {
        let createClient = null;
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            createClient = window.supabase.createClient;
        } else if (typeof window.createClient === 'function') {
            createClient = window.createClient;
        } else if (window.supabase && window.supabase.default && typeof window.supabase.default.createClient === 'function') {
            createClient = window.supabase.default.createClient;
        }

        // Fallback: try dynamic ESM import (works in modern browsers)
        if (!createClient) {
            try {
                const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
                if (mod && typeof mod.createClient === 'function') createClient = mod.createClient;
            } catch (e) {
                // ignore, we'll throw below if still missing
            }
        }

        if (!createClient) throw new Error('createClient do Supabase não encontrado');
        const { url: supabaseUrl, key: supabaseAnonKey, isPlaceholderUrl, isPlaceholderKey } = getSupabaseSettings();
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase credentials are missing. Defina window.CONFIG.supabase.url e window.CONFIG.supabase.key em js/config.js ou use window.NEXT_PUBLIC_SUPABASE_URL e window.NEXT_PUBLIC_SUPABASE_ANON_KEY.');
        }
        if (isPlaceholderUrl || isPlaceholderKey) {
            throw new Error('Supabase config still contains placeholder values. Update acai-cliente/js/config.js with your real Supabase URL and anon key.');
        }
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        window.supabase = supabase;
        // keep minimal compatibility alias
        window.pb = supabase;

        supabaseClient = createSupabaseWrapper();
        window.supabaseClient = supabaseClient;
        window.pbClient = supabaseClient;
    }

    return supabaseClient;
}

function normalizeError(err) {
    if (!err) return null;
    if (err.message) return err;
    return new Error(String(err));
}

function createSupabaseWrapper() {
    return {
        auth: {
            async signInWithPassword({ email, password }) {
                try {
                    await ensureSupabaseReady();
                    const res = await supabase.auth.signInWithPassword({ email: String(email).toLowerCase().trim(), password });
                    return { data: { user: res.data.user }, error: res.error || null };
                } catch (e) {
                    return { data: null, error: normalizeError(e) };
                }
            },
            async signUp({ email, password }) {
                try {
                    await ensureSupabaseReady();
                    const res = await supabase.auth.signUp({ email: String(email).toLowerCase().trim(), password });
                    return { data: { user: res.data.user }, error: res.error || null };
                } catch (e) {
                    return { data: null, error: normalizeError(e) };
                }
            },
            async signOut() {
                try {
                    await ensureSupabaseReady();
                    const res = await supabase.auth.signOut();
                    return { error: res.error || null };
                } catch (e) {
                    return { error: normalizeError(e) };
                }
            },
            async getUser() {
                try {
                    await ensureSupabaseReady();
                    const session = await supabase.auth.getSession();
                    return { data: { user: session.data.session ? session.data.session.user : null }, error: null };
                } catch (e) {
                    return { data: { user: null }, error: normalizeError(e) };
                }
            }
        },
        from(table) {
            const state = { table, filters: [], selectColumns: '*', orderBy: null, limit: null };
            const builder = {
                select(columns = '*') { state.selectColumns = columns; return this; },
                eq(field, value) { state.filters.push({ op: 'eq', field, value }); return this; },
                gte(field, value) { state.filters.push({ op: 'gte', field, value }); return this; },
                lt(field, value) { state.filters.push({ op: 'lt', field, value }); return this; },
                order(field, options = { ascending: true }) { state.orderBy = { field, asc: options.ascending !== false }; return this; },
                limit(n) { state.limit = Number(n) || null; return this; },
                single() { state.single = true; return this; },
                maybeSingle() { state.maybeSingle = true; return this; },
                insert(payload) { state.mode = 'insert'; state.body = payload; return this; },
                update(payload) { state.mode = 'update'; state.body = payload; return this; },
                delete() { state.mode = 'delete'; return this; },
                async then(resolve, reject) {
                    try {
                        await ensureSupabaseReady();
                        const tableRef = supabase.from(state.table);
                        if (!state.mode || state.mode === 'select') {
                            let q = tableRef.select(state.selectColumns);
                            for (const f of state.filters) {
                                if (f.op === 'eq') q = q.eq(f.field, f.value);
                                if (f.op === 'gte') q = q.gte(f.field, f.value);
                                if (f.op === 'lt') q = q.lt(f.field, f.value);
                            }
                            if (state.orderBy) q = q.order(state.orderBy.field, { ascending: state.orderBy.asc });
                            if (state.limit) q = q.limit(state.limit);
                            const res = state.single ? await q.single() : state.maybeSingle ? await q.maybeSingle() : await q;
                            if (res.error) return resolve({ data: null, error: res.error });
                            return resolve({ data: res.data, error: null });
                        }

                        if (state.mode === 'insert') {
                            const payload = Array.isArray(state.body) ? state.body : [state.body];
                            const res = await tableRef.insert(payload).select();
                            if (res.error) return resolve({ data: null, error: res.error });
                            return resolve({ data: res.data, error: null });
                        }

                        if (state.mode === 'update') {
                            const idFilter = state.filters.find(f => f.op === 'eq' && f.field === 'id');
                            if (idFilter) {
                                const res = await tableRef.update(state.body).eq('id', String(idFilter.value)).select();
                                if (res.error) return resolve({ data: null, error: res.error });
                                return resolve({ data: res.data, error: null });
                            }
                            let q = tableRef.update(state.body);
                            for (const f of state.filters) {
                                if (f.op === 'eq') q = q.eq(f.field, f.value);
                                if (f.op === 'gte') q = q.gte(f.field, f.value);
                                if (f.op === 'lt') q = q.lt(f.field, f.value);
                            }
                            const res = await q.select();
                            if (res.error) return resolve({ data: null, error: res.error });
                            return resolve({ data: res.data, error: null });
                        }

                        if (state.mode === 'delete') {
                            const idFilter = state.filters.find(f => f.op === 'eq' && f.field === 'id');
                            if (idFilter) {
                                const res = await tableRef.delete().eq('id', String(idFilter.value));
                                if (res.error) return resolve({ data: null, error: res.error });
                                return resolve({ data: null, error: null });
                            }
                            let q = tableRef.delete();
                            for (const f of state.filters) {
                                if (f.op === 'eq') q = q.eq(f.field, f.value);
                                if (f.op === 'gte') q = q.gte(f.field, f.value);
                                if (f.op === 'lt') q = q.lt(f.field, f.value);
                            }
                            const res = await q;
                            if (res.error) return resolve({ data: null, error: res.error });
                            return resolve({ data: null, error: null });
                        }
                    } catch (e) {
                        return resolve({ data: null, error: normalizeError(e) });
                    }
                }
            };
            return builder;
        }
    };
}

// Compatibility: expose globals for existing code
async function loginWithEmail(email, password) {
    await ensureSupabaseReady();
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const user = data.user;
    try { window.currentUser = user; window.currentUserRole = await getUserRole(); currentUser = window.currentUser; currentUserRole = window.currentUserRole; } catch (e) {}
    try { if (typeof renderSidebar === 'function') renderSidebar(); } catch (e) {}
    try { if (typeof renderHeader === 'function') renderHeader(); } catch (e) {}
    try { if (typeof applyUiRoleRestrictions === 'function') applyUiRoleRestrictions(); } catch (e) {}
    try { if (typeof loadCupons === 'function') loadCupons(); } catch (e) {}
    return user;
}

async function signUpWithEmail(email, password) {
    await ensureSupabaseReady();
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) throw error;
    return data.user;
}

async function logoutUser() {
    await ensureSupabaseReady();
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    window.currentUser = null; window.currentUserRole = null; currentUser = null; currentUserRole = null;
    try { if (typeof renderSidebar === 'function') renderSidebar(); } catch (e) {}
    return true;
}

async function getCurrentUser() {
    try {
        await ensureSupabaseReady();
        const session = await supabase.auth.getSession();
        return session.data.session ? session.data.session.user : null;
    } catch (e) { return null; }
}

async function isAuthenticated() {
    const u = await getCurrentUser();
    return !!u;
}

async function getUserRole() {
    try {
        await ensureSupabaseReady();
        const user = await getCurrentUser();
        if (!user) return null;
        const { data, error } = await supabase.from('roles').select('role').eq('user_id', user.id).maybeSingle();
        if (error) { console.warn('getUserRole: erro ao buscar role', error); return null; }
        if (data && data.role) return String(data.role).toLowerCase();
        const email = (user.email || '').toLowerCase();
        const map = window.CONFIG && window.CONFIG.rolesMap ? window.CONFIG.rolesMap : {};
        return map[email] || null;
    } catch (e) {
        console.error('getUserRole error', e); return null;
    }
}

function isAdmin() { return String(window.currentUserRole || '').toLowerCase() === 'admin'; }
function isAtendente() { return String(window.currentUserRole || '').toLowerCase() === 'atendente'; }
function isDev() { return String(window.currentUserRole || '').toLowerCase() === 'dev'; }

// Helpers
async function getProdutos() {
    await ensureSupabaseReady();
    const { data, error } = await supabaseClient.from('produtos').select('*');
    if (error) throw error; return data || [];
}

async function getCupons() {
    await ensureSupabaseReady();
    const { data, error } = await supabaseClient.from('cupons').select('*');
    if (error) throw error; return data || [];
}

async function createPedido(pedido) {
    await ensureSupabaseReady();
    const { data, error } = await supabaseClient.from('pedidos').insert([pedido]).select();
    if (error) throw error; return (data && data[0]) || null;
}

async function createVendaPresencial({ peso, tipo, extras, pagamento, total }) {
    const pedido = {
        cliente: null,
        cliente_nome: 'Venda Presencial',
        tipo_venda: 'presencial',
        tipo_entrega: 'presencial',
        valor_subtotal: total,
        valor_desconto: 0,
        valor_entrega: 0,
        status: 'entregue'
    };
    return await createPedido(pedido);
}

// Expose globals
window.supabaseClient = supabaseClient || createSupabaseWrapper();
window.pbClient = window.supabaseClient;
window.loginWithEmail = loginWithEmail;
window.logoutUser = logoutUser;
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;
window.getUserRole = getUserRole;
window.isAdmin = isAdmin;
window.isAtendente = isAtendente;
window.isDev = isDev;
window.getProdutos = getProdutos;
window.getCupons = getCupons;
window.createPedido = createPedido;
window.createVendaPresencial = createVendaPresencial;

// Additional higher-level helpers (cupons, produtos, clientes, itens)
async function getCouponByCode(codigo) {
    try {
        const { data, error } = await supabaseClient
            .from('cupons')
            .select('*')
            .eq('codigo', codigo.toUpperCase())
            .eq('ativo', true)
            .maybeSingle();
        if (error) throw error;
        return data;
    } catch (error) { console.error('Erro ao obter cupom:', error.message || error); return null; }
}

async function createCoupon(cupom) {
    try {
        const payload = {
            codigo: cupom.codigo.toUpperCase(),
            desconto: Number(cupom.desconto),
            tipo_desconto: cupom.tipo_desconto || 'percentual',
            ativo: cupom.ativo !== undefined ? cupom.ativo : true,
            limite_uso: cupom.limite_uso || null,
            uso_atual: 0,
            aplica_a: cupom.aplica_a || 'tudo'
        };
        const { data, error } = await supabaseClient.from('cupons').insert([payload]).select();
        if (error) throw error; return data[0];
    } catch (error) { console.error('Erro ao criar cupom:', error.message || error); throw error; }
}

async function updateCoupon(couponId, updates) {
    try {
        const { data, error } = await supabaseClient.from('cupons').update(updates).eq('id', couponId).select();
        if (error) throw error; return data[0];
    } catch (error) { console.error('Erro ao atualizar cupom:', error.message || error); throw error; }
}

async function deleteCoupon(couponId) {
    try {
        const { error } = await supabaseClient.from('cupons').delete().eq('id', couponId);
        if (error) throw error; return true;
    } catch (error) { console.error('Erro ao deletar cupom:', error.message || error); throw error; }
}

async function getProdutosFull() {
    try {
        const { data, error } = await supabaseClient.from('produtos').select('*').order('nome', { ascending: true });
        if (error) throw error; return data || [];
    } catch (error) { console.error('Erro ao obter produtos:', error.message || error); return []; }
}

async function getClientes() {
    try {
        const { data, error } = await supabaseClient.from('clientes').select('*').order('nome', { ascending: true });
        if (error) throw error; return data || [];
    } catch (error) { console.error('Erro ao obter clientes:', error.message || error); return []; }
}

async function createCliente(cliente) {
    try {
        const { data, error } = await supabaseClient.from('clientes').insert([{ ...cliente }]).select();
        if (error) throw error; return data[0];
    } catch (error) { console.error('Erro ao criar cliente:', error.message || error); throw error; }
}

async function getItensPedido(pedidoId) {
    try {
        const { data, error } = await supabaseClient.from('pedido_itens').select('*').eq('pedido_id', pedidoId);
        if (error) throw error; return data || [];
    } catch (error) { console.error('Erro ao obter itens do pedido:', error.message || error); return []; }
}

async function createItemPedido(item) {
    try {
        const payload = { ...item, pedido_id: item.pedido || item.pedido_id || null };
        const { data, error } = await supabaseClient.from('pedido_itens').insert([payload]).select();
        if (error) throw error; return data[0];
    } catch (error) { console.error('Erro ao criar item de pedido:', error.message || error); throw error; }
}

// Realtime helpers (note: currently using Supabase realtime via supabase-js)
function onPedidosChange(callback) {
    if (!window.supabase || !window.supabase.channel) return null;
    const channel = window.supabase.channel('public:pedidos');
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => callback(payload));
    channel.subscribe();
    return channel;
}

function onCuponsChange(callback) {
    if (!window.supabase || !window.supabase.channel) return null;
    const channel = window.supabase.channel('public:cupons');
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'cupons' }, (payload) => callback(payload));
    channel.subscribe();
    return channel;
}

async function unsubscribe(channel) {
    if (channel && typeof channel.unsubscribe === 'function') {
        await channel.unsubscribe();
    }
}



