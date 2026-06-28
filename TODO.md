# TODO: Fix "Cannot read properties of null (reading 'id')" → Enable Backend

## Progress: 2.5/5 ✅

### Backend Integration Plan
- [✅] **1. Create this TODO.md**
- [✅] **2. Update js/app.js** → `BACKEND_URL = 'http://localhost:3334'`
- [✅] **2.5 Backend deps ready** → `npm install` completed, `node_modules/` exists
- [ ] **3. Start backend** → `cd backend && node index.js` (expect: Server running on port 3334)
- [ ] **4. Test order** → http://localhost:3334/pedidos
- [ ] **5. Frontend test** → Submit pedido → No more null.id error

## 🚨 DIAGNOSIS (Error persists)
**Backend status needed**:
```
1. Backend terminal logs? (paste aqui)
2. Test: http://localhost:3334/ping → {ok:true} ?
3. Frontend console errors?

**Restart backend**:
cd backend && node index.js

**Expected**:
```
DB: usando fallback em memória (sem DATABASE_URL)
server running on port 3334
```
```



### Backend Integration Plan
- [ ] **1. Create this TODO.md** ← **Current step**
- [ ] **2. Update js/app.js** → Set `BACKEND_URL = 'http://localhost:3334'`
- [ ] **3. Start backend** → `cd backend && npm install && node index.js`
- [ ] **4. Test order submission** → Add item → Submit → Check http://localhost:3334/pedidos
- [ ] **5. Verify frontend** → No more Supabase null.id error, orders via backend

### After completion:
```
Run: cd backend && node index.js  (keep running)
Open index.html → Add açaí → Fill form → Submit pedido
Check: http://localhost:3334/pedidos (lista pedidos)
```

