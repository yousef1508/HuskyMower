import { WeatherForecast } from "@shared/schema";
import { storage } from "./storage";

// Norwegian Met Office API
const WEATHER_API_BASE_URL = "https://api.met.no/weatherapi";
// Default coordinates for Gjersjøen
const DEFAULT_LATITUDE = 59.7907;
const DEFAULT_LONGITUDE = 10.7686;

// Weather condition mapping
const weatherConditions: Record<string, { icon: string; condition: string }> = {
  "clearsky": { icon: "sun", condition: "Clear Sky" },
  "fair": { icon: "sun", condition: "Fair" },
  "partlycloudy": { icon: "cloud-sun", condition: "Partly Cloudy" },
  "cloudy": { icon: "cloud", condition: "Cloudy" },
  "rainshowers": { icon: "cloud-drizzle", condition: "Rain Showers" },
  "rainshowersandthunder": { icon: "cloud-lightning", condition: "Rain Showers with Thunder" },
  "sleetshowers": { icon: "cloud-sleet", condition: "Sleet Showers" },
  "snowshowers": { icon: "cloud-snow", condition: "Snow Showers" },
  "rain": { icon: "cloud-rain", condition: "Rain" },
  "heavyrain": { icon: "cloud-rain", condition: "Heavy Rain" },
  "heavyrainandthunder": { icon: "cloud-lightning", condition: "Heavy Rain with Thunder" },
  "sleet": { icon: "cloud-sleet", condition: "Sleet" },
  "snow": { icon: "cloud-snow", condition: "Snow" },
  "snowandthunder": { icon: "cloud-lightning", condition: "Snow with Thunder" },
  "fog": { icon: "cloud-fog", condition: "Fog" },
  "sleetshowersandthunder": { icon: "cloud-lightning", condition: "Sleet Showers with Thunder" },
  "snowshowersandthunder": { icon: "cloud-lightning", condition: "Snow Showers with Thunder" },
  "rainandthunder": { icon: "cloud-lightning", condition: "Rain with Thunder" },
  "sleetandthunder": { icon: "cloud-lightning", condition: "Sleet with Thunder" },
  "lightrainshowersandthunder": { icon: "cloud-lightning", condition: "Light Rain Showers with Thunder" },
  "heavyrainshowersandthunder": { icon: "cloud-lightning", condition: "Heavy Rain Showers with Thunder" },
  "lightssleetshowersandthunder": { icon: "cloud-lightning", condition: "Light Sleet Showers with Thunder" },
  "heavysleetshowersandthunder": { icon: "cloud-lightning", condition: "Heavy Sleet Showers with Thunder" },
  "lightsnowshowersandthunder": { icon: "cloud-lightning", condition: "Light Snow Showers with Thunder" },
  "heavysnowshowersandthunder": { icon: "cloud-lightning", condition: "Heavy Snow Showers with Thunder" },
  "lightrainandthunder": { icon: "cloud-lightning", condition: "Light Rain with Thunder" },
  "lightsleetandthunder": { icon: "cloud-lightning", condition: "Light Sleet with Thunder" },
  "heavysleetandthunder": { icon: "cloud-lightning", condition: "Heavy Sleet with Thunder" },
  "lightsnowandthunder": { icon: "cloud-lightning", condition: "Light Snow with Thunder" },
  "heavysnowandthunder": { icon: "cloud-lightning", condition: "Heavy Snow with Thunder" },
  "lightrainshowers": { icon: "cloud-drizzle", condition: "Light Rain Showers" },
  "heavyrainshowers": { icon: "cloud-rain", condition: "Heavy Rain Showers" },
  "lightsleetshowers": { icon: "cloud-sleet", condition: "Light Sleet Showers" },
  "heavysleetshowers": { icon: "cloud-sleet", condition: "Heavy Sleet Showers" },
  "lightsnowshowers": { icon: "cloud-snow", condition: "Light Snow Showers" },
  "heavysnowshowers": { icon: "cloud-snow", condition: "Heavy Snow Showers" },
  "lightrain": { icon: "cloud-drizzle", condition: "Light Rain" },
  "lightsleet": { icon: "cloud-sleet", condition: "Light Sleet" },
  "heavysleet": { icon: "cloud-sleet", condition: "Heavy Sleet" },
  "lightsnow": { icon: "cloud-snow", condition: "Light Snow" },
  "heavysnow": { icon: "cloud-snow", condition: "Heavy Snow" }
};

// Function to determine mowing condition based on weather
function getMowingCondition(
  symbol: string | undefined,
  precipitation: number,
  temperature: number,
  windSpeed: number
): 'excellent' | 'good' | 'fair' | 'poor' {
  // Safety check - if symbol is undefined, base on other factors only
  const symbolStr = symbol || '';
  
  // Poor conditions: Heavy rain, snow, or high winds
  if (
    precipitation > 5 || 
    symbolStr.includes('thunder') || 
    symbolStr.includes('snow') || 
    symbolStr.includes('sleet') ||
    windSpeed > 15 ||
    temperature < 5
  ) {
    return 'poor';
  }
  
  // Fair conditions: Light rain or moderate winds
  if (
    (precipitation > 1 && precipitation <= 5) || 
    windSpeed > 10 ||
    temperature < 8
  ) {
    return 'fair';
  }
  
  // Good conditions: Slight chance of rain
  if (
    (precipitation > 0.1 && precipitation <= 1) || 
    symbolStr.includes('cloudy') ||
    windSpeed > 8
  ) {
    return 'good';
  }
  
  // Excellent conditions: Clear weather, low wind
  return 'excellent';
}

class WeatherAPI {
  private appName: string;
  private contactEmail: string;
  
  constructor(appName = "HusqvarnaAutomowerApp", contactEmail = "contact@example.com") {
    this.appName = appName;
    this.contactEmail = contactEmail;
  }
  
  async getForecast(latitude = DEFAULT_LATITUDE, longitude = DEFAULT_LONGITUDE): Promise<WeatherForecast[]> {
    try {
      console.log(`Getting weather forecast for coordinates: ${latitude}, ${longitude}`);
      
      // Check if we have cached data
      const cachedData = await storage.getWeatherData(latitude, longitude);
      if (cachedData) {
        console.log("Using cached weather data from database");
        return cachedData.forecast as WeatherForecast[];
      }
      
      console.log("No cached weather data found, making API request to Norwegian Met Office");
      
      // No cached data found, make API request
      const locationforecastUrl = `${WEATHER_API_BASE_URL}/locationforecast/2.0/compact?lat=${latitude}&lon=${longitude}`;
      console.log(`Weather API URL: ${locationforecastUrl}`);
      
      const headers = {
        'User-Agent': `${this.appName}/1.0 ${this.contactEmail}`
      };
      console.log("Weather API request headers:", headers);
      
      const response = await fetch(locationforecastUrl, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Weather API error (${response.status}): ${errorText}`);
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }
      
      console.log("Successfully received weather data from API");
      const data = await response.json();
      
      // Process the forecast data
      console.log("Processing weather data...");
      const forecast = this.processWeatherData(data);
      
      // Cache the forecast data
      console.log("Caching weather forecast data to database");
      await storage.saveWeatherData(latitude, longitude, forecast);
      
      return forecast;
    } catch (error) {
      console.error("Error fetching weather forecast:", error);
      // Return fallback forecast data instead of throwing
      console.log("Returning fallback weather forecast data");
      return [{
        date: new Date().toISOString().split('T')[0],
        temperature: 15,
        condition: 'Fair',
        precipitation: 0,
        windSpeed: 2,
        mowingCondition: 'good',
        icon: 'sun'
      }];
    }
  }
  
  private processWeatherData(data: any): WeatherForecast[] {
    // Safety check for data structure
    if (!data || !data.properties || !Array.isArray(data.properties.timeseries)) {
      console.error('Invalid weather data format received');
      // Return a basic forecast with default values instead of crashing
      return [{
        date: new Date().toISOString().split('T')[0],
        temperature: 15,
        condition: 'Unknown',
        precipitation: 0,
        windSpeed: 2,
        mowingCondition: 'good',
        icon: 'cloud-question'
      }];
    }
    
    const timeseriesData = data.properties.timeseries;
    const dailyForecasts: Record<string, any> = {};
    
    // Group data by day
    timeseriesData.forEach((item: any) => {
      const time = new Date(item.time);
      const day = time.toISOString().split('T')[0];
      
      if (!dailyForecasts[day]) {
        dailyForecasts[day] = {
          temps: [],
          symbols: [],
          precipitations: [],
          windSpeeds: []
        };
      }
      
      const details = item.data;
      if (details.instant && details.instant.details) {
        dailyForecasts[day].temps.push(details.instant.details.air_temperature);
        dailyForecasts[day].windSpeeds.push(details.instant.details.wind_speed);
      }
      
      if (details.next_1_hours && details.next_1_hours.details && details.next_1_hours.details.precipitation_amount) {
        dailyForecasts[day].precipitations.push(details.next_1_hours.details.precipitation_amount);
      }
      
      if (details.next_1_hours && details.next_1_hours.summary && details.next_1_hours.summary.symbol_code) {
        dailyForecasts[day].symbols.push(details.next_1_hours.summary.symbol_code);
      }
    });
    
    // Convert daily data to forecasts
    const forecasts: WeatherForecast[] = [];
    
    // Check if we have any daily forecasts, if not return a default forecast
    if (Object.keys(dailyForecasts).length === 0) {
      console.warn('No daily forecast data available');
      return [{
        date: new Date().toISOString().split('T')[0],
        temperature: 15,
        condition: 'Fair',
        precipitation: 0,
        windSpeed: 2,
        mowingCondition: 'good',
        icon: 'sun'
      }];
    }
    
    Object.entries(dailyForecasts)
      .slice(0, 4) // Limit to 4 days
      .forEach(([day, data]: [string, any]) => {
        // Calculate average temperature (with safety check)
        const avgTemp = Array.isArray(data.temps) && data.temps.length > 0
          ? data.temps.reduce((sum: number, temp: number) => sum + temp, 0) / data.temps.length
          : 15; // Default to 15°C if no temperature data
        
        // Find most common weather symbol
        const symbolCounts: Record<string, number> = {};
        
        // Make sure data.symbols exists and is an array
        if (Array.isArray(data.symbols) && data.symbols.length > 0) {
          data.symbols.forEach((symbol: string) => {
            // Strip day/night suffix for consistency
            const baseSymbol = symbol.split('_')[0];
            symbolCounts[baseSymbol] = (symbolCounts[baseSymbol] || 0) + 1;
          });
        } else {
          // Default to 'fair' if no symbols are available
          symbolCounts['fair'] = 1;
        }
        
        // Default to first symbol, or 'fair' if no symbols exist
        let mostCommonSymbol = Object.keys(symbolCounts)[0] || 'fair';
        let maxCount = 0;
        
        Object.entries(symbolCounts).forEach(([symbol, count]: [string, number]) => {
          if (count > maxCount) {
            mostCommonSymbol = symbol;
            maxCount = count;
          }
        });
        
        // Calculate total precipitation (with safety check)
        const totalPrecipitation = Array.isArray(data.precipitations) && data.precipitations.length > 0
          ? data.precipitations.reduce((sum: number, precip: number) => sum + precip, 0)
          : 0; // Default to 0mm if no precipitation data
        
        // Calculate average wind speed (with safety check)
        const avgWindSpeed = Array.isArray(data.windSpeeds) && data.windSpeeds.length > 0
          ? data.windSpeeds.reduce((sum: number, speed: number) => sum + speed, 0) / data.windSpeeds.length
          : 2; // Default to 2 m/s if no wind data
        
        // Get the weather condition from mapping
        const weatherInfo = weatherConditions[mostCommonSymbol] || { icon: "cloud-question", condition: "Unknown" };
        
        // Determine mowing condition
        const mowingCondition = getMowingCondition(mostCommonSymbol, totalPrecipitation, avgTemp, avgWindSpeed);
        
        // Create forecast object
        forecasts.push({
          date: day,
          temperature: Math.round(avgTemp),
          condition: weatherInfo.condition,
          precipitation: Math.round(totalPrecipitation * 10) / 10,
          windSpeed: Math.round(avgWindSpeed),
          mowingCondition,
          icon: weatherInfo.icon
        });
      });
    
    return forecasts;
  }
}

export const weatherAPI = new WeatherAPI();
