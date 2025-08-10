const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors');
const app = express();

// Listen on a specific host via the HOST environment variable
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 8080;

// Enable CORS for all routes
app.use(cors());

let browser, reqCount = 0;

async function startServer() {
    try {

        // using .launch() and then .listen() inside of the same 'async' to ensure that the *server starts only after Puppeteer is ready...* 
        // (solved the issue of the server starting before Puppeteer was ready, causing 'browser is not defined' errors)
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });
        console.log('Puppeteer browser launched successfully.');

        app.listen(port, host, () => {
            console.log(`Proxy listening on ${host}:${port}`);
        });

    } catch (err) {
        console.error('Failed to launch Puppeteer browser:', err);
        process.exit(1); // Exit if the browser fails to launch
    }
}

app.get('/live-events', async (req, res) => {
    reqCount += 1;

    if (!browser) {
        return res.status(503).json({ error: 'Service not ready, browser is not initialized.' });
    }

    try {
        // Open a new page
        const page = await browser.newPage();

        // Navigate to the SofaScore live events API endpoint
        const response = await page.goto(
            'https://www.sofascore.com/api/v1/sport/football/events/live',
            {
                // waitUntil: 'networkidle2',
                timeout: 180000
            }
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

    if (!browser) {
        return res.status(503).json({ error: 'Service not ready, browser is not initialized.' });
    }

    try {
        // Open a new page
        const page = await browser.newPage();

        // Navigate to the SofaScore live stats API endpoint
        const response = await page.goto(
            `https://www.sofascore.com/api/v1/event/${matchID}/statistics`,
            {
                waitUntil: 'networkidle2',
                timeout: 1000 * 60 * 3 
            }
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
    console.log(`Request count: ${reqCount}`);
    res.json({ count: reqCount });
});

startServer();
