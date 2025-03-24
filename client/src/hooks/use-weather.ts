import { useQuery } from "@tanstack/react-query";
import { WeatherForecast } from "@shared/schema";

export const useWeatherForecast = (latitude = 59.7907, longitude = 10.7686) => {
  return useQuery<WeatherForecast[]>({
    queryKey: ["/api/weather", { latitude, longitude }],
    staleTime: 3600000, // 1 hour stale time for weather data
  });
};

// Get weather icon based on condition
export const getWeatherIcon = (iconName: string) => {
  const iconsMap: Record<string, string> = {
    "sun": "sun",
    "cloud-sun": "cloud-sun",
    "cloud": "cloud",
    "cloud-drizzle": "cloud-drizzle",
    "cloud-rain": "cloud-rain",
    "cloud-lightning": "cloud-lightning",
    "cloud-snow": "cloud-snow",
    "cloud-fog": "cloud-fog",
    "cloud-sleet": "cloud-sleet",
  };
  
  return iconsMap[iconName] || "cloud-question";
};

// Get mowing condition details
export const getMowingConditionDetails = (condition: 'excellent' | 'good' | 'fair' | 'poor'): { text: string; color: string } => {
  const conditionMap: Record<string, { text: string; color: string }> = {
    excellent: { text: "Excellent", color: "green" },
    good: { text: "Good", color: "green" },
    fair: { text: "Fair", color: "yellow" },
    poor: { text: "Poor", color: "red" },
  };
  
  return conditionMap[condition] || { text: "Unknown", color: "gray" };
};
