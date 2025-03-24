import { AutomowerStatus } from "@shared/schema";

const AUTOMOWER_AUTH_URL = "https://api.authentication.husqvarnagroup.dev/v1/oauth2/token";
const AUTOMOWER_API_URL = "https://api.amc.husqvarna.dev/v1";

// Get these values from environment variables
const API_KEY = process.env.AUTOMOWER_API_KEY;
const CLIENT_SECRET = process.env.AUTOMOWER_CLIENT_SECRET;

interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  provider: string;
  user_id: string;
  scope: string;
}

class AutomowerAPI {
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  
  constructor() {
    // Initialize token
    this.refreshToken().catch(err => {
      console.error("Failed to initialize Automower API token, will retry on actual API calls:", err.message);
    });
  }
  
  private async refreshToken(): Promise<string> {
    try {
      // Check if API_KEY and CLIENT_SECRET are available
      if (!API_KEY || !CLIENT_SECRET) {
        throw new Error("Missing API_KEY or CLIENT_SECRET. Please check environment variables.");
      }
      
      const headers: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded"
      };
      
      // Only add API_KEY to headers if it exists
      if (API_KEY) {
        headers["X-Api-Key"] = API_KEY;
      }
      
      const params: Record<string, string> = {
        grant_type: "client_credentials"
      };
      
      // Only add client_id and client_secret if they exist
      if (API_KEY) {
        params.client_id = API_KEY;
      }
      
      if (CLIENT_SECRET) {
        params.client_secret = CLIENT_SECRET;
      }
      
      const response = await fetch(AUTOMOWER_AUTH_URL, {
        method: "POST",
        headers,
        body: new URLSearchParams(params)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get token: ${response.status} ${errorText}`);
      }
      
      const data: AuthToken = await response.json();
      
      this.token = data.access_token;
      // Set token expiry to 80% of the actual expiry time to be safe
      const expirySeconds = data.expires_in * 0.8;
      this.tokenExpiry = new Date(Date.now() + expirySeconds * 1000);
      
      return this.token;
    } catch (error) {
      console.error("Error refreshing Automower API token:", error);
      throw error;
    }
  }
  
  private async getToken(): Promise<string> {
    // If token doesn't exist or is expired, refresh it
    if (!this.token || !this.tokenExpiry || new Date() > this.tokenExpiry) {
      return this.refreshToken();
    }
    
    return this.token;
  }
  
  async getMowers(): Promise<AutomowerStatus[]> {
    try {
      const token = await this.getToken();
      
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${token}`
      };
      
      if (API_KEY) {
        headers["X-Api-Key"] = API_KEY;
      }
      
      const response = await fetch(`${AUTOMOWER_API_URL}/mowers`, {
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to get mowers: ${response.status} ${errorText}`);
        return [];
      }
      
      const data = await response.json();
      return data.data.map((mower: any) => ({
        id: mower.id,
        status: mower.attributes.mower.state,
        batteryLevel: mower.attributes.battery.batteryPercent,
        lastActivity: mower.attributes.metadata.lastStatusTimestamp,
        modeOfOperation: mower.attributes.mower.mode,
        manufacturer: mower.attributes.system.manufacturer,
        model: mower.attributes.system.model,
        serialNumber: mower.attributes.system.serialNumber,
        connectionStatus: mower.attributes.metadata.connected ? "connected" : "disconnected",
      }));
    } catch (error) {
      console.error("Error fetching mowers:", error);
      return [];
    }
  }
  
  async getMowerStatus(mowerId: string): Promise<AutomowerStatus | null> {
    try {
      const token = await this.getToken();
      
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${token}`
      };
      
      if (API_KEY) {
        headers["X-Api-Key"] = API_KEY;
      }
      
      const response = await fetch(`${AUTOMOWER_API_URL}/mowers/${mowerId}`, {
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to get mower status: ${response.status} ${errorText}`);
        return null;
      }
      
      const mower = await response.json();
      return {
        id: mower.data.id,
        status: mower.data.attributes.mower.state,
        batteryLevel: mower.data.attributes.battery.batteryPercent,
        lastActivity: mower.data.attributes.metadata.lastStatusTimestamp,
        modeOfOperation: mower.data.attributes.mower.mode,
        manufacturer: mower.data.attributes.system.manufacturer,
        model: mower.data.attributes.system.model,
        serialNumber: mower.data.attributes.system.serialNumber,
        connectionStatus: mower.data.attributes.metadata.connected ? "connected" : "disconnected",
      };
    } catch (error) {
      console.error(`Error fetching mower status for ${mowerId}:`, error);
      return null;
    }
  }
  
  async controlMower(mowerId: string, action: 'START' | 'STOP' | 'PARK' | 'PARK_UNTIL_NEXT_TASK' | 'PARK_UNTIL_FURTHER_NOTICE' | 'RESUME_SCHEDULE'): Promise<boolean> {
    try {
      const token = await this.getToken();
      
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/vnd.api+json"
      };
      
      if (API_KEY) {
        headers["X-Api-Key"] = API_KEY;
      }
      
      const response = await fetch(`${AUTOMOWER_API_URL}/mowers/${mowerId}/actions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          data: {
            type: "actions",
            attributes: {
              action
            }
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to control mower: ${response.status} ${errorText}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Error controlling mower ${mowerId} with action ${action}:`, error);
      return false;
    }
  }
}

export const automowerAPI = new AutomowerAPI();
