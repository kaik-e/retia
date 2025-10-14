import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Globe, FileText, Activity, Server, Shield, LogOut, User, Users, Cloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Domínios', href: '/domains', icon: Globe },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Logs', href: '/logs', icon: Activity },
  { name: 'Proxy', href: '/proxy', icon: Server },
  { name: 'Cloudflare', href: '/cloudflare', icon: Cloud },
  { name: 'Usuários', href: '/users', icon: Users, masterOnly: true },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-6 border-b border-border">
            <img src="/logo.png" alt="Retia" className="w-10 h-10" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              // Hide master-only items for non-master users
              if (item.masterOnly && user.role !== 'master') {
                return null
              }
              
              const isActive = location.pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{user.username || 'retia'}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Retia v1.0
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
