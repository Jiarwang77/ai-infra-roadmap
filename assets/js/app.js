(function () {
  'use strict';

  const PLAN = window.PLAN_DATA;
  const PAPERS = window.PAPERS_DATA;
  const STAGE_COLORS = ['#4c6ef5', '#0ca678', '#f08c00', '#d6336c', '#7048e8', '#1098ad'];
  const CAT_HUES = { K1: 245, K2: 265, K3: 285, K4: 305, A: 205, B: 190, C: 175, D: 160, E: 145, F: 130, G: 110, H: 90, J: 70, I: 52, T1: 32, T2: 16, T3: 0 };
  const GROUP_HUES = { classics: 268, inference: 195, training: 24 };
  const PP_HUES = [220, 155, 32, 330, 265, 190, 95, 0];

  const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const ICON_CHEV = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
  const ICON_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  const ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
  const md = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const fmt = (x, d = 1) => (Number.isFinite(x) ? x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—');
  const sci = (x) => x.toExponential(2).replace('e+', 'e');
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
    }
  };
  const gpuById = (id) => PLAN.gpus.find((g) => g.id === id) || PLAN.gpus[1];
  const gpuOptions = (selected) => PLAN.gpus.map((g) => `<option value="${g.id}"${g.id === selected ? ' selected' : ''}>${esc(g.name)}</option>`).join('');
  const options = (list, selected) => list.map((o) => {
    const [v, label] = Array.isArray(o) ? o : [o, o];
    return `<option value="${esc(v)}"${String(v) === String(selected) ? ' selected' : ''}>${esc(label)}</option>`;
  }).join('');

  /* ---------------- progress ---------------- */
  const DONE_KEY = 'ai-infra-progress-v1';
  const done = new Set(store.get(DONE_KEY, []));
  const stageItems = PLAN.stages.map((s) => s.topics.concat(s.projects).map((x) => x.id));
  const allItems = stageItems.flat().concat(PLAN.coding.map((c) => c.id));
  const doneCount = (ids) => ids.filter((id) => done.has(id)).length;
  const ratio = (ids) => (ids.length ? doneCount(ids) / ids.length : 0);
  let currentStage = Math.min(Math.max(store.get('ai-infra-stage', 0), 0), PLAN.stages.length - 1);

  function checkItem(item, color) {
    const on = done.has(item.id);
    const body = item.title
      ? `<span class="ttl">${esc(item.title)}</span><span class="txt">${md(item.text)}</span>`
      : `<span class="txt solo">${md(item.text)}</span>`;
    return `<li><label class="check-item${on ? ' done' : ''}" style="--c:${color}"><input type="checkbox" data-id="${esc(item.id)}"${on ? ' checked' : ''}><span class="check-box">${ICON_CHECK}</span><span>${body}</span></label></li>`;
  }

  document.addEventListener('change', (e) => {
    const input = e.target;
    if (!input.matches || !input.matches('.check-item input')) return;
    const id = input.dataset.id;
    if (input.checked) done.add(id); else done.delete(id);
    store.set(DONE_KEY, Array.from(done));
    input.closest('.check-item').classList.toggle('done', input.checked);
    updateProgress();
  });

  function updateProgress() {
    const total = ratio(allItems);
    const pct = Math.round(total * 100);
    const C = 2 * Math.PI * 52;
    const fg = $('#ringFg');
    fg.style.strokeDasharray = String(C);
    fg.style.strokeDashoffset = String(C * (1 - total));
    $('#ringPct').textContent = pct + '%';
    $('#ringSub').textContent = `已完成 ${doneCount(allItems)} / ${allItems.length} 项`;
    $('#progressLine').style.width = pct + '%';
    $$('#stageMini .stage-mini-row').forEach((row, i) => {
      const r = ratio(stageItems[i]);
      $('i', row).style.width = r * 100 + '%';
      $('.mono', row).textContent = Math.round(r * 100) + '%';
    });
    $$('#stageTabs .tab').forEach((tab, i) => { $('.pct', tab).textContent = Math.round(ratio(stageItems[i]) * 100) + '%'; });
    const meter = $('#stageMeter');
    if (meter) {
      const ids = stageItems[currentStage];
      $('b', meter).textContent = Math.round(ratio(ids) * 100) + '%';
      $('.bar i', meter).style.width = ratio(ids) * 100 + '%';
      $('p', meter).textContent = `已完成 ${doneCount(ids)} / ${ids.length} 项（知识点 + 动手项目）`;
    }
    $('#codingCount').textContent = `${doneCount(PLAN.coding.map((c) => c.id))} / ${PLAN.coding.length}`;
  }

  /* ---------------- hero ---------------- */
  function renderHero() {
    const topics = PLAN.stages.reduce((a, s) => a + s.topics.length, 0);
    const projects = PLAN.stages.reduce((a, s) => a + s.projects.length, 0);
    const stats = [
      [PLAN.stages.length, '个阶段 · 10 周'],
      [topics, '个知识点'],
      [projects, '个动手项目'],
      [PAPERS.papers.length, '篇量化论文']
    ];
    $('#heroStats').innerHTML = stats.map(([n, t]) => `<div class="card stat"><b>${n}</b><span>${t}</span></div>`).join('');
    $('#stageMini').innerHTML = PLAN.stages.map((s, i) => `<div class="stage-mini-row"><span>${esc(s.short)}</span><div class="bar"><i style="--c:${STAGE_COLORS[i]}"></i></div><span class="muted mono">0%</span></div>`).join('');
    $('#resetBtn').addEventListener('click', () => {
      if (!window.confirm('确定清空所有打勾记录吗？')) return;
      done.clear();
      store.set(DONE_KEY, []);
      renderStage(currentStage);
      renderCoding();
      updateProgress();
    });
  }

  /* ---------------- roadmap ---------------- */
  function renderTimeline() {
    let html = '<div class="tl-grid"><div style="grid-row:1;grid-column:1"></div>';
    for (let w = 1; w <= 10; w++) html += `<div class="tl-week" style="grid-row:1;grid-column:${w + 1}">第 ${w} 周</div>`;
    PLAN.stages.forEach((s, i) => {
      html += `<div class="tl-label" style="grid-row:${i + 2};grid-column:1">阶段 ${i}<span class="tl-name"> · ${esc(s.short)}</span></div>`;
      html += `<button class="tl-bar" data-stage="${i}" style="--c:${STAGE_COLORS[i]};grid-row:${i + 2};grid-column:${s.start + 1} / ${s.end + 2}" title="${esc(s.title)} · ${esc(s.weeks)}">${esc(s.short)}${s.end > s.start ? ` <small>${esc(s.weeks)}</small>` : ''}</button>`;
    });
    $('#timeline').innerHTML = html + '</div>';
    $('#timeline').addEventListener('click', (e) => {
      const bar = e.target.closest('.tl-bar');
      if (!bar) return;
      renderStage(+bar.dataset.stage);
      $('#stageTabs').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function renderTabs() {
    $('#stageTabs').innerHTML = PLAN.stages.map((s, i) => `<button class="tab" data-stage="${i}" style="--c:${STAGE_COLORS[i]}"><span class="dot"></span>${i} · ${esc(s.short)}<span class="pct">0%</span></button>`).join('');
    $('#stageTabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (tab) renderStage(+tab.dataset.stage);
    });
  }

  const resItem = (r) => {
    const external = r.url && !r.url.startsWith('#');
    const title = r.url ? `<a href="${esc(r.url)}"${external ? ' target="_blank" rel="noopener"' : ''}>${esc(r.title)}</a>` : esc(r.title);
    return `<li><span>${title}${r.note ? `<span class="note">${esc(r.note)}</span>` : ''}</span><span class="by">${esc(r.by || '')}</span></li>`;
  };

  const qaItem = (q, stageIdx, withStage) => `<details class="qa" style="--c:${STAGE_COLORS[stageIdx]}"><summary><span class="qtag">${withStage ? esc(PLAN.stages[stageIdx].short) : 'Q'}</span><span>${md(q.q)}</span>${ICON_CHEV}</summary><div class="ans">${md(q.a)}</div></details>`;

  function renderStage(i) {
    currentStage = i;
    store.set('ai-infra-stage', i);
    const s = PLAN.stages[i];
    const c = STAGE_COLORS[i];
    $$('#stageTabs .tab').forEach((t, j) => t.classList.toggle('active', j === i));
    const panel = $('#stagePanel');
    panel.style.setProperty('--c', c);
    panel.innerHTML = `
      <div class="stage-top">
        <div>
          <span class="weeks">${esc(s.weeks)} · 阶段 ${i}</span>
          <h3>${esc(s.title)}</h3>
          <p class="goal">目标：${md(s.goal)}</p>
          <p class="intro">${md(s.intro)}</p>
        </div>
        <div class="stage-meter" id="stageMeter">
          <div class="row"><span>本阶段进度</span><b>0%</b></div>
          <div class="bar"><i style="--c:${c}"></i></div>
          <p class="muted small" style="margin:8px 0 0"></p>
        </div>
      </div>
      <div class="stage-body">
        <div class="stage-col">
          <div class="col-block">
            <div class="col-title"><span>知识点（由浅入深）</span><span>${s.topics.length} 项</span></div>
            <ul class="check-list">${s.topics.map((t) => checkItem(t, c)).join('')}</ul>
          </div>
          <div class="col-block">
            <div class="col-title"><span>动手项目</span><span>${s.projects.length} 项</span></div>
            <ul class="check-list">${s.projects.map((p) => checkItem(p, c)).join('')}</ul>
          </div>
        </div>
        <div class="stage-col">
          <div class="col-block">
            <div class="col-title"><span>资料</span><span>${s.resources.length} 份</span></div>
            <ul class="res-list">${s.resources.map(resItem).join('')}</ul>
          </div>
          ${s.quiz.length ? `<div class="col-block"><div class="col-title"><span>自测题</span><span>${s.quiz.length} 题</span></div>${s.quiz.map((q) => qaItem(q, i, false)).join('')}</div>` : ''}
          <div class="bar-line"><b>达标线：</b>${md(s.bar)}</div>
        </div>
      </div>`;
    updateProgress();
  }

  /* ---------------- parallel matrix ---------------- */
  function renderMatrix() {
    const kinds = PLAN.shardKinds;
    const dot = (row, k) => {
      if (row.shard.includes(k)) return '<span class="sdot on" title="切分"></span>';
      if (row.shard.includes(k + '~')) return '<span class="sdot half" title="部分切分"></span>';
      return '<span class="sdot" title="不切分 / 不涉及"></span>';
    };
    $('#parallelMatrix').innerHTML = `
      <table class="matrix">
        <thead><tr><th>策略</th>${kinds.map((k) => `<th class="dotcol">${k.name}</th>`).join('')}<th>主要通信</th><th>通信量</th><th>典型范围</th><th>主要收益</th><th>主要代价</th></tr></thead>
        <tbody>${PLAN.parallel.map((r) => `<tr><td class="name">${esc(r.name)}</td>${kinds.map((k) => `<td class="dotcol">${dot(r, k.id)}</td>`).join('')}<td>${esc(r.comm)}</td><td class="mono small">${esc(r.vol)}</td><td>${esc(r.scope)}</td><td>${esc(r.gain)}</td><td>${esc(r.cost)}</td></tr>`).join('')}</tbody>
      </table>
      <div class="legend"><span><span class="sdot on"></span>切分</span><span><span class="sdot half"></span>部分切分（TP 不切 LayerNorm / Dropout 的激活）</span><span><span class="sdot"></span>不切分（每卡一份）或不涉及</span></div>`;
  }

  /* ---------------- device mesh ---------------- */
  function renderMesh() {
    const root = $('#meshViz');
    root.innerHTML = `
      <div class="controls">
        <label class="field">总卡数（每节点 8 卡）<select id="mTotal">${options([16, 32, 64], 32)}</select></label>
        <label class="field">TP<select id="mTP">${options([1, 2, 4, 8], 4)}</select></label>
        <label class="field">PP<select id="mPP">${options([1, 2, 4, 8], 2)}</select></label>
        <label class="field">维度顺序（由内到外）<select id="mOrder">${options([['tp-pp-dp', 'TP → PP → DP（Llama 3：DP 在最外层）'], ['tp-dp-pp', 'TP → DP → PP（Megatron 默认：PP 在最外层）']], 'tp-pp-dp')}</select></label>
      </div>
      <div class="mesh-wrap"><div class="mesh-nodes" id="meshNodes"></div><div class="mesh-side" id="meshSide"></div></div>`;
    $$('select', root).forEach((el) => el.addEventListener('change', drawMesh));
    drawMesh();
  }

  function drawMesh() {
    const total = +$('#mTotal').value;
    const TP = +$('#mTP').value;
    const PP = +$('#mPP').value;
    const order = $('#mOrder').value;
    const nodesEl = $('#meshNodes');
    const side = $('#meshSide');
    if (TP * PP > total) {
      nodesEl.innerHTML = `<p class="muted">TP × PP = ${TP * PP}，超过了总卡数 ${total}，请调小。</p>`;
      side.innerHTML = '';
      return;
    }
    const DP = total / (TP * PP);
    const gpus = Array.from({ length: total }, (_, r) => {
      const tp = r % TP;
      const c = order === 'tp-pp-dp'
        ? { tp, pp: Math.floor(r / TP) % PP, dp: Math.floor(r / (TP * PP)) }
        : { tp, dp: Math.floor(r / TP) % DP, pp: Math.floor(r / (TP * DP)) };
      return Object.assign({ r, node: Math.floor(r / 8) }, c);
    });
    let html = '';
    for (let n = 0; n < total / 8; n++) {
      html += `<div class="mesh-node"><span class="nlabel">节点 ${n}</span><div class="mesh-gpus">${gpus.filter((g) => g.node === n).map((g) => `<div class="gpu" data-r="${g.r}" style="--h:${PP_HUES[g.pp % PP_HUES.length]}"><b>GPU ${g.r}</b>tp${g.tp} · dp${g.dp}<br>stage ${g.pp}</div>`).join('')}</div></div>`;
    }
    nodesEl.innerHTML = html;

    const groupBy = (key) => {
      const m = new Map();
      gpus.forEach((g) => { const k = key(g); if (!m.has(k)) m.set(k, []); m.get(k).push(g); });
      return Array.from(m.values());
    };
    const crossing = (groups) => groups.filter((list) => new Set(list.map((g) => g.node)).size > 1).length;
    const row = (name, groups, size, mustBeLocal) => {
      const c = crossing(groups);
      const cls = mustBeLocal ? (c ? 'bad' : 'good') : '';
      return `<span>${name}（每组 ${size} 卡）</span><b class="${cls}">${c} / ${groups.length} 组跨节点</b>`;
    };
    side.innerHTML = `
      <div class="kv">
        ${row('TP 组', groupBy((g) => g.dp + '-' + g.pp), TP, true)}
        ${row('DP 组', groupBy((g) => g.tp + '-' + g.pp), DP, false)}
        ${row('PP 组', groupBy((g) => g.tp + '-' + g.dp), PP, false)}
        <span>DP 并行度 = 总卡数 ÷ (TP × PP)</span><b>${DP}</b>
      </div>
      <p>TP 每层都要对激活做 AllReduce，必须走机内 NVLink，所以放在最内层，组大小不超过单机卡数。DP 和 PP 组跨节点是正常的，区别在于谁放最外层：Llama 3 把 DP 放最外层（FSDP 预取能隐藏延迟），Megatron 默认把 PP 放最外层（只在 stage 边界做点对点通信，流量小）。</p>
      <div class="swatches">${Array.from({ length: PP }, (_, p) => `<span><i style="background:hsl(${PP_HUES[p % PP_HUES.length]} 60% 55%)"></i>stage ${p}</span>`).join('')}</div>
      <div class="swatches"><span><span class="swatch-line" style="border-color:var(--accent)"></span>同一 TP 组</span><span><span class="swatch-line" style="border-color:var(--c-scale);border-top-style:dashed"></span>同一 DP 组</span><span><span class="swatch-line" style="border-color:var(--c-man);border-top-style:dotted"></span>同一 PP 组</span></div>`;

    const highlight = (el) => {
      const g = gpus[+el.dataset.r];
      nodesEl.classList.add('hovering');
      $$('.gpu', nodesEl).forEach((x) => {
        const o = gpus[+x.dataset.r];
        const self = o.r === g.r;
        x.classList.toggle('g-self', self);
        x.classList.toggle('g-tp', !self && o.dp === g.dp && o.pp === g.pp);
        x.classList.toggle('g-dp', !self && o.tp === g.tp && o.pp === g.pp);
        x.classList.toggle('g-pp', !self && o.tp === g.tp && o.dp === g.dp);
      });
    };
    nodesEl.onmouseover = (e) => { const el = e.target.closest('.gpu'); if (el) highlight(el); };
    nodesEl.onclick = nodesEl.onmouseover;
    nodesEl.onmouseleave = () => {
      nodesEl.classList.remove('hovering');
      $$('.gpu', nodesEl).forEach((x) => x.classList.remove('g-self', 'g-tp', 'g-dp', 'g-pp'));
    };
  }

  /* ---------------- inference flow ---------------- */
  function renderFlow() {
    const root = $('#flowViz');
    root.innerHTML = `
      <div class="flow" id="flowNodes">
        ${PLAN.flow.map((f, i) => `<button class="flow-node" data-i="${i}"><span class="num">0${i + 1}</span><b>${esc(f.title)}</b><span>${esc(f.sub)}</span></button>`).join('')}
        <div class="flow-loop"><span>decode 循环：每步为每个请求生成一个 token</span></div>
      </div>
      <div class="flow-detail" id="flowDetail"></div>
      <h4 style="margin:22px 0 4px">PD 分离：把 prefill 与 decode 放到不同实例</h4>
      <p class="muted small" style="margin:0">两个阶段的瓶颈不同，分开后可以各自选择并行方式与 batch 策略，代价是要传输 KV cache。</p>
      <div class="pd-strip">
        <div class="pd-box"><b>Prefill 实例</b><p>计算密集：一次处理整段 prompt，生成第一个 token 和完整的 KV cache；优化目标是 TTFT。</p></div>
        <div class="pd-arrow"><span>KV cache 传输</span><div class="line"></div><span>RDMA / NVLink</span></div>
        <div class="pd-box"><b>Decode 实例</b><p>带宽密集：大 batch 连续生成；MoE 模型常用 DP attention + 大规模 EP；优化目标是 TPOT 与吞吐。</p></div>
      </div>`;
    const select = (i) => {
      const f = PLAN.flow[i];
      $$('.flow-node', root).forEach((n, j) => n.classList.toggle('active', j === i));
      $('#flowDetail').innerHTML = `<div><h4>${esc(f.title)} <span class="muted small mono">${esc(f.sub)}</span></h4><p>${md(f.text)}</p></div><ul>${f.points.map((p) => `<li>${md(p)}</li>`).join('')}</ul>`;
    };
    $('#flowNodes').addEventListener('click', (e) => {
      const n = e.target.closest('.flow-node');
      if (n) select(+n.dataset.i);
    });
    select(1);
  }

  /* ---------------- paged attention ---------------- */
  function renderPaged() {
    const root = $('#pagedViz');
    const BS = 4;
    const POOL = 16;
    const HUE = { P: 265, A: 205, B: 150 };
    const NAME = { P: '共享前缀', A: '请求 A', B: '请求 B' };
    let st;

    const reset = () => {
      st = { pool: new Array(POOL).fill(null), seqs: [], msg: '初始状态：两个请求共享 8 个 token 的系统提示词（2 个块，引用计数为 2）。' };
      const put = (idx, owner, fill, ref) => { st.pool[idx] = { owner, fill, ref }; return idx; };
      const p0 = put(3, 'P', 4, 2);
      const p1 = put(9, 'P', 4, 2);
      st.seqs.push({ id: 'A', table: [p0, p1, put(1, 'A', 3, 1)], active: true });
      st.seqs.push({ id: 'B', table: [p0, p1, put(12, 'B', 4, 1), put(6, 'B', 1, 1)], active: true });
    };
    const tokens = (s) => s.table.reduce((a, idx) => a + st.pool[idx].fill, 0);

    const step = () => {
      if (!st.seqs.some((s) => s.active)) {
        st.msg = '所有请求都已结束，点击「重置」重新开始。';
        draw();
        return;
      }
      const msgs = [];
      for (const s of st.seqs) {
        if (!s.active) continue;
        const last = st.pool[s.table[s.table.length - 1]];
        if (last.fill < BS && last.ref === 1) { last.fill++; continue; }
        let free = st.pool.findIndex((b) => b === null);
        if (free < 0) {
          free = st.pool.findIndex((b) => b && b.ref === 0);
          if (free >= 0) msgs.push(`空闲块用完，淘汰了前缀缓存块 #${free}。`);
        }
        if (free < 0) { msgs.push(`没有可用的块了：调度器需要抢占${NAME[s.id]}（重算或换出到 CPU）。`); break; }
        st.pool[free] = { owner: s.id, fill: 1, ref: 1 };
        s.table.push(free);
        msgs.push(`${NAME[s.id]}的最后一块已满，从空闲链表分配物理块 #${free}。`);
      }
      st.msg = msgs.join(' ') || '每个请求追加 1 个 token，写入各自最后一个未满的块。';
      draw();
    };

    const finish = (id) => {
      const s = st.seqs.find((x) => x.id === id);
      if (!s || !s.active) return;
      s.active = false;
      for (const idx of s.table) {
        const b = st.pool[idx];
        b.ref--;
        if (b.ref === 0) {
          if (b.owner === 'P') b.cached = true; else st.pool[idx] = null;
        }
      }
      const shared = st.pool.some((b) => b && b.owner === 'P' && b.ref > 0);
      st.msg = shared
        ? `${NAME[id]}结束：私有块回到空闲链表，共享前缀块的引用计数减 1，仍被另一个请求使用。`
        : `${NAME[id]}结束：前缀块的引用计数归零，但保留在 prefix cache 中，相同前缀的新请求可以直接复用；显存紧张时按 LRU 淘汰。`;
      draw();
    };

    const lblock = (idx) => {
      const b = st.pool[idx];
      return `<div class="lblock" style="--h:${HUE[b.owner]}"><div class="cells">${[0, 1, 2, 3].map((k) => `<i class="${k < b.fill ? 'f' : ''}"></i>`).join('')}</div><span class="tag">#${idx}</span></div>`;
    };

    const draw = () => {
      const seqs = st.seqs.map((s) => s.active
        ? `<div class="seq-row"><div class="seq-head"><b>${NAME[s.id]}</b><span class="muted">${tokens(s)} 个 token · block table = [${s.table.join(', ')}]</span></div><div class="lblocks">${s.table.map(lblock).join('')}</div></div>`
        : `<div class="seq-row"><div class="seq-head"><b>${NAME[s.id]}（已结束）</b><span class="muted">KV 块已释放</span></div></div>`).join('');
      const pool = st.pool.map((b, idx) => {
        if (!b) return `<div class="pblock">#${idx}<span class="ref">空闲</span></div>`;
        const label = b.owner === 'P' ? (b.cached ? '前缀缓存' : `前缀 ref ${b.ref}`) : NAME[b.owner];
        return `<div class="pblock used" style="--h:${HUE[b.owner]}">#${idx}<span class="ref">${label}</span><span class="ref">${b.fill}/${BS}</span></div>`;
      }).join('');
      const used = st.pool.filter(Boolean).length;
      const frag = st.seqs.filter((s) => s.active).reduce((a, s) => a + (BS - st.pool[s.table[s.table.length - 1]].fill), 0);
      const saved = st.pool.filter((b) => b && b.owner === 'P').reduce((a, b) => a + Math.max(0, b.ref - 1), 0);
      root.innerHTML = `
        <div class="paged">
          <div>
            <div class="col-title"><span>逻辑视图：每个请求的 block table</span></div>
            ${seqs}
            <p class="muted small" style="margin:6px 0 0">方块下方的编号是物理块号。物理块不需要连续；只有最后一块可能没填满（内部碎片）；向共享块写入前需要写时复制。</p>
          </div>
          <div>
            <div class="col-title"><span>物理视图：显存中的 KV 块池（${POOL} 块）</span></div>
            <div class="pool">${pool}</div>
            <div class="paged-stats"><span>已用 <b>${used}</b> / ${POOL} 块</span><span>内部碎片 <b>${frag}</b> 个槽位</span><span>共享前缀节省 <b>${saved}</b> 块</span></div>
            <div class="btn-row">
              <button class="btn sm primary" data-act="step">生成下一个 token</button>
              <button class="btn sm" data-act="finishA">结束请求 A</button>
              <button class="btn sm" data-act="finishB">结束请求 B</button>
              <button class="btn sm" data-act="reset">重置</button>
            </div>
            <p class="small" style="margin:12px 0 0;color:var(--text-2)">${esc(st.msg)}</p>
          </div>
        </div>`;
    };

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'step') step();
      else if (act === 'finishA') finish('A');
      else if (act === 'finishB') finish('B');
      else { reset(); draw(); }
    });
    reset();
    draw();
  }

  /* ---------------- roofline ---------------- */
  const ROOF = { K: 8192, N: 8192 };
  const roofAI = (B, wb) => (2 * B * ROOF.K * ROOF.N) / (wb * ROOF.K * ROOF.N + 2 * B * (ROOF.K + ROOF.N));
  const FMT_COLORS = { 2: 'var(--c-exp)', 1: 'var(--c-man)', 0.5: 'var(--c-sign)' };
  const FMT_NAMES = { 2: 'BF16', 1: 'FP8', 0.5: '4-bit' };

  function renderRoofline() {
    const root = $('#rooflineViz');
    root.innerHTML = `
      <div class="controls">
        <label class="field">GPU<select id="rGpu">${gpuOptions('h100')}</select></label>
        <label class="field">权重格式<select id="rFmt">${options([['2', 'BF16（2 字节）'], ['1', 'FP8 / INT8（1 字节）'], ['0.5', 'INT4 / FP4（0.5 字节）']], '2')}</select></label>
        <label class="field">batch（同时计算的 token 数）：<b id="rBval" class="mono" style="color:var(--text)">1</b><input id="rBatch" type="range" min="0" max="12" step="1" value="0"></label>
      </div>
      <div class="roof-wrap" style="margin-top:16px"><div class="chart" id="rChart"></div><div class="readout" id="rOut"></div></div>`;
    ['rGpu', 'rFmt', 'rBatch'].forEach((id) => $('#' + id).addEventListener('input', drawRoofline));
    drawRoofline();
  }

  function drawRoofline() {
    if (!$('#rChart')) return;
    const gpu = gpuById($('#rGpu').value);
    const wb = parseFloat($('#rFmt').value);
    const B = Math.pow(2, +$('#rBatch').value);
    $('#rBval').textContent = B;
    const peak = gpu.tflops;
    const bw = gpu.bw;
    const ridge = peak / bw;
    const W = 640, H = 360, M = { l: 60, r: 20, t: 20, b: 50 };
    const xMin = 0.25, xMax = 16384, yMin = 1, yMax = 8192;
    const L = Math.log10;
    const lx = (x) => M.l + (L(x) - L(xMin)) / (L(xMax) - L(xMin)) * (W - M.l - M.r);
    const ly = (y) => H - M.b - (L(y) - L(yMin)) / (L(yMax) - L(yMin)) * (H - M.t - M.b);
    const perf = (ai) => Math.min(peak, bw * ai);
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Roofline 图">`;
    [1, 10, 100, 1000, 10000].forEach((x) => {
      svg += `<line class="gridline" x1="${lx(x)}" x2="${lx(x)}" y1="${M.t}" y2="${H - M.b}"/><text x="${lx(x)}" y="${H - M.b + 16}" text-anchor="middle">${x >= 1000 ? x / 1000 + 'k' : x}</text>`;
    });
    [1, 10, 100, 1000].forEach((y) => {
      svg += `<line class="gridline" x1="${M.l}" x2="${W - M.r}" y1="${ly(y)}" y2="${ly(y)}"/><text x="${M.l - 8}" y="${ly(y) + 4}" text-anchor="end">${y >= 1000 ? y / 1000 + 'k' : y}</text>`;
    });
    svg += `<line class="axis" x1="${M.l}" x2="${W - M.r}" y1="${H - M.b}" y2="${H - M.b}"/><line class="axis" x1="${M.l}" x2="${M.l}" y1="${M.t}" y2="${H - M.b}"/>`;
    svg += `<text x="${(M.l + W - M.r) / 2}" y="${H - 10}" text-anchor="middle">算术强度（FLOP / Byte，对数坐标）</text>`;
    svg += `<text transform="translate(16 ${(M.t + H - M.b) / 2}) rotate(-90)" text-anchor="middle">可达性能（TFLOPS，对数坐标）</text>`;
    const x0 = Math.max(xMin, yMin / bw);
    svg += `<path class="roof" d="M${lx(x0)} ${ly(perf(x0))} L${lx(ridge)} ${ly(peak)} L${lx(xMax)} ${ly(peak)}"/>`;
    svg += `<line x1="${lx(ridge)}" x2="${lx(ridge)}" y1="${ly(peak)}" y2="${H - M.b}" style="stroke:var(--accent);stroke-dasharray:4 4;opacity:.6"/>`;
    svg += `<text x="${lx(ridge) + 6}" y="${H - M.b - 8}" style="fill:var(--accent)">拐点 ≈ ${fmt(ridge, 0)}</text>`;
    svg += `<text x="${W - M.r}" y="${ly(peak) - 8}" text-anchor="end" style="fill:var(--accent)">峰值 ${fmt(peak, 0)} TFLOPS · 带宽 ${bw} TB/s</text>`;
    const prefillAI = roofAI(2048, 2);
    svg += `<rect x="${lx(prefillAI) - 5}" y="${ly(perf(prefillAI)) - 5}" width="10" height="10" rx="2" style="fill:var(--text-3)"/><text x="${lx(prefillAI)}" y="${ly(perf(prefillAI)) + 22}" text-anchor="middle">prefill 2048 token</text>`;
    [2, 1, 0.5].forEach((f) => {
      const ai = roofAI(B, f);
      const sel = f === wb;
      svg += `<circle class="pt" cx="${lx(ai)}" cy="${ly(perf(ai))}" r="${sel ? 8 : 5}" style="fill:${FMT_COLORS[f]};opacity:${sel ? 1 : 0.55}"/>`;
      if (sel) svg += `<text x="${lx(ai) - 10}" y="${ly(perf(ai)) - 14}" text-anchor="end" style="fill:var(--text);font-weight:600">${FMT_NAMES[f]} · batch ${B}</text>`;
    });
    svg += '</svg>';
    $('#rChart').innerHTML = svg;

    const ai = roofAI(B, wb);
    const p = perf(ai);
    const flops = 2 * B * ROOF.K * ROOF.N;
    const bytes = wb * ROOF.K * ROOF.N + 2 * B * (ROOF.K + ROOF.N);
    const tCompute = flops / (peak * 1e12);
    const tMem = bytes / (bw * 1e12);
    const memBound = tMem > tCompute;
    const denom = 2 * ROOF.K * ROOF.N - 2 * ridge * (ROOF.K + ROOF.N);
    const bCross = denom > 0 ? ridge * wb * ROOF.K * ROOF.N / denom : Infinity;
    $('#rOut').innerHTML = `
      <div><span class="pill ${memBound ? 'mem' : 'comp'}">${memBound ? '带宽瓶颈（memory-bound）' : '算力瓶颈（compute-bound）'}</span></div>
      <div class="big">${fmt(p, 0)} TFLOPS <span class="muted small">峰值的 ${fmt(p / peak * 100, p / peak < 0.1 ? 1 : 0)}%</span></div>
      <div class="kv">
        <span>算术强度</span><b class="mono">${fmt(ai, 1)} FLOP/B</b>
        <span>读写字节</span><b class="mono">${fmt(bytes / 1e6, 1)} MB</b>
        <span>理论耗时</span><b class="mono">${fmt(Math.max(tCompute, tMem) * 1e6, 1)} μs</b>
        <span>该格式进入 compute-bound 的 batch</span><b class="mono">≈ ${Number.isFinite(bCross) ? fmt(bCross, 0) : '∞'}</b>
      </div>
      <p class="small" style="margin:4px 0 0;color:var(--text-2)">decode 时 batch 就是并发请求数。权重字节越少，同样 batch 下算术强度越高、越早进入 compute-bound——所以 weight-only 量化只在小 batch 时有明显加速。图中淡色点是另外两种权重格式。</p>`;
  }

  /* ---------------- calculators ---------------- */
  const val = (id) => parseFloat($('#' + id).value);

  function renderCalcs() {
    const grid = $('#calcGrid');
    grid.innerHTML = `
      <div class="card card-pad calc" id="calcTrain">
        <h4>训练显存（每卡）</h4>
        <p class="desc">模型状态按混合精度 Adam（16 字节 / 参数）+ ZeRO 切分；激活按 Megatron 公式。</p>
        <div class="form">
          <label class="field wide">模型预设<select id="tPreset">${options(PLAN.trainPresets.map((p, i) => [i, p.name]).concat([['custom', '自定义']]), 1)}</select></label>
          <label class="field">参数量（B）<input id="tParams" type="number" min="0.1" step="0.1"></label>
          <label class="field">层数 L<input id="tLayers" type="number" min="1" step="1"></label>
          <label class="field">hidden h<input id="tHidden" type="number" min="64" step="64"></label>
          <label class="field">head 数 a<input id="tHeads" type="number" min="1" step="1"></label>
          <label class="field">序列长度 s<input id="tSeq" type="number" min="128" step="128" value="4096"></label>
          <label class="field">micro-batch b<input id="tMb" type="number" min="1" step="1" value="1"></label>
          <label class="field">TP（开启 SP）<select id="tTP">${options([1, 2, 4, 8], 8)}</select></label>
          <label class="field">PP<select id="tPP">${options([1, 2, 4, 8, 16], 4)}</select></label>
          <label class="field">DP<input id="tDP" type="number" min="1" step="1" value="2"></label>
          <label class="field">ZeRO 阶段<select id="tZero">${options([[0, '0（不切）'], [1, '1：优化器'], [2, '2：+ 梯度'], [3, '3：+ 参数']], 1)}</select></label>
          <label class="field">激活重计算<select id="tRc">${options([['none', '不重算'], ['selective', 'selective'], ['full', 'full']], 'selective')}</select></label>
          <label class="field">对比显卡<select id="tGpu">${gpuOptions('h100')}</select></label>
        </div>
        <div class="out" id="tOut"></div>
        <p class="note">激活按 1F1B 下首个 stage 计（约等于全部 L 层，与 PP 大小无关），按 MHA 公式、未计 embedding / logits 与临时 buffer。1 GB = 10⁹ 字节。</p>
      </div>

      <div class="card card-pad calc" id="calcKV">
        <h4>KV cache</h4>
        <p class="desc">每 token = 2 × 层数 × KV head 数 × head_dim × 字节数；MLA 只缓存潜向量。</p>
        <div class="form">
          <label class="field wide">模型预设<select id="kPreset">${options(PLAN.kvPresets.map((p, i) => [i, p.name]).concat([['custom', '自定义']]), 1)}</select></label>
          <label class="field">层数<input id="kLayers" type="number" min="1" step="1"></label>
          <label class="field">KV head 数<input id="kHeads" type="number" min="1" step="1"></label>
          <label class="field">head_dim<input id="kDim" type="number" min="16" step="16"></label>
          <label class="field">精度<select id="kDtype">${options([['2', 'BF16 / FP16'], ['1', 'FP8 / INT8'], ['0.5625', 'FP4（含尺度约 4.5 bit）']], '2')}</select></label>
          <label class="field">上下文长度<input id="kCtx" type="number" min="128" step="128" value="8192"></label>
          <label class="field">并发请求数<input id="kBatch" type="number" min="1" step="1" value="32"></label>
          <label class="field wide">可用于 KV 的显存（GiB）<input id="kAvail" type="number" min="1" step="1" value="40"></label>
        </div>
        <div class="out" id="kOut"></div>
        <p class="note" id="kNote">按 1024 进制计算。</p>
      </div>

      <div class="card card-pad calc" id="calcTime">
        <h4>训练时长</h4>
        <p class="desc">总计算量 ≈ 6 × 参数量 × token 数；峰值取 BF16 稠密算力。</p>
        <div class="form">
          <label class="field">参数量（B）<input id="hParams" type="number" min="0.1" step="0.1" value="70"></label>
          <label class="field">训练 token（T）<input id="hTokens" type="number" min="0.01" step="0.1" value="15"></label>
          <label class="field">GPU<select id="hGpu">${gpuOptions('h100')}</select></label>
          <label class="field">GPU 数量<input id="hCount" type="number" min="1" step="1" value="1024"></label>
          <label class="field">MFU（%）<input id="hMfu" type="number" min="1" max="100" step="1" value="40"></label>
        </div>
        <div class="out" id="hOut"></div>
        <p class="note">未计 attention 的额外 FLOPs 与故障重启时间。</p>
      </div>

      <div class="card card-pad calc" id="calcDecode">
        <h4>Decode 延迟下界</h4>
        <p class="desc">每步至少把本卡的权重和 KV cache 从 HBM 读一遍。</p>
        <div class="form">
          <label class="field">参数量（B）<input id="dParams" type="number" min="0.1" step="0.1" value="70"></label>
          <label class="field">权重格式<select id="dFmt">${options([['2', 'BF16'], ['1', 'FP8 / INT8'], ['0.5', 'INT4 / FP4']], '2')}</select></label>
          <label class="field">TP<select id="dTP">${options([1, 2, 4, 8], 8)}</select></label>
          <label class="field">GPU<select id="dGpu">${gpuOptions('h100')}</select></label>
          <label class="field">batch<input id="dBatch" type="number" min="1" step="1" value="1"></label>
          <label class="field">上下文长度<input id="dCtx" type="number" min="0" step="128" value="4096"></label>
          <label class="field wide">每 token 的 KV cache（KiB，可从左侧 KV 计算器得到）<input id="dKV" type="number" min="0" step="1" value="320"></label>
        </div>
        <div class="out" id="dOut"></div>
        <p class="note">忽略计算、TP 通信与 kernel 开销，并假设 KV head 数不少于 TP。batch 大到进入 compute-bound 后，这个下界不再成立。</p>
      </div>`;

    const trainPreset = () => {
      const v = $('#tPreset').value;
      if (v === 'custom') return;
      const p = PLAN.trainPresets[+v];
      $('#tParams').value = p.params; $('#tLayers').value = p.layers; $('#tHidden').value = p.hidden; $('#tHeads').value = p.heads;
    };
    const kvPreset = () => {
      const v = $('#kPreset').value;
      const mla = v !== 'custom' && PLAN.kvPresets[+v].mla;
      if (v !== 'custom') {
        const p = PLAN.kvPresets[+v];
        $('#kLayers').value = p.layers;
        if (!mla) { $('#kHeads').value = p.kvHeads; $('#kDim').value = p.headDim; }
      }
      $('#kHeads').disabled = !!mla;
      $('#kDim').disabled = !!mla;
    };
    $('#tPreset').addEventListener('change', () => { trainPreset(); calcTrain(); });
    $('#kPreset').addEventListener('change', () => { kvPreset(); calcKV(); });
    ['tParams', 'tLayers', 'tHidden', 'tHeads'].forEach((id) => $('#' + id).addEventListener('input', () => { $('#tPreset').value = 'custom'; }));
    ['kLayers', 'kHeads', 'kDim'].forEach((id) => $('#' + id).addEventListener('input', () => {
      const v = $('#kPreset').value;
      if (v !== 'custom' && !PLAN.kvPresets[+v].mla) $('#kPreset').value = 'custom';
    }));
    $('#calcTrain').addEventListener('input', calcTrain);
    $('#calcKV').addEventListener('input', calcKV);
    $('#calcTime').addEventListener('input', calcTime);
    $('#calcDecode').addEventListener('input', calcDecode);
    trainPreset();
    kvPreset();
    calcTrain(); calcKV(); calcTime(); calcDecode();
  }

  function calcTrain() {
    const psi = val('tParams') * 1e9;
    const L = val('tLayers'), h = val('tHidden'), a = val('tHeads'), s = val('tSeq'), b = val('tMb');
    const TP = val('tTP'), PP = val('tPP'), DP = Math.max(1, val('tDP')), zero = val('tZero');
    const rc = $('#tRc').value;
    const gpu = gpuById($('#tGpu').value);
    const per = psi / (TP * PP);
    const w = 2 * per / (zero >= 3 ? DP : 1);
    const g = 2 * per / (zero >= 2 ? DP : 1);
    const o = 12 * per / (zero >= 1 ? DP : 1);
    let layer;
    if (rc === 'none') layer = s * b * h * (34 / TP + 5 * a * s / (h * TP));
    else if (rc === 'selective') layer = s * b * h * 34 / TP;
    else layer = 2 * s * b * h / TP;
    const act = layer * L;
    const total = w + g + o + act;
    const GB = (x) => x / 1e9;
    const parts = [['权重', w, 'var(--c-exp)'], ['梯度', g, 'var(--c-man)'], ['优化器状态', o, 'var(--c-int)'], ['激活', act, 'var(--c-scale)']];
    const cap = gpu.mem;
    const over = GB(total) - cap;
    $('#tOut').innerHTML = `
      <div class="total">${fmt(GB(total), 1)} GB<small>每卡合计 · 共 ${fmt(TP * PP * DP, 0)} 卡</small></div>
      <div class="stack">${parts.map(([, v, c]) => `<i style="width:${v / total * 100}%;background:${c}"></i>`).join('')}</div>
      <div class="stack-legend">${parts.map(([n, v, c]) => `<span><i style="background:${c}"></i>${n} ${fmt(GB(v), 1)} GB</span>`).join('')}</div>
      <div class="cap-line ${over > 0 ? 'over' : 'ok'}">${over > 0 ? `超出 ${esc(gpu.name)}（${cap} GB）${fmt(over, 1)} GB，需要加大切分、开重计算或减小 micro-batch` : `占 ${esc(gpu.name)}（${cap} GB）的 ${fmt(GB(total) / cap * 100, 0)}%，剩余空间留给通信 buffer 与碎片`}</div>`;
  }

  function calcKV() {
    const v = $('#kPreset').value;
    const preset = v === 'custom' ? null : PLAN.kvPresets[+v];
    const L = val('kLayers'), dtype = val('kDtype'), ctx = val('kCtx'), batch = val('kBatch'), avail = val('kAvail');
    const elems = preset && preset.mla ? L * preset.mla : 2 * L * val('kHeads') * val('kDim');
    const perToken = elems * dtype;
    const perReq = perToken * ctx;
    const total = perReq * batch;
    const GiB = 1024 ** 3;
    const maxReq = Math.floor(avail * GiB / perReq);
    $('#kOut').innerHTML = `
      <div class="total">${fmt(total / GiB, 2)} GiB<small>${fmt(batch, 0)} 个请求 × ${fmt(ctx, 0)} token</small></div>
      <div class="lines">
        <span>每 token</span><b class="mono">${fmt(perToken / 1024, 1)} KiB</b>
        <span>每个请求</span><b class="mono">${fmt(perReq / GiB, 3)} GiB</b>
        <span>${fmt(avail, 0)} GiB 最多容纳</span><b class="mono">${fmt(maxReq, 0)} 个这样的请求</b>
      </div>`;
    $('#kNote').textContent = preset && preset.mla
      ? 'MLA：每层每 token 缓存 576 个元素（512 维潜向量 + 64 维解耦 RoPE key），不区分 K / V。按 1024 进制计算。'
      : '按 1024 进制计算；FP4 按每元素约 4.5 bit（含块尺度）估算。';
  }

  function calcTime() {
    const N = val('hParams') * 1e9, T = val('hTokens') * 1e12;
    const gpu = gpuById($('#hGpu').value);
    const count = val('hCount'), mfu = val('hMfu') / 100;
    const flops = 6 * N * T;
    const rate = count * gpu.tflops * 1e12 * mfu;
    const sec = flops / rate;
    const tokensPerDay = rate * 86400 / (6 * N);
    $('#hOut').innerHTML = `
      <div class="total">${fmt(sec / 86400, 1)} 天<small>${fmt(sec / 3600, 0)} 小时</small></div>
      <div class="lines">
        <span>总计算量</span><b class="mono">${sci(flops)} FLOPs</b>
        <span>集群有效算力</span><b class="mono">${sci(rate)} FLOP/s</b>
        <span>每天处理</span><b class="mono">${fmt(tokensPerDay / 1e9, 1)} B token</b>
      </div>`;
  }

  function calcDecode() {
    const params = val('dParams') * 1e9, wb = val('dFmt'), TP = val('dTP');
    const gpu = gpuById($('#dGpu').value);
    const batch = val('dBatch'), ctx = val('dCtx'), kv = val('dKV') * 1024;
    const wBytes = params * wb / TP;
    const kvBytes = batch * ctx * kv / TP;
    const bytes = wBytes + kvBytes;
    const ms = bytes / (gpu.bw * 1e12) * 1e3;
    $('#dOut').innerHTML = `
      <div class="total">${fmt(ms, 2)} ms<small>每步（每个请求生成 1 个 token）</small></div>
      <div class="lines">
        <span>每卡每步读取</span><b class="mono">${fmt(bytes / 1e9, 2)} GB</b>
        <span>其中 KV cache</span><b class="mono">${fmt(kvBytes / bytes * 100, 0)}%</b>
        <span>单请求速度上限</span><b class="mono">${fmt(1000 / ms, 0)} token/s</b>
        <span>总吞吐上限</span><b class="mono">${fmt(batch * 1000 / ms, 0)} token/s</b>
      </div>`;
  }

  /* ---------------- quantization ---------------- */
  const paperHaystack = (p) => (p.title + ' ' + p.note + ' ' + p.authors + ' ' + p.id).toLowerCase();
  const CHIP_QUERY = { 'FP8 E4M3': 'E4M3', 'BitNet b1.58': 'BitNet', 'LLM.int8()': 'LLM.int8' };
  const chipQuery = (name) => CHIP_QUERY[name] || name;
  const countMatches = (term) => PAPERS.papers.filter((p) => paperHaystack(p).includes(term.toLowerCase())).length;

  function renderQuant() {
    $('#fmtList').innerHTML = PLAN.formats.map((f) => {
      let bits;
      if (f.int) {
        bits = new Array(f.int).fill('<i class="n"></i>').join('');
      } else {
        const [s, e, m] = f.bits;
        bits = new Array(s).fill('<i class="s"></i>').join('')
          + Array.from({ length: e }, (_, k) => `<i class="e${k === 0 && s ? ' gap' : ''}"></i>`).join('')
          + Array.from({ length: m }, (_, k) => `<i class="m${k === 0 ? ' gap' : ''}"></i>`).join('');
      }
      const total = f.int || f.bits[0] + f.bits[1] + f.bits[2];
      const layout = f.int ? `${f.int} 位整数` : `${f.bits[0]} 符号 · ${f.bits[1]} 指数 · ${f.bits[2]} 尾数`;
      return `<div class="fmt-row"><div><span class="fname">${esc(f.name)}</span><span class="fuse">${total} bit · ${esc(f.use)}</span></div><div class="fmax"><span>最大值</span>${esc(f.max)}</div><div class="bits" title="${esc(layout)}">${bits}</div></div>`;
    }).join('');

    const fp4 = [0, 0.5, 1, 1.5, 2, 3, 4, 6];
    const int4 = Array.from({ length: 8 }, (_, k) => k * 6 / 7);
    const W = 540, X0 = 110, X1 = 520;
    const x = (v) => X0 + v / 6 * (X1 - X0);
    let svg = `<svg viewBox="0 0 ${W} 150">`;
    const rowSvg = (vals, y, label, color, fmtv) => {
      let s = `<text class="lbl" x="0" y="${y + 4}">${label}</text><line x1="${X0}" x2="${X1}" y1="${y}" y2="${y}" style="stroke:var(--border-strong)"/>`;
      vals.forEach((v, i) => {
        s += `<circle cx="${x(v)}" cy="${y}" r="5.5" style="fill:${color}"/>`;
        s += `<text x="${x(v)}" y="${y + (i % 2 ? 22 : -12)}" text-anchor="middle">${fmtv(v)}</text>`;
      });
      return s;
    };
    svg += rowSvg(fp4, 40, 'FP4 E2M1', 'var(--c-man)', (v) => String(v));
    svg += rowSvg(int4, 112, 'INT4 × 6/7', 'var(--c-int)', (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2)));
    svg += '</svg>';
    $('#numLine').innerHTML = svg + '<p class="muted small" style="margin:6px 0 0">只画了非负半轴，负半轴对称。FP4 在 [0, 2] 内有 5 个取值，INT4 只有 3 个；大于 4 的区间里 FP4 只剩 4 和 6 两个点。</p>';

    $('#blockViz').innerHTML = PLAN.blocks.map((b) => {
      const shown = Math.min(b.elems, 64);
      const cells = Array.from({ length: shown }, () => `<i${b.elemBits === 8 ? ' class="w8"' : ''}></i>`).join('');
      return `<div class="bv-row"><div class="bname">${esc(b.name)}<small>${b.elems} 个元素 / 块</small></div><div><div class="bv-cells">${cells}${b.elems > shown ? `<span class="ell">… 共 ${b.elems} 个</span>` : ''}<span class="sc">${esc(b.scale)}</span></div><div class="bv-meta">有效位宽 <b>${b.eff} bit</b> / 元素${b.extra ? ' · ' + esc(b.extra) : ''} · ${esc(b.note)}</div></div></div>`;
    }).join('') + '<p class="muted small" style="margin:0">绿色格为 4 bit 元素、蓝色高格为 8 bit 元素，黄色为每块共享的尺度。</p>';

    const mm = PLAN.methodMap;
    const chip = (name, hue) => {
      const q = chipQuery(name);
      const n = countMatches(q);
      return n
        ? `<button class="chip" style="--h:${hue}" data-search="${esc(q)}" title="在论文库中搜索 ${esc(q)}（${n} 篇）">${esc(name)}</button>`
        : `<span class="chip" style="--h:${hue}">${esc(name)}</span>`;
    };
    const hue = (ri, ci) => [[205, 175, 145], [245, 285, 320], [30, 10, 0]][ri][ci];
    $('#methodMap').innerHTML = `
      <table class="mmap">
        <thead><tr><th></th>${mm.cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
        <tbody>
          ${mm.rows.map((r, ri) => `<tr><th>${esc(r.label)}</th>${r.cells.map((cell, ci) => (cell.length ? `<td><div class="mchips">${cell.map((n) => chip(n, hue(ri, ci))).join('')}</div></td>` : '<td class="empty"></td>')).join('')}</tr>`).join('')}
          <tr><th>KV cache 与 attention</th><td colspan="3"><div class="mchips">${mm.kv.map((n) => chip(n, 120)).join('')}</div></td></tr>
        </tbody>
      </table>`;
    $('#methodMap').addEventListener('click', (e) => {
      const c = e.target.closest('[data-search]');
      if (!c) return;
      setPaperFilter({ group: 'all', cat: null, q: c.dataset.search });
      $('#papers').scrollIntoView({ behavior: 'smooth' });
    });

    $('#gemmGrid').innerHTML = PLAN.gemms.map((g) => `<div class="gemm"><span class="muted small">${esc(g.name)}</span><div class="expr">${esc(g.expr)}</div><p>${md(g.note)}</p><div class="who"><span class="chip" style="--h:24">训练需要</span>${g.infer ? '<span class="chip" style="--h:195">推理需要</span>' : ''}</div></div>`).join('');
    $('#compareTable').innerHTML = `<table class="cmp"><thead><tr><th>维度</th><th>推理量化</th><th>训练量化</th></tr></thead><tbody>${PLAN.compare.map((r) => `<tr><td>${esc(r[0])}</td><td>${md(r[1])}</td><td>${md(r[2])}</td></tr>`).join('')}</tbody></table>`;
    $('#compareNotes').innerHTML = PLAN.compareNotes.map((n) => `<p>${md(n)}</p>`).join('');
  }

  /* ---------------- papers ---------------- */
  const CAT = {};
  PAPERS.categories.forEach((c) => { CAT[c.id] = c; });
  const pstate = { group: 'all', cat: null, q: '', sort: 'new', limit: 30 };

  function initPapers() {
    const counts = {};
    PAPERS.groups.forEach((g) => { counts[g.id] = PAPERS.papers.filter((p) => p.group === g.id).length; });
    const years = PAPERS.papers.filter((p) => p.group === 'inference').map((p) => +p.date.slice(0, 4));
    $('#paperIntro').innerHTML = `共 ${PAPERS.papers.length} 篇：经典基础 ${counts.classics} 篇（GPTQ、AWQ、SmoothQuant、KIVI 等）；推理侧 ${counts.inference} 篇，聚焦 MXFP4 / NVFP4 推理算法（${Math.min(...years)}–${Math.max(...years)}）；训练侧 ${counts.training} 篇，涵盖 FP4 预训练、无偏梯度与低精度 RL。标题、作者与日期来自 arXiv API，每篇附一句话说明。`;
    $('#groupSeg').innerHTML = [['all', `全部 ${PAPERS.papers.length}`]].concat(PAPERS.groups.map((g) => [g.id, `${g.name.split('：')[0]} ${counts[g.id]}`])).map(([id, label]) => `<button data-group="${id}">${esc(label)}</button>`).join('');
    $('#groupSeg').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const group = b.dataset.group;
      setPaperFilter({ group, cat: pstate.cat && (group === 'all' || CAT[pstate.cat].group === group) ? pstate.cat : null });
    });
    $('#sortSeg').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) setPaperFilter({ sort: b.dataset.sort });
    });
    let timer;
    $('#paperSearch').addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => setPaperFilter({ q: e.target.value }), 120);
    });
    $('#catBars').addEventListener('click', (e) => {
      const bar = e.target.closest('.hbar');
      if (!bar) return;
      const cat = bar.dataset.cat === pstate.cat ? null : bar.dataset.cat;
      setPaperFilter({ cat, group: cat ? CAT[cat].group : pstate.group });
    });
    $('#activeFilter').addEventListener('click', (e) => {
      const b = e.target.closest('[data-clear]');
      if (!b) return;
      if (b.dataset.clear === 'cat') setPaperFilter({ cat: null });
      else setPaperFilter({ q: '' });
    });
    $('#moreRow').addEventListener('click', (e) => {
      if (!e.target.closest('button')) return;
      pstate.limit += 30;
      renderPaperList();
    });
    drawTimeChart();
    setPaperFilter({});
  }

  function setPaperFilter(patch) {
    Object.assign(pstate, patch, { limit: 30 });
    if (patch.q !== undefined && $('#paperSearch').value !== patch.q) $('#paperSearch').value = patch.q;
    $$('#groupSeg button').forEach((b) => b.classList.toggle('active', b.dataset.group === pstate.group));
    $$('#sortSeg button').forEach((b) => b.classList.toggle('active', b.dataset.sort === pstate.sort));
    renderCatBars();
    renderPaperList();
  }

  function renderCatBars() {
    const count = (cat) => PAPERS.papers.filter((p) => p.cat === cat).length;
    const max = Math.max(...PAPERS.categories.map((c) => count(c.id)));
    $('#catBars').innerHTML = PAPERS.groups.map((g) => `<div class="group-label">${esc(g.name)}</div>` + PAPERS.categories.filter((c) => c.group === g.id).map((c) => {
      const n = count(c.id);
      return `<div class="hbar${pstate.cat === c.id ? ' active' : ''}" data-cat="${c.id}" style="--h:${CAT_HUES[c.id]}" title="${esc(c.name)}"><span class="hn"><b>${c.id}</b>${esc(c.name)}</span><span class="ht"><i style="width:${n / max * 100}%"></i></span><span class="hc">${n}</span></div>`;
    }).join('')).join('');
  }

  function drawTimeChart() {
    const bucketOf = (date) => {
      const y = +date.slice(0, 4);
      const q = Math.ceil(+date.slice(5, 7) / 3);
      return y <= 2023 ? '≤2023' : `${y}Q${q}`;
    };
    const last = PAPERS.papers.reduce((m, p) => (p.date > m ? p.date : m), '0000-00');
    const keys = ['≤2023'];
    for (let y = 2024; y <= +last.slice(0, 4); y++) {
      for (let q = 1; q <= 4; q++) {
        const k = `${y}Q${q}`;
        if (y === +last.slice(0, 4) && q > Math.ceil(+last.slice(5, 7) / 3)) break;
        keys.push(k);
      }
    }
    const groups = PAPERS.groups.map((g) => g.id);
    const data = keys.map((k) => {
      const row = { k };
      groups.forEach((g) => { row[g] = PAPERS.papers.filter((p) => p.group === g && bucketOf(p.date) === k).length; });
      row.total = groups.reduce((a, g) => a + row[g], 0);
      return row;
    });
    const W = 520, H = 250, M = { l: 32, r: 8, t: 34, b: 34 };
    const maxV = Math.max(...data.map((d) => d.total));
    const yTop = Math.ceil(maxV / 5) * 5;
    const bw = (W - M.l - M.r) / data.length;
    const y = (v) => H - M.b - v / yTop * (H - M.t - M.b);
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="论文按季度分布">`;
    for (let v = 0; v <= yTop; v += yTop / 5) {
      svg += `<line class="gridline" x1="${M.l}" x2="${W - M.r}" y1="${y(v)}" y2="${y(v)}"/><text x="${M.l - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
    }
    data.forEach((d, i) => {
      let acc = 0;
      const x = M.l + i * bw + bw * 0.16;
      groups.forEach((g) => {
        if (!d[g]) return;
        const y0 = y(acc), y1 = y(acc + d[g]);
        svg += `<rect x="${x}" y="${y1}" width="${bw * 0.68}" height="${y0 - y1}" rx="2" style="fill:hsl(${GROUP_HUES[g]} 60% 56%)"><title>${d.k} · ${esc(PAPERS.groups.find((x2) => x2.id === g).name)}：${d[g]} 篇</title></rect>`;
        acc += d[g];
      });
      const label = d.k === '≤2023' ? '≤23' : d.k.slice(2);
      svg += `<text x="${M.l + i * bw + bw / 2}" y="${H - M.b + 15}" text-anchor="middle" style="font-size:10px">${label}</text>`;
      if (d.total) svg += `<text x="${M.l + i * bw + bw / 2}" y="${y(d.total) - 5}" text-anchor="middle" style="font-size:10px;fill:var(--text-2)">${d.total}</text>`;
    });
    let lx = M.l;
    PAPERS.groups.forEach((g) => {
      svg += `<rect x="${lx}" y="8" width="11" height="11" rx="2" style="fill:hsl(${GROUP_HUES[g.id]} 60% 56%)"/><text x="${lx + 16}" y="18" style="fill:var(--text-2)">${esc(g.name.split('：')[0])}</text>`;
      lx += 92;
    });
    svg += '</svg>';
    $('#timeChart').innerHTML = svg;
  }

  function highlight(text, terms) {
    if (!terms.length) return esc(text);
    const re = new RegExp('(' + terms.map(escRe).join('|') + ')', 'gi');
    return String(text).split(re).map((part, i) => (i % 2 ? `<mark>${esc(part)}</mark>` : esc(part))).join('');
  }

  function renderPaperList() {
    const terms = pstate.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const list = PAPERS.papers.filter((p) => (pstate.group === 'all' || p.group === pstate.group)
      && (!pstate.cat || p.cat === pstate.cat)
      && terms.every((t) => (paperHaystack(p) + ' ' + CAT[p.cat].name.toLowerCase()).includes(t)));
    list.sort((a, b) => {
      const c = a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date);
      return pstate.sort === 'new' ? -c : c;
    });
    const shown = list.slice(0, pstate.limit);
    $('#activeFilter').innerHTML = `<span>共 <b>${list.length}</b> 篇</span>`
      + (pstate.cat ? `<span class="chip" style="--h:${CAT_HUES[pstate.cat]}">${pstate.cat} · ${esc(CAT[pstate.cat].name)}</span><button data-clear="cat">清除类别</button>` : '')
      + (pstate.q.trim() ? `<button data-clear="q">清除搜索</button>` : '');
    $('#paperList').innerHTML = shown.map((p) => `
      <article class="card paper">
        <div class="pdate">${esc(p.date)}</div>
        <div>
          <div class="ptitle"><a href="https://arxiv.org/abs/${esc(p.id)}" target="_blank" rel="noopener">${highlight(p.title, terms)}</a></div>
          <div class="pmeta"><span class="chip" style="--h:${CAT_HUES[p.cat]}">${p.cat} · ${esc(CAT[p.cat].name)}</span><span>${highlight(p.authors, terms)}</span><a href="https://arxiv.org/abs/${esc(p.id)}" target="_blank" rel="noopener">arXiv ${highlight(p.id, terms)}</a><a href="https://arxiv.org/pdf/${esc(p.id)}" target="_blank" rel="noopener">PDF</a></div>
          <p class="pnote">${highlight(p.note, terms)}</p>
        </div>
      </article>`).join('') || '<p class="muted">没有匹配的论文，换个关键词试试。</p>';
    const rest = list.length - shown.length;
    $('#moreRow').innerHTML = rest > 0 ? `<button class="btn" type="button">再显示 ${Math.min(30, rest)} 篇（还有 ${rest} 篇）</button>` : '';
  }

  /* ---------------- interview ---------------- */
  let quizFilter = 'all';
  function renderQuiz() {
    $('#quizSeg').innerHTML = `<button data-q="all" class="${quizFilter === 'all' ? 'active' : ''}">全部</button>`
      + PLAN.stages.map((s, i) => (s.quiz.length ? `<button data-q="${i}" class="${String(quizFilter) === String(i) ? 'active' : ''}">${esc(s.short)}</button>` : '')).join('');
    const items = [];
    PLAN.stages.forEach((s, i) => {
      if (quizFilter === 'all' || +quizFilter === i) s.quiz.forEach((q) => items.push(qaItem(q, i, true)));
    });
    $('#quizList').innerHTML = items.join('');
  }

  function renderCoding() {
    $('#codingList').innerHTML = PLAN.coding.map((c) => checkItem(c, 'var(--accent)')).join('');
  }

  function renderInterview() {
    renderQuiz();
    $('#quizSeg').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      quizFilter = b.dataset.q;
      renderQuiz();
    });
    renderCoding();
    $('#designList').innerHTML = PLAN.design.map((d) => `<li><b>${esc(d.title)}</b>${md(d.text)}</li>`).join('');
    $('#deepDive').innerHTML = PLAN.deepDive.map((d) => `<li><b>${esc(d.title)}</b>${md(d.text)}</li>`).join('');
    $('#reviewSteps').innerHTML = PLAN.review.map((r) => `<li>${md(r)}</li>`).join('');
  }

  /* ---------------- nav & theme ---------------- */
  function initNav() {
    const links = $$('#nav a');
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    if (!('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.remove('active'));
        const a = byId.get(en.target.id);
        if (a) a.classList.add('active');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    $$('main > section').forEach((sec) => obs.observe(sec));
  }

  function initTheme() {
    const btn = $('#themeBtn');
    const icon = () => { btn.innerHTML = document.documentElement.getAttribute('data-theme') === 'dark' ? ICON_SUN : ICON_MOON; };
    btn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('ai-infra-theme', next); } catch (e) { /* storage unavailable */ }
      icon();
    });
    icon();
  }

  renderHero();
  renderTimeline();
  renderTabs();
  renderStage(currentStage);
  renderMatrix();
  renderMesh();
  renderFlow();
  renderPaged();
  renderRoofline();
  renderCalcs();
  renderQuant();
  initPapers();
  renderInterview();
  initNav();
  initTheme();
  updateProgress();
})();
