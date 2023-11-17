import tiktoken from "tiktoken-node";
import OpenAI from "openai";
import { env } from "../config.js";

const openai = new OpenAI({
  apiKey: env.openaiApiKey,
});

const encoding = tiktoken.getEncoding("cl100k_base");

export const getTokenCount = (text: string): number => {
  return encoding.encode(text).length;
};

export const chat = async (messages: OpenAI.ChatCompletionMessageParam[]) => {
  const tokenCount = messages.reduce((acc, message) => {
    const { content } = message;
    if (content == null) return acc;
    if (typeof content === "string") {
      return acc + getTokenCount(content);
    } else {
      const tokenCounts = content.reduce((init, c) => {
        if (c.type === "text") {
          return init + getTokenCount(c.text);
        } else {
          return init;
        }
      }, 0);
      return acc + tokenCounts;
    }
  }, 0);

  const body = { model: "gpt-4-1106-preview", messages, temperature: 0 };
  const response = await openai.chat.completions.create(body, {
    maxRetries: 2,
    timeout: Math.trunc(
      Math.max(90 * 1000, Math.min(1000 * 20, tokenCount / 10))
    ),
  });

  if (env.debug) {
    console.debug("Call OpenAI API", {
      body: JSON.stringify(body, null, 2),
      response: JSON.stringify(response, null, 2),
    });
  }

  return response.choices[0]?.message?.content ?? "";
};
