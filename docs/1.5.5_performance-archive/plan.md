# 1.5.5 性能排查结论（渲染 / GPU）

## 一、排查环境与方法
- 访问地址：http://localhost:3000（本机 3000 端口服务已启动）
- 使用工具：agent-browser 进行页面结构与样式扫描，录制了页面交互过程的 trace 供复盘
- 交互步骤：首屏加载完成后滚动上下各一次，观察动画与光效表现
- 产物：/Users/bytedance/Desktop/skill-cn/docs/1.5.5_performance/trace.zip

## 二、关键发现（定量数据）
1. 元素规模
   - DOM 总量：572
   - 图片：13（总像素约 2.65M，单图未出现超大图）
   - SVG：53
   - Canvas / Video / Iframe：0

2. 高开销视觉效果分布（可能触发 GPU 合成 / 离屏渲染）
   - backdrop-filter：23 个元素
     - blur(12px) saturate(1.6)：13 个（主要为列表卡片）
     - blur(10px) saturate(1.6)：8 个（分段按钮与切换按钮）
     - blur(20px) saturate(1.8)：1 个（顶部固定 Header）
   - filter：26 个元素
     - blur(70px)：3 个（Hero 区域的 glow 光晕）
     - 多个 drop-shadow（包含 loading 点与文本发光）
   - box-shadow：62 个元素

3. 动画与合成层倾向
   - 当前运行中的动画：17 个（glow / spark / loading dot 等持续运行）
   - will-change：40 个元素
     - transform：28 个
     - transform, opacity：10 个

4. 特定组件（与高 GPU 占用高度相关）
   - 列表卡片：a.skill-card 共 12 个，全部带 backdrop-filter（持续占用离屏缓冲）
   - 固定头部：header.app-header 带 backdrop-filter: blur(20px)，滚动时可能频繁参与重合成
   - Hero 光效：3 个 span.glow 带 blur(70px)，3 个 span.spark 持续动画
   - Loading 点：6 个 span.sh-loading__dot，带 drop-shadow + 动画

## 三、可能原因分析（结合用户“GPU 60% / 0.5G 显存”反馈）
1. 大量 backdrop-filter 触发离屏渲染
   - backdrop-filter 会为每个元素创建独立的离屏缓冲区并执行模糊与色彩处理，数量一多即显著占用 GPU 与显存。

2. 多层光效与模糊叠加
   - blur(70px) 的大半径模糊与多处 drop-shadow 会在合成阶段产生额外 GPU 开销，尤其在动画驱动时更明显。

3. 动画常驻运行导致 GPU 常态忙碌
   - 当前页面存在 17 个持续动画，即使页面静止也会维持高频合成与渲染。

4. will-change 使用范围过大
   - will-change 会提前创建合成层，数量过多会推高显存与 GPU 负载，且非必要时会适得其反。

## 四、优化建议（按优先级）
### A. 立刻可做（收益最大）
1. 大幅减少 backdrop-filter 叠加范围
   - 列表卡片优先去掉 backdrop-filter，改为半透明背景或使用预渲染的静态纹理。
   - 仅保留顶部 Header 的模糊，且适当降低 blur 半径（例如 20px → 8~12px）。

2. 限制光效与模糊数量
   - Hero 区域的 blur(70px) 光晕改为静态图片或降低模糊半径与面积。
   - 文本与 loading 点的 drop-shadow 适当减少，避免与动画同时运行。

3. 减少常驻动画数量
   - 非关键动画（glow / spark）在首屏结束后可暂停或降低帧率。
   - 对低性能设备或 prefers-reduced-motion 用户禁用装饰性动画。

4. 收敛 will-change 的使用
   - 只在真正发生动画时短时启用；动画结束后移除，避免全局常驻。

### B. 中期优化（结构性改善）
1. 将复杂滤镜转换为静态资源
   - 使用预先生成的 PNG/SVG 光晕图，减少实时滤镜计算。

2. 合并或复用阴影与光效
   - 通过容器统一渲染光晕或阴影，避免每个元素单独计算。

3. 为非首屏内容启用 content-visibility / contain
   - 降低滚动过程中对未显示区域的渲染与合成压力。

## 五、验证方案（用于确认优化效果）
1. Chrome DevTools Performance 录制 10s（含滚动）对比：
   - 关注 Compositor/GPU 任务时长与帧稳定性。

2. Rendering 面板开启：
   - Paint flashing：确认是否仍有大面积重绘
   - Layer borders：观察合成层数量是否下降

3. Performance Monitor：
   - 观察 GPU Memory 与 GPU Usage 变化，目标显著下降

4. 逐项开关验证：
   - 先仅关闭 backdrop-filter，再关闭 glow 动画，对比 GPU 使用率变化幅度

---

附：本次采样 trace
- /Users/bytedance/Desktop/skill-cn/docs/1.5.5_performance/trace.zip
