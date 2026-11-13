import "dotenv/config"; 
import { ChatOpenAI} from "@langchain/openai"; 
import { ChatAnthropic } from "@langchain/anthropic";
import {
    HumanMessage, 
    SystemMessage, 
} from "@langchain/core/messages"; 
import { StringOutputParser } from "@langchain/core/output_parsers"; 
async function basicInvoke() {
    console.log("==== basic invoke ===="); 
    const model = new ChatOpenAI({
        model: "gpt-4o-mini", 
        temperature: 0,  
    }); 

    const response = await model.invoke([
        new SystemMessage("you are a kind AI assistant, please answer in English"), 
        new HumanMessage("Explain what's LangChain in one sentences"), 
    ]); 

    console.log("Model response: ", response.content); 
    console.log("Token usage: ", response.usage_metadata); 
    console.log(); 
}

// streaming output: print token by token 
async function streamingOutput() {
    console.log("==== streaming output ===="); 
    const model = new ChatOpenAI({
        model: "gpt-4o-mini", 
        temperature: 0.7, 
    }); 

    const stream = await model.stream([
        new HumanMessage("Write a short story about a cat"),
    ]); 

    process.stdout.write("Model response: ");  
    for await (const chunk of stream) {
        process.stdout.write(chunk.text ?? ""); 
    }
    console.log("\n"); 
}

async function chainExample() {
    console.log("==== chain example ===="); 
    const model = new ChatOpenAI({
        model: "gpt-4o-mini", 
        temperature: 0, 
    }); 

    // here we use pipe() connect model and output parser into chain 
    const chain = model.pipe(new StringOutputParser()); 

    // invoke return value is string, 
    const result: string = await chain.invoke([
        new HumanMessage("Use a word to describe TypeScript"), 
    ]); 

    console.log("Chain parsed result: ", result); 
    console.log("Return type :", typeof result); 
    console.log(); 
}

async function main() {
    console.log("LangChain.js Agent Lab"); 
    try {
        await basicInvoke(); 
        await streamingOutput(); 
        await chainExample(); 
    } catch (error) {
        console.error("[Fail] validate failure", error); 
        console.error("\n please check your environment variables"); 
        process.exit(1); 
    }
}

main(); 