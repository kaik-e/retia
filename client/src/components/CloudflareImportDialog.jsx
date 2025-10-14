import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Cloud, CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

export function CloudflareImportDialog({ open, onOpenChange, onSuccess }) {
  const [step, setStep] = useState('check') // check, select, configure, importing
  const [hasToken, setHasToken] = useState(false)
  const [zones, setZones] = useState([])
  const [selectedZone, setSelectedZone] = useState(null)
  const [targetUrl, setTargetUrl] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      checkCloudflareSettings()
    }
  }, [open])

  const checkCloudflareSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.automations.cloudflare.getSettings()
      setHasToken(response.data.hasToken)
      
      if (response.data.hasToken) {
        // Load zones and templates
        const [zonesRes, templatesRes] = await Promise.all([
          api.automations.cloudflare.listZones(),
          api.templates.getAll()
        ])
        setZones(zonesRes.data)
        setTemplates(templatesRes.data)
        setStep('select')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load Cloudflare settings')
    } finally {
      setLoading(false)
    }
  }

  const handleZoneSelect = (zone) => {
    setSelectedZone(zone)
    setStep('configure')
  }

  const handleImport = async () => {
    if (!selectedZone || !targetUrl) {
      setError('Please fill all required fields')
      return
    }

    setLoading(true)
    setError(null)
    setStep('importing')

    try {
      const response = await api.automations.cloudflare.import({
        zoneId: selectedZone.id,
        domain: selectedZone.name,
        targetUrl,
        templateId: templateId || null
      })

      // Check if WAF creation failed
      const wafWarning = response.data?.cloudflare?.waf?.requiresUpgrade
      
      onSuccess?.(wafWarning)
      onOpenChange(false)
      
      // Reset state
      setTimeout(() => {
        setStep('check')
        setSelectedZone(null)
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

    if (!hasToken && step === 'check') {
      return (
        <div className="space-y-4">
          <Alert>
            <Cloud className="h-4 w-4" />
            <AlertDescription>
              Você precisa configurar seu Cloudflare API Token primeiro
            </AlertDescription>
          </Alert>
          <Button
            className="w-full"
            onClick={() => {
              onOpenChange(false)
              window.location.href = '/automations'
            }}
          >
            <Cloud className="w-4 h-4 mr-2" />
            Ir para Configurações Cloudflare
          </Button>
        </div>
      )
    }

    if (step === 'select') {
      return (
        <div className="space-y-4">
          <div>
            <Label>Selecione um domínio do Cloudflare</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {zones.length} domínio{zones.length !== 1 ? 's' : ''} encontrado{zones.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {zones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => handleZoneSelect(zone)}
                className="w-full p-4 border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{zone.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Status: {zone.status}
                    </div>
                  </div>
                  <Badge variant={zone.status === 'active' ? 'default' : 'secondary'}>
                    {zone.status}
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
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">{selectedZone.name}</span>
            </div>
          </div>

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
                setSelectedZone(null)
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
                  <Cloud className="w-4 h-4 mr-2" />
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
          <p className="text-xs text-muted-foreground text-center">
            Criando DNS record, configurando SSL e adicionando ao cloaker
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
            <Cloud className="w-5 h-5" />
            Importar do Cloudflare
          </DialogTitle>
          <DialogDescription>
            Auto-configure um domínio do Cloudflare com DNS, SSL e proxy
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
