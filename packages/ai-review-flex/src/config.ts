import * as core from "@actions/core";

const getEnv = (
  key: string,
  option: {
    defaultValue?: string;
    required?: boolean;
  } = {}
): string => {
  const value = String(process.env[key] || core.getInput(key) || "");
  if (!value && option.defaultValue) {
    return option.defaultValue;
  }
  if (option.required === true && !value) {
    throw new Error(`Please set ${key} environment variable.`);
  }
  return value;
};

export const env = {
  openaiApiKey: getEnv("OPENAI_API_KEY", { required: true }),
  language: getEnv("LANGUAGE", { defaultValue: "English", required: true }),
  debug: getEnv("DEBUG")?.toLowerCase() === "true",
  codingGuide: {
    reader: getEnv("CODING_GUIDE_READER") || undefined,
    path: getEnv("CODING_GUIDE_PATH") || undefined,
    level: Number(getEnv("CODING_GUIDE_LEVEL", { defaultValue: "2" })),
    enablePattern: RegExp(
      getEnv("CODING_GUIDE_ENABLE_PATTERN", { defaultValue: "AI Review.*ON" })
    ),
    filePattern: RegExp(
      getEnv("CODING_GUIDE_FILE_PATTERN", {
        defaultValue: "File Pattern:\\s*(.+)$",
      }),
      "m"
    ),
  },
};
