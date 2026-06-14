import { AzureOpenAI } from "openai";

// Vercel serverless function: POST /api/chat
// 受け取った会話 messages を Azure OpenAI に送り、AI の返答を { reply } で返す。
// Azure の環境変数が未設定のときは、疎通確認用にエコー応答へフォールバックする。
//
// 最重要: キー類は環境変数からのみ読む。レスポンスにもフロントにも出さない。

export default async function handler(req, res) {
  // 環境変数はリクエストごとに読む（.env.local の追記が再起動後に確実に反映される）。
  const {
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_DEPLOYMENT,
    AZURE_OPENAI_API_VERSION,
  } = process.env;

  // 4変数すべて揃っていれば Azure 実呼び出し、欠けていればエコーモード。
  const azureConfigured = Boolean(
    AZURE_OPENAI_ENDPOINT &&
      AZURE_OPENAI_API_KEY &&
      AZURE_OPENAI_DEPLOYMENT &&
      AZURE_OPENAI_API_VERSION
  );

  // POST のみ受ける。
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // body から messages を受け取りバリデーション。
  const messages = req.body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages (non-empty array) is required" });
  }
  const valid = messages.every(
    (m) =>
      m &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string"
  );
  if (!valid) {
    return res
      .status(400)
      .json({ error: "each message must be { role: 'user'|'assistant', content: string }" });
  }

  // ステップA: Azure 未設定ならエコー（最後の user 発言をそのまま返す）。
  if (!azureConfigured) {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    return res.status(200).json({ reply: `（echo）${lastUser?.content ?? ""}` });
  }

  // ステップB: Azure OpenAI に実呼び出し。
  try {
    const client = new AzureOpenAI({
      endpoint: AZURE_OPENAI_ENDPOINT,
      apiKey: AZURE_OPENAI_API_KEY,
      deployment: AZURE_OPENAI_DEPLOYMENT,
      apiVersion: AZURE_OPENAI_API_VERSION,
    });

    const completion = await client.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT,
      messages,
    });

    const reply = completion.choices?.[0]?.message?.content ?? "";
    return res.status(200).json({ reply });
  } catch (err) {
    // キーが漏れないよう、詳細はサーバーログのみ。フロントには汎用メッセージ。
    console.error("Azure OpenAI request failed:", err);
    return res.status(502).json({ error: "AI request failed" });
  }
}
