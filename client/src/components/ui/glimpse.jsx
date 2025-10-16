import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

const GlimpseProvider = TooltipPrimitive.Provider

const Glimpse = TooltipPrimitive.Root

const GlimpseTrigger = TooltipPrimitive.Trigger

const GlimpseContent = React.forwardRef(({ className, sideOffset = 4, children, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  >
    {children}
  </TooltipPrimitive.Content>
))
GlimpseContent.displayName = TooltipPrimitive.Content.displayName

const GlimpsePreview = React.forwardRef(({ className, src, alt = "Preview", width = 400, height = 300, ...props }, ref) => {
  const [html, setHtml] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    const fetchHtml = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const response = await fetch(src, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to load preview')
        }
        
        const htmlContent = await response.text()
        setHtml(htmlContent)
        setError(null)
      } catch (err) {
        console.error('Preview error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchHtml()
  }, [src])

  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={8}
      className={cn(
        "z-50 overflow-hidden rounded-lg border bg-popover shadow-2xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        className
      )}
      {...props}
    >
      <div className="relative bg-white" style={{ width: `${width}px`, height: `${height}px` }}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Loading preview...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-sm text-destructive p-4">
            {error}
          </div>
        ) : (
          <iframe
            srcDoc={html}
            title={alt}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </TooltipPrimitive.Content>
  )
})
GlimpsePreview.displayName = "GlimpsePreview"

export { Glimpse, GlimpseTrigger, GlimpseContent, GlimpsePreview, GlimpseProvider }
