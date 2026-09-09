// ============================================
// GenSphere API - Cloudflare Worker
// ============================================

import { handleAuth } from './routes/auth.js';
import { handleCharacters } from './routes/characters.js';
import { handleChat } from './routes/chat.js';
import { handleAdmin } from './routes/admin.js';
import { handleCategories } from './routes/categories.js';
import { jsonResponse, errorResponse, getTokenFromRequest, verifyToken, ensureDBInitialized } from './utils.js';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        // Handle OPTIONS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
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
            // Ensure database tables exist
            await ensureDBInitialized(env);

            let response;

            // API routes
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
};
