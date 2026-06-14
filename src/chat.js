// /api/chat を fetch で呼ぶだけの薄いレイヤー。状態は持たない。
// messages（会話全体）を渡すと、AI の返答テキスト(reply)を返す。
export async function sendChat(messages) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  // 非200は例外として扱う。表示の作り込みは #8 で行う。
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const data = await res.json();
  return data.reply;
}
