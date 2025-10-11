import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, TrendingUp, Shield, Globe, Activity, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'

export default function Analytics() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [domain, setDomain] = useState(null)
  const [summary, setSummary] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  useEffect(() => {
    loadAnalytics()
  }, [id, days])

  const loadAnalytics = async () => {
    try {
      const [domainRes, summaryRes, logsRes] = await Promise.all([
        api.domains.getOne(id),
        api.analytics.getSummary(id, days),
        api.analytics.getLogs(id, { limit: 50 }),
      ])

      setDomain(domainRes.data)
      setSummary(summaryRes.data)
      setLogs(logsRes.data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all analytics data?')) return

    try {
      await api.analytics.clear(id)
      await loadAnalytics()
    } catch (error) {
      console.error('Failed to clear logs:', error)
      alert('Failed to clear logs')
    }
  }

  const getActionBadge = (action) => {
    if (action === 'redirected') {
      return <Badge variant="default">Redirected</Badge>
    } else if (action.startsWith('blocked')) {
      const reason = action.split(':')[1]
      return (
        <Badge variant="destructive">
          Blocked{reason ? `: ${reason.replace(/_/g, ' ')}` : ''}
        </Badge>
      )
    }
    return <Badge variant="secondary">{action}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/domains')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground mt-2">
              {domain?.domain}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button variant="destructive" onClick={handleClearLogs}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Last {days} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Redirected</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.redirected}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.total > 0 ? Math.round((summary.redirected / summary.total) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked</CardTitle>
              <Shield className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.blocked}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.total > 0 ? Math.round((summary.blocked / summary.total) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Block Rate</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.total > 0 ? Math.round((summary.blocked / summary.total) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Filter effectiveness
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Countries */}
      {summary?.byCountry && summary.byCountry.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Countries</CardTitle>
            <CardDescription>Traffic by country</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.byCountry.map((country, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{country.country || 'Unknown'}</span>
                  <Badge variant="outline">{country.count} requests</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Breakdown */}
      {summary?.byAction && summary.byAction.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Actions Breakdown</CardTitle>
            <CardDescription>Request outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.byAction.map((action, index) => (
                <div key={index} className="flex items-center justify-between">
                  {getActionBadge(action.action)}
                  <span className="font-medium">{action.count} requests</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 50 requests</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No activity recorded yet
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-3 border rounded-lg text-sm"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{log.ip_address}</span>
                      {log.country && (
                        <Badge variant="outline" className="text-xs">
                          {log.country}
                          {log.state && `/${log.state}`}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-2xl">
                      {log.user_agent}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="ml-4">
                    {getActionBadge(log.action)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
