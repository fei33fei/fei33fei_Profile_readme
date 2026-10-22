# 沈亦菲 · FeyFey

> 用视觉算法读懂图像，用 Agent 把流程自动化。

**在线作品集 → https://c6jiw4kctv3gu.space.mcode.cn**

<p align="center">
  <img src="docs/preview-home.png" width="860" alt="作品集首页 —— 文艺复兴透视空间 + 剪纸材质">
</p>

## 关于我

南通理工学院 · 人工智能专业 · 本科在读 · **2027 届**

做的是「把视觉算法和业务流程都变成能跑的系统」这件事 —— 在产线上训过能在 Jetson 边缘端实时跑的轻量化模型，也在用友做过企业级 AI 能力的测试与验收。

- **4 篇一作论文**（SCI 三区 ×1 · EI 收录 ×2 · 会议 ×1）、1 项软著
- **国家级荣誉 5 项 · 省级 4 项 · 校级与参与奖 17 项**，每条标注署名位次
- **7 个项目 · 5 个已公开仓库**
- 简历正在定稿 —— 站内 `/resume/` 先作占位页，定稿后补 PDF 下载

## 两条主线

### 01 · 计算机视觉 —— 图像分割与缺陷检测

从 SAR 溢油像素级分割到工业缺陷轻量化检测，做到 Jetson 边缘端实时推理。

| 项目 | 关键结果 |
|:--|:--|
| **SDE-Net** 海上溢油分割 | mIoU **87.95% / 89.53%**（SOS 数据集 · SCI 三区一作） |
| **FGL-YOLO** 无人机红外绝缘子缺陷检测 | mAP50-95 **0.5749** · 3.73M 参数 · 边缘端 **193.5 总 FPS**（Jetson Orin Nano Super） |
| **桥梁表观病害检测** | 11,123 → **27,757 张**切片增强 · 40,694 实例 · 边缘端 29 FPS |
| **钢材缺陷 · 注意力消融** | mAP50-95 **0.3190 → 0.3486**（国赛三等奖 · 位次 4） |
| **多场景路面坑洼检测** | mAP@0.5 **74.26%** · **61.27 FPS** · 软著已授权 |

> **一个反例比十个最好成绩更有说服力**：同一套改进在 IDID 全面提升、在 CPLID 全部回退。结论是增益与基线水平强相关 —— 这条在项目页里完整保留，是面试时最想被问到的一段。

### 02 · Agent 开发 —— 把模型接进能跑的流程

图像上传 → YOLO 权重推理 → 视觉大模型解释 → 结构化检测报告 → 落库并生成工单（LangGraph 编排）。

差异化设计是**置信度低于阈值 → 转人工复核** —— 与在用友做工业流水线自动化的经验同构：既做过自动化，也知道什么时候不该全自动。

## 论文与成果

| 题目 | 类型 | 级别 | 时间 | 位次 |
|:--|:--|:--|:--|:--|
| SDE-Net: A Strip-Directional Dynamic-Scale and Edge-Aware Network for SAR Oil Spill Segmentation | 论文 | **SCI 三区** | 2026.09 | 一作 |
| FGL-YOLO: A Lightweight and Efficient Network for Insulator Defect Detection on UAV | 论文 | EI 收录（会议） | 2026.01 | 一作 |
| Steel Surface Defect Detection Based on an Improved YOLOv8 Integrating EMA Attention Mechanism | 论文 | EI 收录（期刊） | 2026.03 | 一作 |
| Research on Robot Path Planning Method Based on Improved A\* and DWA Algorithms | 论文 | 会议 | 2026.01 | 一作 |
| 基于 YOLOv8 的多场景路面坑洼实时检测算法研究 | 论文 | 会议 | 2026.04 | 整理中 |
| YOLO-FIS: Enhancing Infrared Traffic Object Detection from UAV Perspectives | 论文 | 会议 | 2025.09 | 三作 |
| 基于视觉监控与 SPC 融合算法的制造过程可视化变差研究 | 论文 | 《电脑编程技巧与维护》 | 2024.08 | 三作 |
| Genetic algorithm-enhanced random forest… NIPT | 论文 | SCI 二区 | 2026.06 | 四作 |
| 基于深度学习的路面凹陷智能检测系统 | **软著** | — | 2026.07 | — |

> SCI 二区那篇署四作，**如实列出但不做项目页** —— 列表里出现不占主线位置，也不损失信息。

## 荣誉奖项

| 级别 | 时间 | 奖项 | 位次 |
|:--|:--|:--|:--|
| 国家级 | 2026.05 | 全国高校商业精英挑战赛 国际贸易竞赛 全国总决赛 · 国赛二等奖 | — |
| 国家级 | 2025.06 | 中国大学生计算机设计大赛（钢材缺陷分割检测）· 国赛三等奖 | 4 |
| 国家级 | 2025.01 | 全国大学生数学建模竞赛 · 国赛二等奖 | 3 |
| 国家级 | 2024.11 | 全国高校商业精英挑战赛 RCEP 赛道 · 国赛一等奖 | 2 |
| 国家级 | 2024.12 | 第二届「数学周报」全国大学生数学能力大赛 · 国赛二等奖 | 1 |
| 省级 | 2026.04 | 大学生服务外包创新创业大赛 桥梁病变赛道 · 省赛三等奖 | — |
| 省级 | 2025.12 | 全国高校计算机能力挑战赛 Word 赛道 · 省赛一等奖 | 1 |
| 省级 | 2025.08 | 中国机器人大赛暨 RoboCup 中国赛 · 省赛二等奖 | 2 |
| 省级 | 2025.07 | 中国高校智能机器人创意大赛 足式机器人挑战赛 · 省赛二等奖 | 2 |

**数学与工程底色**：国赛二等奖 ×2（数学建模 + 数学能力）· A\*+DWA 路径规划一作 · MATLAB / SPSS / 多元统计与最优化 · 用友 BIP ToB 交付（国航 / 哈锅）。

## 技术栈

| 方向 | 内容 |
|:--|:--|
| 计算机视觉 | PyTorch、OpenCV、U-Net、DeepLab、ConvNeXt、YOLOv8 / YOLO11、EMA / SE / CBAM、可变形卷积 DCNv2、小波上采样、Copy-Paste / 滑动窗口增强、模型轻量化与边缘部署 |
| Agent | GPT / Codex / Claude / 本地大模型 API、Skill 与 Agent 框架、MCP、Prompt 工程、多步工作流编排、LangGraph、Obsidian + Claude Code 工作流 |
| 机器学习 / 数学 | 随机森林、遗传算法、集成方法、特征工程、可解释性、MATLAB、SPSS、多元统计与最优化、数学建模、A\* / DWA |
| 工程 | Python、C / C++、Linux、Git、训练与部署流水线自动化、Excel 批量解析与结构化入库、测试用例编写、流程建模、文档撰写 |

## 这个仓库

作品集网站的完整源码。**内容驱动**：所有文案与结构都在 `data/*.json` 里，`build.mjs` 负责渲染成静态站点。

```
.
├── build.mjs              # 生成器：data/*.json → dist/
├── serve.mjs              # 本地预览服务器
├── data/                  # 内容源（改这里，网站就变）
│   ├── site.json          #   身份、配色、字阶、章节轮廓、联系方式
│   ├── projects.json      #   7 个项目 + 9 段详情模板
│   ├── papers.json        #   论文与成果（论文 + 软著）
│   ├── awards.json        #   荣誉奖项
│   └── profile.json       #   关于我：教育、经历、技能矩阵、研究方法
├── src/
│   ├── styles.css         # 设计系统（文艺复兴透视 + 剪纸材质）
│   └── site.js            # 交互层：入口序列、导航、项目筛选、复制邮箱
├── assets/                # 证件照三态：原始 / 3:4 / 1:1
├── dev/                   # 开发工具：截图、视口量测、HTML 校验、同步脚本
├── docs/                  # 界面截图
└── wrangler.jsonc         # Cloudflare Pages 配置
```

### 本地跑

```bash
npm install        # 可选，只为 wrangler；生成器零依赖
npm run build      # → dist/
npm run serve      # → http://127.0.0.1:4173
```

### 部署到 Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist --project-name feyfei
```

`wrangler.jsonc` 已设 `pages_build_output_dir: "./dist"`。产物里自带 `_headers`（缓存与安全响应头）、`_redirects`、`404.html`、`sitemap.xml`、`robots.txt`，可直接作为 Pages 构建目录。

### 设计说明

- **空间机制**：文艺复兴单点透视 —— 地平线、退远地面、前后层叠遮挡。
- **材质机制**：剪纸 —— 决定性裁切轮廓、哑光纸面、真实接触阴影。
- **跨页不变量**：字阶角色、纸墨关系、章节身份（编号 + 主色）、裁切语言、边饰词汇。
- **七个章节**各有编号、主色与专属轮廓路径；场景与纸面之间用四道裁切边做材质交接。
- **正文**用 Noto Serif SC / Noto Sans SC，拉丁文 Palatino 系，代码 Cascadia。
- **汉字保持正常字距**，只有拉丁与数字片段加 tracking —— 不做「奢侈字标」式的逐字加空格。

### 质检脚本

```bash
node dev/check-html.mjs dist/index.html   # 标签配对 + 嵌套 <a> 检测
```

`dev/measure.html` 可在真实视口内量测元素宽度与横向溢出；`dev/shoot2.ps1` 用 iframe 精确渲染指定视口截图（headless `--window-size` 会被 Windows 最小窗口宽度裁剪，不能直接用）。

## 联系方式

- 邮箱 · [nmebryz@163.com](mailto:nmebryz@163.com)
- GitHub · [fei33fei](https://github.com/fei33fei)
- 电话 · 18251141252 ｜ 微信 · 整理中

---

<p align="center"><img src="docs/preview-mobile.png" width="300" alt="移动端"></p>
