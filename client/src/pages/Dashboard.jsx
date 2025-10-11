import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Globe, FileText, Activity, Plus, TrendingUp, Shield, Users } from 'lucide-react'
import { api } from '@/lib/api'

export default function Dashboard() {
  const [stats, setStats] = useState({
    domains: 0,
    templates: 0,
    totalRequests: 0,
    blockedRequests: 0,
    users: 0,
  })
  const [recentDomains, setRecentDomains] = useState([])
  const [loading, setLoading] = useState(true)
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const isMaster = currentUser.role === 'master'

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const promises = [
        api.domains.getAll(),
        api.templates.getAll(),
      ]
      
      if (isMaster) {
        promises.push(api.users.getAll())
      }

      const results = await Promise.all(promises)
      const [domainsRes, templatesRes, usersRes] = results

      setStats({
        domains: domainsRes.data.length,
        templates: templatesRes.data.length,
        totalRequests: 0,
        blockedRequests: 0,
        users: usersRes ? usersRes.data.length : 0,
      })

      setRecentDomains(domainsRes.data.slice(0, 5))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
        <p className="text-muted-foreground mt-2">
          Visão geral do seu sistema de cloaking
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Domínios</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.domains}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Domínios de cloaking ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.templates}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Templates de páginas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Requisições</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requisições totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isMaster ? 'Usuários' : 'Bloqueados'}</CardTitle>
            {isMaster ? <Users className="h-4 w-4 text-muted-foreground" /> : <Shield className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isMaster ? stats.users : stats.blockedRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isMaster ? 'Usuários cadastrados' : 'Requisições filtradas'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Domains */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Domínios Recentes</CardTitle>
              <CardDescription>Seus últimos domínios configurados</CardDescription>
            </div>
            <Link to="/domains/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Domínio
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : recentDomains.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum domínio configurado ainda
            </div>
          ) : (
            <div className="space-y-4">
              {recentDomains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{domain.domain}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Destino: {domain.target_url}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {domain.require_gclid && (
                      <Badge variant="secondary">GCLID</Badge>
                    )}
                    {domain.mobile_only && (
                      <Badge variant="secondary">Mobile</Badge>
                    )}
                    <Link to={`/domains/${domain.id}`}>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </Link>
                    <Link to={`/analytics/${domain.id}`}>
                      <Button variant="ghost" size="sm">
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:border-primary transition-colors cursor-pointer">
          <Link to="/domains/new">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Criar Novo Domínio
              </CardTitle>
              <CardDescription>
                Configure um novo domínio de cloaking com regras personalizadas
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:border-primary transition-colors cursor-pointer">
          <Link to="/templates">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Enviar Template
              </CardTitle>
              <CardDescription>
                Adicione um novo template HTML para páginas de cloaking
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  )
}
