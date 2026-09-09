// ============================================
// GenSphere API - Cloudflare Pages Functions
// 复用 backend/src/ 中的 D1 数据库业务逻辑
// ============================================

import { handleAuth } from '../../backend/src/routes/auth.js';
import { handleCharacters } from '../../backend/src/routes/characters.js';
import { handleChat } from '../../backend/src/routes/chat.js';
import { handleAdmin } from '../../backend/src/routes/admin.js';
import { handleCategories } from '../../backend/src/routes/categories.js';
import { jsonResponse, errorResponse, ensureDBInitialized } from '../../backend/src/utils.js';

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;

    // 自动初始化数据库（首次请求时建表+插入初始数据）
    await ensureDBInitialized(env);

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
    };

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Add CORS to all responses
    const addCors = (response) => {
        const newResponse = new Response(response.body, response);
        Object.entries(corsHeaders).forEach(([k, v]) => {
            newResponse.headers.set(k, v);
        });
        return newResponse;
    };

    try {
        let response;

        // 路由分发，与 backend/src/index.js 保持一致
        if (path.startsWith('/api/auth/')) {
            response = await handleAuth(request, env, path);
        } else if (path.startsWith('/api/characters/') || path === '/api/characters') {
            response = await handleCharacters(request, env, path);
        } else if (path.startsWith('/api/chat/') || path === '/api/chat') {
            response = await handleChat(request, env, path);
        } else if (path.startsWith('/api/admin/')) {
            response = await handleAdmin(request, env, path);
        } else if (path.startsWith('/api/categories') || path === '/api/categories') {
            response = await handleCategories(request, env, path);
        } else {
            response = errorResponse(404, 'API endpoint not found');
        }

        return addCors(response);
    } catch (err) {
        console.error('API Error:', err);
        return addCors(errorResponse(500, err.message || 'Internal server error'));
    }
}
