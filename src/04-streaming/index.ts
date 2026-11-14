import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

function makeModel() {
    return new ChatOpenAI({
        model: "deepseek-chat",
        temperature: 0,
        apiKey: process.env.DEEPSEEK_API_KEY,
        configuration: {
            baseURL: process.env.DEEPSEEK_BASE_URL,
        },
    });
}

async function main() {
    const prompt = ChatPromptTemplate.fromTemplate(
        "Explain the concept of {concept} in a way that is easy to understand. "
    );
    const model = makeModel();
    const parser = new StringOutputParser();

    // complete pipeline: ChatModel + StringOutputParser, chunk type is string
    const chain = prompt.pipe(model).pipe(parser);

    // part 1, via stream output token one by one
    console.log("====.stream() print");
    const stream = await chain.stream({ concept: "AI" });
    for await (const chunk of stream) {
        process.stdout.write(chunk);
    }
    console.log();

    // part 2: stream event 
    console.log("---.streamEvents({version: v2})"); 
    const eventStream = chain.streamEvents(
        {concept: "AI"}, 
        {version: "v2"},
    ); 

    for await (const event of eventStream) {
        switch (event.event) {
            case "on_chat_model_stream": {
                const chunk = event.data.chunk; 
                const text = 
                    chunk?.contentBlocks
                    ?.filter((b: {type: string}) => b.type === "text")
                    .map((b: {text?: string}) => b.text ?? "")
                    .join("") ?? ""; 
                
                process.stdout.write(text); 
                break; 
            }
            case "on_chain_start": {
                console.log("\n [chain start] ${event.name}"); 
                break; 
            }

            case "on_chat_model_end": {
                console.log("\n [chain end] ${event.name}"); 
            }

            case "on_chain_end": {
                console.log("\n [chain end] ${event.name}"); 
                break; 
            }
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
