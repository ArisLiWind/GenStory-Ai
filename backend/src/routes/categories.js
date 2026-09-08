// ============================================
// Categories Routes
// ============================================

import { jsonResponse, errorResponse, safeJsonParse } from '../utils.js';

export async function handleCategories(request, env, path) {
    if (path === '/api/categories' && request.method === 'GET') {
        return getCategories(env);
    }
    return errorResponse(404, 'Not found');
}

async function getCategories(env) {
    const stmt = env.DB.prepare(`
        SELECT id, slug, name, icon, description, sort_order
        FROM categories
        WHERE is_active = 1
        ORDER BY sort_order ASC, id ASC
    `);
    const results = await stmt.all();

    return jsonResponse(results.results || []);
}
