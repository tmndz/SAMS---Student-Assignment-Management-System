// Netlify Function (Universal v1 & v2 compatible, Node.js ES Module)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Canvas-Domain',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Netlify Functions v2 (Standard Web Request/Response)
export default async function (req, context) {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');
    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const headers = { 'Accept': 'application/json', 'User-Agent': 'BlockSync-Netlify-Proxy/2.0' };
    if (authHeader) headers['Authorization'] = authHeader;

    const canvasResponse = await fetch(targetUrl, { method: req.method, headers });
    const body = await canvasResponse.text();

    return new Response(body, {
      status: canvasResponse.status,
      headers: {
        ...corsHeaders,
        'Content-Type': canvasResponse.headers.get('content-type') || 'application/json',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Proxy error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Netlify Functions v1 fallback (AWS Lambda event format)
export const handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const targetUrl = event.queryStringParameters?.url;
    if (!targetUrl) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing url parameter' }),
      };
    }

    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    const headers = { 'Accept': 'application/json', 'User-Agent': 'BlockSync-Netlify-Proxy/2.0' };
    if (authHeader) headers['Authorization'] = authHeader;

    const res = await fetch(targetUrl, { method: event.httpMethod || 'GET', headers });
    const body = await res.text();

    return {
      statusCode: res.status,
      headers: {
        ...corsHeaders,
        'Content-Type': res.headers.get('content-type') || 'application/json',
      },
      body,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message || 'Proxy error' }),
    };
  }
};

export const config = {
  path: '/api/canvas-proxy',
};
