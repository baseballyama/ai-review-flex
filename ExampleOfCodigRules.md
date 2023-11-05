# Sample Coding Rules for AI Review Flex

The following are sample coding rules that `AI Review Flex`. These rules are written in markdown and should be placed in a file (e.g., `coding_guide.md`) within your repository.

## Use camelCase for variable names

Ensure that all your variable names are in camelCase. For example, use `employeeList` instead of `EmployeeList` or `employee_list`.

- File Pattern: \.(js|ts|jsx|tsx)$
- AI Review: ON

## Functions should have descriptive names

Function names should clearly describe what the function does using verb-noun pairs when applicable, such as `calculateTotal` or `getUserInfo`.

- File Pattern: \.(js|ts)$
- AI Review: ON

## Constants should be in uppercase

All constants should be declared using uppercase letters and underscore separators, like `MAX_RETRY_COUNT`.

- File Pattern: \.(js|ts|jsx|tsx)$
- AI Review: ON

## Comment public methods and classes

All public methods and classes should have JSDoc comments describing their purpose, parameters, and return values.

- File Pattern: \.(js|ts)$
- AI Review: ON

## Avoid 'any' type in TypeScript

The use of `any` type should be avoided in TypeScript files. Instead, use specific types or generics for better type safety.

- File Pattern: \.ts$
- AI Review: ON

## No console logs in production code

Remove all `console.log` statements from the production code to avoid leaking information and cluttering the output.

- File Pattern: \.(js|ts|jsx|tsx)$
- AI Review: ON

## SQL Naming Conventions

Use snake*case for all SQL identifiers, including table names and column names. Prefix tables with `tbl*`and views with`view\_`.

- File Pattern: \.(sql)$
- AI Review: ON

## Commit Messages

All commit messages should follow the conventional commit format for consistency and clarity.

- File Pattern: \.(md|txt|docx)$
- AI Review: OFF
