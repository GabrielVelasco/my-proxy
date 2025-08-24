const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors');
const app = express();

// Listen on a specific host via the HOST environment variable
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 8080;

// Enable CORS for all routes
app.use(cors());

// Rate limiting to prevent abuse (to do...)
// const rateLimitMap = new Map();
// const RATE_LIMIT_WINDOW = 60000; // 1 minute
// const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window

// const rateLimit = (req, res, next) => {
//     const clientIP = req.ip || req.connection.remoteAddress;
//     const now = Date.now();
    
//     if (!rateLimitMap.has(clientIP)) {
//         rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });

//     } else {
//         const clientData = rateLimitMap.get(clientIP);
        
//         if (now > clientData.resetTime) {
//             // Reset the rate limit window
//             clientData.count = 1;
//             clientData.resetTime = now + RATE_LIMIT_WINDOW;

//         } else {
//             clientData.count++;
            
//             if (clientData.count > RATE_LIMIT_MAX_REQUESTS) {
//                 return res.status(429).json({ 
//                     error: 'Too many requests, please try again later' 
//                 });
//             }
//         }
//     }
    
//     next();
// };

// Middleware to validate referer with more strict checking
const validateReferer = (req, res, next) => {
    const referer = req.get('Referer') || req.get('Origin');
    const userAgent = req.get('User-Agent') || '';
    
    const allowedDomains = [
        'https://gabrielvelasco.github.io',
        'http://localhost',  // for local development
        'http://127.0.0.1'   // for local development
    ];

    // Block requests with suspicious user agents (bots, scrapers)
    const suspiciousUserAgents = [
        /bot/i, /crawler/i, /spider/i, /scraper/i, 
        /curl/i, /wget/i, /python/i, /java/i
    ];
    
    if (suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
        console.log(`Request blocked: Suspicious user agent - ${userAgent}`);
        return res.status(403).json({ 
            error: 'Access denied: Suspicious user agent' 
        });
    }

    // Check if referer exists and is from allowed domain
    if (!referer) {
        console.log(`Request blocked: No referer header. IP: ${req.ip}, UA: ${userAgent}`);
        return res.status(403).json({ 
            error: 'Access denied: No referer header found' 
        });
    }

    const isAllowed = allowedDomains.some(domain => referer.startsWith(domain));
    
    if (!isAllowed) {
        console.log(`Request blocked: Unauthorized referer - ${referer}. IP: ${req.ip}, UA: ${userAgent}`);
        return res.status(403).json({ 
            error: 'Access denied: Unauthorized domain',
            referer: referer 
        });
    }

    //console.log(`Request allowed from: ${referer} | IP: ${req.ip}`);
    next();
};

let browser;

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

// Health check endpoint (no validation required)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Apply rate limiting and validation to protected endpoints
app.get('/live-events', validateReferer, async (req, res) => {
    if (!browser) {
        return res.status(503).json({ error: 'Service not ready, browser is not initialized.' });
    }

    try {
        // Open a new page
        const page = await browser.newPage();

        // Set a realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // Navigate to the SofaScore live events API endpoint
        const response = await page.goto(
            'https://www.sofascore.com/api/v1/sport/football/events/live',
            {
                // waitUntil: 'networkidle2',
                timeout: 1000 * 60 * 3 
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

app.get('/live-stats/:matchID', validateReferer, async (req, res) => {
    const matchID = req.params.matchID;

    // Validate matchID format (should be numeric)
    if (!/^\d+$/.test(matchID)) {
        return res.status(400).json({ error: 'Invalid match ID format' });
    }

    if (!browser) {
        return res.status(503).json({ error: 'Service not ready, browser is not initialized.' });
    }

    try {
        // Open a new page
        const page = await browser.newPage();

        // Set a realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // Navigate to the SofaScore live stats API endpoint
        const response = await page.goto(
            `https://www.sofascore.com/api/v1/event/${matchID}/statistics`,
            {
                // waitUntil: 'networkidle2',
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

// Catch-all route for unauthorized endpoints
app.use((req, res) => {
    console.log(`Blocked request to unauthorized endpoint: ${req.method} ${req.path} from ${req.ip}`);
    res.status(404).json({ error: 'Endpoint not found' });
});

startServer();
