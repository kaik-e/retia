import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Package, CheckCircle, XCircle, ExternalLink, Trash2, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export function GoDaddyTab() {
  const [settings, setSettings] = useState({ hasCredentials: false })
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await api.automations.godaddy.getSettings()
      setSettings(response.data)
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setAlert(null)

    try {
      await api.automations.godaddy.saveSettings({ apiKey, apiSecret })
      setAlert({
        variant: 'default',
        title: 'Sucesso!',
        description: 'Configurações do GoDaddy salvas com sucesso',
        icon: CheckCircle
      })
      setApiKey('')
      setApiSecret('')
      await loadSettings()
    } catch (error) {
      setAlert({
        variant: 'destructive',
        title: 'Erro',
        description: error.response?.data?.error || 'Falha ao salvar configurações',
        icon: XCircle
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.automations.godaddy.deleteSettings()
      setAlert({
        variant: 'default',
        title: 'Removido',
        description: 'Configurações do GoDaddy removidas',
        icon: CheckCircle
      })
      setDeleteDialog(false)
      await loadSettings()
    } catch (error) {
      setAlert({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao remover configurações',
        icon: XCircle
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Alert */}
      {alert && (
        <Alert variant={alert.variant}>
          {alert.icon && <alert.icon className="h-4 w-4" />}
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
        </Alert>
      )}

      {/* Warning about Cloudflare requirement */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-900">Requer Cloudflare</AlertTitle>
        <AlertDescription className="text-orange-800">
          Para usar a integração GoDaddy, você também precisa configurar o Cloudflare na aba anterior.
          O fluxo completo é: GoDaddy → Cloudflare → Cloaker
        </AlertDescription>
      </Alert>

      {/* Status Card */}
      {!loading && (
        <Card className={settings.hasCredentials ? 'border-green-500' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                <CardTitle>Status da Integração</CardTitle>
              </div>
              {settings.hasCredentials ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Conectado</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Não configurado</span>
                </div>
              )}
            </div>
          </CardHeader>
          {settings.hasCredentials && (
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-900">API Key configurada</p>
                  <p className="text-xs text-green-700 mt-1">
                    Você pode importar domínios do GoDaddy automaticamente
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Configurar API Key</CardTitle>
          <CardDescription>
            Adicione suas credenciais GoDaddy para habilitar auto-configuração
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key *</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Sua GoDaddy API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret *</Label>
              <Input
                id="apiSecret"
                type="password"
                placeholder="Seu GoDaddy API Secret"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                required
              />
              <Alert className="mt-2 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-xs">
                  <strong>IMPORTANTE:</strong> Use credenciais de <strong>PRODUCTION</strong>, não OTE (teste).
                  A API Key precisa ter permissão de leitura em Domains.
                </AlertDescription>
              </Alert>
            </div>

            <Button type="submit" disabled={saving || !apiKey || !apiSecret} className="w-full">
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Como obter suas credenciais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-800">
          <ol className="list-decimal list-inside space-y-2">
            <li>Acesse o GoDaddy Developer Portal</li>
            <li>Faça login com sua conta GoDaddy</li>
            <li>Vá em "API Keys"</li>
            <li>Clique em "Create New API Key"</li>
            <li>Selecione "Production" (não OTE)</li>
            <li>Copie a Key e Secret e cole acima</li>
          </ol>
          <div className="pt-2">
            <a
              href="https://developer.godaddy.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              Ir para GoDaddy Developer Portal
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-purple-900">Como funciona a importação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-purple-800">
          <p className="font-medium">Quando você importa um domínio do GoDaddy:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Sistema busca o domínio no GoDaddy</li>
            <li>Muda os nameservers para Cloudflare automaticamente</li>
            <li>Configura DNS A record no Cloudflare apontando para o VPS</li>
            <li>Ativa proxy (orange cloud) e SSL Flexible</li>
            <li>Adiciona o domínio ao cloaker</li>
          </ol>
          <p className="text-xs mt-3 text-purple-700">
            ⚠️ A mudança de nameservers pode levar até 48h para propagar globalmente
          </p>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Remover Integração"
        description="Tem certeza que deseja remover a integração com GoDaddy? Você precisará configurar novamente para usar a auto-importação."
        onConfirm={handleDelete}
        confirmText="Remover"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  )
}
