const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors');
const app = express();

// Listen on a specific host via the HOST environment variable ()
var host = process.env.HOST || '0.0.0.0';
var port = process.env.PORT || 8080;

// Enable CORS for all routes
app.use(cors());

let browserPromise, reqCount = 0;

(async () => {
    browserPromise = await puppeteer.launch({ 
        headless: true, 
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    });
})();

app.get('/live-events', async (req, res) => {
    reqCount += 1;

    try {
        // Open a new page
        const page = await browserPromise.newPage();

        // Navigate to the SofaScore live events API endpoint
        const response = await page.goto(
            'https://www.sofascore.com/api/v1/sport/football/events/live'
        );

        // Parse the JSON response
        const data = await response.json();

        res.json(data); // Use res.json() instead of res.send()

        await page.close();

    } catch (err) {
        console.error('Error fetching SofaScore data:', err);
        res.status(500).json({ error: 'Failed to fetch live events' });
    }
});

app.get('/live-stats/:matchID', async (req, res) => {
    const matchID = req.params.matchID;

    try {
        // Open a new page
        const page = await browserPromise.newPage();

        // Navigate to the SofaScore live stats API endpoint
        const response = await page.goto(
            `https://www.sofascore.com/api/v1/event/${matchID}/statistics`
        );

        // Parse the JSON response
        const data = await response.json();

        res.json(data); // Use res.json() instead of res.send()

        await page.close();

    } catch (err) {
        console.error('Error fetching SofaScore data:', err);
        res.status(500).json({ error: 'Failed to fetch match statistics' });
    }
});

app.get('/count', (req, res) => {
    res.json({ count: reqCount });
}); 

app.listen(port, host, () => console.log(`Proxy listening on ${host}:${port}`));