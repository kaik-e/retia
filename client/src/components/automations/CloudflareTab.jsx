import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Cloud, CheckCircle, XCircle, ExternalLink, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export function CloudflareTab() {
  const [settings, setSettings] = useState({ hasToken: false, accountId: null })
  const [apiToken, setApiToken] = useState('')
  const [accountId, setAccountId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await api.automations.cloudflare.getSettings()
      setSettings(response.data)
      setAccountId(response.data.accountId || '')
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
      await api.automations.cloudflare.saveSettings({ apiToken, accountId: accountId || null })
      setAlert({
        variant: 'default',
        title: 'Sucesso!',
        description: 'Configurações do Cloudflare salvas com sucesso',
        icon: CheckCircle
      })
      setApiToken('')
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
      await api.automations.cloudflare.deleteSettings()
      setAlert({
        variant: 'default',
        title: 'Removido',
        description: 'Configurações do Cloudflare removidas',
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

      {/* Status Card */}
      {!loading && (
        <Card className={settings.hasToken ? 'border-green-500' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                <CardTitle>Status da Integração</CardTitle>
              </div>
              {settings.hasToken ? (
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
          {settings.hasToken && (
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-900">API Token configurado</p>
                  <p className="text-xs text-green-700 mt-1">
                    Você pode importar domínios do Cloudflare automaticamente
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
          <CardTitle>Configurar API Token</CardTitle>
          <CardDescription>
            Adicione seu Cloudflare API Token para habilitar auto-configuração
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiToken">API Token *</Label>
              <Input
                id="apiToken"
                type="password"
                placeholder="Seu Cloudflare API Token"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Token com permissões: Zone.DNS, Zone.Zone Settings
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountId">Account ID (Opcional)</Label>
              <Input
                id="accountId"
                placeholder="ID da sua conta Cloudflare"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={saving || !apiToken} className="w-full">
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Como obter seu API Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-800">
          <ol className="list-decimal list-inside space-y-2">
            <li>Acesse o Cloudflare Dashboard</li>
            <li>Vá em "My Profile" → "API Tokens"</li>
            <li>Clique em "Create Token"</li>
            <li>Use o template "Edit zone DNS" ou crie um custom com permissões:
              <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                <li>Zone - DNS - Edit</li>
                <li>Zone - Zone Settings - Edit</li>
                <li>Zone - Zone - Read</li>
              </ul>
            </li>
            <li>Copie o token e cole acima</li>
          </ol>
          <div className="pt-2">
            <a
              href="https://dash.cloudflare.com/profile/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              Ir para Cloudflare API Tokens
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Remover Integração"
        description="Tem certeza que deseja remover a integração com Cloudflare? Você precisará configurar novamente para usar a auto-importação."
        onConfirm={handleDelete}
        confirmText="Remover"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  )
}
