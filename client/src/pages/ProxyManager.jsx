import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Server, RefreshCw, CheckCircle, XCircle, Cloud, Lock, Shield } from 'lucide-react'
import { api } from '@/lib/api'

const VPS_IP = '185.245.183.247'

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
                {!status?.proxied && (
                <div className="space-y-3">
                  {/* Cloudflare DNS */}
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Cloud className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
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
                            <code className="bg-white px-2 py-0.5 rounded font-semibold">{VPS_IP}</code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-orange-700">Proxy:</span>
                            <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Proxied ON
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cloudflare Settings */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-900 mb-2 text-sm">Configurações Cloudflare</p>
                        <div className="space-y-1.5 text-xs text-blue-800">
                          <div className="flex items-center gap-2">
                            <span>SSL/TLS:</span>
                            <strong>Flexible</strong>
                          </div>
                          <div className="flex items-start gap-2">
                            <Shield className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <code className="bg-white px-1.5 py-0.5 rounded flex-1">User Agent contains "AdsBot-Google" → Skip</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Server Info */}
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Server className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Porta do Proxy:</span>
                          <code className="font-semibold">8080</code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cloudflare encaminha para:</span>
                          <code className="font-semibold">http://{VPS_IP}:8080</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
