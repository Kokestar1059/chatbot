// 状態管理 + localStorage + イベント配線のエントリ。
// #7: 複数会話を保持し、サイドバーで New chat / 切替を可能にする。
//     状態は conversations 配列 + activeId。本文は常にアクティブ会話を都度引く
//     （#6 にあった messages エイリアスは廃止。切替で古い配列を指す事故を防ぐ）。
//     タイトル自動生成は #8 のスコープ。
import { sendChat } from "./chat.js";
import { renderMessages, renderSidebar, renderError } from "./ui.js";

const form = document.querySelector("#chat-form");
const input = document.querySelector("#input");
const output = document.querySelector("#output");
const sendButton = document.querySelector("#send");
const newChatButton = document.querySelector("#new-chat");
const conversationList = document.querySelector("#conversation-list");
const errorBox = document.querySelector("#error");

// タイトル自動生成（#8）: 最初のユーザー発言から作る。
// 連続する空白を 1 個に潰し、30 文字を超えたら切って「…」を付ける。
const TITLE_MAX = 30;
function makeTitle(text) {
  const normalized = text.trim().replace(/\s+/g, " ");
  return normalized.length > TITLE_MAX
    ? `${normalized.slice(0, TITLE_MAX)}…`
    : normalized;
}

// localStorage キー（§9）。値は Conversation[] の JSON。
const STORAGE_KEY = "chatbot:v1:conversations";

// 全会話とアクティブ会話の id。
// Conversation = { id, title, messages: [{ role, content }] }
let conversations = [];
let activeId = null;

// 送信中フラグ。true の間は送信・新規作成・切替を受け付けない（二重送信・取り違え防止）。
let sending = false;

// 空の会話を1件作り、先頭（最新が上）に積んで active にする。
function createConversation() {
  const conv = { id: crypto.randomUUID(), title: "", messages: [] };
  conversations.unshift(conv);
  activeId = conv.id;
  return conv;
}

// 現在アクティブな会話を返す。常にこれ経由で messages を引く。
function activeConversation() {
  return conversations.find((c) => c.id === activeId) || null;
}

// localStorage から会話を復元する。
// 壊れた/空のデータでも落ちないよう、必ず try/catch + 形チェックする。
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    // 期待する形は Conversation[]。配列全体を復元する（#6 の「先頭1件だけ」を廃止）。
    if (!Array.isArray(data)) return;
    const restored = data
      .filter((c) => c && Array.isArray(c.messages))
      .map((c) => ({
        id: typeof c.id === "string" ? c.id : crypto.randomUUID(),
        title: typeof c.title === "string" ? c.title : "",
        // role/content が妥当なメッセージだけ残す（壊れた要素を捨てる）。
        messages: c.messages.filter(
          (m) =>
            m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string"
        ),
      }));
    if (restored.length === 0) return;
    conversations = restored;
    // activeId は永続化しない（§9 の保存形は Conversation[] のまま）。先頭を active に。
    activeId = restored[0].id;
  } catch (err) {
    // パース失敗時は初期状態のまま続行（落とさない）。
    console.error("会話の復元に失敗しました", err);
  }
}

// 全会話を localStorage に保存する（メッセージ追加・新規作成のたびに呼ぶ）。
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (err) {
    console.error("会話の保存に失敗しました", err);
  }
}

// サイドバーだけを再描画する（タイトル変更時など）。引数の取り違えを一箇所に集約。
function refreshSidebar() {
  renderSidebar(conversationList, conversations, activeId, selectConversation);
}

// サイドバーと本文をまとめて再描画する。
function renderAll(options = {}) {
  refreshSidebar();
  const conv = activeConversation();
  renderMessages(output, conv ? conv.messages : [], options);
}

// 一覧クリック: アクティブ会話を切り替えて再描画。
function selectConversation(id) {
  if (sending) return;
  if (id === activeId) return;
  activeId = id;
  // エラーは送信単位の表示。会話を切り替えたら消す。
  renderError(errorBox, "");
  renderAll();
  input.focus();
}

// New chat: 空の会話を作って active にし、保存 + 再描画。
function newChat() {
  if (sending) return;
  const current = activeConversation();
  // 直近が空の会話なら無駄に増やさず、それを使う。
  if (current && current.messages.length === 0) {
    input.focus();
    return;
  }
  createConversation();
  // 直前のエラー表示を残さない。
  renderError(errorBox, "");
  save();
  renderAll();
  input.focus();
}

// 入力欄・送信ボタンの有効/無効を切り替える。
function setSending(value) {
  sending = value;
  input.disabled = value;
  sendButton.disabled = value;
  newChatButton.disabled = value;
}

// 起動: 復元 → 会話が無ければ1件作る → 初期描画。
load();
if (!activeConversation()) {
  createConversation();
}
renderAll();

newChatButton.addEventListener("click", newChat);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (sending) return;

  const text = input.value.trim();
  if (!text) return;

  // 送信時点のアクティブ会話を固定（切替は送信中ロックで防止済み）。
  const conv = activeConversation();
  if (!conv) return;

  // 再送に備えて前回のエラー表示をクリア。
  renderError(errorBox, "");

  // user 発言を履歴に積んで即描画 + 保存。
  conv.messages.push({ role: "user", content: text });
  // タイトル未設定（＝最初の発言）なら、この発言から自動生成する。
  // 送信失敗で発言を取り消したときに戻せるよう、今回付けたかを覚えておく。
  const titleAssignedNow = !conv.title;
  if (titleAssignedNow) {
    conv.title = makeTitle(text);
    refreshSidebar();
  }
  save();
  input.value = "";
  setSending(true);
  // 送信中は typing バブルを表示。
  renderMessages(output, conv.messages, { typing: true });

  try {
    const reply = await sendChat(conv.messages);
    conv.messages.push({ role: "assistant", content: reply });
    save();
    renderMessages(output, conv.messages);
  } catch (err) {
    console.error(err);
    // 失敗時は積んだ user 発言を取り消して保存し、入力欄に書き戻して再送できるようにする。
    conv.messages.pop();
    // 今回のタイトルもこの発言から付けたものなので、空の会話に戻す。
    if (titleAssignedNow) {
      conv.title = "";
      refreshSidebar();
    }
    save();
    input.value = text;
    renderMessages(output, conv.messages);
    // 何が起きたかが分かるエラーを表示（詳細は console、画面には汎用メッセージ）。
    renderError(errorBox, "送信に失敗しました。接続や Azure の設定を確認して、もう一度お試しください。");
  } finally {
    setSending(false);
    input.focus();
  }
});
