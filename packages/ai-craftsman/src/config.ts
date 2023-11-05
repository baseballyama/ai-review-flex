import github from "@actions/github";

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

const required = <T>(key: string, value: T | undefined): T => {
  if (!value) throw new Error(`${key} should be set.`);
  return value;
};

export const env = {
  github: {
    token: getEnv("GITHUB_TOKEN", { required: true }),
    repository: required(
      "GITHUB_REPOSITORY",
      github.context.payload?.repository
    ),
    eventPath: getEnv("GITHUB_EVENT_PATH", { required: true }),
    baseRef: required(
      "github.base_ref",
      String(github.context.payload.pull_request?.["base"]?.ref || "")
    ),
    comment:
      String(github.context?.payload?.comment?.["body"] ?? "") || undefined,
  },
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
