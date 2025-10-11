import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Activity, Search, Filter } from 'lucide-react'
import { api } from '@/lib/api'

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  useEffect(() => {
    loadLogs()
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadLogs, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadLogs = async () => {
    try {
      // Get all domains
      const domainsRes = await api.domains.getAll()
      
      // Get logs for all domains
      const logsPromises = domainsRes.data.map(domain =>
        api.analytics.getLogs(domain.id, 100).catch(() => ({ data: [] }))
      )
      
      const logsResults = await Promise.all(logsPromises)
      
      // Combine and sort all logs
      const allLogs = logsResults
        .flatMap((res, idx) => 
          res.data.map(log => ({
            ...log,
            domain: domainsRes.data[idx].domain
          }))
        )
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      
      setLogs(allLogs)
    } catch (error) {
      console.error('Failed to load logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const parseUserAgent = (ua) => {
    if (!ua) return { browser: 'Desconhecido', os: 'Desconhecido' }
    
    // Simple parsing
    let browser = 'Desconhecido'
    let os = 'Desconhecido'
    
    // Browser detection
    if (ua.includes('Chrome/')) {
      const version = ua.match(/Chrome\/([\d.]+)/)?.[1]
      browser = `Chrome ${version}`
    } else if (ua.includes('Firefox/')) {
      const version = ua.match(/Firefox\/([\d.]+)/)?.[1]
      browser = `Firefox ${version}`
    } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
      browser = 'Safari'
    } else if (ua.includes('Go-http-client')) {
      browser = 'Go-http-client/1.1'
    }
    
    // OS detection
    if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac')) os = 'Mac'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
    
    return { browser, os }
  }

  const getLocationCode = (country, state) => {
    if (state && state !== 'Unknown') return state
    if (country && country !== 'Unknown') return country
    return 'Unknown'
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !filter || 
      log.ip_address?.includes(filter) ||
      log.domain?.toLowerCase().includes(filter.toLowerCase()) ||
      log.user_agent?.toLowerCase().includes(filter.toLowerCase())
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    
    return matchesSearch && matchesAction
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logs de Acesso</h1>
        <p className="text-muted-foreground mt-2">
          Monitoramento em tempo real de todas as requisições
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="IP, domínio, user agent..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ação</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="all">Todas</option>
                <option value="redirected">Redirecionados</option>
                <option value="blocked">Bloqueados</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Bloqueados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredLogs.filter(l => l.action === 'blocked').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Redirecionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredLogs.filter(l => l.action === 'redirected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Requisições Recentes
              </CardTitle>
              <CardDescription>
                Atualização automática a cada 10 segundos
              </CardDescription>
            </div>
            <Badge variant="outline">{filteredLogs.length} registros</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum log encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.slice(0, 50).map((log, index) => {
                const { browser, os } = parseUserAgent(log.user_agent)
                const location = getLocationCode(log.country, log.state)
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-muted-foreground">
                          {formatDate(log.timestamp)}
                        </span>
                        <Badge variant={log.action === 'blocked' ? 'destructive' : 'default'}>
                          {log.action === 'blocked' ? 'Bloqueado' : 'Redirecionado'}
                        </Badge>
                        {location !== 'Unknown' && (
                          <Badge variant="outline">{location}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-mono font-medium">{log.ip_address}</span>
                        <span className="text-muted-foreground">{log.domain}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {browser} ({os})
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
