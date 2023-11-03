## コンポーネントファイル構造

| Meta      | Content                                         |
| --------- | ----------------------------------------------- |
| Level     | 必須                                            |
| Link      | https://angular.io/guide/styleguide#style-04-06 |
| AI Review | OFF                                             |

### 説明

各コンポーネントは独自のディレクトリを持ち、そのディレクトリ内にはコンポーネントのクラスファイル、テンプレート、スタイル、テストが含まれるべきです。

### 理由

コンポーネントの関連ファイルを一箇所に集めることで、コンポーネントの再利用性を高め、管理を容易にします。また、新しい開発者がプロジェクトに参加した際の学習コストを削減します。

### 例

```
// 良いコードの例
/src
  /app
    /button
      button.component.ts
      button.component.html
      button.component.css
      button.component.spec.ts

// 悪いコードの例
/src
  /components
    button.ts
    /styles
      button.css
  /views
    button.html
```

### 例外ケース

- ユーティリティ関数やサービスなど、特定のコンポーネントに紐付かない共有ファイルは共通のディレクトリに配置する。

### リファクタリングガイドライン

既存プロジェクトでは、大幅なディレクトリ構造の変更を避け、新規コンポーネントからこの規則に従うこと。時間が許せば、徐々に既存のコンポーネントも新しいファイル構造に移行させる。

---

## 非同期操作の取り扱い

| Meta      | Content                                                                                     |
| --------- | ------------------------------------------------------------------------------------------- |
| Level     | 必須                                                                                        |
| Link      | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function |
| AI Review | ON                                                                                          |

### 説明

非同期操作は`async/await`パターンを使用して実装すること。コールバックや`.then()`、`.catch()`メソッドを用いた Promise チェーンは避ける。

### 理由

`async/await`は非同期コードをより読みやすく、同期的な流れで記述できるためです。コードの可読性とメンテナンス性が向上します。

### 例

```typescript
// 良いコードの例
async function getUser(id: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);
    const user = await response.json();
    return user;
  } catch (error) {
    throw new Error(error);
  }
}

// 悪いコードの例
function getUser(id: string): Promise<User> {
  return fetch(`/api/users/${id}`)
    .then((response) => response.json())
    .then((user) => user)
    .catch((error) => {
      throw new Error(error);
    });
}
```

### 例外ケース

- 既存のコードベースで`Promise`チェーンが広範に使用されている場合は、段階的に`async/await`にリファクタリングする。

### リファクタリングガイドライン

新規プロジェクトや新規機能では`async/await`を用いること。既存のコードは、重要なバグ修正や機能追加の際に、この新しいパターンに徐々に置き換えていく。

## 型定義の適用

| Meta      | Content                                                            |
| --------- | ------------------------------------------------------------------ |
| Level     | 必須                                                               |
| Link      | https://www.typescriptlang.org/docs/handbook/2/everyday-types.html |
| AI Review | ON                                                                 |

### 説明

全ての変数、関数の引数、および戻り値には明示的な型またはインターフェースを指定すること。

### 理由

型を明示的に宣言することで、コンパイル時の型チェックの恩恵を受けられ、ランタイムエラーのリスクを減らします。また、コードの意図が明確になり、他の開発者がコードを理解しやすくなります。

### 例

```typescript
// 良いコードの例
function add(x: number, y: number): number {
  return x + y;
}

// 悪いコードの例
function add(x, y) {
  return x + y;
}
```

### 例外ケース

- ライブラリが提供する関数や変数の型が any である場合は、適宜型アサーションを使用する。

### リファクタリングガイドライン

既存のコードでは、任意の型が使われていた場合、それを具体的な型に置き換えていく。新規コードでは初めから型を適用する。

---

## ユニットテストの実施

| Meta      | Content                                |
| --------- | -------------------------------------- |
| Level     | 推奨                                   |
| Link      | https://jestjs.io/docs/getting-started |
| AI Review | OFF                                    |

### 説明

新しく追加する全ての関数に対してユニットテストを書き、既存の関数についても段階的にテストを追加する。

### 理由

ユニットテストにより、コードの品質を保ち、将来的な機能追加やリファクタリングが安全に行われるようにします。バグの発見を早期に行い、修正コストを削減する効果もあります。

### 例

```typescript
// 良いコードの例（テストの例）
describe("add function", () => {
  it("adds two numbers correctly", () => {
    expect(add(1, 2)).toBe(3);
  });
});

// 悪いコードの例（テストがない）
function add(x: number, y: number): number {
  return x + y;
}
```

### 例外ケース

- 外部 API の結果に依存する関数など、テストが困難なケースでは、モックを使用して依存関係を切り離す。

### リファクタリングガイドライン

テストがない既存の関数に対しては、新しいバグ報告や機能追加があるたびにユニットテストを追加していく。新規関数では最初からテストを書くことをルール化する。
