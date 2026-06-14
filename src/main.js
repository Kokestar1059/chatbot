// 状態管理 + localStorage + イベント配線のエントリ。
// #6: 1会話を localStorage に永続化し、リロードで復元する。
//     複数会話・New chat は #7、タイトル自動生成は #8 で扱う。
import { sendChat } from "./chat.js";
import { renderMessages } from "./ui.js";

const form = document.querySelector("#chat-form");
const input = document.querySelector("#input");
const output = document.querySelector("#output");
const sendButton = document.querySelector("#send");

// localStorage キー（§9）。値は Conversation[] の JSON。
const STORAGE_KEY = "chatbot:v1:conversations";

// 現在の会話。#6 では1会話だけ扱う（複数会話は #7）。
// Conversation = { id, title, messages: [{ role, content }] }
let conversation = { id: crypto.randomUUID(), title: "", messages: [] };

// localStorage から会話を復元する。
// 壊れた/空のデータでも落ちないよう、必ず try/catch + 形チェックする。
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    // 期待する形は Conversation[]。先頭の1会話だけ復元する。
    if (!Array.isArray(data) || data.length === 0) return;
    const first = data[0];
    if (!first || !Array.isArray(first.messages)) return;
    conversation = {
      id: typeof first.id === "string" ? first.id : crypto.randomUUID(),
      title: typeof first.title === "string" ? first.title : "",
      // role/content が妥当なメッセージだけ残す（壊れた要素を捨てる）。
      messages: first.messages.filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      ),
    };
  } catch (err) {
    // パース失敗時は初期状態のまま続行（落とさない）。
    console.error("会話の復元に失敗しました", err);
  }
}

// 現在の会話を localStorage に保存する（メッセージ追加のたびに呼ぶ）。
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([conversation]));
  } catch (err) {
    console.error("会話の保存に失敗しました", err);
  }
}

// 起動時にロードして復元。messages は conversation.messages を直接参照する
//（push が conversation を更新し、save() がそのまま直列化される）。
load();
const messages = conversation.messages;
// 送信中フラグ。true の間は新しい送信を受け付けない（二重送信防止）。
let sending = false;

// 復元した会話を初期描画する。
renderMessages(output, messages);

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

  // user 発言を履歴に積んで即描画 + 保存。
  messages.push({ role: "user", content: text });
  save();
  input.value = "";
  setSending(true);
  // 送信中は typing バブルを表示。
  renderMessages(output, messages, { typing: true });

  try {
    const reply = await sendChat(messages);
    messages.push({ role: "assistant", content: reply });
    save();
    renderMessages(output, messages);
  } catch (err) {
    console.error(err);
    // 失敗時は積んだ user 発言を取り消して保存し、入力欄に書き戻して再送できるようにする。
    // エラー表示の作り込みは #8。
    messages.pop();
    save();
    input.value = text;
    renderMessages(output, messages);
  } finally {
    setSending(false);
    input.focus();
  }
});
