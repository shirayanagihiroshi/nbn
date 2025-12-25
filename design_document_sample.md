# アプリケーション設計図

## 1. 概要

このドキュメントは、新しいWebアプリケーションの設計について記述したものです。
ユーザー認証機能を持ち、ログイン後にダッシュボードが表示されるシンプルなアプリケーションを想定しています。

## 2. システム構成図

全体の構成を以下に示します。

```mermaid
graph TD
    subgraph "クライアント"
        User[ユーザー] --> Browser[Webブラウザ]
    end

    subgraph "サーバー"
        Browser -- HTTPS --> WebServer[Webサーバー(Node.js/Express)]
        WebServer --> AuthService[認証サービス]
        WebServer --> APIServer[APIサーバー]
        APIServer --> Database[(データベースPostgreSQL)]
    end

    style User fill:#f9f,stroke:#333,stroke-width:2px
    style Browser fill:#ccf,stroke:#333,stroke-width:2px
```

## 3. シーケンス図

### 3.1. ユーザーログイン

ユーザーがログインする際のシーケンス図です。

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Browser as ブラウザ
    participant Server as サーバー
    participant DB as データベース

    User->>Browser: ログインページにアクセス
    Browser->>Server: GET /login
    Server-->>Browser: ログインページのHTMLを返す
    Browser-->>User: ログインページを表示

    User->>Browser: メールアドレスとパスワードを入力し送信
    Browser->>Server: POST /api/login (認証情報)
    Server->>DB: ユーザー情報を照会
    DB-->>Server: ユーザー情報を返す

    alt 認証成功
        Server-->>Browser: 成功レスポンス (セッショントークン)
        Browser->>Server: GET /dashboard
        Server-->>Browser: ダッシュボードのHTMLを返す
        Browser-->>User: ダッシュボードを表示
    else 認証失敗
        Server-->>Browser: エラーレスポンス
        Browser-->>User: エラーメッセージを表示
    end
```

## 4. クラス図

サーバーサイドの主要なクラス構成です。

```mermaid
classDiagram
    class User {
        -string userId
        -string username
        -string hashedPassword
        +login(password) bool
        +getProfile() UserProfile
    }

    class AuthService {
        +authenticate(username, password) User
        +createSession(user) string
    }

    class UserController {
        -AuthService authService
        +handleLogin(req, res)
        +handleGetDashboard(req, res)
    }

    UserController ..> AuthService : uses
    AuthService ..> User : uses
```

## 5. 状態遷移図

ユーザーの状態遷移を示します。

```mermaid
stateDiagram-v2
    [*] --> 未ログイン
    未ログイン --> ログイン中: ログイン試行
    ログイン中 --> ログイン済み: 認証成功
    ログイン中 --> 未ログイン: 認証失敗
    ログイン済み --> 未ログイン: ログアウト
    ログイン済み --> [*]
```
