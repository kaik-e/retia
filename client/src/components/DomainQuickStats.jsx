import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export function DomainQuickStats({ domainId }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [domainId])

  const loadStats = async () => {
    try {
      const response = await api.analytics.getSummary(domainId, 1) // Last 24 hours
      setStats(response.data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="flex gap-4 text-xs">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  const blockRate = stats.total > 0 ? ((stats.blocked / stats.total) * 100).toFixed(1) : 0

  return (
    <div className="flex gap-4 text-xs">
      <div className="flex flex-col">
        <span className="font-bold text-lg">{stats.total}</span>
        <span className="text-muted-foreground">Hoje</span>
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-lg text-green-600">{stats.redirected}</span>
        <span className="text-muted-foreground">Válidos</span>
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-lg text-red-600">{stats.blocked}</span>
        <span className="text-muted-foreground">Bloq.</span>
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-lg">{blockRate}%</span>
        <span className="text-muted-foreground">Rate</span>
      </div>
    </div>
  )
}
