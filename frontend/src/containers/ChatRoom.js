import { useState, useEffect, useRef } from "react";
import { Input, Tabs } from "antd";
import styled from "styled-components"
import { useChat } from "./hooks/useChat"
import Title from "../components/Title"
import Message from "../components/Message"
import ChatModal from "../components/ChatModal"

const ChatBoxesWrapper = styled(Tabs)`
  width: 100%;
  height: 300px;
  background: #eeeeee52;
  border-radius: 10px;
  margin: 20px;
  padding: 20px;
`
const ChatBoxWrapper = styled.div`
  height: calc(240px - 36px);
  display: flex;
  flex-direction: column;
  overflow: auto;
`

const FootRef = styled.div`
  height: 20px;
`

const ChatRoom = () => {
    const { me, messages, sendMessage, displayStatus, startChat } = useChat()
    const [msg, setMsg] = useState('')
    const [msgSent, setMsgSent] = useState(false)
    const [chatBoxes, setChatBoxes] = useState([])
    const [activeKey, setActiveKey] = useState('')
    const [modalOpen, setModalOpen] = useState(false)

    //const msgRef = useRef(null)
    const msgFooter = useRef(null)

    const displayChat = (chat) => (
        (chat.length === 0) ? (
            <p style={{ color: '#ccc' }}> No messages... </p>
        ) : (
            <ChatBoxWrapper>
                {chat.map(({name, body}, i) => (
                    <Message isMe={name === me} message={body} key={i}></Message>
                ))}
                <FootRef ref={msgFooter}></FootRef>
            </ChatBoxWrapper>
        )
    )

    const extractChat = (friend) => {
        return displayChat(messages.filter
            (({name, body}) => ((name === friend) || (name === me))))
    }

    const createChatBox = (friend) => {
        if (chatBoxes.some(({key}) => key === friend)) {
            throw new Error(friend + "'s chat box has already opened.");
        }
        const chat = extractChat(friend);
        setChatBoxes([...chatBoxes, { label: friend, children: chat, key: friend }]);
        setMsgSent(true);
        return friend;
    }

    const removeChatBox = (targetKey, activeKey) => {
        const index = chatBoxes.findIndex(({key}) => key === activeKey);
        const newChatBoxes = chatBoxes.filter(({key}) =>key !== targetKey);
        setChatBoxes(newChatBoxes);
        return activeKey
            ? activeKey === targetKey
                ? index === 0
                    ? '' 
                    : chatBoxes[index - 1].key
                : activeKey
            : '';
        };

    const scrollToBottom = () => {
        msgFooter.current?.scrollIntoView({behavior:'smooth', block:'start'})
    }

    useEffect(() => {
        scrollToBottom()
        setMsgSent(false)
    }, [msgSent])

    useEffect(()=>{
        if(chatBoxes.length !== 0){
            const index = chatBoxes.findIndex (({key}) => key === activeKey);
            const chat = extractChat();
            const newChatboxes = [...chatBoxes.slice(0,index), {label: activeKey, children: chat, key: activeKey}, ...chatBoxes.slice(index+1,)]
            setChatBoxes(newChatboxes);
            setMsgSent(true);
        }
    },[messages])

    return(
        <>
            <Title name={me}></Title>
            <>
                <ChatBoxesWrapper
                    tabBarStyle={{height: '36px'}}
                    type='editable-card'
                    activeKey={activeKey}
                    onChange={(key) => {
                        setActiveKey(key)
                        startChat(me, key)
                    }}
                    onEdit={(targetKey, action) => {
                        if (action === "add"){
                            setModalOpen(true)
                        }
                        else if (action === "remove"){
                            setActiveKey(removeChatBox(targetKey, activeKey))
                        }
                    }}
                    items={chatBoxes}
                ></ChatBoxesWrapper>
                <ChatModal
                    open={modalOpen}
                    onCreate={({name}) => {
                        startChat(me, name)
                        setActiveKey(createChatBox(name))
                        setModalOpen(false)
                    }}
                    onCancel={() => {
                        setModalOpen(false)
                    }}
                ></ChatModal>
            </>
            <Input.Search
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                enterButton="Send"
                placeholder="Type a message here..."
                onSearch={(msg) => {
                    if (!msg){
                        displayStatus({
                            type: 'error',
                            msg: 'Please enter message'
                        })
                        return
                    }
                    else if (activeKey === ""){
                        displayStatus({
                            type: 'error',
                            msg: 'Please add a chatbox first'
                        })
                        setMsg('')
                        return
                    }
                    sendMessage({name: me, to: activeKey, body: msg})
                    setMsg('')
                    setMsgSent(true)
                }}
            ></Input.Search>
        </>
    )
}

export default ChatRoom