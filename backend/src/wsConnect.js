import { UserModel, MessageModel, ChatBoxModel } from './models/chatbox'

const chatBoxes = {}

const sendData = (data, ws) => {
    ws.send(JSON.stringify(data)); }
    
const sendStatus = (payload, ws) => {
    sendData(["status", payload], ws); }

const broadcastMessage = (wss, data, status) => {
    wss.clients.forEach((client) => {
        sendData(data, client);
        sendStatus(status, client);
    });
};

const makeName = (name, to) => { return [name, to].sort().join('_'); };

const validateChatBox = async (name, participants) => {
    let box = await ChatBoxModel.findOne({ name });
    if (!box){
        box = await new ChatBoxModel({ name, users: participants }).save();
    }
    return box.populate(["users", {path: 'messages', populate: 'sender' }]);
};

const validateUser = async (name) => {
    let box = await UserModel.findOne({ name })
    if (!box){
        box = await new UserModel({ name }).save();
    }
    return(box._id)
}

const freshChatBox = async (chatboxName, me, friend, body) => {
    let mes = []
    const existing = (await ChatBoxModel.findOne({ name: chatboxName }))
    if(existing){
        mes = existing.messages
        await ChatBoxModel.deleteOne({ name: chatboxName })
    }
    try{
        const newChatBox = new ChatBoxModel({
                                name: chatboxName,
                                users: [await UserModel.findOne({me}).populate()._id, await UserModel.findOne({friend}).populate()._id],
                                messages: [...mes, body]
                            })
        return newChatBox.save()
    } catch(e) { throw new Error("Create chatbox failed")}
}

export default {
    onMessage: (wss) => (
        async (byteString) => {
            const { data } = byteString
            const [task, payload] = JSON.parse(data)
            switch (task) {
                case 'CHAT': {
                    const { name, to } = payload
                    const chatboxName = makeName(name, to)
                    if (!chatBoxes[chatboxName]){
                        chatBoxes[chatboxName] = new Set()
                    }
                    chatBoxes[chatboxName].add(wss)
                    if (wss.box !== "" && chatBoxes[wss.box]){
                        chatBoxes[wss.box].delete(wss)
                    }
                    wss.box = chatboxName

                    const Name = await validateUser(name)
                    const To = await validateUser(to)

                    const mes = (await validateChatBox(chatboxName, [Name, To])).messages
                    let mesList = []
                    mes.map((message) => {
                        const m = {name: message.sender.name,
                                to: message.sender.name === me ? to : me,
                                body: message.body}
                        mesList = [...mesList, m]
                    }) 
                    sendData(['initial', mesList], wss)
                    break
                }
                case 'MESSAGE': {
                    const { name, to, body } = payload
                    const chatboxName = makeName(name, to)
                    const message = new MessageModel({ chatbox: await ChatBoxModel.findOne({name: chatboxName}),
                                                    sender: name,
                                                    body: body})
                    freshChatBox(chatboxName, name, to, message)
                    try{
                        await message.save()
                    } catch (e) {
                        throw new Error("DB save message failed") 
                    }
                    broadcastMessage(chatboxName, ['output', [payload]], {type: 'success', msg: 'Message sent.'})
                    break
                }
                default: break
            }
        }
    )
}