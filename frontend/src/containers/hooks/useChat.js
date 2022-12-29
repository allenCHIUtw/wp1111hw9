import { useState, useEffect, createContext, useContext } from "react";
import { message } from "antd";
// import axios from "axios";
const API_ROOT =
  process.env.NODE_ENV === "production"
    ? "/api"
    : "http://localhost:4000/api";
  
const WS_URL =
  process.env.NODE_ENV === "production"
    ? window.location.origin.replace(/^http/, "ws")
    : "ws://localhost:4000";
export const ws = new WebSocket(WS_URL);
// export const api = axios.create({ baseURL: API_ROOT });
const LOCALSTORAGE_KEY = "save-me";
const savedMe = localStorage.getItem(LOCALSTORAGE_KEY);

const ChatContext = createContext({
    status:{},
    displayStatus: ()=>{},
    messages: [],
    sendMessage: ()=>{},
    setSignedIn: ()=>{},
    setMe: ()=>{},
    me:'',
    signedIn:false,
    startChat: ()=>{},
    activeKey:'',
    setActiveKey:()=>{},
});

const client = new WebSocket (WS_URL)

const ChatProvider = (props) => {
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState({});
    const [me, setMe] = useState(savedMe || "");
    const [signedIn, setSignedIn] = useState(false);

    const sendData = async (data) => {
        console.log(client.readyState === client.OPEN)
        client.send(JSON.stringify(data));
    };

    const clearMessages = () => {
        sendData(["clear"]);
    };

    const startChat = (name, to) => {
        if (!name || !to) {
            throw new Error('Name or to required')
        }
        sendData(['CHAT', {name, to}])
    }

    const sendMessage = (payload) => {
        const {name, to, body} = payload
        if (!name || !to || !body){
            throw new Error('Name or to or body required')
        }
        sendData(['MESSAGE', {name, to, body}])
    }

    const displayStatus = (s) => {
        if (s.msg) {
            const { type, msg } = s;
            const content = { content: msg, duration: 0.5 }
            switch (type) {
                case 'success':
                    message.success(content)
                    break
                case 'error':
                default:
                    message.error(content)
                    break
            }
        }
    }

    client.onmessage = (byteString) => {
        const {task, payload} = JSON.parse(byteString.data)
        switch(task){
            case 'cleared':{
                setMessages([]);
                break;}
            case 'initial':{
                setMessages(payload);
                break;}
            case 'output':{
                console.log(messages);
                setMessages(()=>[...messages,...payload]);
                break;}
            case 'status':{
                setStatus(payload);
                break;}
            default: break;
        }
    }

    useEffect(() => {
        if (signedIn) {
            localStorage.setItem(LOCALSTORAGE_KEY, me);
        }
    }, [me, signedIn]);

    return (
        <ChatContext.Provider
            value={{
                status, me, signedIn, messages, setMe, setSignedIn,
                startChat, sendMessage, clearMessages, displayStatus
            }}
            {...props}
        />
    );
};

const useChat = () => useContext(ChatContext);
export { ChatProvider, useChat };