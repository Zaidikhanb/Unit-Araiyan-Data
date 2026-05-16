export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { id, category } = req.body;
    if (!id || !category) return res.status(400).json({ error: 'Missing id or category' });

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    if (!token || !owner || !repo) {
        return res.status(500).json({ error: 'Server not configured' });
    }

    const path = `data/${category}.json`;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    try {
        const getRes = await fetch(apiUrl, {
            headers: { Authorization: `token ${token}` }
        });
        if (!getRes.ok) {
            return res.status(404).json({ error: 'Category file not found' });
        }
        const file = await getRes.json();
        const entries = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
        const updated = entries.filter(e => e.id !== id);
        if (updated.length === entries.length) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        const content = Buffer.from(JSON.stringify(updated, null, 2)).toString('base64');

        const putRes = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                Authorization: `token ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Delete entry ${id} from ${category}`,
                content,
                sha: file.sha,
            }),
        });

        if (putRes.ok) {
            return res.status(200).json({ status: 'deleted' });
        } else {
            const err = await putRes.json();
            return res.status(500).json({ error: 'GitHub delete failed', details: err });
        }
    } catch (err) {
        return res.status(500).json({ error: 'Internal error' });
    }
}