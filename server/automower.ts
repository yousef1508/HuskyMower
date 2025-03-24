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
      
      console.log("Automower API credentials:", { 
        apiKey: API_KEY,
        clientSecretLength: CLIENT_SECRET ? CLIENT_SECRET.length : 0 
      });
      
      // According to the Husqvarna API documentation, we only need the content-type header for token request
      const headers: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded"
      };
      
      // Prepare parameters according to documentation
      const params: Record<string, string> = {
        grant_type: "client_credentials",
        client_id: API_KEY,
        client_secret: CLIENT_SECRET
      };
      
      console.log("Attempting to get Automower token with credentials");
      
      const response = await fetch(AUTOMOWER_AUTH_URL, {
        method: "POST",
        headers,
        body: new URLSearchParams(params)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to get token: ${response.status} ${errorText}`);
        throw new Error(`Failed to get token: ${response.status} ${errorText}`);
      }
      
      const data: AuthToken = await response.json();
      console.log("Successfully obtained Automower token");
      
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
      
      // Set headers according to documentation
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${token}`,
        "Authorization-Provider": "husqvarna",
        "X-Api-Key": API_KEY
      };
      
      console.log("Attempting to fetch mowers from Automower API");
      console.log("Headers:", {
        AuthorizationLength: token.length,
        "Authorization-Provider": "husqvarna",
        "X-Api-Key": API_KEY
      });
      
      const response = await fetch(`${AUTOMOWER_API_URL}/mowers`, {
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to get mowers: ${response.status} ${errorText}`);
        return [];
      }
      
      const data = await response.json();
      // Log just a summary of the data structure to avoid excessive logging
      console.log(`Found ${data.data?.length || 0} mowers from Automower API`);
      
      // Check if there's location/position data
      if (data.data && data.data.length > 0) {
        console.log("Checking for location data in mower response");
        const firstMower = data.data[0];
        if (firstMower.attributes?.positions) {
          console.log("Found position data in mower response:", 
            firstMower.attributes.positions.slice(0, 2)); // Log just a few positions
        } else {
          console.log("No position data found in mower attributes");
        }
      }
      
      if (!data.data || !Array.isArray(data.data)) {
        console.error("Unexpected response format from Automower API - no data array", data);
        return [];
      }
      
      if (data.data.length === 0) {
        console.log("No mowers found in Automower API response");
        return [];
      }
      
      // Log the first mower's timestamp format
      if (data.data[0]?.attributes?.metadata?.lastStatusTimestamp) {
        console.log("Sample lastStatusTimestamp format:", data.data[0].attributes.metadata.lastStatusTimestamp);
      }
      
      return data.data.map((mower: any) => {
        try {
          // Extract location data
          let latitude: number | undefined = undefined;
          let longitude: number | undefined = undefined;
          let positions: Array<{latitude: number, longitude: number}> | undefined = undefined;
          
          // Check if there's a positions array 
          if (mower.attributes?.positions && Array.isArray(mower.attributes.positions)) {
            positions = mower.attributes.positions as Array<{latitude: number, longitude: number}>;
            
            // If positions exist, use the last position as the current location
            if (positions && positions.length > 0) {
              const lastPosition = positions[positions.length - 1];
              if (lastPosition) {
                latitude = lastPosition.latitude;
                longitude = lastPosition.longitude;
              }
            }
          }
          
          // Return complete automower data with location info
          return {
            id: mower.id,
            status: mower.attributes.mower.state,
            batteryLevel: mower.attributes.battery.batteryPercent,
            lastActivity: mower.attributes.metadata.lastStatusTimestamp,
            modeOfOperation: mower.attributes.mower.mode,
            manufacturer: mower.attributes.system.manufacturer,
            model: mower.attributes.system.model,
            serialNumber: mower.attributes.system.serialNumber,
            connectionStatus: mower.attributes.metadata.connected ? "connected" : "disconnected",
            // Location data for geofencing
            latitude, 
            longitude,
            positions
          };
        } catch (err) {
          console.error("Error mapping mower data:", err, mower);
          return null;
        }
      }).filter(Boolean) as AutomowerStatus[];
    } catch (error) {
      console.error("Error fetching mowers:", error);
      return [];
    }
  }
  
  async getMowerStatus(mowerId: string): Promise<AutomowerStatus | null> {
    try {
      const token = await this.getToken();
      
      // Set headers according to documentation
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${token}`,
        "Authorization-Provider": "husqvarna",
        "X-Api-Key": API_KEY
      };
      
      const response = await fetch(`${AUTOMOWER_API_URL}/mowers/${mowerId}`, {
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to get mower status: ${response.status} ${errorText}`);
        return null;
      }
      
      const mower = await response.json();
      
      // Extract location data
      let latitude: number | undefined = undefined;
      let longitude: number | undefined = undefined;
      let positions: Array<{latitude: number, longitude: number}> | undefined = undefined;
      
      // Check if there's a positions array 
      if (mower.data.attributes?.positions && Array.isArray(mower.data.attributes.positions)) {
        positions = mower.data.attributes.positions as Array<{latitude: number, longitude: number}>;
        
        // If positions exist, use the last position as the current location
        if (positions && positions.length > 0) {
          const lastPosition = positions[positions.length - 1];
          if (lastPosition) {
            latitude = lastPosition.latitude;
            longitude = lastPosition.longitude;
          }
        }
      }
      
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
        // Location data for geofencing
        latitude, 
        longitude,
        positions
      };
    } catch (error) {
      console.error(`Error fetching mower status for ${mowerId}:`, error);
      return null;
    }
  }
  
  async controlMower(mowerId: string, action: 'Start' | 'Pause' | 'Park' | 'ParkUntilNextSchedule' | 'ParkUntilFurtherNotice' | 'ResumeSchedule'): Promise<boolean> {
    try {
      const token = await this.getToken();
      
      // Set headers according to documentation
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${token}`,
        "Authorization-Provider": "husqvarna",
        "X-Api-Key": API_KEY,
        "Content-Type": "application/vnd.api+json"
      };
      
      // Create payload according to documentation
      let payload: any = {
        data: {
          type: action
        }
      };
      
      // Add duration for actions that require it
      if (action === 'Start' || action === 'Park') {
        payload.data.attributes = {
          duration: 60 // Default to 60 minutes, can be made configurable later
        };
      }
      
      console.log(`Sending control command to mower ${mowerId}: ${action}`);
      
      const response = await fetch(`${AUTOMOWER_API_URL}/mowers/${mowerId}/actions`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
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
