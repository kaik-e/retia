# 🔧 Troubleshooting - Domínio Não Proxiado

## Problema: "Proxy server not responding or domain not configured"

### 1️⃣ Verificar se o Proxy está Rodando

```bash
pm2 list
```

**Deve mostrar:**
```
┌─────┬──────────────┬─────────┬─────────┐
│ id  │ name         │ status  │ port    │
├─────┼──────────────┼─────────┼─────────┤
│ 0   │ retia-api    │ online  │ 3000    │
│ 1   │ retia-proxy  │ online  │ 8080    │
└─────┴──────────────┴─────────┴─────────┘
```

**Se o proxy estiver `stopped` ou `errored`:**
```bash
pm2 restart retia-proxy
pm2 logs retia-proxy --lines 50
```

---

### 2️⃣ Verificar Logs do Proxy

```bash
pm2 logs retia-proxy --lines 50
```

**Deve mostrar:**
```
🚀 HTTP Proxy server running on port 8080
📡 Ready to handle domain requests
💡 Cloudflare will forward to this port
```

---

### 3️⃣ Verificar se a Porta 8080 está Aberta

```bash
# Verificar se está escutando
sudo netstat -tlnp | grep 8080

# Deve mostrar algo como:
tcp6  0  0 :::8080  :::*  LISTEN  12345/node
```

**Se não aparecer nada:**
```bash
pm2 restart retia-proxy
```

---

### 4️⃣ Verificar Firewall

```bash
sudo ufw status
```

**Deve ter:**
```
3000/tcp    ALLOW       Anywhere
8080/tcp    ALLOW       Anywhere
```

**Se não tiver:**
```bash
sudo ufw allow 8080/tcp
sudo ufw reload
```

---

### 5️⃣ Testar o Proxy Localmente

```bash
curl -H "Host: lojasdoterra.shop" http://localhost:8080/
```

**Deve retornar:**
- HTML do template (se configurado)
- OU redirect para o target_url
- OU mensagem de bloqueio

**Se retornar "Domain not configured":**
- O domínio não está no banco de dados
- Vá para o passo 6

---

### 6️⃣ Verificar se o Domínio está Cadastrado

```bash
# Acessar o banco de dados
sqlite3 data/cloaker.db

# Verificar domínios
SELECT domain, is_active FROM domains;

# Sair
.exit
```

**Se o domínio não aparecer:**
1. Acesse o dashboard: `http://185.245.183.247:3000`
2. Vá em "Domínios" → "Novo Domínio"
3. Adicione: `lojasdoterra.shop`

---

### 7️⃣ Testar do Cloudflare

```bash
# Testar se o Cloudflare consegue acessar
curl -H "Host: lojasdoterra.shop" http://185.245.183.247:8080/
```

**Deve retornar o mesmo que o teste local**

---

### 8️⃣ Verificar DNS do Cloudflare

No Cloudflare, verifique:

- **Type:** A
- **Name:** lojasdoterra.shop (ou @)
- **IPv4:** 185.245.183.247
- **Proxy:** 🟠 Proxied (ON)
- **TTL:** Auto

---

### 9️⃣ Aguardar Propagação DNS

```bash
# Verificar se o DNS está resolvendo
dig lojasdoterra.shop

# Deve mostrar IPs do Cloudflare (não o seu IP direto)
```

**Aguarde até 5 minutos para propagação**

---

### 🔟 Restart Completo

Se nada funcionar:

```bash
# Parar tudo
pm2 stop all

# Limpar logs
pm2 flush

# Iniciar novamente
pm2 start server/index.js --name retia-api
pm2 start server/proxy-server.js --name retia-proxy

# Ver logs em tempo real
pm2 logs
```

---

## ✅ Checklist Rápido

- [ ] `pm2 list` mostra proxy online
- [ ] `pm2 logs retia-proxy` sem erros
- [ ] `netstat -tlnp | grep 8080` mostra porta aberta
- [ ] `ufw status` mostra porta 8080 permitida
- [ ] `curl localhost:8080` funciona
- [ ] Domínio está no banco de dados
- [ ] Cloudflare DNS configurado corretamente
- [ ] Cloudflare Proxy está ON (🟠)

---

## 🆘 Ainda não funciona?

**Verifique se o domínio está ATIVO:**

```bash
sqlite3 data/cloaker.db "SELECT domain, is_active FROM domains WHERE domain = 'lojasdoterra.shop';"
```

**Deve retornar:**
```
lojasdoterra.shop|1
```

**Se retornar `0` (inativo):**
1. Acesse o dashboard
2. Vá em "Domínios"
3. Ative o domínio

---

## 📞 Comandos Úteis

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs retia-proxy

# Restart
pm2 restart retia-proxy

# Ver uso de recursos
pm2 monit

# Limpar logs
pm2 flush
```
