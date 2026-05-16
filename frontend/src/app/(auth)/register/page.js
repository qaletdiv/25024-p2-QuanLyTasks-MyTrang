'use client'
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function Login(){
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [error, setError] = useState("");
    const [name, setName] = useState("");
    const route = useRouter();

    const handleSubmit = async (e) =>{
        e.preventDefault();
        setError("");
        try{
            const res = await fetch('http://localhost:5000/api/register',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({name: name, email: email, password: pass}),            
            });
            const data = await res.json();
            if(res.ok){
                alert("Sign up sucessfully!");
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.userId);
                route.push('/boards');
            }
            else{
                setError(data.message);
            }
        }
        catch(err){
            setError("Cannot connect to server!");
        }
    };

    return(
        <div id="regis-container">
            <h2>Register in</h2>
            <form onSubmit={e => handleSubmit(e)}>
                <label>Name: <input type="text" className="regis-input" id="regis-name" value={name} onChange={(e) => setName(e.target.value)}></input></label>
                <label>Email: <input type="email" className="regis-input" id="regis-email" value={email} onChange={(e) => setEmail(e.target.value)}/></label>
                <label>Password: <input type="password" className="regis-input" id="regis-password" value={pass} onChange={(e) => setPass(e.target.value)}/></label>
                {error && <p style={{color: 'red'}}>{error}</p>}
                <button id="btn-regis" type="submit">Sign up</button>
            </form>
        </div>
    )
}