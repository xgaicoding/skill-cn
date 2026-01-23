# Skill Hub 中国 🇨🇳

<div align="center">

![Skill Hub Logo](./public/images/logo.svg)

**助力国内 Skill 使用者快速找到能用、好用、可复用的实践方案**

[![GitHub stars](https://img.shields.io/github/stars/xgaicoding/skill-cn?style=social)](https://github.com/xgaicoding/skill-cn)
[![GitHub license](https://img.shields.io/github/license/xgaicoding/skill-cn)](https://github.com/xgaicoding/skill-cn/blob/main/LICENSE)

[🌐 在线体验](https://skill-cn.com) | [📖 官方文档](https://my.feishu.cn/wiki/XKnEwisJbi8TLEkdW6wckqkQnoe?fromScene=spaceOverview) | [💬 问题反馈](https://github.com/xgaicoding/skill-cn/issues)

</div>

## 🎯 项目简介

Skill Hub 中国是一个专注于 Agent Skill 落地实践的开源项目


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
npm run lint             # 代码检查
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
<a href="https://github.com/mengjian-github">
<img src="https://github.com/mengjian-github.png" width="80" height="80" style="border-radius: 50%;" alt="mengjian-github"><br>
<sub><b>孟健</b></sub><br>
<sub>贡献者</sub>
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
  <img src="./public/images/wx.png" alt="微信二维码" width="200">
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

