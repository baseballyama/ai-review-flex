const getEnv = (
  key: string,
  option: {
    defaultValue?: string;
    required?: boolean;
  } = {}
): string => {
  const value = String(process.env[key] ?? "");
  if (!value && option.defaultValue) {
    return option.defaultValue;
  }
  if (option.required === true && !value) {
    throw new Error(`Please set ${key} environment variable.`);
  }
  return value;
};

export const env = {
  github: {
    token: getEnv("GITHUB_TOKEN", { required: true }),
    repository: getEnv("GITHUB_REPOSITORY", { required: true }),
    eventPath: getEnv("GITHUB_EVENT_PATH", { required: true }),
    baseRef: getEnv("BASE_REF", { required: true }),
  },
  openaiApiKey: getEnv("OPENAI_API_KEY", { required: true }),
  language: getEnv("LANGUAGE", { defaultValue: "English", required: true }),
  debug: getEnv("DEBUG")?.toLowerCase() === "true",
  codingGuide: {
    reader: getEnv("CODING_GUIDE_READER") || undefined,
    path: getEnv("CODING_GUIDE_PATH") || undefined,
    level: Number(getEnv("CODING_GUIDE_LEVEL")) || undefined,
  },
};
