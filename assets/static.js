
(() => {
  window.VIRUS_TRACKER_STATIC = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === "string" ? input : (input && input.url) || "";
    if (url.includes("/api/")) {
      return Promise.resolve(new Response(JSON.stringify({error: "GitHub Pages static demo: backend unavailable"}), {
        status: 503,
        headers: {"Content-Type": "application/json"}
      }));
    }
    return originalFetch(input, init);
  };
  const notice = () => {
    window.alert("这是 GitHub Pages 静态演示：数据采集、LLM 总结、手动运行、筛选与跨机构查询需要本地或服务器后端。");
  };
  document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector(".site-header");
    const banner = document.createElement("div");
    banner.className = "static-demo-banner";
    banner.innerHTML = '<div class="inner"><span class="tag">STATIC DEMO</span>' +
      '<span>数据快照 2026-10-26 · 采集 / LLM / 手动运行 / 筛选 / 合规查询需后端</span>' +
      '<span class="tag">SOURCE PRIVATE</span>' +
      '<a class="btn btn-small" href="/virus-tracker/downloads/events.jsonl">下载 AI-READY 数据</a></div>';
    if (header && header.parentNode) header.parentNode.insertBefore(banner, header.nextSibling);
    else document.body.insertBefore(banner, document.body.firstChild);
    document.querySelectorAll(
      "#run-btn, [data-run-trigger], #ai-run-btn, #ai-drill-btn, .filter-actions button, .filter-actions .btn"
    ).forEach((el) => {
      el.addEventListener("click", (event) => { event.preventDefault(); notice(); });
    });
    ["filter-form", "compliance-query-form", "deid-form", "semantic-form"].forEach((id) => {
      const form = document.getElementById(id);
      if (form) form.addEventListener("submit", (event) => { event.preventDefault(); notice(); });
    });
    document.querySelectorAll("form[action]").forEach((form) => {
      if (form.id !== "filter-form") form.addEventListener("submit", (event) => event.preventDefault());
    });
  });
})();
