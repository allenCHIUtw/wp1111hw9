import http from 'http'
import express from 'express'
import dotenv from 'dotenv-defaults'
import mongoose from 'mongoose'
import WebSocket from 'ws'
import mongo from './mongo'
import wsConnect from './wsConnect'
import axios from "axios";

mongo.connect();
const API_ROOT =
  process.env.NODE_ENV === "production"
    ? "/api"
    : "http://localhost:4000/api";

console.log(window)    
const WS_URL =
  process.env.NODE_ENV === "production"
    ? window.location.origin.replace(/^http/, "ws")
    : "ws://localhost:4000";
const app = express()
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
export const ws = new WebSocket(WS_URL);
export const api = axios.create({ baseURL: API_ROOT });