🎯 GUIA DE USO - ARQUIVO PROJETO-FINAL.ZIP
==========================================

Este é o seu arquivo com TUDO refatorado e funcional!

---

## 📥 PASSO 1: EXTRAIR O ZIP

### Windows
1. Clique com botão direito em `projeto-final.zip`
2. Selecione "Extrair tudo..."
3. Escolha uma pasta
4. Clique "Extrair"

### Mac
1. Duplo clique em `projeto-final.zip`
2. Arquivo será extraído automaticamente

### Linux
```bash
unzip projeto-final.zip
# ou
tar -xzf projeto-final.zip
```

---

## 📂 ESTRUTURA APÓS EXTRAIR

```
projeto-final/
│
├── 📂 admin/              ← Sistema para gerentes/atendentes
│   ├── index.html         ← Abra no navegador
│   ├── js/
│   │   ├── pocketbase.js  ← Integração com PocketBase
│   │   ├── app.js         ← Lógica principal
│   │   └── ...
│   └── css/
│
├── 📂 cliente/            ← Site de pedidos para clientes
│   ├── index.html         ← Abra no navegador
│   ├── js/
│   │   ├── pocketbase.js  ← NOVO! Integração com PocketBase
│   │   ├── site_orders.js ← Atualizado
│   │   ├── cupons.js      ← Atualizado
│   │   └── ...
│   └── css/
│
├── 📄 README.md              ⭐ LEIA PRIMEIRO (5 min)
├── 📄 GUIA_POCKETBASE.md     ← Guia completo (20 min)
├── 📄 CHECKLIST.md           ← Verificação pós-instalação
├── 📄 TROUBLESHOOTING.md     ← Soluções para problemas
├── 📄 POCKETBASE_SCHEMA.json ← Schema das coleções
├── 📄 DADOS_INICIAIS.sql     ← Dados de teste
└── 📄 pocketbase_config.json ← Configuração recomendada
```

---

## 🚀 PASSO 2: INSTALAR POCKETBASE

### 1. Download
- Acesse: https://pocketbase.io/
- Clique em "Download"
- Escolha seu SO (Windows, Mac, Linux)

### 2. Descompactar
- Extraia em uma pasta segura
- Exemplo: `~/pocketbase/` ou `C:\pocketbase\`

### 3. Executar

**Windows:**
1. Abra a pasta `pocketbase`
2. Duplo clique em `pocketbase.exe`
3. Deve abrir uma janela com logs

**Mac/Linux:**
```bash
cd ~/pocketbase
chmod +x pocketbase
./pocketbase serve
```

**Sucesso quando aparecer:**
```
REST API listening on "http://127.0.0.1:8090"
API server started successfully ⚡
```

---

## 📊 PASSO 3: ACESSAR O ADMIN PANEL

1. Abra seu navegador
2. Digite: `http://127.0.0.1:8090/_/`
3. Você verá o admin panel do PocketBase

**Você deve ver:**
- Collections (vazio por enquanto)
- Settings
- Logs
- SQL Console

---

## 🗂️ PASSO 4: CRIAR AS COLEÇÕES

### Opção A: Manualmente (Mais seguro)
1. No Admin Panel, clique "+ New Collection"
2. Siga as instruções em `GUIA_POCKETBASE.md` seção 4
3. Crie: users, clientes, produtos, pedidos, pedido_itens, cupons, financeiro, funcionarios

### Opção B: Usar o Schema JSON (Rápido)
1. Abra `POCKETBASE_SCHEMA.json`
2. Copie o conteúdo
3. No Admin Panel, procure por "Import/Export"
4. Cole o JSON

**Tempo estimado:** 20-30 minutos

---

## 📦 PASSO 5: INSERIR DADOS DE TESTE

### Opção A: SQL (Rápido)
1. Admin Panel → SQL Console
2. Abra `DADOS_INICIAIS.sql`
3. Copie os comandos SQL
4. Cole no SQL Console
5. Clique "Execute"

### Opção B: Manualmente (Visual)
1. Admin Panel → Collections → cupons
2. Clique "+ New"
3. Adicione cupons:
   - codigo: BEMVINDO10
   - desconto: 10
   - tipo_desconto: percentual
   - ativo: true

**Cupons recomendados:**
- BEMVINDO10 (10% desconto)
- PROMOCAO20 (20% desconto)
- ENTREGA5 (R$ 5 fixo)

---

## 🌐 PASSO 6: TESTAR NO NAVEGADOR

### Teste 1: Verificar Conexão

Abra o Console do Navegador (F12):
```javascript
console.log(window.pocketbaseClient);
// Deve mostrar: {from: ƒ, auth: {...}}
```

✅ **Sucesso:** Mostra um objeto
❌ **Erro:** undefined

### Teste 2: Listar Cupons

```javascript
pocketbaseClient.from('cupons').select('*').then(r => {
  console.table(r.data);
});
```

✅ **Sucesso:** Vê a lista de cupons
❌ **Erro:** Vê erro ou lista vazia (crie cupons)

### Teste 3: Testar Validação de Cupom

```javascript
window.cuponsService.validar('BEMVINDO10').then(r => {
  console.log('Cupom:', r);
  console.log('Desconto:', window.cuponsService.calcularDesconto(r, 100));
});
```

✅ **Sucesso:** Cupom retorna e calcula 10% de 100 = 10
❌ **Erro:** null

---

## 🎨 PASSO 7: ABRIR OS SISTEMAS

### Site de Pedidos
1. Abra `cliente/index.html` no navegador
2. Clique "Ver cardápio"
3. Adicione items ao carrinho
4. Aplique cupom "BEMVINDO10"
5. Clique "Checkout"
6. Preencha dados
7. Clique "Confirmar Pedido"

✅ **Sucesso:** Pedido criado, mensagem de sucesso

### Dashboard
1. Abra `admin/index.html` no navegador
2. Faça login (email/senha)
3. Você verá os pedidos criados

**Usuário padrão:**
- Email: (verificar em `admin/js/core/config.js`)
- Senha: (configurar no admin panel)

---

## 🔍 PASSO 8: VERIFICAR TUDO COM CHECKLIST

Siga o arquivo `CHECKLIST.md`:
- 10 fases
- Verificar cada uma
- Marcar como ✅ quando completar

**Tempo estimado:** 30-60 minutos

---

## 🆘 PASSO 9: SE TER PROBLEMAS

### Erro: "pocketbaseClient não definido"
→ Procure em `TROUBLESHOOTING.md` seção 1

### Erro: "CORS error"
→ Procure em `TROUBLESHOOTING.md` seção 3

### Erro: "Collection not found"
→ Procure em `TROUBLESHOOTING.md` seção 4

### Cupom não funciona
→ Procure em `TROUBLESHOOTING.md` seção 5

---

## 📚 LEITURA RECOMENDADA

**Ordre de leitura:**

1. **Este arquivo** (já está lendo! 🎉)
2. **README.md** - Estrutura geral (5 min)
3. **GUIA_POCKETBASE.md** - Tudo detalhado (20 min)
4. **CHECKLIST.md** - Verificação (durante setup)
5. **TROUBLESHOOTING.md** - Se tiver erros

---

## 🎯 TIMELINE COMPLETO

| Etapa | Tempo | Status |
|-------|-------|--------|
| Extrair ZIP | 1 min | ✅ |
| Instalar PocketBase | 5 min | ✅ |
| Executar PocketBase | 1 min | ✅ |
| Criar Coleções | 20 min | ✅ |
| Inserir Dados | 5 min | ✅ |
| Testar Site | 10 min | ✅ |
| Testar Dashboard | 10 min | ✅ |
| Checklist Completo | 30 min | ✅ |
| **TOTAL** | **~1h30m** | **✅** |

---

## 💾 CONFIGURAÇÕES IMPORTANTES

### Ambiente Local (Desenvolvimento)
```
PocketBase: http://127.0.0.1:8090
Dados: Locais (pb_data/)
Backup: Manual
```

### Ambiente Produção
```
PocketBase: https://api.seu-dominio.com
Dados: Servidor (backup automático)
SSL: Habilitado
Firewall: Configurado
```

Ver: `GUIA_POCKETBASE.md` seção 10

---

## 🎁 BONUS: COMANDOS ÚTEIS

### Backup
```bash
cp -r ~/pocketbase/pb_data ~/backup_$(date +%Y%m%d)
```

### Restaurar Backup
```bash
cp -r ~/backup_20250412 ~/pocketbase/pb_data
./pocketbase serve
```

### Rodar em Porta Diferente
```bash
./pocketbase serve --http=127.0.0.1:8091
```

### Parar PocketBase
```bash
Ctrl+C (no terminal)
```

---

## ✅ CHECKLIST RÁPIDO

Antes de considerar tudo pronto:

- [ ] PocketBase instalado
- [ ] PocketBase rodando
- [ ] Admin panel acessível
- [ ] Coleções criadas
- [ ] Dados inseridos
- [ ] Site funciona
- [ ] Dashboard funciona
- [ ] Cupons validam
- [ ] Pedidos salvam
- [ ] Backup feito

---

## 🆘 ÚLTIMO RECURSO

Se nada funcionar:

1. **Deletar tudo e recomeçar**
```bash
rm -rf pb_data
./pocketbase serve
# Recria banco vazio
```

2. **Verificar logs**
- Procurar por [ERROR] no terminal do PocketBase

3. **Pedir ajuda**
- GitHub: https://github.com/pocketbase/pocketbase
- Discord: https://discord.gg/wizardry

---

## 🎉 PRÓXIMO PASSO

Agora que extraiu o ZIP:

1. **Leia `README.md`** (5 minutos) ← PRÓXIMO!
2. **Instale PocketBase**
3. **Siga `GUIA_POCKETBASE.md`**
4. **Use `CHECKLIST.md` para verificar**

---

## 📞 SUPORTE RÁPIDO

- **Erros ao usar:** `TROUBLESHOOTING.md`
- **Como configurar:** `GUIA_POCKETBASE.md`
- **Verificação:** `CHECKLIST.md`
- **Documentação oficial:** https://pocketbase.io/docs/

---

**Pronto para começar? 🚀**

Próximo arquivo a ler: `README.md`

Boa sorte! 🍓
