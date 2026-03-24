export type WeatherApiResponse = {
  text: string;
  temperature_2m?: number;
  relative_humidity_2m?: number;
  apparent_temperature?: number;
  precipitation?: number;
  wind_speed_10m?: number;
  weather_condition?: string;
  weather_code?: number;
};
