// Meta (Facebook / Instagram / Ads) Graph API fetcher — server-side only.
//
// The access token is a SECRET and must live in a Vercel Environment Variable
// (META_ACCESS_TOKEN), never in client code. The browser calls this endpoint;
// this endpoint calls Meta with the token and returns normalized JSON.
//
//   GET /api/meta?type=posts&id=<pageId>           → recent FB page posts + insights
//   GET /api/meta?type=ig&id=<igUserId>            → recent Instagram media + insights
//   GET /api/meta?type=page&id=<pageId>            → page-level insights (reach, engagement)
//   GET /api/meta?type=ads&id=<adAccountId>        → ad account insights (spend, reach, ...)
//   GET /api/meta?type=ping                        → token sanity check (/me)
//
// Use a long-lived System User token (Business Settings → System Users).
const GRAPH = 'https://graph.facebook.com/v21.0';

function token() {
  return process.env.META_ACCESS_TOKEN || process.env.META_SYSTEM_USER_TOKEN || '';
}

async function graph(path, params) {
  const url = new URL(GRAPH + path);
  Object.keys(params || {}).forEach((k) => { if (params[k] != null) url.searchParams.set(k, params[k]); });
  url.searchParams.set('access_token', token());
  const r = await fetch(url.toString());
  const json = await r.json();
  if (json && json.error) {
    const e = new Error(json.error.message || 'Meta API error');
    e.meta = json.error;
    throw e;
  }
  return json;
}

// Normalize a Facebook page post + its engagement into a flat record.
function mapPost(p) {
  const insights = {};
  (p.insights && p.insights.data || []).forEach((m) => {
    insights[m.name] = (m.values && m.values[0] && m.values[0].value) || 0;
  });
  return {
    id: p.id,
    date: p.created_time ? p.created_time.slice(0, 10) : '',
    title: (p.message || p.story || '').slice(0, 120) || '(no caption)',
    type: p.attachments && p.attachments.data && p.attachments.data[0] ? (p.attachments.data[0].media_type || 'Post') : 'Post',
    reach: insights.post_impressions_unique || insights.post_impressions || 0,
    likes: (p.likes && p.likes.summary && p.likes.summary.total_count) || 0,
    comments: (p.comments && p.comments.summary && p.comments.summary.total_count) || 0,
    shares: (p.shares && p.shares.count) || 0,
  };
}

function mapIg(m) {
  const insights = {};
  (m.insights && m.insights.data || []).forEach((x) => {
    insights[x.name] = (x.values && x.values[0] && x.values[0].value) || 0;
  });
  return {
    id: m.id,
    date: m.timestamp ? m.timestamp.slice(0, 10) : '',
    title: (m.caption || '').slice(0, 120) || '(no caption)',
    type: m.media_type || 'IMAGE',
    reach: insights.reach || insights.impressions || 0,
    likes: m.like_count || insights.likes || 0,
    comments: m.comments_count || insights.comments || 0,
    shares: insights.shares || 0,
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!token()) {
    return res.status(400).json({ error: 'META_ACCESS_TOKEN is not set. Add it in Vercel → Settings → Environment Variables and redeploy.' });
  }

  const q = req.query || {};
  const type = q.type || 'ping';
  const id = q.id;

  try {
    if (type === 'ping') {
      const me = await graph('/me', { fields: 'id,name' });
      return res.status(200).json({ ok: true, me });
    }

    if (type === 'posts') {
      if (!id) return res.status(400).json({ error: 'id (page id) required' });
      const data = await graph('/' + id + '/posts', {
        fields: 'id,message,story,created_time,shares,attachments{media_type},likes.summary(true),comments.summary(true),insights.metric(post_impressions_unique)',
        limit: q.limit || 25,
      });
      return res.status(200).json({ posts: (data.data || []).map(mapPost) });
    }

    if (type === 'ig') {
      if (!id) return res.status(400).json({ error: 'id (instagram user id) required' });
      const data = await graph('/' + id + '/media', {
        fields: 'id,caption,media_type,timestamp,like_count,comments_count,insights.metric(reach,impressions)',
        limit: q.limit || 25,
      });
      return res.status(200).json({ posts: (data.data || []).map(mapIg) });
    }

    if (type === 'page') {
      if (!id) return res.status(400).json({ error: 'id (page id) required' });
      const data = await graph('/' + id + '/insights', {
        metric: 'page_impressions_unique,page_post_engagements,page_fans',
        period: 'days_28',
      });
      const out = {};
      (data.data || []).forEach((m) => { out[m.name] = (m.values && m.values[m.values.length - 1] && m.values[m.values.length - 1].value) || 0; });
      return res.status(200).json({ insights: out });
    }

    if (type === 'ads') {
      if (!id) return res.status(400).json({ error: 'id (ad account id, with or without act_ prefix) required' });
      const act = String(id).indexOf('act_') === 0 ? id : 'act_' + id;
      const data = await graph('/' + act + '/insights', {
        fields: 'spend,impressions,reach,clicks,cpc,ctr,actions',
        date_preset: q.range || 'last_30d',
        level: 'account',
      });
      const row = (data.data && data.data[0]) || {};
      const conv = (row.actions || []).filter((a) => /purchase|lead|complete_registration|submit_application/.test(a.action_type))
        .reduce((s, a) => s + Number(a.value || 0), 0);
      return res.status(200).json({
        spend: Number(row.spend || 0), impressions: Number(row.impressions || 0),
        reach: Number(row.reach || 0), clicks: Number(row.clicks || 0),
        cpc: Number(row.cpc || 0), ctr: Number(row.ctr || 0), conversions: conv,
      });
    }

    return res.status(400).json({ error: 'unknown type: ' + type });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e), meta: e && e.meta });
  }
};
