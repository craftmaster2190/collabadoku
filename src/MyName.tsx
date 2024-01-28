import "./MyName.css"
import {useEffect, useState} from "react";

interface MyNameProps {
    onSetMyName: (myName: string) => void;
}

function MyName({onSetMyName}: MyNameProps) {
    const [myName, setMyName] = useState(localStorage.getItem("myName") ?? "")

    useEffect(() => {
        localStorage.setItem("myName", myName);
        onSetMyName(myName)
    }, [myName, onSetMyName])

    return <div className="MyName">
        <div>My Name</div>
        <input type="text" placeholder="My Name" value={myName}
               onChange={event => setMyName(event.currentTarget.value)}/>
    </div>
}

export default MyName
