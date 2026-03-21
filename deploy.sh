#!/bin/bash
# 龙虾工坊服务器部署脚本
# 在服务器上执行此脚本

echo "🦞 龙虾工坊部署脚本"
echo "===================="

# 安装 Node.js（如果没有）
if ! command -v node &> /dev/null; then
    echo "安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 安装 PM2（如果没有）
if ! command -v pm2 &> /dev/null; then
    echo "安装 PM2..."
    sudo npm install -g pm2
fi

# 创建项目目录
PROJECT_DIR="/var/www/lobster-site"
sudo mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 拉取代码（如果已存在则更新）
if [ -d ".git" ]; then
    echo "更新代码..."
    git pull
else
    echo "克隆代码..."
    git clone https://github.com/qiaosteve/lobster-site.git .
fi

# 设置环境变量
export GLM_API_KEY="f88c31397908458bb6cff33dcdf8df04.0UyeRPCwVmnCVnKL"

# 启动服务
echo "启动服务..."
pm2 delete lobster-api 2>/dev/null || true
pm2 start api/server.js --name lobster-api

# 保存 PM2 配置
pm2 save

# 安装 Nginx 配置
if ! command -v nginx &> /dev/null; then
    echo "安装 Nginx..."
    sudo apt-get install -y nginx
fi

# 创建 Nginx 配置
sudo tee /etc/nginx/sites-available/lobster-site << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 启用配置
sudo ln -sf /etc/nginx/sites-available/lobster-site /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "✅ 部署完成！"
echo "访问地址: http://服务器IP"
echo "API状态: http://服务器IP/api/stats"
echo ""
echo "管理命令:"
echo "  查看日志: pm2 logs lobster-api"
echo "  重启服务: pm2 restart lobster-api"
echo "  停止服务: pm2 stop lobster-api"