// DOM 描画のみ（状態を持たない）。XSS 対策: テキストは必ず textContent で挿入する。

// 1 件分の吹き出し要素を生成する。
// role: "user" | "assistant"
function createBubble(role, content) {
  const bubble = document.createElement("div");
  const roleClass = role === "user" ? "bubble--user" : "bubble--assistant";
  bubble.className = `bubble ${roleClass}`;
  // textContent で挿入（innerHTML 禁止）。改行は CSS white-space: pre-wrap で表示。
  bubble.textContent = content;
  return bubble;
}

// 「…」を表示する typing バブル（assistant 側）。
function createTypingBubble() {
  const bubble = document.createElement("div");
  bubble.className = "bubble bubble--assistant bubble--typing";

  // 3 つのドットでアニメーション。テキストは textContent で挿入。
  for (let i = 0; i < 3; i += 1) {
    const dot = document.createElement("span");
    dot.className = "typing-dot";
    dot.textContent = "・";
    bubble.appendChild(dot);
  }
  return bubble;
}

// container 要素に messages 配列を吹き出しで描画する。
// messages: Array<{ role: "user" | "assistant", content: string }>
// options: { typing?: boolean } — typing=true なら末尾に「…」の typing バブルを追加
export function renderMessages(container, messages, options = {}) {
  if (!container) return;

  // 毎回中身をクリアしてから描画する。
  const nodes = [];
  for (const message of messages || []) {
    nodes.push(createBubble(message.role, message.content));
  }
  if (options.typing) {
    nodes.push(createTypingBubble());
  }
  container.replaceChildren(...nodes);

  // 描画後、一番下までスクロール。
  container.scrollTop = container.scrollHeight;
}
