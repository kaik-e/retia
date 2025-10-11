import { useState } from 'react'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { X, CheckSquare, Square } from 'lucide-react'
import { InfoTooltip } from './ui/info-tooltip'

const BRAZILIAN_STATES = [
  { code: 'AC', name: 'Acre', region: 'Norte' },
  { code: 'AL', name: 'Alagoas', region: 'Nordeste' },
  { code: 'AP', name: 'Amapá', region: 'Norte' },
  { code: 'AM', name: 'Amazonas', region: 'Norte' },
  { code: 'BA', name: 'Bahia', region: 'Nordeste' },
  { code: 'CE', name: 'Ceará', region: 'Nordeste' },
  { code: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste' },
  { code: 'ES', name: 'Espírito Santo', region: 'Sudeste' },
  { code: 'GO', name: 'Goiás', region: 'Centro-Oeste' },
  { code: 'MA', name: 'Maranhão', region: 'Nordeste' },
  { code: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste' },
  { code: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste' },
  { code: 'MG', name: 'Minas Gerais', region: 'Sudeste' },
  { code: 'PA', name: 'Pará', region: 'Norte' },
  { code: 'PB', name: 'Paraíba', region: 'Nordeste' },
  { code: 'PR', name: 'Paraná', region: 'Sul' },
  { code: 'PE', name: 'Pernambuco', region: 'Nordeste' },
  { code: 'PI', name: 'Piauí', region: 'Nordeste' },
  { code: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste' },
  { code: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste' },
  { code: 'RS', name: 'Rio Grande do Sul', region: 'Sul' },
  { code: 'RO', name: 'Rondônia', region: 'Norte' },
  { code: 'RR', name: 'Roraima', region: 'Norte' },
  { code: 'SC', name: 'Santa Catarina', region: 'Sul' },
  { code: 'SP', name: 'São Paulo', region: 'Sudeste' },
  { code: 'SE', name: 'Sergipe', region: 'Nordeste' },
  { code: 'TO', name: 'Tocantins', region: 'Norte' },
]

const REGIONS = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']

export default function BrazilianStatesSelector({ selectedStates, onChange }) {
  const [expandedRegions, setExpandedRegions] = useState(REGIONS)

  const isStateSelected = (stateCode) => {
    return selectedStates.some(s => s.country_code === 'BR' && s.state_code === stateCode)
  }

  const toggleState = (stateCode) => {
    if (isStateSelected(stateCode)) {
      // Remove state
      onChange(selectedStates.filter(s => !(s.country_code === 'BR' && s.state_code === stateCode)))
    } else {
      // Add state
      onChange([...selectedStates, { country_code: 'BR', state_code: stateCode }])
    }
  }

  const toggleRegion = (region) => {
    const statesInRegion = BRAZILIAN_STATES.filter(s => s.region === region)
    const allSelected = statesInRegion.every(s => isStateSelected(s.code))

    if (allSelected) {
      // Deselect all in region
      onChange(selectedStates.filter(s => 
        !statesInRegion.some(rs => rs.code === s.state_code && s.country_code === 'BR')
      ))
    } else {
      // Select all in region
      const newStates = statesInRegion
        .filter(s => !isStateSelected(s.code))
        .map(s => ({ country_code: 'BR', state_code: s.code }))
      onChange([...selectedStates, ...newStates])
    }
  }

  const selectAll = () => {
    const allBrazilianStates = BRAZILIAN_STATES.map(s => ({
      country_code: 'BR',
      state_code: s.code
    }))
    // Remove existing BR states and add all
    const nonBRStates = selectedStates.filter(s => s.country_code !== 'BR')
    onChange([...nonBRStates, ...allBrazilianStates])
  }

  const deselectAll = () => {
    // Remove all BR states
    onChange(selectedStates.filter(s => s.country_code !== 'BR'))
  }

  const toggleRegionExpand = (region) => {
    if (expandedRegions.includes(region)) {
      setExpandedRegions(expandedRegions.filter(r => r !== region))
    } else {
      setExpandedRegions([...expandedRegions, region])
    }
  }

  const selectedBRCount = selectedStates.filter(s => s.country_code === 'BR').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Brazilian States</CardTitle>
            <InfoTooltip>
              Quick selection for all 27 Brazilian states. Select by region or individually. Perfect for geo-targeting Brazilian traffic.
            </InfoTooltip>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAll}
              disabled={selectedBRCount === 27}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={deselectAll}
              disabled={selectedBRCount === 0}
            >
              <Square className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
        <CardDescription>
          Block traffic from specific Brazilian states ({selectedBRCount}/27 selected)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected States Summary */}
        {selectedBRCount > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
            {selectedStates
              .filter(s => s.country_code === 'BR')
              .map((state, index) => {
                const stateInfo = BRAZILIAN_STATES.find(s => s.code === state.state_code)
                return (
                  <Badge key={index} variant="secondary" className="gap-2">
                    BR/{state.state_code}
                    {stateInfo && ` - ${stateInfo.name}`}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => toggleState(state.state_code)}
                    />
                  </Badge>
                )
              })}
          </div>
        )}

        {/* States by Region */}
        <div className="space-y-3">
          {REGIONS.map(region => {
            const statesInRegion = BRAZILIAN_STATES.filter(s => s.region === region)
            const selectedInRegion = statesInRegion.filter(s => isStateSelected(s.code)).length
            const allSelected = selectedInRegion === statesInRegion.length
            const someSelected = selectedInRegion > 0 && !allSelected
            const isExpanded = expandedRegions.includes(region)

            return (
              <div key={region} className="border rounded-lg">
                {/* Region Header */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => toggleRegionExpand(region)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => toggleRegion(region)}
                      onClick={(e) => e.stopPropagation()}
                      className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                    />
                    <div>
                      <span className="font-medium">{region}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({selectedInRegion}/{statesInRegion.length})
                      </span>
                    </div>
                  </div>
                  <span className="text-muted-foreground">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </div>

                {/* States in Region */}
                {isExpanded && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-3 pt-0 border-t">
                    {statesInRegion.map(state => (
                      <div
                        key={state.code}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-accent transition-colors cursor-pointer"
                        onClick={() => toggleState(state.code)}
                      >
                        <Checkbox
                          checked={isStateSelected(state.code)}
                          onCheckedChange={() => toggleState(state.code)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Label
                          htmlFor={state.code}
                          className="text-sm cursor-pointer flex-1"
                        >
                          <span className="font-medium">{state.code}</span>
                          <span className="text-muted-foreground ml-1">
                            {state.name}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md">
          💡 <strong>Tip:</strong> Click region names to expand/collapse. Click checkboxes to select individual states or entire regions.
        </div>
      </CardContent>
    </Card>
  )
}
