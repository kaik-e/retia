import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Save, ArrowLeft, Plus, X, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { CheckboxDropdown } from '@/components/CheckboxDropdown'
import { COUNTRIES, BRAZILIAN_STATES } from '@/lib/countries'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function DomainEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [formData, setFormData] = useState({
    domain: '',
    target_url: '',
    template_id: '',
    pass_query_params: true,
    require_gclid: true,
    mobile_only: true,
    block_pingable_ips: false,
    block_asn: false,
    lockdown_mode: false,
    lockdown_template_id: '',
  })

  const [asnBlocks, setAsnBlocks] = useState([])
  const [countryBlocks, setCountryBlocks] = useState([])
  const [stateBlocks, setStateBlocks] = useState([])
  const [ipBlocks, setIpBlocks] = useState([])

  const [newAsn, setNewAsn] = useState({ asn: '', description: '' })
  const [newCountry, setNewCountry] = useState('')
  const [newState, setNewState] = useState({ country_code: '', state_code: '' })
  const [newIp, setNewIp] = useState({ ip_address: '', description: '' })

  useEffect(() => {
    loadTemplates()
    if (isEdit) {
      loadDomain()
    }
  }, [id])

  const loadTemplates = async () => {
    try {
      const response = await api.templates.getAll()
      setTemplates(response.data)
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const loadDomain = async () => {
    try {
      const response = await api.domains.getOne(id)
      const domain = response.data
      setFormData({
        domain: domain.domain,
        target_url: domain.target_url,
        template_id: domain.template_id || '',
        pass_query_params: domain.pass_query_params,
        require_gclid: domain.require_gclid,
        mobile_only: domain.mobile_only,
        block_pingable_ips: domain.block_pingable_ips,
        block_asn: domain.block_asn || false,
        lockdown_mode: domain.lockdown_mode || false,
        lockdown_template_id: domain.lockdown_template_id || '',
      })
      setAsnBlocks(domain.asn_blocks || [])
      setCountryBlocks(domain.country_blocks || [])
      setStateBlocks(domain.state_blocks || [])
      setIpBlocks(domain.ip_blocks || [])
    } catch (error) {
      console.error('Failed to load domain:', error)
      const errorMsg = error.response?.data?.error || error.message || 'Falha ao carregar domínio'
      setAlert({ variant: 'destructive', title: 'Erro', description: errorMsg, icon: XCircle })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAlert(null)

    try {
      const data = {
        ...formData,
        asn_blocks: asnBlocks,
        country_blocks: countryBlocks,
        state_blocks: stateBlocks,
        ip_blocks: ipBlocks,
      }

      console.log('Submitting domain data:', data)

      if (isEdit) {
        const response = await api.domains.update(id, data)
        console.log('Update response:', response)
      } else {
        const response = await api.domains.create(data)
        console.log('Create response:', response)
      }

      console.log('Domain saved successfully, redirecting...')
      setAlert({ variant: 'success', title: 'Sucesso!', description: 'Domínio salvo com sucesso', icon: CheckCircle })
      
      // Redirect immediately
      navigate('/domains')
    } catch (error) {
      console.error('Failed to save domain:', error)
      console.error('Error details:', error.response?.data)
      const errorMsg = error.response?.data?.error || error.message || 'Erro desconhecido'
      setAlert({ 
        variant: 'destructive', 
        title: 'Erro ao Salvar', 
        description: errorMsg,
        icon: XCircle 
      })
    } finally {
      setLoading(false)
    }
  }

  const addAsnBlock = () => {
    if (newAsn.asn) {
      setAsnBlocks([...asnBlocks, { ...newAsn }])
      setNewAsn({ asn: '', description: '' })
    }
  }

  const addCountryBlock = () => {
    if (newCountry) {
      setCountryBlocks([...countryBlocks, { country_code: newCountry }])
      setNewCountry('')
    }
  }

  const addStateBlock = () => {
    if (newState.country_code && newState.state_code) {
      setStateBlocks([...stateBlocks, { ...newState }])
      setNewState({ country_code: '', state_code: '' })
    }
  }

  const addIpBlock = () => {
    if (newIp.ip_address) {
      setIpBlocks([...ipBlocks, { ...newIp }])
      setNewIp({ ip_address: '', description: '' })
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/domains')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? 'Editar Domínio' : 'Criar Domínio'}
          </h1>
          <p className="text-muted-foreground mt-2">
            Configurar regras de cloaking e filtros
          </p>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <Alert variant={alert.variant}>
          {alert.icon && <alert.icon className="h-4 w-4" />}
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações Básicas</CardTitle>
            <CardDescription>Configuração de domínio e redirecionamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domínio</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_url">URL de Destino</Label>
              <Input
                id="target_url"
                placeholder="https://target-site.com"
                value={formData.target_url}
                onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Para onde o tráfego legítimo será redirecionado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Template de Cloaking</Label>
              <select
                id="template"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.template_id}
                onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
              >
                <option value="">Template padrão</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Página HTML mostrada para visitantes bloqueados
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lockdown Mode */}
        <Card className={formData.lockdown_mode ? 'border-destructive' : ''}>
          <CardHeader>
            <div className="flex items-center gap-2">
              {formData.lockdown_mode && <AlertTriangle className="w-5 h-5 text-destructive" />}
              <CardTitle>Modo de Bloqueio Total</CardTitle>
            </div>
            <CardDescription>
              Modo de emergência - bloqueia TODO o tráfego e mostra template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <Label>Ativar Bloqueio Total</Label>
                  <InfoTooltip>
                    Quando ativado, TODOS os visitantes verão o template de bloqueio. Nenhum tráfego será redirecionado. Use para emergências ou manutenção.
                  </InfoTooltip>
                </div>
                <p className="text-xs text-muted-foreground">
                  Bloquear todo o tráfego independente dos filtros
                </p>
              </div>
              <Switch
                checked={formData.lockdown_mode}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, lockdown_mode: checked })
                }
              />
            </div>

            {formData.lockdown_mode && (
              <div className="space-y-2 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                <Label htmlFor="lockdown_template">Template de Bloqueio *</Label>
                <select
                  id="lockdown_template"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.lockdown_template_id}
                  onChange={(e) => setFormData({ ...formData, lockdown_template_id: e.target.value })}
                  required={formData.lockdown_mode}
                >
                  <option value="">Selecione um template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-destructive font-medium">
                  Todos os visitantes verão este template até o bloqueio ser desativado
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cloaking Options */}
        <Card>
          <CardHeader>
            <CardTitle>Opções de Cloaking</CardTitle>
            <CardDescription>Configurar regras de filtragem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <Label>Passar Parâmetros de URL</Label>
                  <InfoTooltip>
                    Encaminha todos os parâmetros de URL (como ?gclid=xxx&utm_source=google) para a URL de destino. Essencial para rastreamento e atribuição.
                  </InfoTooltip>
                </div>
                <p className="text-xs text-muted-foreground">
                  Incluir parâmetros de URL no redirecionamento
                </p>
              </div>
              <Switch
                checked={formData.pass_query_params}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, pass_query_params: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <Label>Exigir GCLID</Label>
                  <InfoTooltip>
                    Bloqueia qualquer visitante sem um parâmetro Google Click ID (gclid). Perfeito para garantir que o tráfego venha apenas de campanhas do Google Ads.
                  </InfoTooltip>
                </div>
                <p className="text-xs text-muted-foreground">
                  Bloquear tráfego sem Google Click ID
                </p>
              </div>
              <Switch
                checked={formData.require_gclid}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, require_gclid: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <Label>Apenas Dispositivos Móveis</Label>
                  <InfoTooltip>
                    Permite apenas dispositivos móveis (telefones). Bloqueia computadores desktop e tablets. Detecta o tipo de dispositivo pelo user agent.
                  </InfoTooltip>
                </div>
                <p className="text-xs text-muted-foreground">
                  Bloquear desktops e tablets
                </p>
              </div>
              <Switch
                checked={formData.mobile_only}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, mobile_only: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <Label>Bloquear IPs Pingáveis</Label>
                  <InfoTooltip>
                    Bloqueia IPs de datacenter, hospedagem, VPN e proxy. Filtra bots e scrapers da AWS, Google Cloud, DigitalOcean, etc.
                  </InfoTooltip>
                </div>
                <p className="text-xs text-muted-foreground">
                  Bloquear IPs de datacenter/hospedagem
                </p>
              </div>
              <Switch
                checked={formData.block_pingable_ips}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, block_pingable_ips: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <Label>Bloquear ASNs Comuns</Label>
                  <InfoTooltip>
                    Bloqueia automaticamente ASNs conhecidos de scrapers, bots e datacenters. Inclui Google (AS15169), Amazon (AS16509), Cloudflare, etc.
                  </InfoTooltip>
                </div>
                <p className="text-xs text-muted-foreground">
                  Bloquear redes de bots e scrapers automaticamente
                </p>
              </div>
              <Switch
                checked={formData.block_asn}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, block_asn: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Country Blocks */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Bloqueio por País</CardTitle>
              <InfoTooltip>
                Bloqueia visitantes por país. Selecione no dropdown. Padrão: Nenhum país bloqueado.
              </InfoTooltip>
            </div>
            <CardDescription>
              Bloquear tráfego de países específicos ({countryBlocks.length} selecionados)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Selecione Países para Bloquear</Label>
              <CheckboxDropdown
                options={COUNTRIES}
                selected={countryBlocks.map(c => c.country_code)}
                onChange={(selected) => {
                  setCountryBlocks(selected.map(code => ({ country_code: code })))
                }}
                placeholder="Nenhum país bloqueado (padrão)"
                searchPlaceholder="Buscar países..."
                emptyText="Nenhum país encontrado"
                selectAllText="Selecionar Todos"
                clearAllText="Limpar Todos"
              />
              <p className="text-xs text-muted-foreground">
                Padrão: Sem bloqueios. Selecione países para começar a bloquear.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Brazilian States */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Estados Brasileiros</CardTitle>
              <InfoTooltip>
                Bloqueia tráfego de estados brasileiros específicos. Padrão: Nenhum estado bloqueado.
              </InfoTooltip>
            </div>
            <CardDescription>
              Bloquear tráfego de estados brasileiros ({stateBlocks.filter(s => s.country_code === 'BR').length}/27 selecionados)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Selecione Estados Brasileiros para Bloquear</Label>
              <CheckboxDropdown
                options={BRAZILIAN_STATES}
                selected={stateBlocks.filter(s => s.country_code === 'BR').map(s => s.state_code)}
                onChange={(selected) => {
                  // Keep non-BR states and add selected BR states
                  const nonBRStates = stateBlocks.filter(s => s.country_code !== 'BR')
                  const brStates = selected.map(code => ({ country_code: 'BR', state_code: code }))
                  setStateBlocks([...nonBRStates, ...brStates])
                }}
                placeholder="Nenhum estado bloqueado (padrão)"
                searchPlaceholder="Buscar estados..."
                emptyText="Nenhum estado encontrado"
                selectAllText="Selecionar Todos"
                clearAllText="Limpar Todos"
              />
              <p className="text-xs text-muted-foreground">
                Padrão: Sem bloqueios. Selecione estados para começar a bloquear tráfego brasileiro.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* IP Blocks */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Bloqueios de IP</CardTitle>
              <InfoTooltip>
                Bloqueia manualmente endereços IP específicos. Útil para bloquear concorrentes conhecidos, scrapers ou visitantes problemáticos.
              </InfoTooltip>
            </div>
            <CardDescription>Bloquear endereços IP específicos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="192.168.1.1"
                value={newIp.ip_address}
                onChange={(e) => setNewIp({ ...newIp, ip_address: e.target.value })}
              />
              <Input
                placeholder="Descrição (opcional)"
                value={newIp.description}
                onChange={(e) => setNewIp({ ...newIp, description: e.target.value })}
              />
              <Button type="button" onClick={addIpBlock}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ipBlocks.map((ip, index) => (
                <Badge key={index} variant="secondary" className="gap-2">
                  {ip.ip_address}
                  {ip.description && ` - ${ip.description}`}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setIpBlocks(ipBlocks.filter((_, i) => i !== index))}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : isEdit ? 'Atualizar Domínio' : 'Criar Domínio'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/domains')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
