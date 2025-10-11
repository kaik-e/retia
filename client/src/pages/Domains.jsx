import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Globe, Plus, Trash2, Edit, TrendingUp, Power, Lock, Unlock, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import { DomainQuickStats } from '@/components/DomainQuickStats'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function Domains() {
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, domain: null })

  useEffect(() => {
    loadDomains()
  }, [])

  const loadDomains = async () => {
    try {
      const response = await api.domains.getAll()
      setDomains(response.data)
    } catch (error) {
      console.error('Failed to load domains:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.domains.delete(deleteDialog.id)
      setDomains(domains.filter(d => d.id !== deleteDialog.id))
      setAlert({
        variant: 'success',
        title: 'Sucesso!',
        description: 'Domínio excluído com sucesso',
        icon: CheckCircle
      })
      setTimeout(() => setAlert(null), 3000)
    } catch (error) {
      console.error('Failed to delete domain:', error)
      setAlert({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao excluir domínio',
        icon: XCircle
      })
    } finally {
      setDeleteDialog({ open: false, id: null, domain: null })
    }
  }


  const toggleLockdown = async (domain) => {
    const newLockdownState = !domain.lockdown_mode
    
    if (newLockdownState && !domain.lockdown_template_id) {
      setAlert({
        variant: 'warning',
        title: 'Template Necessário',
        description: 'Configure um template de bloqueio antes de ativar o lockdown',
        icon: Lock
      })
      return
    }

    try {
      // Get full domain data first
      const fullDomain = await api.domains.getOne(domain.id)
      const data = fullDomain.data
      
      // Update with only valid fields (exclude template_name, template_filename, created_at, updated_at)
      await api.domains.update(domain.id, {
        domain: data.domain,
        target_url: data.target_url,
        template_id: data.template_id,
        pass_query_params: data.pass_query_params,
        require_gclid: data.require_gclid,
        mobile_only: data.mobile_only,
        block_pingable_ips: data.block_pingable_ips,
        block_asn: data.block_asn,
        lockdown_mode: newLockdownState,
        lockdown_template_id: data.lockdown_template_id,
        is_active: data.is_active,
        asn_blocks: data.asn_blocks || [],
        country_blocks: data.country_blocks || [],
        state_blocks: data.state_blocks || [],
        ip_blocks: data.ip_blocks || []
      })
      
      // Reload domains to get fresh data
      await loadDomains()
      
      setAlert({
        variant: 'success',
        title: 'Sucesso!',
        description: newLockdownState ? 'Lockdown ativado' : 'Lockdown desativado',
        icon: CheckCircle
      })
      
      // Auto-dismiss alert after 3 seconds
      setTimeout(() => setAlert(null), 3000)
    } catch (error) {
      console.error('Failed to toggle lockdown:', error)
      setAlert({
        variant: 'destructive',
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao alterar lockdown',
        icon: XCircle
      })
    }
  }

  const toggleDomainActive = async (domain) => {
    const newActiveState = !domain.is_active
    
    try {
      // Get full domain data first
      const fullDomain = await api.domains.getOne(domain.id)
      const data = fullDomain.data
      
      // Update with only valid fields
      await api.domains.update(domain.id, {
        domain: data.domain,
        target_url: data.target_url,
        template_id: data.template_id,
        pass_query_params: data.pass_query_params,
        require_gclid: data.require_gclid,
        mobile_only: data.mobile_only,
        block_pingable_ips: data.block_pingable_ips,
        block_asn: data.block_asn,
        lockdown_mode: data.lockdown_mode,
        lockdown_template_id: data.lockdown_template_id,
        is_active: newActiveState,
        asn_blocks: data.asn_blocks || [],
        country_blocks: data.country_blocks || [],
        state_blocks: data.state_blocks || [],
        ip_blocks: data.ip_blocks || []
      })
      
      // Reload domains to get fresh data
      await loadDomains()
      
      setAlert({
        variant: 'success',
        title: 'Sucesso!',
        description: newActiveState ? 'Domínio ativado' : 'Domínio desativado',
        icon: CheckCircle
      })
      
      // Auto-dismiss alert after 3 seconds
      setTimeout(() => setAlert(null), 3000)
    } catch (error) {
      console.error('Failed to toggle domain:', error)
      setAlert({
        variant: 'destructive',
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao alterar status do domínio',
        icon: XCircle
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Domínios</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus domínios de cloaking e configurações
          </p>
        </div>
        <Link to="/domains/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Domínio
          </Button>
        </Link>
      </div>

      {/* Alert */}
      {alert && (
        <Alert variant={alert.variant}>
          {alert.icon && <alert.icon className="h-4 w-4" />}
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
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
              <Globe className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">Nenhum domínio ainda</h3>
                <p className="text-muted-foreground mt-1">
                  Comece criando seu primeiro domínio de cloaking
                </p>
              </div>
              <Link to="/domains/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Domínio
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {domains.map((domain) => (
            <Card key={domain.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-primary" />
                      <CardTitle>{domain.domain}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => window.open(`https://${domain.domain}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      {domain.lockdown_mode && (
                        <Badge variant="destructive" className="gap-1">
                          <Lock className="w-3 h-3" />
                          Lockdown
                        </Badge>
                      )}
                      {domain.is_active === false && (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </div>
                    <CardDescription>
                      Redireciona para: {domain.target_url}
                    </CardDescription>
                    
                    {domain.template_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Template:</span>
                        <Badge variant="outline">{domain.template_name}</Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {/* Main Action Buttons */}
                    <div className="flex items-center gap-2">
                    <Link to={`/analytics/${domain.id}`}>
                      <Button variant="ghost" size="sm" title="View Analytics">
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                    </Link>
                      <Link to={`/domains/${domain.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, id: domain.id, domain: domain.domain })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant={domain.lockdown_mode ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => toggleLockdown(domain)}
                        title={domain.lockdown_mode ? "Desativar Lockdown" : "Ativar Lockdown"}
                      >
                        {domain.lockdown_mode ? <Unlock className="w-4 h-4 mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
                        {domain.lockdown_mode ? "Desbloquear" : "Lockdown"}
                      </Button>
                      <Button
                        variant={domain.is_active === false ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDomainActive(domain)}
                        title={domain.is_active === false ? "Ativar Domínio" : "Desativar Domínio"}
                      >
                        <Power className="w-4 h-4 mr-1" />
                        {domain.is_active === false ? "Ativar" : "Desativar"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {domain.pass_query_params && (
                      <Badge variant="secondary">Passar Parâmetros</Badge>
                    )}
                    {domain.require_gclid && (
                      <Badge variant="secondary">Exigir GCLID</Badge>
                    )}
                    {domain.mobile_only && (
                      <Badge variant="secondary">Apenas Mobile</Badge>
                    )}
                    {domain.block_pingable_ips && (
                      <Badge variant="secondary">Bloquear IPs Pingáveis</Badge>
                    )}
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="pt-2 border-t">
                    <DomainQuickStats domainId={domain.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, id: null, domain: null })}
        title="Excluir Domínio"
        description={`Tem certeza que deseja excluir o domínio "${deleteDialog.domain}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  )
}
