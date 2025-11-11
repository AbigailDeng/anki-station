# 地铁站点记忆游戏

一个有趣的地铁站点记忆游戏，帮助你和家人测试对地铁线路的记忆能力。

## 功能特点

- 🎮 **记忆挑战**：5分钟时间记忆整条地铁线的所有站点
- ✅ **答题模式**：时间到后依次回答站点名称，系统自动判断对错
- 📱 **移动端适配**：完美支持手机和平板设备
- 🎨 **美观界面**：现代化的UI设计，流畅的用户体验
- 📊 **进度追踪**：实时显示答题进度和得分

## 游戏规则

1. **选择线路**：从列表中选择一条地铁线路
2. **记忆阶段**：5分钟倒计时，仔细记忆所有站点名称和换乘信息
3. **答题阶段**：依次输入每个站点的名称，系统会判断是否正确
4. **查看结果**：每答一题立即显示正确答案和换乘信息

## 安装和运行

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

浏览器会自动打开 `http://localhost:3000`

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS (移动端响应式设计)

## 项目结构

```
anki-station/
├── src/
│   ├── data/
│   │   └── subwayLines.ts    # 地铁线路数据（TypeScript）
│   ├── App.tsx               # 主应用组件（TypeScript）
│   ├── main.tsx              # 入口文件（TypeScript）
│   └── index.css             # Tailwind CSS 样式
├── index.html                # HTML模板
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript配置
├── tailwind.config.js        # Tailwind CSS配置
├── postcss.config.js         # PostCSS配置
└── vite.config.ts            # Vite配置（TypeScript）
```

## 使用说明

1. 打开应用后，选择一条地铁线路
2. 在5分钟记忆时间内，仔细查看所有站点
3. 时间到后进入答题模式
4. 输入站点名称并提交答案
5. 查看正确答案和换乘信息
6. 可以随时跳转到任意站点重新答题

## 自定义地铁线路

编辑 `src/data/subwayLines.ts` 文件，可以添加或修改地铁线路数据：

```typescript
{
  id: 1,
  name: '1号线',
  color: '#E4002B',
  stations: [
    { name: '站点名称', transfer: ['换乘线路1', '换乘线路2'] },
    // ...
  ]
}
```

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 许可证

MIT

