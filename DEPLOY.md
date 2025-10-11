# 🚀 Deploy para VPS

## Requisitos
- Node.js 18+
- PM2 (gerenciador de processos)
- Cloudflare configurado

## 1. Setup no VPS

```bash
# Clone o projeto
git clone [seu-repo]
cd retia

# Instale dependências
npm run setup

# Configure variáveis de ambiente
cp .env.example .env
nano .env  # Edite JWT_SECRET para algo seguro!

# Crie diretórios necessários
mkdir -p data data/templates

# Rode migrações (cria banco de dados)
npm run migrate

# Build do frontend
npm run build
```

## 2. Configurar PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar API (porta 3000)
pm2 start server/index.js --name "retia-api"

# Iniciar Proxy (porta 8080)
pm2 start server/proxy-server.js --name "retia-proxy"

# Salvar configuração
pm2 save

# Auto-start no boot
pm2 startup
```

## 3. Configurar Cloudflare

### DNS
- **Type:** A
- **Name:** seudominio.com (ou @)
- **IPv4:** [IP do seu VPS]
- **Proxy:** 🟠 Proxied (ativado)
- **TTL:** Auto

### SSL/TLS
- **Mode:** Flexible
- **Always Use HTTPS:** ON

### Security Rules
```
Rule: Skip AdsBot
Expression: (http.user_agent contains "AdsBot-Google")
Action: Skip (All remaining rules)
```

## 4. Firewall (UFW)

```bash
# Permitir portas necessárias
sudo ufw allow 3000/tcp  # API
sudo ufw allow 8080/tcp  # Proxy
sudo ufw enable
```

## 5. Verificar Status

```bash
# Ver processos rodando
pm2 list

# Ver logs
pm2 logs retia-api
pm2 logs retia-proxy

# Restart
pm2 restart all
```

## 6. Acessar Painel

```
http://[seu-ip]:3000
```

**Login Padrão:**
- Usuário: `retia`
- Senha: `Retia10@@`

⚠️ **IMPORTANTE:** Mude as credenciais em produção editando `server/middleware/auth.js`

## Fluxo de Tráfego

```
Usuário (HTTPS)
    ↓
Cloudflare (Proxy ON 🟠)
    ↓ HTTP
VPS Porta 8080 (Proxy Node.js)
    ↓
Porta 3000 (API + Cloaking)
    ↓
Redirect ou Template
```

## Troubleshooting

### Proxy não funciona
```bash
# Verificar se está rodando
pm2 list

# Ver logs
pm2 logs retia-proxy

# Restart
pm2 restart retia-proxy
```

### Cloudflare não conecta
- Verifique se proxy está na porta 8080
- Confirme que Proxy está ON (laranja) no Cloudflare
- Verifique SSL/TLS em Flexible

### Domínio não resolve
- Aguarde propagação DNS (até 24h)
- Teste com `dig seudominio.com`
- Verifique se IP está correto no Cloudflare
