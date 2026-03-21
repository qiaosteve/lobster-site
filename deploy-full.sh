#!/bin/bash
# 龙虾工坊完整部署脚本
# 在服务器上执行: curl -fsSL ... | bash

set -e

echo "🦞 龙虾工坊部署脚本"
echo "===================="
echo "域名: laborxia.store"
echo "服务器: 47.102.41.11"
echo ""

# 1. 安装 Node.js
echo "📦 安装 Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "Node.js: $(node -v)"

# 2. 安装 PM2
echo "📦 安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2 -y
fi

# 3. 安装 Nginx
echo "📦 安装 Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y nginx
fi

# 4. 创建项目目录
echo "📁 创建项目目录..."
sudo mkdir -p /var/www
cd /var/www

# 5. 克隆或更新代码
if [ -d "lobster-site" ]; then
    echo "📥 更新代码..."
    cd lobster-site
    git pull
else
    echo "📥 克隆代码..."
    sudo git clone https://github.com/qiaosteve/lobster-site.git
    sudo chown -R $USER:$USER /var/www/lobster-site
    cd lobster-site
fi

# 6. 设置环境变量
echo "⚙️ 设置环境变量..."
export GLM_API_KEY="f88c31397908458bb6cff33dcdf8df04.0UyeRPCwVmnCVnKL"
if ! grep -q "GLM_API_KEY" ~/.bashrc; then
    echo 'export GLM_API_KEY="f88c31397908458bb6cff33dcdf8df04.0UyeRPCwVmnCVnKL"' >> ~/.bashrc
fi

# 7. 启动后端服务
echo "🚀 启动后端服务..."
pm2 delete lobster-api 2>/dev/null || true
pm2 start api/server.js --name lobster-api
pm2 save

# 8. 配置 Nginx
echo "🌐 配置 Nginx..."
sudo tee /etc/nginx/sites-available/lobster << 'EOF'
server {
    listen 80;
    server_name laborxia.store www.laborxia.store;
    
    # 静态文件
    location / {
        root /var/www/lobster-site;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 9. 启用配置
sudo ln -sf /etc/nginx/sites-available/lobster /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 10. 设置开机自启
sudo systemctl enable nginx
pm2 startup | tail -1 | sudo bash 2>/dev/null || true

# 11. 配置防火墙
echo "🔥 配置防火墙..."
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 443/tcp 2>/dev/null || true

echo ""
echo "✅ 基础部署完成！"
echo ""
echo "访问地址: http://laborxia.store"
echo "API状态: http://laborxia.store/api/stats"
echo ""
echo "============================================"
echo "下一步: 配置 SSL 证书 (HTTPS)"
echo "============================================"
echo ""
echo "执行以下命令申请免费SSL证书:"
echo ""
echo "sudo apt-get install -y certbot python3-certbot-nginx"
echo "sudo certbot --nginx -d laborxia.store -d www.laborxia.store"
echo ""
echo "管理命令:"
echo "  查看日志: pm2 logs lobster-api"
echo "  重启服务: pm2 restart lobster-api"
echo "  更新网站: cd /var/www/lobster-site && git pull && pm2 restart lobster-api"