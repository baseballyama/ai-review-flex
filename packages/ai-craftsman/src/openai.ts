import tiktoken from "tiktoken-node";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: String(process.env["OPENAI_API_KEY"]),
});

const encoding = tiktoken.getEncoding("cl100k_base");

export const getTokenCount = (text: string): number => {
  return encoding.encode(text).length;
};

export const chat = async (messages: OpenAI.ChatCompletionMessageParam[]) => {
  const tokenCount = messages.reduce((acc, message) => {
    return acc + getTokenCount(message.content ?? "");
  }, 0);

  const model = tokenCount * 1.1 + 1024 < 8 * 1024 ? "gpt-4" : "gpt-4-32k";
  const response = await openai.chat.completions.create(
    {
      model,
      messages,
      temperature: 0,
      max_tokens: Math.trunc(Math.min(1024, (16 * 1024 - tokenCount) * 0.9)),
    },
    {
      maxRetries: 2,
      timeout: Math.trunc(
        Math.max(90 * 1000, Math.min(1000 * 20, tokenCount / 10))
      ),
    }
  );

  return response.choices[0]?.message?.content ?? "";
};
