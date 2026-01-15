# GitHub 信息获取（最小 Demo）

从一个 GitHub 仓库/目录链接中，获取：
- 仓库 star 数
- 作者（owner）名称（login + name）
- 指定目录的最近一次提交时间（last commit date）

## 准备

在 `docs/research/github` 下安装依赖：

```bash
npm i
```

建议通过环境变量提供 Token（不要写进代码/仓库）：

```bash
export GITHUB_TOKEN='你的 PAT（fine-grained token）'
```

不设置 `GITHUB_TOKEN` 也可以跑（公共仓库会走匿名请求，但有更严格的 rate limit）。

## 运行

```bash
node demo.mjs 'https://github.com/anthropics/skills/tree/main/skills/algorithmic-art'
```

## 下载目录 Zip（仅该目录）

从目录链接生成一个只包含该目录的 zip（默认输出到 `output/<目录名>.zip`）：

```bash
node dir-zip.mjs 'https://github.com/anthropics/skills/tree/main/skills/algorithmic-art'
```

