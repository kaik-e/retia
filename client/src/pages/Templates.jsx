import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Glimpse, GlimpseTrigger, GlimpsePreview, GlimpseProvider } from '@/components/ui/glimpse'
import { FileText, Upload, Trash2, Eye, File, CheckCircle, XCircle, Code } from 'lucide-react'
import { api } from '@/lib/api'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [templateName, setTemplateName] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [pasteTemplateName, setPasteTemplateName] = useState('')
  const [alert, setAlert] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: null })
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await api.templates.getAll()
      setTemplates(response.data)
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      if (!templateName) {
        setTemplateName(file.name.replace('.html', ''))
      }
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!selectedFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('template', selectedFile)
      formData.append('name', templateName)

      await api.templates.upload(formData)
      
      // Reset form
      setSelectedFile(null)
      setTemplateName('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Reload templates
      await loadTemplates()
      setAlert({
        variant: 'success',
        title: 'Sucesso!',
        description: 'Template enviado com sucesso',
        icon: CheckCircle
      })
      setTimeout(() => setAlert(null), 3000)
    } catch (error) {
      console.error('Failed to upload template:', error)
      setAlert({
        variant: 'destructive',
        title: 'Erro',
        description: error.response?.data?.error || error.message || 'Falha ao enviar template',
        icon: XCircle
      })
    } finally {
      setUploading(false)
    }
  }

  const handlePasteCreate = async (e) => {
    e.preventDefault()
    console.log('[Templates] handlePasteCreate called')
    
    if (!htmlContent.trim() || !pasteTemplateName.trim()) {
      console.log('[Templates] Missing content or name')
      return
    }

    setUploading(true)
    try {
      console.log('[Templates] Creating blob and file...', {
        contentLength: htmlContent.length,
        name: pasteTemplateName
      })
      
      // Create a Blob from HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' })
      console.log('[Templates] Blob created:', blob.size, 'bytes')
      
      // Create FormData directly with blob (avoid File constructor issues)
      const formData = new FormData()
      formData.append('template', blob, `${pasteTemplateName}.html`)
      formData.append('name', pasteTemplateName)
      console.log('[Templates] FormData created with blob, calling API...')

      const response = await api.templates.upload(formData)
      console.log('[Templates] API response:', response)
      
      // Reset form
      setHtmlContent('')
      setPasteTemplateName('')

      // Reload templates
      await loadTemplates()
      setAlert({
        variant: 'success',
        title: 'Sucesso!',
        description: 'Template criado com sucesso',
        icon: CheckCircle
      })
      setTimeout(() => setAlert(null), 3000)
    } catch (error) {
      console.error('[Templates] Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack,
        fullError: error
      })
      setAlert({
        variant: 'destructive',
        title: 'Erro',
        description: error.response?.data?.error || error.message || 'Falha ao criar template',
        icon: XCircle
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.templates.delete(deleteDialog.id)
      setTemplates(templates.filter(t => t.id !== deleteDialog.id))
      setAlert({
        variant: 'success',
        title: 'Sucesso!',
        description: 'Template excluído com sucesso',
        icon: CheckCircle
      })
      setTimeout(() => setAlert(null), 3000)
    } catch (error) {
      console.error('Failed to delete template:', error)
      setAlert({
        variant: 'destructive',
        title: 'Erro',
        description: error.response?.data?.error || error.message || 'Falha ao excluir template',
        icon: XCircle
      })
    } finally {
      setDeleteDialog({ open: false, id: null, name: null })
    }
  }

  const handlePreview = async (id) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/templates/${id}/content`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to load template')
      }
      
      const html = await response.text()
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (error) {
      console.error('Failed to preview template:', error)
      setAlert({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao visualizar template',
        icon: XCircle
      })
    }
  }

  return (
    <GlimpseProvider delayDuration={300}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie templates HTML para páginas de cloaking
          </p>
        </div>

      {/* Alert */}
      {alert && (
        <Alert variant={alert.variant}>
          {alert.icon && <alert.icon className="h-4 w-4" />}
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
        </Alert>
      )}

      {/* Create Template Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Criar Template</CardTitle>
            <InfoTooltip>
              Crie um template fazendo upload de arquivo HTML ou colando o código diretamente. Inclua todo CSS/JS inline ou use links CDN.
            </InfoTooltip>
          </div>
          <CardDescription>
            Escolha entre fazer upload de arquivo ou colar HTML
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="text-xs sm:text-sm">
                <Upload className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Upload Arquivo</span>
                <span className="sm:hidden">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="paste" className="text-xs sm:text-sm">
                <Code className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Colar HTML</span>
                <span className="sm:hidden">Colar</span>
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload">
              <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Template</Label>
              <Input
                id="name"
                placeholder="Minha Landing Page"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Arquivo HTML</Label>
              
              {/* File Upload Area */}
              <div 
                className="relative border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  id="file"
                  ref={fileInputRef}
                  type="file"
                  accept=".html"
                  onChange={handleFileSelect}
                  className="hidden"
                  required
                />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <File className="w-12 h-12 mx-auto text-primary" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-medium">Clique para fazer upload ou arraste e solte</p>
                      <p className="text-sm text-muted-foreground">
                        Apenas arquivos HTML (máx 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

                <Button type="submit" disabled={uploading || !selectedFile} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Enviando...' : 'Fazer Upload'}
                </Button>
              </form>
            </TabsContent>

            {/* Paste HTML Tab */}
            <TabsContent value="paste">
              <form onSubmit={handlePasteCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paste-name">Nome do Template</Label>
                  <Input
                    id="paste-name"
                    placeholder="Minha Landing Page"
                    value={pasteTemplateName}
                    onChange={(e) => setPasteTemplateName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="html-content">Código HTML</Label>
                  <Textarea
                    id="html-content"
                    placeholder="Cole seu código HTML aqui..."
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    className="font-mono text-sm min-h-[400px]"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Cole o código HTML completo, incluindo tags &lt;html&gt;, &lt;head&gt; e &lt;body&gt;
                  </p>
                </div>

                <Button type="submit" disabled={uploading || !htmlContent.trim()} className="w-full">
                  <Code className="w-4 h-4 mr-2" />
                  {uploading ? 'Criando...' : 'Criar Template'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle>Seus Templates</CardTitle>
          <CardDescription>
            {templates.length} template{templates.length !== 1 ? 's' : ''} disponível{templates.length !== 1 ? 'is' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">No templates yet</h3>
                <p className="text-muted-foreground mt-1">
                  Upload your first HTML template to get started
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-accent transition-colors gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{template.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {template.filename}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Created: {new Date(template.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Glimpse>
                      <GlimpseTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </GlimpseTrigger>
                      <GlimpsePreview
                        src={`/api/templates/${template.id}/content`}
                        alt={template.name}
                        width={600}
                        height={400}
                      />
                    </Glimpse>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(template.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Abrir</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialog({ open: true, id: template.id, name: template.name })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Template Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Templates should be complete, self-contained HTML files</li>
            <li>Include all CSS and JavaScript inline or use CDN links</li>
            <li>Make sure images are hosted externally or use data URIs</li>
            <li>Test your template in a browser before uploading</li>
            <li>Templates are shown to blocked/filtered visitors</li>
          </ul>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, id: null, name: null })}
        title="Excluir Template"
        description={`Tem certeza que deseja excluir o template "${deleteDialog.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />
      </div>
    </GlimpseProvider>
  )
}
