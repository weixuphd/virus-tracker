(() => {
  const banner = document.getElementById("run-banner");
  const bannerText = document.getElementById("run-banner-text");
  const runButtons = Array.from(document.querySelectorAll("#run-btn, [data-run-trigger]"));
  let pollTimer = null;
  let isReloading = false;

  const phaseLabels = {
    collecting: "正在采集 PubMed、卫生机构与新闻源…",
    deduplicating: "正在去重与入库…",
    analyzing: "正在识别病原体、宿主与严重度…",
    summarizing: "本地大模型正在生成中文摘要…",
    digesting: "正在生成每日简报…",
    exporting: "正在导出 AI-READY 数据…",
    completed: "追踪完成",
    failed: "追踪失败",
  };

  function showBanner(text) {
    if (!banner) return;
    banner.hidden = false;
    if (bannerText) bannerText.textContent = text;
  }

  function hideBanner() {
    if (banner) banner.hidden = true;
  }

  function setButtonState(running) {
    runButtons.forEach((button) => {
      button.disabled = running;
      if (running) {
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<span class="spinner"></span> 追踪中…';
      } else if (button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
        delete button.dataset.originalText;
      }
    });
  }

  function adminToken() {
    return window.localStorage.getItem("vt-admin-token") || "";
  }

  async function startRun() {
    setButtonState(true);
    showBanner("正在启动追踪任务…");
    const headers = { "Content-Type": "application/json" };
    const token = adminToken();
    if (token) headers["X-Admin-Token"] = token;
    try {
      let response = await fetch("/api/admin/run", {
        method: "POST",
        headers,
        body: JSON.stringify({ use_llm: true }),
      });
      if (response.status === 401) {
        const entered = window.prompt("请输入 VT_ADMIN_TOKEN（仅保存在本机浏览器）：");
        if (entered) {
          window.localStorage.setItem("vt-admin-token", entered);
          headers["X-Admin-Token"] = entered;
          response = await fetch("/api/admin/run", {
            method: "POST",
            headers,
            body: JSON.stringify({ use_llm: true }),
          });
        }
      }
      if (response.status === 409) {
        showBanner("已有追踪任务在运行，正在等待结果…");
        startPolling();
        return;
      }
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "启动失败");
      }
      startPolling();
    } catch (error) {
      setButtonState(false);
      showBanner(`启动失败：${error.message}`);
      window.setTimeout(hideBanner, 8000);
    }
  }

  function startPolling() {
    if (pollTimer) window.clearInterval(pollTimer);
    setButtonState(true);
    pollTimer = window.setInterval(checkRun, 2500);
    checkRun();
  }

  async function checkRun() {
    try {
      const response = await fetch("/api/runs/latest", { cache: "no-store" });
      if (!response.ok) return;
      const run = await response.json();
      if (!run || run.status === "none") {
        setButtonState(false);
        hideBanner();
        return;
      }
      const stats = run.stats || {};
      const phase = stats.phase || run.status;
      if (run.status === "running") {
        const count = stats.assessed ? ` · 已分析 ${stats.assessed} 条` : "";
        const summary = stats.summarized ? ` · 已总结 ${stats.summarized} 条` : "";
        showBanner(`${phaseLabels[phase] || "正在运行…"}${count}${summary}`);
        return;
      }
      window.clearInterval(pollTimer);
      pollTimer = null;
      setButtonState(false);
      if (run.status === "completed") {
        showBanner(`追踪完成：新增 ${stats.new_articles || 0} 条，分析 ${stats.assessed || 0} 条，LLM 总结 ${stats.summarized || 0} 条。正在刷新…`);
        if (!isReloading) {
          isReloading = true;
          window.setTimeout(() => window.location.reload(), 1200);
        }
      } else if (run.status === "failed") {
        showBanner(`追踪失败：${(run.error || "未知错误").split("\n").slice(-1)[0]}`);
      }
    } catch (error) {
      // Keep polling through transient network errors.
    }
  }

  runButtons.forEach((button) => button.addEventListener("click", startRun));

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.getElementById(button.dataset.copyTarget);
      if (!target) return;
      const text = target.textContent || "";
      try {
        await navigator.clipboard.writeText(text);
        const original = button.textContent;
        button.textContent = "已复制";
        window.setTimeout(() => (button.textContent = original), 1500);
      } catch (error) {
        window.prompt("复制失败，请手动复制：", text.slice(0, 2000));
      }
    });
  });

  const filterForm = document.getElementById("filter-form");
  if (filterForm) {
    filterForm.querySelectorAll("select").forEach((select) => {
      select.addEventListener("change", () => filterForm.requestSubmit());
    });
  }

  fetch("/api/runs/latest", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : null))
    .then((run) => {
      if (run && run.status === "running") startPolling();
    })
    .catch(() => {});
})();
