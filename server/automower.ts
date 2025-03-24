import { AutomowerStatus } from "@shared/schema";

const AUTOMOWER_AUTH_URL = "https://api.authentication.husqvarnagroup.dev/v1/oauth2/token";
const AUTOMOWER_API_URL = "https://api.amc.husqvarna.dev/v1";

// Get these values from environment variables
const API_KEY = process.env.AUTOMOWER_API_KEY || "b46d3fe8-ed9f-48f1-8cb8-e8b97181b75e";
const CLIENT_SECRET = process.env.AUTOMOWER_CLIENT_SECRET || "84593f7f-70d2-41a1-8147-4bd558735f5b";

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
    this.refreshToken();
  }
  
  private async refreshToken(): Promise<string> {
    try {
      const response = await fetch(AUTOMOWER_AUTH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Api-Key": API_KEY
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: API_KEY,
          client_secret: CLIENT_SECRET
        })
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
      
      const response = await fetch(`${AUTOMOWER_API_URL}/mowers`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Api-Key": API_KEY
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get mowers: ${response.status} ${errorText}`);
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
      throw error;
    }
  }
  
  async getMowerStatus(mowerId: string): Promise<AutomowerStatus> {
    try {
      const token = await this.getToken();
      
      const response = await fetch(`${AUTOMOWER_API_URL}/mowers/${mowerId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Api-Key": API_KEY
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get mower status: ${response.status} ${errorText}`);
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
      throw error;
    }
  }
  
  async controlMower(mowerId: string, action: 'START' | 'STOP' | 'PARK' | 'PARK_UNTIL_NEXT_TASK' | 'PARK_UNTIL_FURTHER_NOTICE' | 'RESUME_SCHEDULE'): Promise<boolean> {
    try {
      const token = await this.getToken();
      
      const response = await fetch(`${AUTOMOWER_API_URL}/mowers/${mowerId}/actions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Api-Key": API_KEY,
          "Content-Type": "application/vnd.api+json"
        },
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
        throw new Error(`Failed to control mower: ${response.status} ${errorText}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error controlling mower ${mowerId} with action ${action}:`, error);
      throw error;
    }
  }
}

export const automowerAPI = new AutomowerAPI();
