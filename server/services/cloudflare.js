const axios = require('axios');

class CloudflareService {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.baseURL = 'https://api.cloudflare.com/client/v4';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // List all zones (domains) in the account
  async listZones() {
    try {
      const response = await this.client.get('/zones');
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to list zones: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  // Get zone details
  async getZone(zoneId) {
    try {
      const response = await this.client.get(`/zones/${zoneId}`);
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to get zone: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  // Create DNS A record
  async createDNSRecord(zoneId, name, ipAddress, proxied = true) {
    try {
      const response = await this.client.post(`/zones/${zoneId}/dns_records`, {
        type: 'A',
        name: name,
        content: ipAddress,
        ttl: 1, // Auto (required when proxied)
        proxied: proxied
      });
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to create DNS record: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  // List DNS records for a zone
  async listDNSRecords(zoneId) {
    try {
      const response = await this.client.get(`/zones/${zoneId}/dns_records`);
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to list DNS records: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  // Update DNS record
  async updateDNSRecord(zoneId, recordId, data) {
    try {
      const response = await this.client.put(`/zones/${zoneId}/dns_records/${recordId}`, data);
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to update DNS record: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  // Delete DNS record
  async deleteDNSRecord(zoneId, recordId) {
    try {
      const response = await this.client.delete(`/zones/${zoneId}/dns_records/${recordId}`);
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to delete DNS record: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  // Update zone settings (SSL mode)
  async updateSSLMode(zoneId, mode = 'flexible') {
    try {
      const response = await this.client.patch(`/zones/${zoneId}/settings/ssl`, {
        value: mode
      });
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to update SSL mode: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  // Get zone settings
  async getZoneSettings(zoneId) {
    try {
      const response = await this.client.get(`/zones/${zoneId}/settings`);
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to get zone settings: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  // Create WAF rule to skip bot detection for AdsBot-Google
  async createWAFRule(zoneId) {
    try {
      const response = await this.client.post(`/zones/${zoneId}/firewall/rules`, {
        filter: {
          expression: '(http.user_agent contains "AdsBot-Google")',
          paused: false
        },
        action: 'skip',
        action_parameters: {
          ruleset: 'current'
        },
        description: 'Skip bot detection for AdsBot-Google'
      });
      return response.data.result;
    } catch (error) {
      // WAF rules might not be available on all plans, so we don't throw
      console.warn('Could not create WAF rule (might require higher plan):', error.message);
      return null;
    }
  }

  // Verify API token is valid
  async verifyToken() {
    try {
      const response = await this.client.get('/user/tokens/verify');
      return response.data.result;
    } catch (error) {
      throw new Error(`Invalid API token: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  // Auto-setup domain: Create DNS, enable proxy, set SSL
  async autoSetupDomain(zoneId, domainName, vpsIp) {
    const results = {
      dns: null,
      ssl: null,
      waf: null,
      errors: []
    };

    try {
      // 1. Check if DNS record already exists
      const existingRecords = await this.listDNSRecords(zoneId);
      const existingRecord = existingRecords.find(r => r.name === domainName && r.type === 'A');

      if (existingRecord) {
        // Update existing record
        results.dns = await this.updateDNSRecord(zoneId, existingRecord.id, {
          type: 'A',
          name: domainName,
          content: vpsIp,
          ttl: 1,
          proxied: true
        });
      } else {
        // Create new record
        results.dns = await this.createDNSRecord(zoneId, domainName, vpsIp, true);
      }
    } catch (error) {
      results.errors.push(`DNS: ${error.message}`);
    }

    try {
      // 2. Set SSL to Flexible
      results.ssl = await this.updateSSLMode(zoneId, 'flexible');
    } catch (error) {
      results.errors.push(`SSL: ${error.message}`);
    }

    try {
      // 3. Create WAF rule (optional, might fail on free plans)
      results.waf = await this.createWAFRule(zoneId);
    } catch (error) {
      // WAF is optional, don't add to errors
      console.warn('WAF rule creation skipped:', error.message);
    }

    return results;
  }
}

module.exports = CloudflareService;
