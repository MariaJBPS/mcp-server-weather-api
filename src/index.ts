import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getCityWeather } from "./tools/weather-tools.ts";

const server = new McpServer({
  name: "weather-mcp-server",
  description: "An example MCP server implemented in TypeScript",
  version: "1.0.0",
});

server.registerTool(
  "get-city-weather",
  {
    title: "Gets a city's weather information.",
    description:
      "Retrieves current weather conditions including temperature, humidity, precipitation, and wind speed for a specified city.",
    inputSchema: z.object({
      city: z.string().describe("The name of the city to get the weather for."),
    }),
  },
  async ({ city }) => {
    try {
      const { weatherApiResponse } = await getCityWeather(city);
      return {
        content: [
          {
            type: "text",
            text: weatherApiResponse.text,
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
