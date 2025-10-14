const axios = require('axios');

class GoDaddyService {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseURL = 'https://api.godaddy.com/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `sso-key ${apiKey}:${apiSecret}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // List all domains in the account
  async listDomains() {
    try {
      const response = await this.client.get('/domains');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to list domains: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get domain details
  async getDomain(domain) {
    try {
      const response = await this.client.get(`/domains/${domain}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get domain: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get domain nameservers
  async getNameservers(domain) {
    try {
      const response = await this.client.get(`/domains/${domain}`);
      return response.data.nameServers || [];
    } catch (error) {
      throw new Error(`Failed to get nameservers: ${error.response?.data?.message || error.message}`);
    }
  }

  // Update domain nameservers
  async updateNameservers(domain, nameservers) {
    try {
      const response = await this.client.patch(`/domains/${domain}`, {
        nameServers: nameservers
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update nameservers: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get DNS records for a domain
  async getDNSRecords(domain) {
    try {
      const response = await this.client.get(`/domains/${domain}/records`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get DNS records: ${error.response?.data?.message || error.message}`);
    }
  }

  // Add DNS record
  async addDNSRecord(domain, record) {
    try {
      const response = await this.client.patch(`/domains/${domain}/records`, [record]);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add DNS record: ${error.response?.data?.message || error.message}`);
    }
  }

  // Replace all DNS records
  async replaceDNSRecords(domain, records) {
    try {
      const response = await this.client.put(`/domains/${domain}/records`, records);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to replace DNS records: ${error.response?.data?.message || error.message}`);
    }
  }

  // Verify API credentials
  async verifyCredentials() {
    try {
      await this.listDomains();
      return true;
    } catch (error) {
      throw new Error(`Invalid API credentials: ${error.message}`);
    }
  }

  // Change nameservers to Cloudflare
  async changeToCloudflare(domain) {
    const cloudflareNameservers = [
      'aaron.ns.cloudflare.com',
      'jill.ns.cloudflare.com'
    ];

    try {
      await this.updateNameservers(domain, cloudflareNameservers);
      return {
        success: true,
        nameservers: cloudflareNameservers,
        message: 'Nameservers updated to Cloudflare'
      };
    } catch (error) {
      throw new Error(`Failed to change nameservers: ${error.message}`);
    }
  }
}

module.exports = GoDaddyService;
