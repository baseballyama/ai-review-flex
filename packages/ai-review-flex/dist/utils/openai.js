import tiktoken from "tiktoken-node";
import OpenAI from "openai";
import { env } from "../config.js";
const openai = new OpenAI({
    apiKey: env.openaiApiKey,
});
const encoding = tiktoken.getEncoding("cl100k_base");
export const getTokenCount = (text) => {
    return encoding.encode(text).length;
};
export const chat = async (messages) => {
    const tokenCount = messages.reduce((acc, message) => {
        return acc + getTokenCount(message.content ?? "");
    }, 0);
    const model = tokenCount * 1.1 + 1024 < 8 * 1024 ? "gpt-4" : "gpt-4-32k";
    const body = { model, messages, temperature: 0 };
    const response = await openai.chat.completions.create(body, {
        maxRetries: 2,
        timeout: Math.trunc(Math.max(90 * 1000, Math.min(1000 * 20, tokenCount / 10))),
    });
    if (env.debug) {
        console.debug("Call OpenAI API", {
            body: JSON.stringify(body, null, 2),
            response: JSON.stringify(response, null, 2),
        });
    }
    return response.choices[0]?.message?.content ?? "";
};
