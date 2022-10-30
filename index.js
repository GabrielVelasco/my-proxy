const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express(); // create Express app, returns express app w/ methods

// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

app.use(cors());

async function eleicoes(req, res){
    const url = "https://resultados.tse.jus.br/oficial/ele2022/545/dados-simplificados/br/br-c0001-e000545-r.json";
    const dataFromTse = await axios.get(scurl);
    
    // console.dir(dataFromSofaScore.data);
    res.send(dataFromTse.data);
}

async function getLiveGames(req, res){
    const url = "https://api.sofascore.com/api/v1/sport/football/events/live";
    const dataFromSofaScore = await axios.get(scurl);
    
    res.send(dataFromSofaScore.data.events);
}

app.get("/ele", eleicoes);

app.get("/liveGames", getLiveGames);

// aways at the END!!!!!!
app.get("/", (req, res) => { // generic url request
	
    res.send("my proxy API!");
});

app.listen(port, host, () => {
	// starts the server, add listener to the port 3000 (localhost)
	console.log('Running on ' + host + ':' + port);
});