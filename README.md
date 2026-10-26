# AI Infra Roadmap

系统学习 AI Infra 的可视化网站：多卡训练 · 推理框架 · 量化。

在线访问：<https://jiarwang77.github.io/ai-infra-roadmap/>

## 内容

| 模块 | 说明 |
| --- | --- |
| 学习路线 | 6 个阶段、10 周，由浅入深：基本功 → 多卡训练 → 推理框架 → 量化 → 进阶专题 → 面试冲刺。每个阶段有知识点、资料、动手项目、自测题和达标线，知识点可以打勾，进度保存在浏览器本地 |
| 系统图解 | 并行策略对比矩阵、DeviceMesh 分组可视化、推理请求生命周期、PagedAttention 交互演示、Roofline 图 |
| 算账工具 | 训练显存、KV cache、训练时长、decode 延迟下界四个计算器 |
| 量化图解 | 数值格式位布局、FP4 与 INT4 取值网格、MXFP4 / NVFP4 等块尺度格式、方法地图、推理量化与训练量化的对比 |
| 论文库 | 128 篇量化论文：经典基础 20 篇、MXFP4 / NVFP4 推理 90 篇、低精度训练 18 篇，可按类别筛选、搜索 |
| 面试题库 | 各阶段自测题与答题要点、手撕代码清单、系统设计题、项目复盘模板 |

## 本地预览

纯静态页面，没有构建步骤：

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000
```

## 更新论文

论文列表在 `data/papers/` 下，每个分组一个 TSV（列为 `id`、`cat`、`note`）：

- `classics.tsv`：经典基础（K1–K4）
- `inference.tsv`：推理侧（A–J）
- `training.tsv`：训练侧（T1–T3）

标题、作者、日期缓存在 `meta.json`，来自 arXiv API。修改 TSV 后运行：

```bash
python3 scripts/build_papers.py --fetch   # 为新增的 arXiv 编号拉取元数据并重新生成 assets/js/papers-data.js
```

类别名称在 `scripts/build_papers.py` 的 `CATEGORIES` 中定义。学习路线和图解的文字内容在 `assets/js/plan-data.js`。

## 目录

```
index.html                 页面骨架
assets/css/style.css       样式（浅色 / 深色主题）
assets/js/plan-data.js     学习路线与图解内容
assets/js/papers-data.js   论文数据（由脚本生成）
assets/js/app.js           渲染与交互
data/papers/               论文 TSV 与 arXiv 元数据缓存
scripts/build_papers.py    论文数据生成脚本
```
