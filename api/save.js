export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { category, entry } = req.body;
    if (!category || !entry) return res.status(400).json({ error: 'Missing category or entry' });

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    if (!token || !owner || !repo) {
        return res.status(500).json({ error: 'Server not configured with GitHub credentials' });
    }

    const path = `data/${category}.json`;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    try {
        let existingSha = null;
        let currentData = [];
        // Try to get the current file
        const getRes = await fetch(apiUrl, {
            headers: { Authorization: `token ${token}` }
        });
        if (getRes.ok) {
            const file = await getRes.json();
            existingSha = file.sha;
            currentData = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
        } else if (getRes.status !== 404) {
            const err = await getRes.json();
            return res.status(500).json({ error: 'GitHub read failed', details: err });
        }

        currentData.push(entry);
        const content = Buffer.from(JSON.stringify(currentData, null, 2)).toString('base64');

        const putRes = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                Authorization: `token ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Add ${category} entry ${entry.id}`,
                content,
                sha: existingSha || undefined,
            }),
        });

        if (putRes.ok) {
            return res.status(200).json({ status: 'saved' });
        } else {
            const err = await putRes.json();
            return res.status(500).json({ error: 'GitHub write failed', details: err });
        }
    } catch (err) {
        return res.status(500).json({ error: 'Internal error' });
    }
}