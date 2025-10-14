import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Cloud, CheckCircle, XCircle, ExternalLink, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export function CloudflareTab() {
  const [credentials, setCredentials] = useState([])
  const [name, setName] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [accountId, setAccountId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: null })

  useEffect(() => {
    loadCredentials()
  }, [])

  const loadCredentials = async () => {
    try {
      const response = await api.automations.credentials.list('cloudflare')
      setCredentials(response.data)
    } catch (error) {
      console.error('Failed to load credentials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setAlert({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nome da credencial é obrigatório',
        icon: XCircle
      })
      return
    }
    
    setSaving(true)
    setAlert(null)

    try {
      await api.automations.credentials.add({
        name: name.trim(),
        provider: 'cloudflare',
        credentials: {
          apiToken,
          accountId: accountId || null
        },
        isDefault: credentials.length === 0 // First one is default
      })
      
      setAlert({
        variant: 'default',
        title: 'Sucesso!',
        description: 'Credencial adicionada com sucesso',
        icon: CheckCircle
      })
      setName('')
      setApiToken('')
      setAccountId('')
      await loadCredentials()
    } catch (error) {
      setAlert({
        variant: 'destructive',
        title: 'Erro',
        description: error.response?.data?.error || 'Falha ao adicionar credencial',
        icon: XCircle
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.automations.credentials.delete(deleteDialog.id)
      setAlert({
        variant: 'default',
        title: 'Removido',
        description: 'Credencial removida com sucesso',
        icon: CheckCircle
      })
      setDeleteDialog({ open: false, id: null, name: null })
      await loadCredentials()
    } catch (error) {
      setAlert({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao remover credencial',
        icon: XCircle
      })
    }
  }
  
  const handleSetDefault = async (id) => {
    try {
      await api.automations.credentials.update(id, { isDefault: true })
      await loadCredentials()
      setAlert({
        variant: 'default',
        title: 'Sucesso!',
        description: 'Credencial padrão atualizada',
        icon: CheckCircle
      })
    } catch (error) {
      setAlert({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao atualizar credencial padrão',
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

      {/* Credentials List */}
      {!loading && credentials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Credenciais Configuradas</CardTitle>
            <CardDescription>
              {credentials.length} credencial{credentials.length !== 1 ? 'is' : ''} Cloudflare
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Cloud className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{cred.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Adicionado em {new Date(cred.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {cred.is_default && (
                      <Badge variant="default">Padrão</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!cred.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(cred.id)}
                      >
                        Tornar Padrão
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialog({ open: true, id: cred.id, name: cred.name })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Nova Credencial</CardTitle>
          <CardDescription>
            Adicione uma nova conta Cloudflare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Credencial *</Label>
              <Input
                id="name"
                placeholder="Ex: Conta Principal, Conta Cliente X"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Um nome para identificar esta credencial
              </p>
            </div>
            
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

            <Button type="submit" disabled={saving || !apiToken || !name} className="w-full">
              {saving ? 'Adicionando...' : 'Adicionar Credencial'}
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
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, id: null, name: null })}
        title="Remover Credencial"
        description={`Tem certeza que deseja remover a credencial "${deleteDialog.name}"?`}
        onConfirm={handleDelete}
        confirmText="Remover"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  )
}
