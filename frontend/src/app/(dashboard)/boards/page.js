'use client'
import { useState } from "react";


export default function Boards(){
    const [err, setErr] = useState("");
    const [boards, setBoards] = useState([]);
    const userId = localStorage.getItem('userId');
    
    try{
        const res = await fetch(`http://localhost:5000/api/boards/${userId}`,{
            method: "GET",
            headers:{
                'Content-Type': 'application/json',
            }
        });
        const data = await res.json();
        if(!res.ok){
            setErr(data.message);
        }
        else{
            userBoards = data.userBoards;
        }
    }
    catch(err){
        setErr("Cannot connect to server!");
    }

    return(
        <div id="user-boards">
            {err && <p style={{color: 'red'}}>{err}</p>}
            {userBoards.map((e,index)=>(
                <div id="board-card" key={index}>
                    <p>Title: {e.title}</p>
                </div>
            ))}
        </div>
    )
}