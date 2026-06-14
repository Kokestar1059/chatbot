// 状態管理 + イベント配線のエントリ。
// #5: 会話履歴をメモリ上に保持し、吹き出しで表示。送信中は二重送信を防ぐ。
//     localStorage 永続化は #6、複数会話は #7 で扱う。
import { sendChat } from "./chat.js";
import { renderMessages } from "./ui.js";

const form = document.querySelector("#chat-form");
const input = document.querySelector("#input");
const output = document.querySelector("#output");
const sendButton = document.querySelector("#send");

// この会話の messages（会話全体）。Azure はステートレスなので毎回まるごと送る。
const messages = [];
// 送信中フラグ。true の間は新しい送信を受け付けない（二重送信防止）。
let sending = false;

// 入力欄・送信ボタンの有効/無効を切り替える。
function setSending(value) {
  sending = value;
  input.disabled = value;
  sendButton.disabled = value;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (sending) return;

  const text = input.value.trim();
  if (!text) return;

  // user 発言を履歴に積んで即描画。
  messages.push({ role: "user", content: text });
  input.value = "";
  setSending(true);
  // 送信中は typing バブルを表示。
  renderMessages(output, messages, { typing: true });

  try {
    const reply = await sendChat(messages);
    messages.push({ role: "assistant", content: reply });
    renderMessages(output, messages);
  } catch (err) {
    console.error(err);
    // 失敗時は積んだ user 発言を取り消し、入力欄に書き戻して再送できるようにする。
    // エラー表示の作り込みは #8。
    messages.pop();
    input.value = text;
    renderMessages(output, messages);
  } finally {
    setSending(false);
    input.focus();
  }
});
