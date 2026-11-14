import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";

function makeModel(temperature = 0) {
    return new ChatOpenAI({
        model: "deepseek-chat",
        temperature,
        apiKey: process.env.DEEPSEEK_API_KEY,
        configuration: {
            baseURL: process.env.DEEPSEEK_BASE_URL,
        },
    });
}

// -- part 1: minimal chain prompt | model | parser  
const explainPrompt = ChatPromptTemplate.fromTemplate(
    "Explain the concept of {concept} in a way that is easy to understand."
); 
const parser = new StringOutputParser();  
const explainChain = explainPrompt.pipe(makeModel()).pipe(parser); 

const explanation = await explainChain.invoke({
    concept: "AI"
}); 

console.log("explain in one sentence: ", explanation); 
console.log("type: " + typeof explanation); 

// -- part 2: four steps pipeline 

// 1. define schema of output message 
const reviewSchema = z.object({
    summary: z.string().describe("Summary of the review"), 
    props: z.array(z.string()).describe("Pros of the product"),  
    cons: z.array(z.string()).describe("Cons of the product"),  
    rating: z.number().min(1).max(5).describe("Rating of the product"),  
}); 

// 2. via withStructuredOutput, we can create a structured model  
const structuredModel = makeModel().withStructuredOutput(reviewSchema, {
    method: "functionCalling", 
}); 

// 3. prompt 
const reviewPrompt = ChatPromptTemplate.fromTemplate(`
    You are a helpful assistant that analyzes product reviews and provides structured output.  
    product name: {product}
    user review: {feedback}    
`); 

function addRatingDisplay(review: z.infer<typeof reviewSchema>) {
    const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
    return { ...review, display: `${stars} (${review.rating}/5)` };
}

// compose into runnable sequence here 
const reviewChain = RunnableSequence.from([
    reviewPrompt, 
    structuredModel,  
    addRatingDisplay, 
]); 

const result = await reviewChain.invoke({
    product: "AirPods Pro2", 
    feedback: "I love these AirPods! They are so comfortable and easy to use. I highly recommend them to anyone in the market for a new pair of headphones." 
}); 


console.log("review content (4 step pipeline)");
console.log(JSON.stringify(result, null, 2));  