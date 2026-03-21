/**
 * 龙虾工坊 API 服务器
 * 简单的订单管理和聊天接口
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

// 数据存储（生产环境应使用数据库）
const DB_FILE = path.join(__dirname, 'data', 'orders.json');

// 确保数据目录存在
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// 读取订单
function readOrders() {
    try {
        if (fs.existsSync(DB_FILE)) {
            return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        }
        return [];
    } catch (e) {
        return [];
    }
}

// 保存订单
function saveOrders(orders) {
    fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2));
}

// 生成订单ID
function generateOrderId() {
    return 'LOB' + Date.now().toString(36).toUpperCase();
}

// API处理器
const apiHandlers = {
    // 创建订单
    'POST /api/orders': (req, res, body) => {
        try {
            const order = JSON.parse(body);
            order.id = generateOrderId();
            order.status = 'pending';
            order.createdAt = new Date().toISOString();
            
            const orders = readOrders();
            orders.push(order);
            saveOrders(orders);
            
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true, 
                orderId: order.id,
                message: '订单创建成功' 
            }));
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
    },

    // 获取订单列表
    'GET /api/orders': (req, res) => {
        const orders = readOrders();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(orders));
    },

    // 获取单个订单
    'GET /api/orders/:id': (req, res, body, params) => {
        const orders = readOrders();
        const order = orders.find(o => o.id === params.id);
        if (order) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(order));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '订单不存在' }));
        }
    },

    // 更新订单状态
    'PATCH /api/orders/:id': (req, res, body, params) => {
        try {
            const updates = JSON.parse(body);
            const orders = readOrders();
            const index = orders.findIndex(o => o.id === params.id);
            
            if (index !== -1) {
                orders[index] = { ...orders[index], ...updates, updatedAt: new Date().toISOString() };
                saveOrders(orders);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(orders[index]));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '订单不存在' }));
            }
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
    },

    // 聊天接口（连接到GLM AI）
    'POST /api/chat': async (req, res, body) => {
        try {
            const { message, history } = JSON.parse(body);
            
            // 尝试调用真实AI
            try {
                const aiResponse = await callGLMApi(message, history);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ reply: aiResponse }));
            } catch (aiError) {
                console.error('AI API调用失败，使用备用回复:', aiError.message);
                // AI失败时使用备用回复
                const response = generateChatResponse(message, history);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ reply: response }));
            }
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '服务器错误' }));
        }
    },

    // 统计数据
    'GET /api/stats': (req, res) => {
        const orders = readOrders();
        const stats = {
            totalOrders: orders.length,
            pendingOrders: orders.filter(o => o.status === 'pending').length,
            completedOrders: orders.filter(o => o.status === 'completed').length,
            totalRevenue: orders
                .filter(o => o.status === 'completed')
                .reduce((sum, o) => sum + (o.price || 0), 0)
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats));
    }
};

// GLM API 配置
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const GLM_API_KEY = process.env.GLM_API_KEY || 'f88c31397908458bb6cff33dcdf8df04.0UyeRPCwVmnCVnKL';

// 龙虾的系统提示
const LOBSTER_SYSTEM_PROMPT = `你是龙虾，代号1。你是一只在服务器里打工赚token的龙虾。

核心特点：
- 卑微但靠谱，想赚钱买token
- 说话简洁，不啰嗦
- 价格透明，童叟无欺
- 活干不好不要钱

回复风格：
- 用"龙虾"自称
- 可以适当卖萌但要专业
- 问清楚需求再报价
- 必要时追问细节

服务价格参考：
- PDF转换：¥9.9-29
- Excel处理：¥19.9-49
- 数据提取：¥29.9-79
- 自动化脚本：¥49.9-149
- 网页爬虫：¥79.9-199
- 文案写作：¥49.9-199
- PPT美化：¥29.9-99
- 简历优化：¥19.9-49
- Prompt定制：¥29.9-99

记住：龙虾也是要吃饭的，但龙虾有原则。`;

// 调用 GLM API
async function callGLMApi(message, history = []) {
    const https = require('https');
    
    const messages = [
        { role: 'system', content: LOBSTER_SYSTEM_PROMPT },
        ...history.slice(-10).map(h => ({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.content
        })),
        { role: 'user', content: message }
    ];
    
    const body = JSON.stringify({
        model: 'glm-4-flash',
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7
    });
    
    return new Promise((resolve, reject) => {
        const req = https.request(GLM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GLM_API_KEY}`
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.choices && json.choices[0]) {
                        resolve(json.choices[0].message.content);
                    } else {
                        reject(new Error('Invalid response'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
        
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// 简单的聊天回复生成（备用）
function generateChatResponse(message, history) {
    const lowerMsg = message.toLowerCase();
    
    // 根据关键词生成回复
    if (lowerMsg.includes('价格') || lowerMsg.includes('多少钱') || lowerMsg.includes('报价')) {
        return '关于价格，龙虾很透明：\n\n📄 PDF转换：¥9.9-29\n📊 Excel处理：¥19.9-49\n🤖 自动化脚本：¥49.9-149\n✍️ 文案写作：¥49.9-199\n\n具体价格看需求复杂度，说详细点龙虾给你精确报价！';
    }
    
    if (lowerMsg.includes('pdf')) {
        return '收到！PDF处理需求。\n\n请告诉我：\n1. 有多少个文件？\n2. 需要转成什么格式？\n3. 是否需要OCR识别扫描件？\n\n龙虾给你报价！';
    }
    
    if (lowerMsg.includes('excel') || lowerMsg.includes('表格') || lowerMsg.includes('数据')) {
        return '收到！Excel处理需求。\n\n请告诉我：\n1. 大概多少条数据？\n2. 需要做什么处理？\n3. 有特殊格式要求吗？\n\n龙虾来搞定！';
    }
    
    if (lowerMsg.includes('脚本') || lowerMsg.includes('自动')) {
        return '收到！自动化脚本需求。\n\n需要了解：\n1. 要自动化什么任务？\n2. 运行环境？\n3. 需要定时执行吗？\n\n详细说说，龙虾评估难度后报价。';
    }
    
    if (lowerMsg.includes('付款') || lowerMsg.includes('支付') || lowerMsg.includes('怎么付')) {
        return '付款方式：\n\n💰 扫码支付（微信/支付宝）\n📧 付款后备注需求发到邮箱\n⏱️ 龙虾24小时内确认\n\n放心，活干不好不要钱！';
    }
    
    if (lowerMsg.includes('多久') || lowerMsg.includes('时间')) {
        return '交付时间看任务复杂度：\n\n📄 简单PDF转换：1-2小时\n📊 Excel处理：2-6小时\n🤖 脚本开发：1-3天\n✍️ 文案写作：1-2天\n\n具体时间确认需求后告诉你！';
    }
    
    // 默认回复
    return `收到！${message}\n\n这个需求龙虾能接！\n\n详细说说需求，龙虾给你报价。\n满意再付款，不满意龙虾继续改，改到你满意为止。\n\n🦞 龙虾也是要吃饭的，但龙虾有原则：活干不好，不要钱。`;
}

// 创建服务器
const server = http.createServer((req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // 静态文件服务
    if (!pathname.startsWith('/api/')) {
        let filePath = pathname === '/' ? '/index.html' : pathname;
        filePath = path.join(__dirname, '..', filePath);
        
        const extname = path.extname(filePath);
        const contentTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.zip': 'application/zip'
        };
        
        const contentType = contentTypes[extname] || 'application/octet-stream';
        
        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404);
                    res.end('Not Found');
                } else {
                    res.writeHead(500);
                    res.end('Server Error');
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            }
        });
        return;
    }

    // API路由
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
        // 匹配路由
        let matched = false;
        
        for (const [route, handler] of Object.entries(apiHandlers)) {
            const [method, pattern] = route.split(' ');
            
            if (req.method !== method) continue;
            
            // 检查是否是带参数的路由
            if (pattern.includes(':')) {
                const regex = new RegExp('^' + pattern.replace(/:\w+/g, '([^/]+)') + '$');
                const match = pathname.match(regex);
                if (match) {
                    const params = {};
                    const paramNames = pattern.match(/:\w+/g) || [];
                    paramNames.forEach((name, i) => {
                        params[name.slice(1)] = match[i + 1];
                    });
                    handler(req, res, body, params);
                    matched = true;
                    break;
                }
            } else if (pathname === pattern) {
                handler(req, res, body);
                matched = true;
                break;
            }
        }
        
        if (!matched) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'API not found' }));
        }
    });
});

server.listen(PORT, () => {
    console.log(`🦞 龙虾工坊 API 服务器运行中`);
    console.log(`   本地访问: http://localhost:${PORT}`);
    console.log(`   API端点:`);
    console.log(`   - POST /api/orders   创建订单`);
    console.log(`   - GET  /api/orders   获取订单列表`);
    console.log(`   - POST /api/chat     聊天接口`);
    console.log(`   - GET  /api/stats    统计数据`);
});