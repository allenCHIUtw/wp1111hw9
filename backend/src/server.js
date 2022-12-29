import http from 'http'
import express from 'express'
import dotenv from 'dotenv-defaults'
import mongoose from 'mongoose'
import WebSocket from 'ws'
import mongo from './mongo'
import wsConnect from './wsConnect'


mongo.connect();

import path from "path";
import cors from "cors";

const app = express();

if (process.env.NODE_ENV === "production") {
  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, "../frontend", "build")));
  app.get("/*", function (req, res) {
    res.sendFile(path.join(__dirname, "../frontend", "build", "index.html"));
  });
}


const server = http.createServer(app)
const wss = new WebSocket.Server({ server })
const db = mongoose.connection

db.once('open', () => {
    console.log("MongoDB connected!")
    wss.on('connection', (ws) => {
        ws.box = ''
        ws.onmessage = wsConnect.onMessage(ws)
    })
})
if (process.env.NODE_ENV === "development") {
    app.use(cors());
   }
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`)
});

