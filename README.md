# Skill Hub 中国 🇨🇳

<div align="center">

![Skill Hub Logo](./public/images/logo.svg)

**助力国内 Skill 使用者快速找到能用、好用、可复用的实践方案**

[![GitHub stars](https://img.shields.io/github/stars/xgaicoding/skill-cn?style=social)](https://github.com/xgaicoding/skill-cn)
[![GitHub license](https://img.shields.io/github/license/xgaicoding/skill-cn)](https://github.com/xgaicoding/skill-cn/blob/master/LICENSE)

[🌐 在线体验](https://www.skill-cn.com) | [📖 官方文档](https://my.feishu.cn/wiki/XKnEwisJbi8TLEkdW6wckqkQnoe?fromScene=spaceOverview) | [💬 问题反馈](https://github.com/xgaicoding/skill-cn/issues)

</div>

## 🎯 项目简介

[Skill Hub 中国](https://www.skill-cn.com)是一个专注于 Agent Skill 落地实践的开源平台，帮助国内开发者快速找到能用、好用、可复用的 AI 工具实践方案。

### ✨ 收录热门 Skill

| Skill | 场景 | 链接 |
|-------|------|------|
| [AI 做 PPT](https://www.skill-cn.com/skill/9) | 一键创建专业演示文稿 | pptx |
| [AI UI 设计](https://www.skill-cn.com/skill/1) | 让 AI 写出专业级前端界面 | ui-ux-pro-max |
| [AI 自动写公众号](https://www.skill-cn.com/skill/23) | 从素材到发布全流程自动化 | baoyu-skills |
| [AI 浏览器自动化](https://www.skill-cn.com/skill/12) | 网页测试与数据采集 | agent-browser |
| [A 股技术分析](https://www.skill-cn.com/skill/50) | 多维度共振验证信号 | stock-analysis |
| [AI 处理 PDF](https://www.skill-cn.com/skill/38) | 提取文本、合并拆分 | pdf |
| [AI 处理 Excel](https://www.skill-cn.com/skill/39) | 公式、图表、数据分析 | xlsx |
| [Markdown 转公众号](https://www.skill-cn.com/skill/18) | AI 全流程自动化发布 | md2wechat |
| [Vue 最佳实践](https://www.skill-cn.com/skill/34) | 组件设计与性能优化 | vue-best-practices |
| [React 最佳实践](https://www.skill-cn.com/skill/35) | 组件设计与性能优化 | react-best-practices |

👉 [查看全部 49 个 Skill →](https://www.skill-cn.com)

### 📝 实践案例

平台收录了 **232+ 篇真实实践案例**，涵盖 AI 编程、设计、自动化、内容创作等领域。每篇案例包含具体的使用场景、操作步骤和踩坑记录。

👉 [浏览实践案例 →](https://www.skill-cn.com)


## 🚀 快速开始

### 💻 本地开发

```bash
# 克隆项目
git clone https://github.com/xgaicoding/skill-cn.git
cd skill-cn

# 安装依赖
npm install

# 配置环境变量（见下文“环境变量”）
# - 推荐新建 .env.local
# - 注意不要提交任何真实 Key/Token

# 启动开发服务器
npm run dev

# 访问应用
# http://localhost:3000
```

## 📦 项目结构

```
skill-cn/
├── app/                      # Next.js App Router（页面与 Route Handlers）
│   ├── api/                  # API：skills/practices 列表、详情、计数、下载等
│   ├── auth/                 # GitHub OAuth 回调页
│   └── skill/[id]/           # Skill 详情页路由
├── components/               # UI 组件（首页、详情、Header/Footer、骨架屏等）
├── lib/                      # Supabase/GitHub 封装、常量与类型
├── docs/                     # PRD、技术方案、线框图、视觉稿
└── pages/_document.tsx       # 构建兼容兜底（避免部分环境 build 阶段报错）
```

## 🛠️ 开发命令

```bash
npm run dev              # 启动开发服务器
npm run build            # 构建
npm run start            # 启动生产服务
```

## 🤝 参与贡献

欢迎通过以下方式参与贡献：

- 🐛 [报告 Bug](https://github.com/xgaicoding/skill-cn/issues)
- 🌟 推荐优质 Skill
- ✨ 推荐优质实践
- 💡 提交功能建议
- 📖 完善文档 / UI / 代码

### 贡献流程

1. Fork 项目
2. 创建特性分支（`git checkout -b feature/AmazingFeature`）
3. 提交更改（`git commit -m 'Add some AmazingFeature'`）
4. 推送分支（`git push origin feature/AmazingFeature`）
5. 创建 Pull Request

## 👥 贡献者

<div align="center">

### 🌟 感谢所有为 Skill Hub 中国做出贡献的优秀开发者们！

<br>

<table align="center">
<tr>
<td align="center" width="120">
<a href="https://github.com/xgaicoding">
<img src="https://github.com/xgaicoding.png" width="80" height="80" style="border-radius: 50%;" alt="xgaicoding"><br>
<sub><b>李骁</b></sub><br>
<sub>项目发起人</sub>
</a>
</td>
<td align="center" width="120">
<a href="https://github.com/NumbSilver">
<img src="https://github.com/NumbSilver.png" width="80" height="80" style="border-radius: 50%;" alt="NumbSilver"><br>
<sub><b>孙齐浓</b></sub><br>
<sub>核心贡献者</sub>
</a>
</td>
<td align="center" width="120">
<a href="https://github.com/mengjian-github">
<img src="https://github.com/mengjian-github.png" width="80" height="80" style="border-radius: 50%;" alt="mengjian-github"><br>
<sub><b>孟健</b></sub><br>
<sub>核心贡献者</sub>
</a>
</td>
<td align="center" width="120">
<a href="https://github.com/ylx911229">
<img src="https://github.com/ylx911229.png" width="80" height="80" style="border-radius: 50%;" alt="ylx911229"><br>
<sub><b>姚路行</b></sub><br>
<sub>核心贡献者</sub>
</a>
</td>
</tr>
</table>

<br>

**💖 每一份贡献都让这个项目变得更好！**

想加入我们吗？[查看贡献指南](./CONTRIBUTING.md) 开始你的开源之旅！

</div>

## 📞 联系我们

<div align="center">
  <img src="./public/images/xg-qr.png" alt="微信二维码" width="200">
  <p><strong>扫码加入交流群</strong></p>
  <p>技术交流 | 实践分享 | 开源协作</p>
</div>

## 📄 开源协议

本项目基于 [MIT License](./LICENSE) 开源协议。

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！**

Made with ❤️ in China | © 2026 Skill Hub 中国

</div>

