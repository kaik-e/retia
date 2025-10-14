import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Cloud, Package } from 'lucide-react'
import { CloudflareTab } from '@/components/automations/CloudflareTab'
import { GoDaddyTab } from '@/components/automations/GoDaddyTab'

export default function Automations() {
  const [activeTab, setActiveTab] = useState('cloudflare')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Automações</h1>
        <p className="text-muted-foreground mt-2">
          Configure integrações com provedores de domínio e DNS
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cloudflare" className="flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            Cloudflare
          </TabsTrigger>
          <TabsTrigger value="godaddy" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            GoDaddy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cloudflare" className="mt-6">
          <CloudflareTab />
        </TabsContent>

        <TabsContent value="godaddy" className="mt-6">
          <GoDaddyTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
