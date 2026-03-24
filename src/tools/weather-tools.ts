import { fetchWeatherApi } from "openmeteo";
import { StringUtils } from "../helpers/stringUtils.ts";
import { getWeatherCode } from "../helpers/weatherUtils.ts";
import { WeatherApiResponse } from "../models.ts";

/**
 * Gets a city's weather information.
 * @param city - The name of the city to get the weather for.
 * @returns WeatherApiResponse containing the weather information for the specified city.
 **/
export const getCityWeather = async (
  city: string,
): Promise<{ weatherApiResponse: WeatherApiResponse }> => {
  city = StringUtils.capitalize(city.trim());
  const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geoUrl.searchParams.append("name", city);
  geoUrl.searchParams.append("count", "1");
  geoUrl.searchParams.append("language", "en");

  const geoRes = await fetch(geoUrl.toString());
  if (!geoRes.ok) {
    throw new Error(
      `Geocoding request failed: ${geoRes.status} ${geoRes.statusText}`,
    );
  }
  const geoData = await geoRes.json();
  if (!geoData.results?.length) {
    throw new Error(`City "${city}" not found`);
  }

  const { latitude, longitude } = geoData.results[0];

  const responses = await fetchWeatherApi(
    "https://api.open-meteo.com/v1/forecast",
    {
      latitude,
      longitude,
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "precipitation",
        "wind_speed_10m",
        "weather_code",
      ],
      forecast_days: 1,
    },
  );

  const current = responses[0].current()!;

  // Variable indices correspond to request order:
  // 0: temperature_2m, 1: relative_humidity_2m, 2: apparent_temperature,
  // 3: precipitation, 4: wind_speed_10m, 5: weather_code
  const getCurrentWeatherMetric = (index: number): number =>
    current.variables(index)?.value() ?? 0;

  const weatherCondition = getWeatherCode(getCurrentWeatherMetric(5) ?? -1);

  const weatherData = {
    current: {
      time: new Date(Number(current?.time())).toLocaleDateString(),
      temperature_2m: Math.floor(getCurrentWeatherMetric(0)),
      relative_humidity_2m: Math.floor(getCurrentWeatherMetric(1)),
      apparent_temperature: Math.floor(getCurrentWeatherMetric(2)),
      precipitation: Math.floor(getCurrentWeatherMetric(3)),
      wind_speed_10m: Math.floor(getCurrentWeatherMetric(4)),
      weather_condition: weatherCondition,
    },
  };

  const currentWeatherText = [
    `The current temperature for ${city} is ${weatherData.current.temperature_2m}°C, feels like ${weatherData.current.apparent_temperature}°C.`,
    `Weather Condition: ${weatherCondition}`,
    `Humidity: ${weatherData.current.relative_humidity_2m}%`,
    `Precipitation: ${weatherData.current.precipitation}mm`,
    `Wind speed: ${weatherData.current.wind_speed_10m} km/h`,
  ].join("\n");

  return {
    weatherApiResponse: {
      text: `${currentWeatherText}`,
      ...weatherData.current,
    },
  };
};
