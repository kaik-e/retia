export const t = {
  // Common
  back: 'Voltar',
  save: 'Salvar',
  saving: 'Salvando...',
  cancel: 'Cancelar',
  delete: 'Excluir',
  edit: 'Editar',
  create: 'Criar',
  update: 'Atualizar',
  loading: 'Carregando...',
  search: 'Buscar...',
  selectAll: 'Selecionar Todos',
  clearAll: 'Limpar Todos',
  selected: 'selecionado',
  selectedPlural: 'selecionados',
  
  // Domain Edit
  editDomain: 'Editar Domínio',
  createDomain: 'Criar Domínio',
  configureCloaking: 'Configurar regras de cloaking e filtros',
  
  // Basic Settings
  basicSettings: 'Configurações Básicas',
  domainAndRedirect: 'Configuração de domínio e redirecionamento',
  domain: 'Domínio',
  targetUrl: 'URL de Destino',
  targetUrlDesc: 'Para onde o tráfego legítimo será redirecionado',
  cloakedTemplate: 'Template de Cloaking',
  defaultTemplate: 'Template padrão',
  cloakedTemplateDesc: 'Página HTML mostrada para visitantes bloqueados',
  
  // Lockdown Mode
  lockdownMode: 'Modo Lockdown',
  lockdownDesc: 'Modo de emergência - bloqueia TODO o tráfego e mostra template',
  enableLockdown: 'Ativar Lockdown',
  lockdownTooltip: 'Quando ativado, TODOS os visitantes verão o template de bloqueio. Nenhum tráfego será redirecionado. Use para emergências ou manutenção.',
  lockdownBlockAll: 'Bloquear todo o tráfego independente dos filtros',
  lockdownTemplate: 'Template Lockdown',
  lockdownWarning: 'Todos os visitantes verão este template até o lockdown ser desativado',
  
  // Cloaking Options
  cloakingOptions: 'Opções de Cloaking',
  configureFilters: 'Configurar regras de filtragem',
  
  passQueryParams: 'Passar Parâmetros de URL',
  passQueryParamsDesc: 'Incluir parâmetros de URL no redirecionamento',
  passQueryParamsTooltip: 'Encaminha todos os parâmetros de URL (como ?gclid=xxx&utm_source=google) para a URL de destino. Essencial para rastreamento e atribuição.',
  
  requireGclid: 'Exigir GCLID',
  requireGclidDesc: 'Bloquear tráfego sem Google Click ID',
  requireGclidTooltip: 'Bloqueia qualquer visitante sem um parâmetro Google Click ID (gclid). Perfeito para garantir que o tráfego venha apenas de campanhas do Google Ads.',
  
  mobileOnly: 'Apenas Dispositivos Móveis',
  mobileOnlyDesc: 'Bloquear desktops e tablets',
  mobileOnlyTooltip: 'Permite apenas dispositivos móveis (telefones). Bloqueia computadores desktop e tablets. Detecta o tipo de dispositivo pelo user agent.',
  
  blockPingableIps: 'Bloquear IPs Pingáveis',
  blockPingableIpsDesc: 'Bloquear IPs de datacenter/hospedagem',
  blockPingableIpsTooltip: 'Bloqueia IPs de datacenter, hospedagem, VPN e proxy. Filtra bots e scrapers da AWS, Google Cloud, DigitalOcean, etc.',
  
  // ASN Blocks
  asnBlocks: 'Bloqueios de ASN',
  asnBlocksDesc: 'Bloquear Números de Sistema Autônomo específicos',
  asnBlocksTooltip: 'Bloqueia redes inteiras pelo ASN (Número de Sistema Autônomo). Exemplo: AS15169 é o Google. Encontre ASNs em ipinfo.io ou bgp.he.net',
  asnPlaceholder: 'AS15169',
  descriptionOptional: 'Descrição (opcional)',
  
  // Country Blocks
  countryBlocks: 'Bloqueio por País',
  countryBlocksDesc: 'Bloquear tráfego de países específicos',
  countryBlocksTooltip: 'Bloqueia visitantes por país. Selecione no dropdown. Padrão: Nenhum país bloqueado.',
  selectCountries: 'Selecione Países para Bloquear',
  noCountriesBlocked: 'Nenhum país bloqueado (padrão)',
  searchCountries: 'Buscar países...',
  noCountriesFound: 'Nenhum país encontrado',
  countryDefaultDesc: 'Padrão: Sem bloqueios. Selecione países para começar a bloquear.',
  
  // Brazilian States
  brazilianStates: 'Estados Brasileiros',
  brazilianStatesDesc: 'Bloquear tráfego de estados brasileiros',
  brazilianStatesTooltip: 'Bloqueia tráfego de estados brasileiros específicos. Padrão: Nenhum estado bloqueado.',
  selectBrazilianStates: 'Selecione Estados Brasileiros para Bloquear',
  noStatesBlocked: 'Nenhum estado bloqueado (padrão)',
  searchStates: 'Buscar estados...',
  noStatesFound: 'Nenhum estado encontrado',
  statesDefaultDesc: 'Padrão: Sem bloqueios. Selecione estados para começar a bloquear tráfego brasileiro.',
  
  // Other States
  otherStates: 'Outros Estados/Regiões',
  otherStatesDesc: 'Bloquear tráfego de estados em outros países',
  otherStatesTooltip: 'Bloqueia estados ou regiões específicas de outros países (não-Brasil). Use códigos de 2 letras. Exemplos: US/CA (Califórnia), US/NY (Nova York), GB/ENG (Inglaterra)',
  countryCode: 'País (US)',
  stateCode: 'Estado (CA)',
  
  // IP Blocks
  ipBlocks: 'Bloqueios de IP',
  ipBlocksDesc: 'Bloquear endereços IP específicos',
  ipBlocksTooltip: 'Bloqueia manualmente endereços IP específicos. Útil para bloquear concorrentes conhecidos, scrapers ou visitantes problemáticos.',
  ipPlaceholder: '192.168.1.1',
  
  // Submit
  updateDomain: 'Atualizar Domínio',
  createDomainButton: 'Criar Domínio',
}
