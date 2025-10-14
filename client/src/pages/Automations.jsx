import { Cloud } from 'lucide-react'
import { CloudflareTab } from '@/components/automations/CloudflareTab'

export default function Automations() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Cloud className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automações Cloudflare</h1>
          <p className="text-muted-foreground mt-2">
            Configure múltiplas contas Cloudflare para auto-importação de domínios
          </p>
        </div>
      </div>

      <CloudflareTab />
    </div>
  )
}
