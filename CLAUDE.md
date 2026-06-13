# CLAUDE.md

このリポジトリで作業する Claude Code 用のガイド。**変化の遅いものだけ**をここに置く。
「今どこまで進んだか（現在地）」は **GitHub Issue #1（トラッキング）** と `git log` を見る。

---

## 1. このプロジェクトは何か
Azure OpenAI を使ったシンプルなチャットボット（学校提出用 v1）。**ローカルで動くこと**がゴール。
これは「AIのコーディングをブラックボックスにせず、開発者が各ステップを把握しながら進める」**演習**でもある。
→ だから **一度に全部作らない**。Issue 単位で1機能ずつ、対話しながら積む。

## 2. スタック
- フロント: Vite + 素の HTML/CSS/JavaScript（フレームワーク・jQuery なし）
- バックエンド: Vercel serverless function (`/api/chat`)
- AI: Azure OpenAI（公式 `openai` SDK の `AzureOpenAI` クラス、モデルは gpt-4o-mini 想定）
- データ保存: ブラウザの localStorage のみ（DB・認証なし）

## 3. ディレクトリ（完成時の予定）
```
index.html        … Vite エントリ（ルート直下）
src/main.js       … 状態管理 + localStorage + イベント配線
src/ui.js         … DOM 描画のみ（状態を持たない）
src/chat.js       … /api/chat を fetch で呼ぶ
src/style.css     … レイアウト
api/chat.js       … serverless function（Azure を呼ぶ・キーを持つ）
```
※ まだ存在しないファイルもある。各スライスで順に作る。

## 4. コマンド
- `npm install` … 依存インストール
- `vercel dev` … フロント(Vite) と `/api/chat` を同時起動（ローカル開発はこれ）
- `npm run build` … 本番ビルド（Vite）

## 5. 最重要ルール（破ってはいけない）
- **Azure の API キーをフロント側や git に絶対含めない。** キーは `api/chat.js` で環境変数からのみ読む。
- `.env` / `.env.local` は `.gitignore` 済み。コミットしない。
- フロントに表示するテキストは `textContent` で挿入（`innerHTML` 禁止・XSS 対策）。

## 6. 開発ワークフロー（演習の核心）
- **1 Issue = 1 スライス = 1 セッション = レビュー可能な小さなコミット**。
- 着手前に対象 Issue を読む。完了したら Issue をクローズし、トラッキング #1 のチェックを入れる。
- コミットは **Conventional Commits** で、Issue 番号を紐付ける:
  - 例: `feat: add /api/chat serverless function (#3)` / 本文末尾に `Closes #3`
  - 種別: `feat`（新機能） / `fix`（修正） / `refactor` / `docs` / `chore`
- **決定の理由（なぜそうしたか）は Issue 本文・コメントに残す**（横断的な重要決定はメモリにも）。
  別途 decisions.md のような markdown は作らない。

## 7. セッション再開手順（新しいセッションを開いたらまずこれ）
現在地は次の3つを読めば一意に分かる:
1. **トラッキング Issue #1**（`gh issue view 1`）… 7スライスのチェックリスト＝進捗ボード
2. **`git log --oneline`** … 何が積まれたか
3. **`gh issue list`** … 残っているタスク

→ 「直近の完了」と「次にやる Issue」を把握してから着手する。

## 8. 途中変更の扱い
- **新機能を足したい** → 新しい Issue を立てる（既存を壊さない）。enhancement ラベル。
- **方向転換 / 仕様変更** → 影響する Issue を編集 or クローズ。必要なら CLAUDE.md（§2,3,9）を更新し、
  変更理由を該当 Issue に書く。
- **大きな修正** → Issue を立ててブランチで作業。
- **小さな修正** → その場で直して `fix:` コミット（Issue 不要、あれば紐付け）。

## 9. データモデル（localStorage キー: `chatbot:v1:conversations`）
```
Conversation = { id: string, title: string, messages: Message[] }
Message      = { role: "user" | "assistant", content: string }
```
- `id` は `crypto.randomUUID()`。`title` は最初のユーザー発言から自動生成。
- Azure はステートレスなので、送信時は会話の messages 全体を毎回送る。

## 10. v1 スコープ外（やらない）
ユーザー認証 / サーバー DB・Supabase / 返答のストリーミング表示 / 凝ったデザイン。
