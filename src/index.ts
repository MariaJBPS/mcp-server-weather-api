import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fetchWeatherApi } from "openmeteo";

const server = new McpServer({
  name: "weather-mcp-server",
  description: "An example MCP server implemented in TypeScript",
  version: "1.0.0",
});

server.registerTool(
  "get-weather",
  {
    title: "Gets a city's weather information.",
    description: "",
    inputSchema: z.object({
      city: z.string().describe("The name of the city to get the weather for."),
    }),
  },
  async ({ city }) => {
    try {
      city = capitalize(city.trim());
      const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
      geoUrl.searchParams.append("name", city);
      geoUrl.searchParams.append("count", "1");
      geoUrl.searchParams.append("language", "en");

      const geoRes = await fetch(geoUrl.toString());
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

      const weatherCondition = getWeatherCode(
        current.variables(5)?.value() ?? -1,
      );

      const weatherData = {
        current: {
          time: new Date(Number(current?.time())).toLocaleDateString(),
          temperature_2m: Math.floor(current.variables(0)!.value()),
          relative_humidity_2m: Math.floor(current.variables(1)!.value()),
          apparent_temperature: Math.floor(current.variables(2)!.value()),
          precipitation: Math.floor(current.variables(3)!.value()),
          wind_speed_10m: Math.floor(current.variables(4)!.value()),
          weather_condition: weatherCondition,
        },
      };

      const currentWeatherText = [
        `Weather Condition: ${weatherCondition}`,
        `Humidity: ${weatherData.current.relative_humidity_2m}%`,
        `Precipitation: ${weatherData.current.precipitation}mm`,
        `Wind speed: ${weatherData.current.wind_speed_10m} km/h`,
      ].join("\n");
      return {
        content: [
          {
            type: "text",
            text: `The current temperature for ${city} is ${weatherData.current.temperature_2m}°C, feels like ${weatherData.current.apparent_temperature}°C.${currentWeatherText}`,
          },
        ],
      };
    } catch (err) {
      console.error("Tool error:", err);
      throw err;
    }
  },
);

const transport = new StdioServerTransport();
server.connect(transport);

console.error("Server starting...");

const weatherCodeMap: Record<number, string> = {
  0: "Clear sky",

  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",

  45: "Fog",
  48: "Depositing rime fog",

  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",

  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",

  61: "Light rain",
  63: "Moderate rain",
  65: "Heavy rain",

  66: "Light freezing rain",
  67: "Heavy freezing rain",

  71: "Light snowfall",
  73: "Moderate snowfall",
  75: "Heavy snowfall",

  77: "Snow grains",

  80: "Light rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",

  85: "Light snow showers",
  86: "Heavy snow showers",

  95: "Thunderstorm (slight or moderate)",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

const getWeatherCode = (weather_code: number): string =>
  weatherCodeMap[weather_code] ?? "Unknown weather condition.";

const capitalize = (value: string): string =>
  `${value[0].toUpperCase()}${value.substring(1)}`;
