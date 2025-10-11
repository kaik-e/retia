import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users as UsersIcon, Plus, Edit, Trash2, CheckCircle, XCircle, Shield, User, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: 'user',
    is_active: true
  })

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const isMaster = currentUser.role === 'master'

  useEffect(() => {
    if (isMaster) {
      loadUsers()
    }
  }, [isMaster])

  const loadUsers = async () => {
    try {
      const response = await api.users.getAll()
      setUsers(response.data)
    } catch (error) {
      console.error('Failed to load users:', error)
      setAlert({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar usuários',
        icon: XCircle
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAlert(null)

    try {
      if (editingUser) {
        await api.users.update(editingUser.id, formData)
        setAlert({
          variant: 'success',
          title: 'Sucesso!',
          description: 'Usuário atualizado com sucesso',
          icon: CheckCircle
        })
      } else {
        await api.users.create(formData)
        setAlert({
          variant: 'success',
          title: 'Sucesso!',
          description: 'Usuário criado com sucesso',
          icon: CheckCircle
        })
      }

      setDialogOpen(false)
      setEditingUser(null)
      setFormData({ username: '', password: '', email: '', role: 'user', is_active: true })
      loadUsers()
      setTimeout(() => setAlert(null), 3000)
    } catch (error) {
      setAlert({
        variant: 'destructive',
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao salvar usuário',
        icon: XCircle
      })
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      password: '',
      email: user.email || '',
      role: user.role,
      is_active: user.is_active === 1
    })
    setDialogOpen(true)
  }

  const handleDelete = async (userId) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return

    try {
      await api.users.delete(userId)
      setAlert({
        variant: 'success',
        title: 'Sucesso!',
        description: 'Usuário excluído com sucesso',
        icon: CheckCircle
      })
      loadUsers()
      setTimeout(() => setAlert(null), 3000)
    } catch (error) {
      setAlert({
        variant: 'destructive',
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao excluir usuário',
        icon: XCircle
      })
    }
  }

  const toggleActive = async (user) => {
    try {
      await api.users.update(user.id, { is_active: user.is_active === 1 ? 0 : 1 })
      loadUsers()
    } catch (error) {
      setAlert({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao alterar status do usuário',
        icon: XCircle
      })
    }
  }

  if (!isMaster) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Apenas o usuário master pode acessar o gerenciamento de usuários.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground mt-2">
            Crie e gerencie usuários do sistema
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingUser(null)
              setFormData({ username: '', password: '', email: '', role: 'user', is_active: true })
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'Atualize as informações do usuário' : 'Crie um novo usuário do sistema'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha {!editingUser && '*'}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  placeholder={editingUser ? 'Deixe em branco para manter' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active">Usuário ativo</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingUser ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert */}
      {alert && (
        <Alert variant={alert.variant}>
          {alert.icon && <alert.icon className="h-4 w-4" />}
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
        </Alert>
      )}

      {/* Users List */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              Carregando usuários...
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {user.role === 'master' ? (
                        <Shield className="w-5 h-5 text-primary" />
                      ) : (
                        <User className="w-5 h-5 text-muted-foreground" />
                      )}
                      <CardTitle>{user.username}</CardTitle>
                      {user.role === 'master' && (
                        <Badge variant="default" className="bg-primary">Master</Badge>
                      )}
                      {user.role === 'admin' && (
                        <Badge variant="secondary">Admin</Badge>
                      )}
                      {user.is_active === 0 && (
                        <Badge variant="destructive">Inativo</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {user.email || 'Sem email'} • Criado em {new Date(user.created_at).toLocaleDateString()}
                      {user.last_login && ` • Último login: ${new Date(user.last_login).toLocaleString()}`}
                    </CardDescription>
                  </div>
                  {user.role !== 'master' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(user)}
                      >
                        {user.is_active === 1 ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
