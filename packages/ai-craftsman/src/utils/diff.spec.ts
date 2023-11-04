import { describe, test, expect } from "vitest";
import { splitForEachDiff } from "./diff";

describe("source", () => {
  const diff1 = `\
diff --git a/example.txt b/example.txt
index 2d6ed5b..0a4ef57 100644
--- a/example.txt
+++ b/example.txt
@@ -1,4 +1,3 @@
-この行は削除されます。
  この行は変更されていません。
  この行も変更されていません。
  この行もそのままです。`;

  const diff2 = `\
diff --git a/example.txt b/example.txt
index 0a4ef57..2d6ed5b 100644
--- a/example.txt
+++ b/example.txt
@@ -1,3 +1,4 @@
+この行は追加されました。
  この行は変更されていません。
  この行も変更されていません。
  この行もそのままです。`;

  const diff3 = `\
diff --git a/example.txt b/example.txt
index 2d6ed5b..0a4ef57 100644
--- a/example.txt
+++ b/example.txt
@@ -1,4 +1,4 @@
-この行は削除されます。
+この行は新しく追加されました。
  この行は変更されていません。
  この行も変更されていません。
-この行も削除されます。
+この行も新しく追加されました。`;

  const diff4 = `\
diff --git a/example.txt b/example.txt
index 4e6d5ab..3f7a9c3 100644
--- a/example.txt
+++ b/example.txt
@@ -1,3 +1,3 @@
-これは最初のセクションの古い行です。
+これは最初のセクションの新しい行です。
  ここは最初のセクションの変更されていない行です。
  ここも最初のセクションで変更されていません。

@@ -10,3 +10,12 @@
  これは二番目のセクションの変更されていない行です。
-これは二番目のセクションで削除される行です。
  これも二番目のセクションの変更されていない行です。

@@ -20,2 +19,21 @@
  これは三番目のセクションの変更されていない行です。
+これは三番目のセクションに追加される新しい行です。
  これも三番目のセクションで変更されていません。`;

  test("splitForEachDiff", async () => {
    expect(splitForEachDiff(diff1)).toStrictEqual([
      {
        startRow: 1,
        endRow: 3,
        diff: "1   この行は変更されていません。\n2   この行も変更されていません。\n3   この行もそのままです。",
        type: "delete",
      },
    ]);

    expect(splitForEachDiff(diff2)).toStrictEqual([
      {
        startRow: 1,
        endRow: 4,
        diff: "1 +この行は追加されました。\n2   この行は変更されていません。\n3   この行も変更されていません。\n4   この行もそのままです。",
        type: "add",
      },
    ]);

    expect(splitForEachDiff(diff3)).toStrictEqual([
      {
        startRow: 1,
        endRow: 4,
        diff:
          "1 +この行は新しく追加されました。\n" +
          "2   この行は変更されていません。\n" +
          "3   この行も変更されていません。\n" +
          "4 +この行も新しく追加されました。",
        type: "modify",
      },
    ]);

    console.log(splitForEachDiff(diff4));
    expect(splitForEachDiff(diff4)).toStrictEqual([
      {
        startRow: 1,
        endRow: 3,
        diff:
          "1 +これは最初のセクションの新しい行です。\n" +
          "2   ここは最初のセクションの変更されていない行です。\n" +
          "3   ここも最初のセクションで変更されていません。\n" +
          "4 ",
        type: "modify",
      },
      {
        startRow: 10,
        endRow: 12,
        diff: "10   これは二番目のセクションの変更されていない行です。\n11   これも二番目のセクションの変更されていない行です。\n12 ",
        type: "delete",
      },
      {
        startRow: 19,
        endRow: 21,
        diff:
          "19   これは三番目のセクションの変更されていない行です。\n" +
          "20 +これは三番目のセクションに追加される新しい行です。\n" +
          "21   これも三番目のセクションで変更されていません。",
        type: "add",
      },
    ]);
  });
});
