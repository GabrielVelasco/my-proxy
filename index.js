const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express(); // create Express app, returns express app w/ methods

// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

var corsOptions = {
    origin: 'https://gabrielvelasco.github.io/BET-Attack-Momentum/',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

async function getlivegames(req, res){
    const scurl = "https://api.sofascore.com/api/v1/sport/football/events/live";
    const dataFromSofaScore = await axios.get(scurl);
    
    // console.dir(dataFromSofaScore.data.events);
    res.send(dataFromSofaScore.data.events);
}

app.get("/livegames", cors(corsOptions), getlivegames);

// aways at the END!!!!!!
app.get("/", (req, res) => { // generic url request
	
    res.send("my proxy API!");
});

app.listen(port, host, () => {
	// starts the server, add listener to the port 3000 (localhost)
	console.log('Running on ' + host + ':' + port);
});