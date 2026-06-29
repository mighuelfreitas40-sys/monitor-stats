export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const placeId = req.query.placeId;

    if (!placeId || !/^\d+$/.test(placeId) || placeId.length > 15) {
        return res.status(400).json({ error: 'invalid placeId' });
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.REPO_OWNER || 'mighuelfreitas40-sys';
    const REPO_NAME = process.env.REPO_NAME || 'monitor-stats';
    const FILE_PATH = 'stats.json';

    try {
        const fileRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            headers: { Authorization: `token ${GITHUB_TOKEN}` }
        });

        let stats = { total: 26000, games: {} };
        let sha = null;

        if (fileRes.status === 200) {
            const fileData = await fileRes.json();
            sha = fileData.sha;
            const content = Buffer.from(fileData.content, 'base64').toString('utf8');
            try {
                stats = JSON.parse(content);
            } catch {}
        }

        const gameName = await getGameName(placeId);
        const gameCount = stats.games[placeId] || 0;

        return res.status(200).json({
            total: stats.total || 0,
            gameCount: gameCount,
            gameName: gameName
        });
    } catch (e) {
        return res.status(500).json({ error: 'internal error' });
    }
}

async function getGameName(placeId) {
    try {
        const res = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`, { timeout: 5000 });
        const data = await res.json();
        if (data.universeId) {
            const infoRes = await fetch(`https://games.roblox.com/v1/games?universeIds=${data.universeId}`, { timeout: 5000 });
            const infoData = await infoRes.json();
            if (infoData.data && infoData.data[0]) {
                return infoData.data[0].name;
            }
        }
    } catch (e) {}
    return 'Desconhecido';
}