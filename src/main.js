// 状態管理 + イベント配線のエントリ。
// #4: 1回の送信→応答表示の最小ループ（履歴なし・複数会話なし）。
import { sendChat } from "./chat.js";

const form = document.querySelector("#chat-form");
const input = document.querySelector("#input");
const output = document.querySelector("#output");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  // user 発言を messages に積んで API へ。履歴なしなので毎回 1 件だけ。
  const messages = [{ role: "user", content: text }];

  input.value = "";
  output.textContent = "…送信中";

  try {
    const reply = await sendChat(messages);
    // XSS 対策: 表示は必ず textContent で挿入する。
    output.textContent = reply;
  } catch (err) {
    console.error(err);
    output.textContent = "エラーが発生しました";
  }
});
