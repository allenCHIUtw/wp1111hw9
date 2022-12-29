import mongoose from 'mongoose'

const Schema = mongoose.Schema

/******* User Schema *******/
const UserSchema = new Schema({
    name: { type: String, required: [true, 'Name field is required.'] },
    chatBoxes: [{ type: mongoose.Types.ObjectId, ref: 'ChatBox' }],
});

const UserModel = mongoose.model('users', UserSchema);


export default UserModel;