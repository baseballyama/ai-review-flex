# Sample Coding Rules for AI Review Flex

The following are sample coding rules that `AI Review Flex`. These rules are written in markdown and should be placed in a file (e.g., `coding_guide.md`) within your repository.

## Functions should have descriptive names

Function names should clearly describe what the function does using verb-noun pairs when applicable, such as `calculateTotal` or `getUserInfo`.

- File Pattern: src/.+\.(js|ts)$
- AI Review: ON

## No console logs in production code

Remove all `console.log` statements from the production code to avoid leaking information and cluttering the output.

- File Pattern: src/.+\.(js|ts|jsx|tsx)$
- AI Review: ON

## SQL Naming Conventions

Use snake*case for all SQL identifiers, including table names and column names. Prefix tables with `tbl*`and views with`view\_`.

- File Pattern: src/.+\.(sql)$
- AI Review: ON

## Commit Messages

All commit messages should follow the conventional commit format for consistency and clarity.

- File Pattern: src/.+\.(md|txt|docx)$
- AI Review: OFF
