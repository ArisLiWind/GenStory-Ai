// ============================================
// GenSphere API - Cloudflare Pages Functions
// 生产环境：D1 数据库持久化
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

    // CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    const addCors = (response) => {
        const newResponse = new Response(response.body, response);
        Object.entries(corsHeaders).forEach(([k, v]) => {
            newResponse.headers.set(k, v);
        });
        return newResponse;
    };

    try {
        if (!env.DB) {
            return addCors(errorResponse(503, '数据库未配置，请在 Cloudflare Pages 设置中绑定 D1 数据库（变量名：DB）'));
        }

        // 确保数据库表和初始数据存在
        await ensureDBInitialized(env);

        let response;

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
            response = errorResponse(404, 'API endpoint not found: ' + path);
        }

        return addCors(response);
    } catch (err) {
        console.error('API Error:', err.message, err.stack);
        return addCors(errorResponse(500, err.message || 'Internal server error'));
    }
}
