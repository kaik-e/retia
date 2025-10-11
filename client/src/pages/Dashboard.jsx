import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Globe, FileText, Activity, Plus, TrendingUp, Shield } from 'lucide-react'
import { api } from '@/lib/api'

export default function Dashboard() {
  const [stats, setStats] = useState({
    domains: 0,
    templates: 0,
    totalRequests: 0,
    blockedRequests: 0,
  })
  const [recentDomains, setRecentDomains] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [domainsRes, templatesRes] = await Promise.all([
        api.domains.getAll(),
        api.templates.getAll(),
      ])

      setStats({
        domains: domainsRes.data.length,
        templates: templatesRes.data.length,
        totalRequests: 0, // Would need to aggregate from analytics
        blockedRequests: 0,
      })

      setRecentDomains(domainsRes.data.slice(0, 5))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your cloaking system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Domains</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.domains}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active cloaking domains
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.templates}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cloaked page templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blockedRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Filtered requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Domains */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Domains</CardTitle>
              <CardDescription>Your latest configured domains</CardDescription>
            </div>
            <Link to="/domains/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Domain
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : recentDomains.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No domains configured yet
            </div>
          ) : (
            <div className="space-y-4">
              {recentDomains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{domain.domain}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Target: {domain.target_url}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {domain.require_gclid && (
                      <Badge variant="secondary">GCLID</Badge>
                    )}
                    {domain.mobile_only && (
                      <Badge variant="secondary">Mobile</Badge>
                    )}
                    <Link to={`/domains/${domain.id}`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Link to={`/analytics/${domain.id}`}>
                      <Button variant="ghost" size="sm">
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:border-primary transition-colors cursor-pointer">
          <Link to="/domains/new">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Create New Domain
              </CardTitle>
              <CardDescription>
                Set up a new cloaking domain with custom rules
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:border-primary transition-colors cursor-pointer">
          <Link to="/templates">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Upload Template
              </CardTitle>
              <CardDescription>
                Add a new HTML template for cloaked pages
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  )
}
