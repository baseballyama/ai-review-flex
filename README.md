# AI Review Flex

`AI Review Flex` is a versatile GitHub Action that employs AI to review code against project-specific guidelines. By interpreting markdown coding guides, it delivers tailored feedback for each pull request to uphold your coding standards.

### Goals of AI Review Flex

The primary goal of `AI Review Flex` is to streamline the code review process by integrating AI-powered analysis into your project workflow. This tool aims to:

- **Enforce Coding Standards**: Automatically ensure that all code submissions adhere to your project's specific coding guidelines.
- **Enhance Code Quality**: Assist in maintaining high code quality by providing smart, context-aware suggestions for improvement.
- **Save Time**: Reduce the manual effort required in code reviews, allowing developers to focus on more complex tasks.
- **Facilitate Learning**: Help team members learn coding standards and best practices through consistent, AI-driven feedback.
- **Support Incremental Improvement**: Enable incremental reviews to gradually improve code within the context of recent changes.

By integrating `AI Review Flex` into your GitHub Actions, you embrace a proactive approach to code quality that benefits the whole development team, leading to more reliable and maintainable codebases.

### Non-Goals of AI Review Flex

While `AI Review Flex` aims to enhance the code review process, it's important to note the boundaries of its functionality. The following are explicitly not goals of this tool:

- **Non-Review Assistance**: `AI Review Flex` is not designed to provide support beyond code reviews, such as generating summaries for pull requests or conducting any form of project management.
- **Standalone Library Provision**: The tool is solely created to function as a GitHub Action. It is not intended to be used as a library or to be integrated into other forms of CI/CD pipelines outside GitHub.

## Prerequisites

To use `AI Review Flex`, make sure you have:

- A GitHub repository.
- An OpenAI API Key.

## Setup

Incorporate this action in your workflow (`.github/workflows/main.yml`) with the required settings:

```yaml
- uses: actions/checkout@v4
  with:
    # Needed to get diffs
    fetch-depth: 0
- name: AI Review Flex
  uses: baseballyama/ai-review-flex@v0
  with:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    LANGUAGE: "English"
    CODING_GUIDE_PATH: "path/to/guide.md"
    CODING_GUIDE_LEVEL: 2
    CODING_GUIDE_ENABLE_PATTERN: "AI Review.*ON"
    CODING_GUIDE_FILE_PATTERN: "File Pattern:\\s*`?(.+)`?$"
    CODING_GUIDE_READER: "path/to/custom_reader.js"
    DEBUG: false
```

## Customizing Coding Rules

Configure these parameters in the workflow for tailored coding standard reviews:

| Parameter                     | Description                                  | Required | Default                     |
| ----------------------------- | -------------------------------------------- | -------- | --------------------------- |
| `CODING_GUIDE_PATH`           | Path to markdown coding rules.               | No       | -                           |
| `CODING_GUIDE_LEVEL`          | Markdown level to interpret as rules.        | No       | `2`                         |
| `CODING_GUIDE_ENABLE_PATTERN` | Regex pattern to match reviewed rules.       | No       | `AI Review.*ON`             |
| `CODING_GUIDE_FILE_PATTERN`   | Regex for file paths to apply rules.         | No       | `File Pattern:\s*/?(.+)/?$` |
| `CODING_GUIDE_READER`         | Path to a `.js` custom rule reader function. | No       | -                           |
| `LANGUAGE`                    | Language preference for reviews.             | No       | "English"                   |
| `DEBUG`                       | Enable debug mode for detailed logs.         | No       | `false`                     |

Example custom rule reader function:

```javascript
import * as fs from "node:fs";

export default async (): Promise<{ rule: string, filePattern: RegExp }[]> => {
  const markdown = await fs.promises.readFile("GUIDE.md", "utf-8");
  return markdown
    .split("## ")
    .map((rule) => `## ${rule}`)
    .filter(() => {
      /** some filter process */
      return true;
    })
    .map((rule) => {
      const [, filePattern = ".*"] = rule.match(/File Pattern: (\S+)$/m) ?? [];
      return { rule, filePattern: RegExp(filePattern) };
    });
};
```

Set the custom reader in your workflow as:

```yaml
CODING_GUIDE_READER: "path/to/your/rules-reader.js"
```

## Example of Coding Rules

Please see [ExampleOfCodigRules.md](./ExampleOfCodigRules.md) to check example of coding rules.

### Incremental Reviews

`AI Review Flex` supports not only one-time comprehensive reviews but also incremental reviews. Incremental reviews focus on changes made since the last code analysis, allowing for continuous integration of feedback and improvements. To initiate an incremental review on your pull request, simply add the following comment:

```markdown
/ai-review-flex incremental
```

For a full review that encompasses all changes in the pull request, use the comment:

```markdown
/ai-review-flex
```

This feature ensures that your team can keep code quality high by systematically reviewing incremental changes, thus making code reviews more efficient and focused.

## Usage

Configure the action, and it will automatically review PRs based on your rules.

## Contributing

Suggestions and contributions are appreciated! Feel free to submit issues or pull requests.

## License

Distributed under the MIT License.
