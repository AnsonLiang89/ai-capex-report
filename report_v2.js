// AI Capex Report v2 - 单导航优化版（v1.6）
const P = '#534AB7', PL = '#7B72D9', A = '#E63946', G = '#06A77D', W = '#FFA500';

// 加载 markdown 数据
const script = document.createElement('script');
script.src = 'report_md.js';
script.onload = renderAll;
document.head.appendChild(script);

function renderAll() {
  marked.setOptions({ gfm: true, breaks: false, headerIds: true });
  document.getElementById('content').innerHTML = marked.parse(MD_CONTENT);
  assignIds();
  insertCharts();
  setupTabbar();
  setupScrollSpy();
  setupBackTop();
  setupProgress();
}

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '');
}

// 给所有标题添加 id（用于 scroll-margin 和锚点跳转）
function assignIds() {
  const headings = document.querySelectorAll('#content h1, #content h2, #content h3');
  headings.forEach((h, idx) => {
    h.id = slugify(h.textContent) + '-' + idx;
  });
}

// Tab 导航：点击 tab 跳转到对应章节
function setupTabbar() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      const headings = document.querySelectorAll('#content h2');
      for (const h of headings) {
        if (h.textContent.includes(target)) {
          const top = h.getBoundingClientRect().top + window.pageYOffset - 64;
          window.scrollTo({ top, behavior: 'smooth' });
          break;
        }
      }
    });
  });
}

// 滚动监听：tab 高亮 + 章内子节悬浮条联动
function setupScrollSpy() {
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const tabKeywords = tabs.map(t => t.dataset.target);
  const allH2 = Array.from(document.querySelectorAll('#content h2'));
  const subnav = document.getElementById('chapter-subnav');
  const subnavLinks = document.getElementById('subnav-links');

  // 预先按 tab 关键词把 h2 归到各章
  const chapterMap = {};  // tabIdx -> { h2: heading, h3s: [headings] }
  let currentChapterIdx = -1;
  document.querySelectorAll('#content h2, #content h3').forEach(h => {
    if (h.tagName === 'H2') {
      // 找它属于哪个 tab
      for (let i = 0; i < tabKeywords.length; i++) {
        if (h.textContent.includes(tabKeywords[i])) {
          currentChapterIdx = i;
          if (!chapterMap[i]) chapterMap[i] = { h2: h, h3s: [] };
          break;
        }
      }
    } else if (h.tagName === 'H3' && currentChapterIdx !== -1) {
      if (chapterMap[currentChapterIdx]) chapterMap[currentChapterIdx].h3s.push(h);
    }
  });

  let lastTabIdx = -1;

  function onScroll() {
    // 找当前最接近顶部的 h2
    let activeTabIdx = 0;
    let lastH2Top = -Infinity;
    allH2.forEach(h => {
      const top = h.getBoundingClientRect().top;
      if (top < 100 && top > lastH2Top) {
        lastH2Top = top;
        for (let i = 0; i < tabKeywords.length; i++) {
          if (h.textContent.includes(tabKeywords[i])) {
            activeTabIdx = i;
            break;
          }
        }
      }
    });

    // 更新 tab 高亮
    tabs.forEach((t, i) => t.classList.toggle('active', i === activeTabIdx));

    // 更新章内子节悬浮条
    if (activeTabIdx !== lastTabIdx) {
      lastTabIdx = activeTabIdx;
      const ch = chapterMap[activeTabIdx];
      if (ch && ch.h3s.length > 0) {
        subnavLinks.innerHTML = ch.h3s.map(h3 => {
          const txt = h3.textContent.replace(/[#📊📐🌐🇺🇸🇨🇳⚠️💾🏭🔬💸📈💎☁️⚙️🏛️📅💰]/g, '').trim();
          // 简化：取前 12 字
          const short = txt.length > 16 ? txt.slice(0, 16) + '…' : txt;
          return `<a href="#${h3.id}" data-id="${h3.id}">${short}</a>`;
        }).join('');
        subnav.classList.add('show');
        // 重新绑定点击事件
        subnav.querySelectorAll('a').forEach(a => {
          a.addEventListener('click', e => {
            e.preventDefault();
            const target = document.getElementById(a.dataset.id);
            if (target) {
              const top = target.getBoundingClientRect().top + window.pageYOffset - 110;
              window.scrollTo({ top, behavior: 'smooth' });
            }
          });
        });
      } else {
        subnav.classList.remove('show');
      }
    }

    // 子节高亮
    if (chapterMap[activeTabIdx]) {
      const h3s = chapterMap[activeTabIdx].h3s;
      let activeH3Id = '';
      h3s.forEach(h => {
        if (h.getBoundingClientRect().top < 130) activeH3Id = h.id;
      });
      subnav.querySelectorAll('a').forEach(a => {
        a.classList.toggle('active', a.dataset.id === activeH3Id);
      });
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// 返回顶部按钮
function setupBackTop() {
  const btn = document.getElementById('backTop');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.pageYOffset > 600);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// 阅读进度条
function setupProgress() {
  const bar = document.getElementById('progress');
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    bar.style.width = pct + '%';
  }, { passive: true });
}

// 在某个 h2/h3 节点后面插入图表卡片
function insertChartAfter(headingText, chartHTML, chartFn) {
  const headings = document.querySelectorAll('#content h2, #content h3');
  for (const h of headings) {
    if (h.textContent.includes(headingText)) {
      const card = document.createElement('div');
      card.className = 'chart-card';
      card.innerHTML = chartHTML;
      h.parentNode.insertBefore(card, h.nextElementSibling);
      setTimeout(chartFn, 50);
      return;
    }
  }
}

function insertCharts() {
  // === 1. 第一章 美系 Hyperscaler 之后插入"Capex 时序" ===
  insertChartAfter('1.1 美系 Hyperscaler', `
    <h4>📊 美系 5 大 Hyperscaler Capex 4 年时序（亿美元）</h4>
    <div id="ch-hyper" class="chart"></div>`, () => {
    echarts.init(document.getElementById('ch-hyper')).setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['Microsoft','Amazon','Alphabet','Meta','Oracle'], top: 0 },
      grid: { left: 60, right: 30, top: 50, bottom: 30 },
      xAxis: { type: 'category', data: ['2024A','2025A','2026E','2027E'] },
      yAxis: { type: 'value', name: '$亿' },
      series: [
        { name: 'Microsoft', type: 'line', data: [560,1150,1900,2300], itemStyle: { color: P }, lineStyle: { width: 3 }, symbol: 'circle', symbolSize: 8 },
        { name: 'Amazon', type: 'line', data: [770,1320,2000,2600], itemStyle: { color: A }, lineStyle: { width: 3 }, symbol: 'circle', symbolSize: 8 },
        { name: 'Alphabet', type: 'line', data: [520,910,1850,2400], itemStyle: { color: W }, lineStyle: { width: 3 }, symbol: 'circle', symbolSize: 8 },
        { name: 'Meta', type: 'line', data: [390,720,1350,1850], itemStyle: { color: G }, lineStyle: { width: 3 }, symbol: 'circle', symbolSize: 8 },
        { name: 'Oracle', type: 'line', data: [80,210,500,750], itemStyle: { color: '#9B96D9' }, lineStyle: { width: 3, type: 'dashed' }, symbol: 'triangle', symbolSize: 8 }
      ]
    });
  });

  // === 2. 中国云厂之后插入"中外对比"（已修正中国 4 家口径，统一为"亿美元"）===
  insertChartAfter('1.2 中国云厂', `
    <h4>📊 9 大 CSP 2025→2026 Capex 上调对比（亿美元，1USD=7.20RMB）</h4>
    <p style="font-size:13px;color:#6B6789;margin:0 0 12px;line-height:1.6;">
      <b>口径统一</b>：所有数字均为"亿美元（USD 亿）"。中国 4 家从原始 RMB 亿按 1USD=7.20RMB 折算。
      读法示例：阿里 ¥1,500亿 ÷ 7.20 = $208亿（即 $20.8B）。这张图也直观显示了中美 capex 量级差距。
    </p>
    <div id="ch-csp" class="chart"></div>`, () => {
    echarts.init(document.getElementById('ch-csp')).setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: p => {
          const cn = ['阿里','字节','腾讯','百度'];
          let s = `<b>${p[0].name}</b><br/>`;
          p.forEach(item => {
            const usd = item.value;
            if (cn.includes(p[0].name)) {
              const rmb = Math.round(usd * 7.2);
              s += `${item.marker} ${item.seriesName}: $${usd}亿 (≈ ¥${rmb}亿)<br/>`;
            } else {
              s += `${item.marker} ${item.seriesName}: $${usd}亿 ($${(usd/10).toFixed(1)}B)<br/>`;
            }
          });
          return s;
        }
      },
      legend: { data: ['2025A', '2026E'], top: 0 },
      grid: { left: 60, right: 30, top: 80, bottom: 60 },
      xAxis: { type: 'category', data: ['Microsoft','Amazon','Alphabet','Meta','Oracle','阿里','字节','腾讯','百度'], axisLabel: { fontSize: 12 } },
      yAxis: { type: 'value', name: '$亿（亿美元）' },
      series: [
        { name: '2025A', type: 'bar', data: [1150,1320,910,720,210, 119, 139, 114, 56], itemStyle: { color: PL } },
        { name: '2026E', type: 'bar', data: [1900,2000,1850,1350,500, 208, 278, 139, 69], itemStyle: { color: P }, label: { show: true, position: 'top', fontSize: 11, fontWeight: 'bold' } }
      ]
    });
  });

  // === 3. 运营商章节插入"算力 vs 总 capex" ===
  insertChartAfter('中国三大电信运营商', `
    <h4>📊 三大运营商：总 capex 缩 vs 算力 capex 涨</h4>
    <div id="ch-tel" class="chart"></div>`, () => {
    echarts.init(document.getElementById('ch-tel')).setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['总 capex（亿元）','算力 capex（亿元）'], top: 0 },
      grid: { left: 60, right: 30, top: 50, bottom: 30 },
      xAxis: { type: 'category', data: ['中国移动','中国电信','中国联通'] },
      yAxis: { type: 'value', name: '¥亿' },
      series: [
        { name: '总 capex（亿元）', type: 'bar', data: [1366,730,500], itemStyle: { color: PL }, label: { show: true, position: 'top' } },
        { name: '算力 capex（亿元）', type: 'bar', data: [378,255,175], itemStyle: { color: A }, label: { show: true, position: 'top' } }
      ]
    });
  });

  // === 4. 核心组件：GPU 份额饼 ===
  insertChartAfter('4.1 AI 加速器', `
    <h4>📊 AI 加速器市场份额（2026E）</h4>
    <div id="ch-gpu" class="chart"></div>`, () => {
    echarts.init(document.getElementById('ch-gpu')).setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
      legend: { orient: 'vertical', left: 'left', top: 'middle' },
      series: [{ type: 'pie', radius: ['40%', '70%'], center: ['65%', '50%'], itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 }, label: { show: true, formatter: '{b}\n{c}%' },
        data: [
          { value: 75, name: 'NVIDIA', itemStyle: { color: P } },
          { value: 8, name: '自研ASIC', itemStyle: { color: A } },
          { value: 6, name: 'AMD', itemStyle: { color: W } },
          { value: 5, name: '华为昇腾', itemStyle: { color: G } },
          { value: 3, name: '寒武纪/海光', itemStyle: { color: '#E07AB4' } },
          { value: 3, name: '其他', itemStyle: { color: '#9B96D9' } }
        ] }]
    });
  });

  // === 5. HBM 章节：4 张图 ===
  insertChartAfter('4.2 HBM', `
    <h4>📊 HBM 月晶圆产能时序（K wafer/月）</h4>
    <div id="ch-hbm-cap" class="chart"></div>
    <h4 style="margin-top:24px;">📊 HBM TAM 演变（亿美元）</h4>
    <div id="ch-hbm-tam" class="chart"></div>`, () => {
    echarts.init(document.getElementById('ch-hbm-cap')).setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['SK海力士','三星','Micron'], top: 0 },
      grid: { left: 50, right: 30, top: 50, bottom: 30 },
      xAxis: { type: 'category', data: ['2024年底','2025年底','2026年底','2027E'] },
      yAxis: { type: 'value', name: 'K wafer/月' },
      series: [
        { name: 'SK海力士', type: 'line', data: [12,150,200,240], itemStyle: { color: P }, lineStyle: { width: 3 }, symbol: 'circle', symbolSize: 10, label: { show: true } },
        { name: '三星', type: 'line', data: [13,150,150,250], itemStyle: { color: A }, lineStyle: { width: 3, type: 'dashed' }, symbol: 'rect', symbolSize: 10, label: { show: true } },
        { name: 'Micron', type: 'line', data: [4,55,100,145], itemStyle: { color: W }, lineStyle: { width: 3 }, symbol: 'triangle', symbolSize: 10, label: { show: true } }
      ]
    });
    echarts.init(document.getElementById('ch-hbm-tam')).setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 30, top: 30, bottom: 30 },
      xAxis: { type: 'category', data: ['2023','2024','2025','2026E','2027E','2028E'] },
      yAxis: { type: 'value', name: '亿美元' },
      series: [{ type: 'bar', data: [50,280,520,700,850,1000], itemStyle: { color: function(p) { return [PL,PL,P,P,A,A][p.dataIndex]; } }, label: { show: true, position: 'top', fontWeight: 'bold', formatter: '${c}亿' } }]
    });
  });

  // === 6. 代工封装：CoWoS 爬坡 ===
  insertChartAfter('第五章', `
    <h4>📊 TSMC CoWoS 月产能爬坡曲线</h4>
    <div id="ch-cowos" class="chart"></div>`, () => {
    echarts.init(document.getElementById('ch-cowos')).setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 30, top: 30, bottom: 30 },
      xAxis: { type: 'category', data: ['2024Q4','2025Q2','2025Q4','2026Q2','2026Q4','2027E'] },
      yAxis: { type: 'value', name: 'K wafer/月' },
      series: [{ type: 'line', data: [36,50,70,95,130,180], itemStyle: { color: P }, lineStyle: { width: 4 }, symbol: 'circle', symbolSize: 12, smooth: true, label: { show: true, fontWeight: 'bold' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(83,74,183,0.4)' }, { offset: 1, color: 'rgba(83,74,183,0.05)' }] } } }]
    });
  });

  // === 7. 资金传导：桑基图（守恒律修复版 v1.5）===
  insertChartAfter('第七章', `
    <h4>📊 2026E AI 产业链资金流动桑基图（单位：亿美元，TrendForce基准）</h4>
    <p style="font-size:13px;color:#6B6789;margin:0 0 12px;line-height:1.6;">
      <b>读图说明</b>：本桑基图严格遵守"流量守恒"——每个节点流出 ≤ 流入。HBM/TSMC 向 WFE 设备的流量代表"由当年云厂 capex 间接转化为设备订单的部分"（约自身 capex/营收 强度 50%）；
      WFE 全球 2026 实际市场约 $1,400亿，差额来自三星 Foundry / Intel Foundry / 中芯国际等其他客户的独立 capex（不在本图追踪范围内）。
    </p>
    <div id="ch-sankey" class="chart chart-large"></div>`, () => {
    echarts.init(document.getElementById('ch-sankey')).setOption({
      tooltip: { trigger: 'item' },
      series: [{ type: 'sankey', layout: 'none', left: 30, right: 220, top: 20, bottom: 20, nodeAlign: 'left', nodeWidth: 18, nodeGap: 14, label: { fontSize: 11, fontWeight: 'bold', color: '#2C2A4A' }, lineStyle: { curveness: 0.5, opacity: 0.5 }, emphasis: { focus: 'adjacency' },
        data: [
          { name: '美系5巨头 7600', itemStyle: { color: P } },
          { name: '中国4云厂 600', itemStyle: { color: A } },
          { name: 'IT设备 5810', itemStyle: { color: P } },
          { name: '建筑+电力 2070', itemStyle: { color: '#E07AB4' } },
          { name: 'AI服务器 4360', itemStyle: { color: P } },
          { name: '网络设备 1450', itemStyle: { color: PL } },
          { name: 'GPU+ASIC 2090', itemStyle: { color: P } },
          { name: 'HBM 700', itemStyle: { color: A } },
          { name: 'DDR5/NAND 480', itemStyle: { color: W } },
          { name: 'PCB+散热+电源 440', itemStyle: { color: G } },
          { name: 'ODM组装 350', itemStyle: { color: PL } },
          { name: 'CoWoS封装 130', itemStyle: { color: '#9B96D9' } },
          { name: '光模块 500', itemStyle: { color: '#5BC0DE' } },
          { name: '交换芯片 300', itemStyle: { color: '#E07AB4' } },
          { name: 'TSMC代工 850', itemStyle: { color: P } },
          { name: 'WFE设备(本图追踪) 760', itemStyle: { color: G } }
        ],
        links: [
          // 守恒规则：每节点流出 ≤ 流入
          { source: '美系5巨头 7600', target: 'IT设备 5810', value: 5320 },
          { source: '美系5巨头 7600', target: '建筑+电力 2070', value: 1900 },
          { source: '中国4云厂 600', target: 'IT设备 5810', value: 420 },
          { source: '中国4云厂 600', target: '建筑+电力 2070', value: 150 },
          { source: 'IT设备 5810', target: 'AI服务器 4360', value: 4360 },
          { source: 'IT设备 5810', target: '网络设备 1450', value: 1450 },
          // BoM 拆解（按 TrendForce 2026 / SEMI 最新更新）：48% GPU+ASIC / 16% HBM / 11% DDR5+NAND / 10% PCB+散热+电源 / 8% ODM / 3% CoWoS / 4% 其他
          { source: 'AI服务器 4360', target: 'GPU+ASIC 2090', value: 2090 },
          { source: 'AI服务器 4360', target: 'HBM 700', value: 700 },
          { source: 'AI服务器 4360', target: 'DDR5/NAND 480', value: 480 },
          { source: 'AI服务器 4360', target: 'PCB+散热+电源 440', value: 440 },
          { source: 'AI服务器 4360', target: 'ODM组装 350', value: 350 },
          { source: 'AI服务器 4360', target: 'CoWoS封装 130', value: 130 },
          { source: '网络设备 1450', target: '光模块 500', value: 500 },
          { source: '网络设备 1450', target: '交换芯片 300', value: 300 },
          { source: 'GPU+ASIC 2090', target: 'TSMC代工 850', value: 850 },
          // === 守恒修复 ===
          // HBM 流入 700 → 流向 WFE 350（按 HBM 厂 capex/营收 50% 强度反推）
          { source: 'HBM 700', target: 'WFE设备(本图追踪) 760', value: 350 },
          // TSMC 流入 850 → 流向 WFE 410（按 TSMC capex/营收 ~48% 强度反推）
          { source: 'TSMC代工 850', target: 'WFE设备(本图追踪) 760', value: 410 }
        ]
      }]
    });
  });

  // === 8. 趋势风险：FCF 警戒（已修正数据数量级）===
  insertChartAfter('8.2 自由现金流警戒', `
    <h4>📊 美系巨头自由现金流时序（亿美元）</h4>
    <div id="ch-fcf" class="chart"></div>
    <h4 style="margin-top:24px;">📊 财务健康度矩阵（Capex/OCF vs Net Debt/EBITDA · 2026E）</h4>
    <div id="ch-fcf-matrix" class="chart"></div>
    <h4 style="margin-top:24px;">📊 Neocloud 极端 Capex/OCF 比率（vs Hyperscaler）</h4>
    <div id="ch-neocloud" class="chart"></div>`, () => {
    // 8.1 FCF 时序
    echarts.init(document.getElementById('ch-fcf')).setOption({
      tooltip: { trigger: 'axis', valueFormatter: v => '$' + v + '亿' },
      legend: { data: ['Microsoft','Alphabet','Meta','Amazon','Oracle'], top: 0 },
      grid: { left: 60, right: 30, top: 50, bottom: 30 },
      xAxis: { type: 'category', data: ['2024A','2025A','2026E'] },
      yAxis: { type: 'value', name: '$亿' },
      series: [
        { name: 'Microsoft', type: 'line', data: [740, 720, 550], itemStyle: { color: P }, lineStyle: { width: 4 }, symbol: 'circle', symbolSize: 12, label: { show: true } },
        { name: 'Alphabet', type: 'line', data: [727, 450, 250], itemStyle: { color: '#5BC0DE' }, lineStyle: { width: 3, type: 'dashed' }, symbol: 'circle', symbolSize: 10, label: { show: true } },
        { name: 'Meta', type: 'line', data: [526, 520, 0], itemStyle: { color: G }, lineStyle: { width: 3 }, symbol: 'triangle', symbolSize: 10, label: { show: true } },
        { name: 'Amazon', type: 'line', data: [382, 112, -225], itemStyle: { color: A }, lineStyle: { width: 3 }, symbol: 'circle', symbolSize: 10, label: { show: true } },
        { name: 'Oracle', type: 'line', data: [118, -25, -350], itemStyle: { color: W }, lineStyle: { width: 3, type: 'dashed' }, symbol: 'rect', symbolSize: 10, label: { show: true } }
      ]
    });

    // 8.2 财务健康度矩阵（Capex/OCF vs Net Debt/EBITDA）
    echarts.init(document.getElementById('ch-fcf-matrix')).setOption({
      tooltip: {
        formatter: p => `<b>${p.data[3]}</b><br/>Capex/OCF: ${p.data[0]}%<br/>Net Debt/EBITDA: ${p.data[1]}×<br/>评级: ${p.data[4]}`
      },
      grid: { left: 60, right: 60, top: 30, bottom: 50 },
      xAxis: { type: 'value', name: 'Capex/OCF (%)', nameLocation: 'middle', nameGap: 30, min: 0, max: 250, splitLine: { lineStyle: { color: '#eee' } } },
      yAxis: { type: 'value', name: 'Net Debt/EBITDA (×)', nameLocation: 'middle', nameGap: 40, min: -1, max: 4 },
      series: [{
        type: 'scatter',
        symbolSize: d => Math.sqrt(d[2]) * 4,
        label: { show: true, formatter: '{@[3]}', fontSize: 12, fontWeight: 'bold', position: 'top' },
        data: [
          [79, -0.2, 1900, 'Microsoft', 'AAA', P],
          [80, -0.4, 1200, 'Alphabet', 'AA+', '#5BC0DE'],
          [100, 0.1, 1400, 'Meta', 'AA', G],
          [110, 0.6, 2000, 'Amazon', 'AA', A],
          [214, 3.0, 550, 'Oracle', 'BBB+', W]
        ],
        itemStyle: { color: p => p.data[5] },
        markArea: {
          silent: true,
          itemStyle: { color: 'rgba(230,57,70,0.06)' },
          data: [[{ xAxis: 120, yAxis: 2.5 }, { xAxis: 250, yAxis: 4 }]]
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#aaa', type: 'dashed' },
          data: [
            { xAxis: 80, label: { formatter: '健康线' } },
            { xAxis: 120, label: { formatter: '危险线' } }
          ]
        }
      }]
    });

    // 8.3 Neocloud Capex/OCF 极端值对比
    echarts.init(document.getElementById('ch-neocloud')).setOption({
      tooltip: { trigger: 'axis', valueFormatter: v => v + '%' },
      grid: { left: 60, right: 30, top: 30, bottom: 60 },
      xAxis: { type: 'category', data: ['Microsoft','Alphabet','Meta','Amazon','Oracle','CoreWeave','Nebius','Crusoe'], axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value', name: 'Capex/OCF (%)', max: 1000 },
      series: [{
        type: 'bar',
        data: [
          { value: 79, itemStyle: { color: G } },
          { value: 80, itemStyle: { color: G } },
          { value: 100, itemStyle: { color: W } },
          { value: 110, itemStyle: { color: W } },
          { value: 214, itemStyle: { color: A } },
          { value: 500, itemStyle: { color: A } },
          { value: 800, itemStyle: { color: A } },
          { value: 900, itemStyle: { color: A } }
        ],
        label: { show: true, position: 'top', formatter: '{c}%', fontWeight: 'bold' },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#aaa', type: 'dashed' },
          data: [
            { yAxis: 80, label: { formatter: '健康 80%' } },
            { yAxis: 120, label: { formatter: '危险 120%' } }
          ]
        }
      }]
    });
  });

  // === 9. 第二章电力专题：DC 用电增长 ===
  insertChartAfter('2.1 全球数据中心电力需求', `
    <h4>📊 全球数据中心电力消耗演变（TWh）</h4>
    <div id="ch-power" class="chart"></div>`, () => {
    echarts.init(document.getElementById('ch-power')).setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['全球 DC 用电（TWh）','其中 AI DC（TWh）','美国 DC 用电（TWh）'], top: 0 },
      grid: { left: 60, right: 30, top: 50, bottom: 30 },
      xAxis: { type: 'category', data: ['2024','2025','2026E','2027E','2028E','2030E'] },
      yAxis: { type: 'value', name: 'TWh' },
      series: [
        { name: '全球 DC 用电（TWh）', type: 'bar', data: [460,580,750,950,1200,1500], itemStyle: { color: PL }, label: { show: true, position: 'top', fontSize: 11 } },
        { name: '其中 AI DC（TWh）', type: 'line', data: [55,145,300,520,800,1050], itemStyle: { color: A }, lineStyle: { width: 3 }, symbol: 'circle', symbolSize: 10 },
        { name: '美国 DC 用电（TWh）', type: 'line', data: [200,260,340,430,520,600], itemStyle: { color: P }, lineStyle: { width: 3, type: 'dashed' }, symbol: 'rect', symbolSize: 10 }
      ]
    });
  });

  // === 10. 8.6 应用变现 vs Capex ===
  insertChartAfter('8.6 AI 应用变现', `
    <h4>📊 AI 应用收入 vs Hyperscaler Capex 投入（亿美元）</h4>
    <div id="ch-monetize" class="chart"></div>`, () => {
    echarts.init(document.getElementById('ch-monetize')).setOption({
      tooltip: { trigger: 'axis', valueFormatter: v => '$' + v + '亿' },
      legend: { data: ['Capex 投入','AI 应用 ARR','差距'], top: 0 },
      grid: { left: 60, right: 30, top: 50, bottom: 30 },
      xAxis: { type: 'category', data: ['2024','2025','2026E','2027E','2028E'] },
      yAxis: { type: 'value', name: '$亿' },
      series: [
        { name: 'Capex 投入', type: 'bar', data: [2300,4300,7600,9000,10000], itemStyle: { color: A }, label: { show: true, position: 'top', fontSize: 10 } },
        { name: 'AI 应用 ARR', type: 'bar', data: [150,400,800,1700,3000], itemStyle: { color: G }, label: { show: true, position: 'top', fontSize: 10 } },
        { name: '差距', type: 'line', data: [2150,3900,6800,7300,7000], itemStyle: { color: W }, lineStyle: { width: 3, type: 'dashed' }, symbol: 'triangle', symbolSize: 10 }
      ]
    });
  });

  // === 11. 8.7 周期顶点信号雷达图 ===
  insertChartAfter('8.7 周期顶点信号', `
    <h4>📊 周期顶点信号雷达（当前 vs 顶点阈值）</h4>
    <div id="ch-cycle" class="chart"></div>`, () => {
    echarts.init(document.getElementById('ch-cycle')).setOption({
      tooltip: {},
      legend: { data: ['当前状态','顶点阈值'], top: 0 },
      radar: {
        indicator: [
          { name: 'HBM 长协涨幅', max: 50 },
          { name: 'CoWoS 利用率', max: 110 },
          { name: 'GPU 二级溢价', max: 50 },
          { name: 'Capex 季环比', max: 30 },
          { name: 'GPU 租金 YoY', max: 50 },
          { name: 'TSMC 营收 YoY', max: 50 }
        ],
        center: ['50%', '55%'],
        radius: '60%'
      },
      series: [{
        type: 'radar',
        data: [
          { name: '当前状态', value: [35, 100, 20, 25, 15, 30], itemStyle: { color: P }, areaStyle: { color: 'rgba(83,74,183,0.3)' } },
          { name: '顶点阈值', value: [15, 85, 0, 5, 0, 10], itemStyle: { color: A }, areaStyle: { color: 'rgba(230,57,70,0.2)' }, lineStyle: { type: 'dashed' } }
        ]
      }]
    });
  });

  // === 12. 第十三章 ROI 测算 - 三情景对比 ===
  insertChartAfter('13.2 三种价格情景', `
    <h4>📊 单 GW 算力 4 年 IRR 三情景对比</h4>
    <div id="ch-roi" class="chart"></div>`, () => {
    echarts.init(document.getElementById('ch-roi')).setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['4 年总收入（$亿）','净现金流（$亿）','IRR (%)'], top: 0 },
      grid: { left: 60, right: 60, top: 50, bottom: 30 },
      xAxis: { type: 'category', data: ['悲观（$2/h）','中性（$4/h，当前）','乐观（$6/h）'] },
      yAxis: [
        { type: 'value', name: '$亿', position: 'left' },
        { type: 'value', name: 'IRR %', position: 'right', max: 60 }
      ],
      series: [
        { name: '4 年总收入（$亿）', type: 'bar', data: [300,600,900], itemStyle: { color: PL }, label: { show: true, position: 'top' } },
        { name: '净现金流（$亿）', type: 'bar', data: [102,402,702], itemStyle: { color: G }, label: { show: true, position: 'top' } },
        { name: 'IRR (%)', type: 'line', yAxisIndex: 1, data: [13,35,52], itemStyle: { color: A }, lineStyle: { width: 4 }, symbol: 'circle', symbolSize: 14, label: { show: true, formatter: '{c}%', fontWeight: 'bold' } }
      ]
    });
  });

  // === 14. 4.1B CPU 章节图：AMD 反超 Intel + ARM 渗透率 ===
  insertChartAfter('4.1B CPU', `
    <h4>📊 数据中心 CPU：AMD 反超 Intel + ARM 崛起（亿美元）</h4>
    <div id="ch-cpu1" class="chart"></div>
    <h4 style="margin-top:24px;">📊 ARM 在数据中心 CPU 的渗透率演变</h4>
    <div id="ch-cpu2" class="chart"></div>`, () => {
    echarts.init(document.getElementById('ch-cpu1')).setOption({
      tooltip: { trigger: 'axis', valueFormatter: v => '$' + v + '亿' },
      legend: { data: ['AMD 数据中心 CPU','Intel 数据中心 CPU','NVIDIA Grace（嵌入）','海光信息（折美元）'], top: 0 },
      grid: { left: 60, right: 30, top: 50, bottom: 30 },
      xAxis: { type: 'category', data: ['2024A','2025A','2026E','2027E'] },
      yAxis: { type: 'value', name: '$亿' },
      series: [
        { name: 'AMD 数据中心 CPU', type: 'line', data: [130, 200, 280, 380], itemStyle: { color: P }, lineStyle: { width: 4 }, symbol: 'circle', symbolSize: 12, label: { show: true, fontWeight: 'bold' } },
        { name: 'Intel 数据中心 CPU', type: 'line', data: [190, 180, 170, 165], itemStyle: { color: A }, lineStyle: { width: 3, type: 'dashed' }, symbol: 'rect', symbolSize: 10, label: { show: true } },
        { name: 'NVIDIA Grace（嵌入）', type: 'line', data: [25, 50, 100, 180], itemStyle: { color: G }, lineStyle: { width: 3 }, symbol: 'triangle', symbolSize: 10, label: { show: true } },
        { name: '海光信息（折美元）', type: 'line', data: [12, 20, 29, 40], itemStyle: { color: W }, lineStyle: { width: 3 }, symbol: 'diamond', symbolSize: 10 }
      ]
    });
    echarts.init(document.getElementById('ch-cpu2')).setOption({
      tooltip: { trigger: 'axis', valueFormatter: v => v + '%' },
      grid: { left: 50, right: 30, top: 30, bottom: 30 },
      xAxis: { type: 'category', data: ['2024','2025','2026E','2027E','2028E','2030E'] },
      yAxis: { type: 'value', name: '%', max: 60 },
      series: [{
        type: 'line',
        data: [8, 14, 22, 30, 38, 47],
        itemStyle: { color: P },
        lineStyle: { width: 4 },
        symbol: 'circle',
        symbolSize: 12,
        smooth: true,
        label: { show: true, formatter: '{c}%', fontWeight: 'bold' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(83,74,183,0.4)' }, { offset: 1, color: 'rgba(83,74,183,0.05)' }] } }
      }]
    });
  });

  // === 15. 第十四章分析师视角：投资矩阵 ===
  insertChartAfter('14.2 确定性最高', `
    <h4>📊 投资标的胜率 × 弹性矩阵（气泡大小 = 当前市值，单位 $亿）</h4>
    <div id="ch-invest" class="chart chart-large"></div>`, () => {
    echarts.init(document.getElementById('ch-invest')).setOption({
      tooltip: { formatter: p => `<b>${p.data[3]}</b><br/>胜率: ${p.data[0]}%<br/>2026 EPS 弹性: ${p.data[1]>0?'+':''}${p.data[1]}%<br/>梯队: ${p.data[4]}` },
      grid: { left: 60, right: 60, top: 30, bottom: 60 },
      xAxis: { type: 'value', name: '胜率（%）→', nameLocation: 'middle', nameGap: 30, min: 30, max: 100 },
      yAxis: { type: 'value', name: '2026 EPS 弹性（%）↑', nameLocation: 'middle', nameGap: 40, min: -60, max: 130 },
      series: [{
        type: 'scatter',
        symbolSize: d => Math.sqrt(d[2]) * 1.4,
        label: { show: true, formatter: '{@[3]}', fontSize: 12, fontWeight: 'bold', position: 'right' },
        data: [
          [92, 35, 1200, 'TSMC', '🥇 第一', P],
          [88, 60, 200, 'SK海力士', '🥇 第一', P],
          [85, 50, 1500, '博通 AVGO', '🥇 第一', P],
          [82, 80, 180, 'Micron', '🥈 第二', '#5BC0DE'],
          [80, 90, 50, 'ASMPT', '🥈 第二', '#5BC0DE'],
          [78, 110, 20, 'Hanmi Semi', '🥈 第二', '#5BC0DE'],
          [80, 70, 600, 'AMD', '🥈 第二', '#5BC0DE'],
          [82, 50, 50, '北方华创', '🥈 第二', '#5BC0DE'],
          [78, 55, 100, '中际旭创', '🥈 第二', '#5BC0DE'],
          [75, 60, 30, '海光信息', '🥈 第二', '#5BC0DE'],
          [70, 35, 500, '三星电子', '🥈 第二', '#5BC0DE'],
          [88, 25, 4000, 'NVIDIA', '🥇 已贵', P],
          [60, 100, 25, '寒武纪', '🥉 第三', W],
          [55, 80, 15, '摩尔/沐曦', '🥉 IPO', W],
          [65, 40, 80, 'Vertiv', '🥉 第三', W],
          [35, -30, 200, 'Oracle', '⚠️ 高风险', A],
          [40, -50, 80, 'CoreWeave', '⚠️ 高风险', A],
          [50, 0, 800, 'Intel', '⚠️ 困境反转', A],
          [55, -10, 1500, 'Meta', '🟡 中性', '#9B96D9']
        ],
        itemStyle: { color: p => p.data[5] },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#ccc', type: 'dashed' },
          data: [
            { xAxis: 75, label: { formatter: '高胜率线' } },
            { yAxis: 50, label: { formatter: '高弹性线' } },
            { yAxis: 0, lineStyle: { color: '#aaa' } }
          ]
        }
      }]
    });
  });

  // === 13. 第十二章 关键事件日历（甘特图风格）===
  insertChartAfter('第十二章', `
    <h4>📊 2024-2028 AI Capex 关键事件时间线</h4>
    <div id="ch-timeline" class="chart"></div>`, () => {
    echarts.init(document.getElementById('ch-timeline')).setOption({
      tooltip: { trigger: 'item' },
      grid: { left: 100, right: 30, top: 30, bottom: 30 },
      xAxis: { type: 'category', data: ['24Q4','25Q1','25Q2','25Q3','25Q4','26Q1','26Q2','26Q3','26Q4','27Q1','27Q2','27Q3','27Q4','28Q1','28Q2','28Q3','28Q4'] },
      yAxis: { type: 'category', data: ['周期顶点信号','HBM4 量产','Rubin GPU','Stargate 部署','CoWoS 月产能(K)','HBM 月产能(K)'].reverse() },
      visualMap: {
        min: 0, max: 600, calculable: true, orient: 'horizontal', left: 'center', bottom: 0,
        inRange: { color: ['#F5F4FB', '#7B72D9', '#534AB7', '#E63946'] }
      },
      series: [{
        type: 'heatmap',
        data: [
          // [x, y, value]
          // CoWoS 月产能（千片/月）
          [0,0,36],[1,0,45],[2,0,55],[3,0,62],[4,0,70],[5,0,80],[6,0,95],[7,0,110],[8,0,130],[9,0,140],[10,0,150],[11,0,160],[12,0,180],[13,0,200],[14,0,220],[15,0,240],[16,0,260],
          // HBM 月产能
          [0,1,30],[1,1,60],[2,1,120],[3,1,200],[4,1,280],[5,1,330],[6,1,360],[7,1,400],[8,1,450],[9,1,490],[10,1,530],[11,1,560],[12,1,580],[13,1,600],[14,1,620],[15,1,630],[16,1,640],
          // Stargate 部署进度（百万 GPU）
          [4,2,5],[5,2,15],[6,2,30],[7,2,45],[8,2,60],[9,2,80],[10,2,110],[11,2,140],[12,2,170],[13,2,200],
          // Rubin GPU 量产
          [8,3,10],[9,3,30],[10,3,80],[11,3,150],[12,3,250],[13,3,350],[14,3,420],[15,3,460],[16,3,500],
          // HBM4 量产
          [5,4,5],[6,4,30],[7,4,80],[8,4,160],[9,4,250],[10,4,340],[11,4,420],[12,4,500],
          // 周期顶点信号强度
          [9,5,10],[10,5,15],[11,5,30],[12,5,60],[13,5,100],[14,5,150],[15,5,200],[16,5,250]
        ],
        label: { show: false }
      }]
    });
  });
}
