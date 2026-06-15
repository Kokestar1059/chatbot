# ①課題名
Azure OpenAI チャットボット（v1）

## ②課題内容（どんな作品か）
- Azure OpenAI を使って会話できる、シンプルなチャットボットアプリ
- 複数の会話を持てて、左サイドバーから「New chat」や会話の切り替えができる
- 会話はブラウザの localStorage に自動保存され、リロードしても残る
- 最初の発言から会話タイトルを自動生成。送信失敗時はエラーを画面に表示する
- 素の HTML/CSS/JavaScript（フロント）＋ Vercel serverless function（`/api/chat`）で構成

## ③アプリのデプロイURL
デプロイなし（ローカルで動作）。動かし方は下の「⑦ フリー項目」を参照。

## ④アプリのログイン用IDまたはPassword（ある場合）
なし（ユーザー認証機能はありません）

## ⑤工夫した点・こだわった点
- **API キーを安全に扱う**：Azure のキーはサーバー側（`api/chat.js`）の環境変数からのみ読み、フロントや git には一切含めない設計にした
- **XSS 対策**：画面に出すテキストはすべて `textContent` で挿入し、`innerHTML` を使わない
- **状態と表示の分離**：`main.js`（状態管理・localStorage）と `ui.js`（DOM 描画のみ）を分け、見通しよく保った
- **小さく積み上げる開発**：1 機能 = 1 Issue = 1 ブランチ = レビュー可能な小さなコミット、という流れで段階的に開発した
- **Azure 未設定でも動く**：キーが無いときはエコー応答にフォールバックし、見た目や保存機能を確認できるようにした

## ⑥難しかった点・次回トライしたいこと（又は機能）
- 難しかった点：会話の切り替え・送信中ロック・送信失敗時の巻き戻しなど、状態の整合性を崩さない作り込み
- 難しかった点：API キーを漏らさないためのフロント／サーバーの責務分け
- 次回トライしたい：返答のストリーミング表示、サーバー側への会話保存、デプロイ（Vercel 本番公開）

## ⑦フリー項目（感想、シェアしたいこと等なんでも）

### ローカルでの動かし方
```bash
# 1. 依存をインストール
npm install

# 2. 環境変数ファイルを用意（実値は .env.local に書く。git には含めない）
cp .env.example .env.local
#   → .env.local に Azure OpenAI の接続情報を記入
#     （未記入でも「エコー応答」で動作確認できます）

# 3. 起動（フロントと /api/chat を同時に立ち上げる）
vercel dev
```
表示された URL（通常 `http://localhost:3000`）をブラウザで開く。
※ `npm run dev`（Vite 単体）だと `/api/chat` が動かず送信に失敗します。ローカル開発は `vercel dev` を使ってください。

`.env.local` に書く項目（`.env.example` をコピーして使用）:
```
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com
AZURE_OPENAI_API_KEY=<Azure ポータルのキー>
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-10-21
```

