const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express(); // create Express app, returns express app w/ methods

app.use(cors());

async function getlivegames(req, res){
    const scurl = "https://api.sofascore.com/api/v1/sport/football/events/live";
    const dataFromSofaScore = await axios.get(scurl);
    
    // console.dir(dataFromSofaScore.data.events);
    res.send(dataFromSofaScore.data.events);
}

app.get("/livegames", getlivegames);

// aways at the END!!!!!!
app.get("/", (req, res) => { // generic url request
	
    res.send("my proxy API!");
});

app.listen(3000, () => {
	// starts the server, add listener to the port 3000 (localhost)
	console.log("listening at 3000!!!!!");
});