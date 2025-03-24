import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WeatherForecast } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { getMowingConditionDetails, getWeatherIcon } from "@/hooks/use-weather";
import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  CloudFog,
  HelpCircle
} from "lucide-react";
import { format } from "date-fns";

interface WeatherForecastProps {
  forecast?: WeatherForecast[];
  isLoading: boolean;
  latitude?: number;
  longitude?: number;
}

export default function WeatherForecast({
  forecast,
  isLoading,
  latitude = 59.7907,
  longitude = 10.7686
}: WeatherForecastProps) {
  // Map icon strings to Lucide icons
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      "sun": Sun,
      "cloud-sun": CloudSun,
      "cloud": Cloud,
      "cloud-drizzle": CloudDrizzle,
      "cloud-rain": CloudRain,
      "cloud-lightning": CloudLightning,
      "cloud-snow": CloudSnow,
      "cloud-fog": CloudFog,
    };
    
    const IconComponent = iconMap[iconName] || HelpCircle;
    return <IconComponent className="h-12 w-12 text-primary" />;
  };
  
  // Format date in a readable way
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return format(date, "EEEE");
    }
  };

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-row justify-between items-center px-4 py-3 border-b border-border">
        <h3 className="font-medium">Weather Forecast</h3>
        <span className="text-sm text-muted-foreground">
          Coordinates: {latitude}, {longitude}
        </span>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-secondary/50">
                <CardContent className="p-4 flex flex-col items-center">
                  <Skeleton className="h-5 w-20 mb-2" />
                  <Skeleton className="h-12 w-12 rounded-full my-2" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-4 w-24 mb-3" />
                  <div className="w-full pt-2 border-t border-border">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !forecast || forecast.length === 0 ? (
          // Empty state
          <div className="text-center py-8">
            <Cloud className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Weather data unavailable</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Unable to fetch weather data at this time. Please check your connection or try again later.
            </p>
          </div>
        ) : (
          // Weather forecast grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {forecast.map((day, index) => {
              const mowingCondition = getMowingConditionDetails(day.mowingCondition);
              
              return (
                <Card key={index} className="bg-secondary/50">
                  <CardContent className="p-4 flex flex-col items-center">
                    <h4 className="font-medium mb-2">{formatDate(day.date)}</h4>
                    <div className="my-2">
                      {getIconComponent(day.icon)}
                    </div>
                    <div className="text-2xl font-semibold">{day.temperature}°C</div>
                    <div className="text-sm text-muted-foreground mb-3">{day.condition}</div>
                    <div className="w-full pt-2 border-t border-border">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Precipitation:</span>
                        <span>{day.precipitation}%</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-muted-foreground">Wind:</span>
                        <span>{day.windSpeed} km/h</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-muted-foreground">Mowing:</span>
                        <span className="flex items-center">
                          <span className="h-2.5 w-2.5 rounded-full bg-${mowingCondition.color}-500 mr-1.5"></span>
                          {mowingCondition.text}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
