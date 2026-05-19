'use client'
import { useState, useEffect} from "react";

export default function Boards(){
    const [err, setErr] = useState("");
    const [boards, setBoards] = useState([]);
    
    useEffect(() =>{
        //create a fake async function here
        const fetchBoards = async () =>{
            try{
                const userId = localStorage.getItem('userId');
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:5000/api/boards',{
                    method: "GET",
                    headers:{
                        'Content-Type': 'application/json',
                        'x-user-id': userId,
                        'authorization': `Bearer ${token}`
                    }
                });
                const data = await res.json();
                if(!res.ok){
                    setErr(data.message);
                } 
                else{
                    setBoards(data.userBoards);
                }
            }
            catch(err){
                setErr("Cannot connect to server!");
            }
        }
        fetchBoards();
    },[]);

    return(
        <div id="user-boards">
            {err && <p style={{color: 'red'}}>{err}</p>}
            {boards.length === 0 && <p>You have no boards yet!</p>}
            {boards.map((e,index)=>(
                <div id="board-card" key={index}>
                    <p>Title: {e.title}</p>
                </div>
            ))}
        </div>
    )
}

