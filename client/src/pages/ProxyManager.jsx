import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Server, Plus, RefreshCw, CheckCircle, XCircle, Copy, Trash2, AlertCircle, Terminal } from 'lucide-react'
import { api } from '@/lib/api'

export default function ProxyManager() {
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [proxyStatuses, setProxyStatuses] = useState({})
  const [checkingStatus, setCheckingStatus] = useState({})
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    loadDomains()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDomains, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDomains = async () => {
    try {
      const response = await api.domains.getAll()
      setDomains(response.data)
      
      // Check proxy status for each domain
      response.data.forEach(domain => {
        checkProxyStatus(domain.id)
      })
    } catch (error) {
      console.error('Failed to load domains:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkProxyStatus = async (domainId) => {
    setCheckingStatus(prev => ({ ...prev, [domainId]: true }))
    try {
      const response = await api.domains.getProxyStatus(domainId)
      setProxyStatuses(prev => ({ ...prev, [domainId]: response.data }))
    } catch (error) {
      setProxyStatuses(prev => ({ 
        ...prev, 
        [domainId]: { proxied: false, message: 'Error checking status' }
      }))
    } finally {
      setCheckingStatus(prev => ({ ...prev, [domainId]: false }))
    }
  }

  const autoConfigureNginx = async (domainId) => {
    setGenerating(domainId)
    setAlert(null)
    try {
      const response = await fetch(`http://localhost:3000/api/domains/${domainId}/auto-configure-nginx`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.status === 'active') {
        setAlert({
          variant: 'success',
          title: 'Nginx Configurado com Sucesso!',
          description: data.message,
          icon: CheckCircle
        })
      } else if (data.status === 'manual_required') {
        setAlert({
          variant: 'warning',
          title: 'Permissões Sudo Necessárias',
          description: 'Arquivo criado. Execute estes comandos:',
          commands: data.commands,
          icon: Terminal
        })
      } else {
        setAlert({
          variant: 'default',
          title: 'Configuração Criada',
          description: data.message,
          icon: CheckCircle
        })
      }
      
      loadDomains()
    } catch (error) {
      console.error('Failed to configure nginx:', error)
      setAlert({
        variant: 'destructive',
        title: 'Erro ao Configurar',
        description: error.message,
        icon: XCircle
      })
    } finally {
      setGenerating(null)
    }
  }

  const deleteNginxConfig = async (domainId) => {
    if (!confirm('Tem certeza que deseja remover a configuração Nginx?')) return
    
    try {
      await api.domains.deleteNginx(domainId)
      alert('Configuração Nginx removida!')
    } catch (error) {
      console.error('Failed to delete nginx config:', error)
      alert('Erro ao remover configuração')
    }
  }

  const copySetupCommand = (domain) => {
    const command = `# 1. Gerar configuração
curl -X POST http://localhost:3000/api/domains/${domain.id}/nginx

# 2. Criar link simbólico
sudo ln -s $(pwd)/nginx/sites-enabled/${domain.id}.conf /etc/nginx/sites-enabled/

# 3. Testar configuração
sudo nginx -t

# 4. Recarregar Nginx
sudo systemctl reload nginx`
    
    navigator.clipboard.writeText(command)
    alert('Comandos copiados!')
  }

  const copyProxyPass = (domainId) => {
    const config = `location / {
    proxy_pass http://localhost:3000/api/cloak/${domainId};
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}`
    
    navigator.clipboard.writeText(config)
    alert('Configuração proxy_pass copiada!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Status do Proxy</h1>
        <p className="text-muted-foreground mt-2">
          Monitor em tempo real dos domínios proxiados
        </p>
      </div>

      {/* Alert */}
      {alert && (
        <Alert variant={alert.variant}>
          {alert.icon && <alert.icon className="h-4 w-4" />}
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>
            {alert.description}
            {alert.commands && (
              <div className="mt-3 space-y-2">
                {alert.commands.map((cmd, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <code className="flex-1 bg-black/10 px-3 py-2 rounded text-xs font-mono">
                      {cmd}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(cmd)
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Domains List */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              Carregando domínios...
            </div>
          </CardContent>
        </Card>
      ) : domains.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Server className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">Nenhum domínio configurado</h3>
                <p className="text-muted-foreground mt-1">
                  Crie um domínio primeiro para configurar o proxy
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {domains.map((domain) => {
            const status = proxyStatuses[domain.id]
            const checking = checkingStatus[domain.id]
            
            return (
              <Card key={domain.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <Server className="w-5 h-5 text-primary" />
                        <CardTitle>{domain.domain}</CardTitle>
                        {checking ? (
                          <Badge variant="outline" className="gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Verificando...
                          </Badge>
                        ) : status?.proxied ? (
                          <Badge variant="default" className="gap-1 bg-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Proxiado
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="w-3 h-3" />
                            Não Proxiado
                          </Badge>
                        )}
                        {!domain.is_active && (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </div>
                      <CardDescription>
                        Target: {domain.target_url}
                      </CardDescription>
                      {status && !checking && (
                        <p className="text-xs text-muted-foreground">
                          {status.message}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => checkProxyStatus(domain.id)}
                      disabled={checking}
                    >
                      <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Cloudflare DNS */}
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.5939 2.36205L11.7939 3.16205L11.0005 3.95538L10.2072 3.16205L9.40718 2.36205C8.22051 1.17538 6.28051 1.17538 5.09384 2.36205C3.90718 3.54872 3.90718 5.48872 5.09384 6.67538L5.89384 7.47538L11.0005 12.582L16.1072 7.47538L16.9072 6.67538C18.0939 5.48872 18.0939 3.54872 16.9072 2.36205C15.7205 1.17538 13.7805 1.17538 12.5939 2.36205Z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-orange-900 mb-2 text-sm">Cloudflare DNS</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-orange-700">Type:</span>
                            <code className="bg-white px-2 py-0.5 rounded font-semibold">A</code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-orange-700">Name:</span>
                            <code className="bg-white px-2 py-0.5 rounded font-semibold">{domain.domain}</code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-orange-700">IPv4:</span>
                            <code className="bg-white px-2 py-0.5 rounded font-semibold">[Seu IP]</code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-orange-700">Proxy:</span>
                            <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-xs font-semibold">🟠 Proxied</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cloudflare Settings */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-blue-900 mb-2 text-sm">Cloudflare Settings</p>
                        <div className="space-y-1.5 text-xs text-blue-800">
                          <div className="flex items-center gap-2">
                            <span>SSL/TLS:</span>
                            <strong>Flexible</strong>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="whitespace-nowrap">Security:</span>
                            <code className="bg-white px-1.5 py-0.5 rounded flex-1">User Agent contains "AdsBot-Google" → Skip</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Server Info */}
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Porta do Proxy:</span>
                        <code className="font-semibold">8080</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cloudflare encaminha para:</span>
                        <code className="font-semibold">http://[seu-ip]:8080</code>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
