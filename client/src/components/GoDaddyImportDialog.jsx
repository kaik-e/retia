import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Package, CheckCircle, XCircle, Loader2, AlertTriangle, Cloud } from 'lucide-react'
import { api } from '@/lib/api'

export function GoDaddyImportDialog({ open, onOpenChange, onSuccess }) {
  const [step, setStep] = useState('check') // check, select, configure, importing
  const [hasCredentials, setHasCredentials] = useState(false)
  const [hasCloudflare, setHasCloudflare] = useState(false)
  const [domains, setDomains] = useState([])
  const [selectedDomain, setSelectedDomain] = useState(null)
  const [targetUrl, setTargetUrl] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      checkSettings()
    }
  }, [open])

  const checkSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const [godaddyRes, cloudflareRes, templatesRes] = await Promise.all([
        api.automations.godaddy.getSettings(),
        api.automations.cloudflare.getSettings(),
        api.templates.getAll()
      ])
      
      setHasCredentials(godaddyRes.data.hasCredentials)
      setHasCloudflare(cloudflareRes.data.hasToken)
      setTemplates(templatesRes.data)
      
      if (godaddyRes.data.hasCredentials && cloudflareRes.data.hasToken) {
        // Load domains
        const domainsRes = await api.automations.godaddy.listDomains()
        setDomains(domainsRes.data)
        setStep('select')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleDomainSelect = (domain) => {
    setSelectedDomain(domain)
    setStep('configure')
  }

  const handleImport = async () => {
    if (!selectedDomain || !targetUrl) {
      setError('Please fill all required fields')
      return
    }

    setLoading(true)
    setError(null)
    setStep('importing')

    try {
      await api.automations.godaddy.import({
        domain: selectedDomain.domain,
        targetUrl,
        templateId: templateId || null
      })

      onSuccess?.()
      onOpenChange(false)
      
      // Reset state
      setTimeout(() => {
        setStep('check')
        setSelectedDomain(null)
        setTargetUrl('')
        setTemplateId('')
      }, 500)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to import domain')
      setStep('configure')
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    if (loading && step === 'check') {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Verificando configurações...</p>
        </div>
      )
    }

    if ((!hasCredentials || !hasCloudflare) && step === 'check') {
      return (
        <div className="space-y-4">
          {!hasCredentials && (
            <Alert variant="destructive">
              <Package className="h-4 w-4" />
              <AlertDescription>
                Você precisa configurar suas credenciais GoDaddy primeiro
              </AlertDescription>
            </Alert>
          )}
          {!hasCloudflare && (
            <Alert variant="destructive">
              <Cloud className="h-4 w-4" />
              <AlertDescription>
                Você precisa configurar seu Cloudflare API Token primeiro
              </AlertDescription>
            </Alert>
          )}
          <Button
            className="w-full"
            onClick={() => {
              onOpenChange(false)
              window.location.href = '/automations'
            }}
          >
            Ir para Configurações
          </Button>
        </div>
      )
    }

    if (step === 'select') {
      return (
        <div className="space-y-4">
          <div>
            <Label>Selecione um domínio do GoDaddy</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {domains.length} domínio{domains.length !== 1 ? 's' : ''} encontrado{domains.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {domains.map((domain) => (
              <button
                key={domain.domainId}
                onClick={() => handleDomainSelect(domain)}
                className="w-full p-4 border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{domain.domain}</div>
                    <div className="text-sm text-muted-foreground">
                      Expira: {new Date(domain.expires).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={domain.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {domain.status}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (step === 'configure') {
      return (
        <div className="space-y-4">
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-600" />
              <span className="font-medium text-orange-900">{selectedDomain.domain}</span>
            </div>
          </div>

          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-xs">
              Os nameservers serão alterados automaticamente para Cloudflare. 
              A propagação pode levar até 48h.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="targetUrl">URL de Destino *</Label>
            <Input
              id="targetUrl"
              placeholder="https://example.com"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Para onde o tráfego legítimo será redirecionado
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Template de Cloaking (Opcional)</Label>
            <select
              id="template"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              <option value="">Nenhum template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setStep('select')
                setSelectedDomain(null)
                setError(null)
              }}
              className="flex-1"
            >
              Voltar
            </Button>
            <Button
              onClick={handleImport}
              disabled={loading || !targetUrl}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </div>
        </div>
      )
    }

    if (step === 'importing') {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground mb-2">Configurando domínio...</p>
          <p className="text-xs text-muted-foreground text-center max-w-sm">
            Mudando nameservers, criando DNS no Cloudflare, configurando SSL e adicionando ao cloaker
          </p>
        </div>
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Importar do GoDaddy
          </DialogTitle>
          <DialogDescription>
            Auto-configure um domínio do GoDaddy mudando nameservers para Cloudflare
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
