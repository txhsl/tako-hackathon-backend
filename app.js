import express from "express";

const app = express();

app.get('/', function(req, res) {
    res.send('hello node');
})

const server = app.listen(8080);