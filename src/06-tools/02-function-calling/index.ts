// Function Calling: same ool hand over to createAgent, and let the model decide invoke which tool 

import { createAgent} from "langchain"; 
import { tool } from "@langchain/core/tools"; 
import { ChatOpenAI} from "@langchain/openai"; 
import {HumanMessage} from "@langchain/core/messages"; 
import { z } from "zod"; 

// here we create the model instance 
function makeModel() {
    return new ChatOpenAI({
        model: "mock-claude", 
        apiKey: process.env.DEEPSEEK_API_KEY ?? "mock-key", 
        temperature: 0, 
        configuration: process.env.OPENAI_API_KEY
        ? undefined 
        : {baseURL: process.env.DEEPSEEK_API_BASE_URL ?? "https://localhost:11434/v1"},  
    }); 
}

const getWeather = tool(
    async ({city}) => {
        return JSON.stringify({city, temperature: 22, condition: "sunny"}); 
    }, 
    {
        name: "get_weather", 
        description: "Get the weather of a city", 
        schema: z.object({
            city: z.string().describe("The city to get the weather of"), 
        }), 
    }
); 

const calculate = tool(
    async ({expression}) => {
        return String(Function(`"use strict"; return (${expression})`)()); 
    }, 
    {
        name: "calculate", 
        description: "Calculate the result, and only return the result, no other text", 
        schema: z.object({
            expression: z.string().describe("The mathematical expression to calculate"),  
        }), 
    }
); 

const tools = [getWeather, calculate]; 

const agent = createAgent({
    model: makeModel(), 
    tools, 
    systemPrompt: "You are a helpful assistant that can answer questions and help with tasks.",  
}); 

const result = await agent.invoke({
    messages: [{role: "user", content: "what is the weather in New York?"}]
}); 

console.log("agent result:", result.messages.at(-1)?.text); 

const model = makeModel(); 
const response = await model.invoke([new HumanMessage("What is the weather in New York?")],
{
    tools, 
    tool_choice: "auto",  
    maxRetries: 3,  
});

if (response.tool_calls && response.tool_calls.length > 0) {
    for (const tc of response.tool_calls) {
        console.log(`single step validation -> tool ${tc.name}, parameter: ${JSON.stringify(tc.args)}`); 
    }
} else {
    console.log("single step validation -> no tool calls");  
}
