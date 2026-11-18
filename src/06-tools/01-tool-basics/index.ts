// how to use tools in langgraph  
// first create helper + Zod schema define tool, and then hand ove it to createAgent to schedule 
import { createAgent} from "langchain"; 
import { tool } from "@langchain/core/tools"; 
import { ChatOpenAI } from "@langchain/openai";  
import { z } from "zod"; 

function makeModel() {
    return new ChatOpenAI({
        model: "mock-claude", 
        apiKey: process.env.DEEPSEEK_API_KEY ?? "mock-key",   
        temperature: 0, 
        configuration: process.env.DEEPSEEK_API_KEY
        ? undefined 
        : {baseURL: process.env.DEEPSEEK_API_BASE_URL ?? "https://localhost:11434/v1"},  
    }); 
}

// how to define a tool?
// name + description + Zod schema + execute function  
const getWeather = tool(
    async ({city, unit}) => {
        const data: Record<string, {temp: number, condition: string}> = {
            "New York": {temp: 20, condition: "sunny"},
            "Los Angeles": {temp: 25, condition: "sunny"},
            "Chicago": {temp: 18, condition: "cloudy"},
            "Houston": {temp: 22, condition: "rainy"},
            "Miami": {temp: 28, condition: "sunny"},
            "San Francisco": {temp: 16, condition: "cloudy"},
            "Seattle": {temp: 12, condition: "rainy"},
            "Boston": {temp: 14, condition: "cloudy"},
            "Washington": {temp: 17, condition: "rainy"}, 
        }; 
        const found = data[city]; 
        if (!found) {
            return JSON.stringify({error: `City ${city} not found`}); 
        }

        const temp = unit == "fahrenheit" ? (found.temp * 9) / 5 + 32 : found.temp; 
        return JSON.stringify({city, temperature: temp, condition: found.condition}); 
    }, 
    {
        name: "get_weather", 
        description: "Get the weather of a city", 
        schema: z.object({
            city: z.string().describe("The city to get the weather of"), 
            unit: z.enum(["celsius", "fahrenheit"]).describe("The unit of the temperature"), 
        }), 
    }
); 

// second calculator tool  
const calculate = tool(
    async ({expression}) => {
        return String(Function(`"use strict";  return (${expression})`)()); 
    }, 
    {
        name: "calculate", 
        description: "Calculate the result of a mathematical expression",  
        schema: z.object({
            expression: z.string().describe("The mathematical expression to calculate"),  
        })
    }
); 

const direct = await getWeather.invoke({city: "New York", unit: "celsius"}); 
console.log("direct get weather", direct); 

const agent = createAgent({
    model: makeModel(), 
    tools: [getWeather, calculate], 
    systemPrompt: "You are a helpful assistant that can answer questions and help with tasks.",    
}); 

const result = await agent.invoke({
    messages: [{role: "user", content: "what is the weather in New York?"}], 
}); 

console.log("agent result", result.messages.at(-1)?.text); 