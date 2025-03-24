import { useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WeatherForecastComponent from "@/components/weather/weather-forecast";
import { useWeatherForecast } from "@/hooks/use-weather";
import { MapPin, RefreshCw } from "lucide-react";

export default function Weather() {
  // Gjersjøen coordinates as default
  const [latitude, setLatitude] = useState("59.7907");
  const [longitude, setLongitude] = useState("10.7686");
  const [activeCoords, setActiveCoords] = useState({ lat: 59.7907, lng: 10.7686 });
  
  const { data: forecast, isLoading, refetch } = useWeatherForecast(
    activeCoords.lat,
    activeCoords.lng
  );

  const handleRefresh = () => {
    refetch();
  };

  const handleCoordinateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveCoords({
      lat: parseFloat(latitude),
      lng: parseFloat(longitude)
    });
  };

  return (
    <AppLayout title="Weather">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <h2 className="text-2xl font-semibold">Weather Forecast</h2>
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh Data
          </Button>
        </div>

        {/* Coordinate selector */}
        <Card className="border border-border bg-card">
          <CardContent className="p-6">
            <form 
              className="flex flex-col md:flex-row gap-4 items-end"
              onSubmit={handleCoordinateSubmit}
            >
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Latitude</label>
                <Input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Enter latitude"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Longitude</label>
                <Input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Enter longitude"
                />
              </div>
              <Button type="submit" className="min-w-[120px]">
                <MapPin className="h-4 w-4 mr-2" /> Set Location
              </Button>
            </form>
            <div className="mt-4 text-xs text-muted-foreground">
              Default coordinates: Gjersjøen (59.7907, 10.7686)
            </div>
          </CardContent>
        </Card>

        {/* Weather forecast */}
        <WeatherForecastComponent 
          forecast={forecast}
          isLoading={isLoading}
          latitude={activeCoords.lat}
          longitude={activeCoords.lng}
        />

        {/* Weather description */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <h3 className="text-lg font-medium">Weather and Mowing Conditions</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Weather data is sourced from the Norwegian Meteorological Institute (yr.no) and updated every 3 hours.
                The forecast provides information relevant to lawn mowing conditions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Mowing Condition Indicators</h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center">
                      <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                      <span>Excellent - Ideal conditions for mowing</span>
                    </div>
                    <div className="flex items-center">
                      <span className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></span>
                      <span>Fair - Acceptable mowing conditions</span>
                    </div>
                    <div className="flex items-center">
                      <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
                      <span>Poor - Not recommended for mowing</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Mowing Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Avoid mowing in heavy rain or when grass is wet</li>
                    <li>Wind speeds over 15km/h may affect cutting pattern</li>
                    <li>Cold temperatures below 5°C reduce battery efficiency</li>
                    <li>Schedule mowing for days with excellent conditions</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
