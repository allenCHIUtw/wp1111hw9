import AppTitle from "../components/Title"
import LogIn from "../components/LogIn"
import { useChat } from "./hooks/useChat"

const SignIn = ({me}) => {

    const { setMe, setSignedIn, displayStatus } = useChat()

    const handleLogin = (name) => {
        if(!name){
            displayStatus({
                type: "error",
                msg: "Missing user name"
            })
        }
        else{
            setSignedIn(name)
        }
    }

    return(
        <>
            <AppTitle></AppTitle>
            <LogIn me={me} setName={setMe} onLogin={handleLogin}></LogIn>
        </>
    )
} 

export default SignIn
