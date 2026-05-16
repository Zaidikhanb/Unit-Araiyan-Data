export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    if (!token || !owner || !repo) {
        return res.status(500).json({ error: 'Server not configured with GitHub credentials' });
    }

    const category = req.query.category; // optional
    const categories = category ? [category] : ['items', 'samples', 'cleaning', 'persons'];

    let allEntries = [];

    try {
        for (const cat of categories) {
            const path = `data/${cat}.json`;
            const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
            const response = await fetch(url, {
                headers: { Authorization: `token ${token}` }
            });
            if (response.ok) {
                const file = await response.json();
                const entries = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
                allEntries = allEntries.concat(entries);
            } else if (response.status !== 404) {
                console.error(`Failed to fetch ${cat}:`, await response.json());
            }
        }
        return res.status(200).json({ entries: allEntries });
    } catch (err) {
        return res.status(500).json({ error: 'Internal error' });
    }
}