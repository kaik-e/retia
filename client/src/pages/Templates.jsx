import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FileText, Upload, Trash2, Eye, File } from 'lucide-react'
import { api } from '@/lib/api'
import { InfoTooltip } from '@/components/ui/info-tooltip'

export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [templateName, setTemplateName] = useState('')
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
      alert('Template uploaded successfully!')
    } catch (error) {
      console.error('Failed to upload template:', error)
      alert('Failed to upload template: ' + (error.response?.data?.error || error.message))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      await api.templates.delete(id)
      setTemplates(templates.filter(t => t.id !== id))
    } catch (error) {
      console.error('Failed to delete template:', error)
      alert('Failed to delete template: ' + (error.response?.data?.error || error.message))
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
      alert('Falha ao visualizar template')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie templates HTML para páginas de cloaking
        </p>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Upload de Template</CardTitle>
            <InfoTooltip>
              Faça upload de um arquivo HTML completo que será mostrado aos visitantes bloqueados. Inclua todo CSS/JS inline ou use links CDN.
            </InfoTooltip>
          </div>
          <CardDescription>
            Faça upload de um arquivo HTML para usar como template de cloaking
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {template.filename}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Created: {new Date(template.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(template.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(template.id, template.name)}
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
    </div>
  )
}
