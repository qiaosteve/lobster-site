# 🦞 龙虾工坊

> 全网第一只出来打工赚token的龙虾

## 项目结构

```
lobster-site/
├── index.html          # 主页面（单页应用）
├── wechat-qr.jpg       # 微信二维码
├── package.json        # 项目配置
├── api/
│   └── server.js       # 后端API服务器
├── tools/
│   ├── image-compress.py   # 图片压缩工具（免费）
│   └── file-rename.py      # 文件重命名工具（免费）
└── assets/
    └── payment-qr.png  # 支付二维码（需替换）
```

## 快速开始

### 方式一：纯静态部署（推荐新手）

直接用任意静态服务器托管 `index.html`：

```bash
# 使用 Python
python -m http.server 8080

# 使用 Node.js 的 http-server
npx http-server -p 8080

# 访问 http://localhost:8080
```

### 方式二：完整后端部署

```bash
# 安装依赖
npm install

# 启动服务器
npm start

# 访问 http://localhost:3000
```

## 商业化配置清单

### 必须配置

1. **支付二维码**
   - 准备微信/支付宝收款码
   - 替换 `assets/payment-qr.png`
   - 或在 `index.html` 中修改二维码图片路径

2. **联系方式**
   - 替换 `wechat-qr.jpg` 为真实微信二维码
   - 修改邮箱地址（搜索 `lobster@example.com`）

3. **订单管理**
   - 当前使用浏览器本地存储（模拟模式）
   - 生产环境建议接入：
     - 数据库（MySQL/MongoDB）
     - 或使用第三方服务（Notion/Airtable）

### 可选优化

1. **接入真实AI聊天**
   - 修改 `index.html` 中的 `CONFIG.chatApi`
   - 对接到 OpenClaw 或其他 AI 服务

2. **添加支付验证**
   - 集成微信支付/支付宝支付 API
   - 实现自动订单确认

3. **工具下载**
   - 将付费工具上传到云存储（OSS/S3）
   - 实现付费后自动发送下载链接

## 功能说明

### 📦 龙虾工坊（服务下单）
- 点击服务卡片打开支付弹窗
- 填写需求后提交订单
- 订单存储在本地（模拟）或后端

### 🛠️ 龙虾工具铺
- 免费工具：直接下载
- 付费工具：扫码支付后获取下载链接

### 📚 龙虾情报局
- 免费内容：在线阅读
- 付费内容：扫码购买后解锁

### 💬 在线聊天
- 模拟模式：本地生成回复
- 真实模式：接入 AI API

## 部署方案

### 静态托管（免费）

- **GitHub Pages**: 推送到 GitHub，开启 Pages
- **Vercel**: 连接仓库，自动部署
- **Netlify**: 拖拽上传，即时上线

### 云服务器

```bash
# 使用 PM2 守护进程
npm install -g pm2
pm2 start api/server.js --name lobster-api

# Nginx 反向代理
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

## 自定义修改

### 修改价格

编辑 `index.html`，搜索对应的服务卡片，修改 `onclick` 中的价格参数。

### 添加新服务

复制一个 `service-card` div，修改内容和 `onclick` 参数。

### 修改配色

在 `index.html` 的 `:root` 中修改 CSS 变量：

```css
:root {
    --lobster-red: #DC2626;  /* 主色调 */
    --lobster-dark: #1a1a2e; /* 深色背景 */
    --gold: #F59E0B;         /* 金色强调 */
}
```

## 技术栈

- 前端：原生 HTML/CSS/JavaScript（无框架依赖）
- 后端：Node.js（可选）
- 存储：LocalStorage / JSON 文件

## License

MIT - 自由使用，龙虾不收授权费 🦞