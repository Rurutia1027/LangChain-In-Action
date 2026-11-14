import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

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

const articleAnalysisSchema = z.object({
    title: z.string().describe("Article Title"),
    category: z
        .enum([
            "technology",
            "science",
            "business",
            "health",
            "environment",
            "entertainment",
            "other",
        ])
        .describe("Article Category"),
    keyPoints: z
        .array(z.string())
        .min(1)
        .max(5)
        .describe("Key Points of the Article"),
    entities: z
        .array(
            z.object({
                name: z.string().describe("Entity Name"),
                type: z
                    .enum(["person", "organization", "location", "product"])
                    .describe("Entity Type"),
            })
        )
        .describe("Entities Mentioned in the Article"),
    sentiment: z
        .enum(["positive", "negative", "neutral"])
        .describe("Overall Sentiment of the Article"),
    readingTimeMinutes: z
        .number()
        .min(1)
        .max(10)
        .describe("Estimated Reading Time in Minutes"),
});

type ArticleAnalysis = z.infer<typeof articleAnalysisSchema>;

async function main() {
    const model = makeModel();
    const structuredModel = model.withStructuredOutput(articleAnalysisSchema, {
        method: "functionCalling",
        includeRaw: false,
    });

    const prompt = ChatPromptTemplate.fromMessages([
        ["system", "You are a helpful assistant that analyzes articles and provides structured output."],
        ["human", "Analyze the following article: {article}"],
    ]);

    const analysisChain = prompt.pipe(structuredModel);

    const analysis: ArticleAnalysis = await analysisChain.invoke({
        article: `
        Nvidia has released its latest GPU, the GeForce RTX 4090. It is a powerful GPU that is designed for gaming and professional use. It is the fastest GPU on the market and is capable of running the latest games at 4K resolution.
        `,
    });

    console.log(JSON.stringify(analysis, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
