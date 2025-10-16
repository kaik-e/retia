import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Globe, FileText, Activity, Server, Shield, LogOut, User, Users, Zap, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { useTheme } from '@/components/theme-provider'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Domínios', href: '/domains', icon: Globe },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Logs', href: '/logs', icon: Activity },
  { name: 'Proxy', href: '/proxy', icon: Server },
  { name: 'Automações', href: '/automations', icon: Zap },
  { name: 'Usuários', href: '/users', icon: Users, masterOnly: true },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const { theme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-40 flex items-center justify-between px-4">
        <img 
          src={theme === 'dark' ? '/logo-white.svg' : '/logo.png'} 
          alt="Retia" 
          className="w-8 h-8" 
        />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 mt-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0 mt-16 lg:mt-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo - Hidden on mobile (shown in header) */}
          <div className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-border">
            <img 
              src={theme === 'dark' ? '/logo-white.svg' : '/logo.png'} 
              alt="Retia" 
              className="w-10 h-10" 
            />
            <ThemeToggle />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
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
                  onClick={() => setSidebarOpen(false)}
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
      <div className="lg:pl-64 pt-16 lg:pt-0">
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
