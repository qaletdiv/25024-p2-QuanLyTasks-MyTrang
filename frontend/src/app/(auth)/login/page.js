'use client'
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function Login(){
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [error, setError] = useState("");
    const route = useRouter();

    const handleSubmit = async (e) =>{
        e.preventDefault();
        setError("");
        try{
            const res = await fetch('http://localhost:5000/api/login',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({email: email, password: pass}),            
            });
            const data = await res.json();
            if(res.ok){
                alert("Log in sucessfully!");
                localStorage.setItem('token', data.token);
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
        <div id="login-container">
            <h2>Log in</h2>
            <form onSubmit={e => handleSubmit(e)}>
                <label>Email: <input type="email" className="login-input" id="login-email" value={email} onChange={(e) => setEmail(e.target.value)}/></label>
                <label>Password: <input type="password" className="login-input" id="login-password" value={pass} onChange={(e) => setPass(e.target.value)}/></label>
                {error && <p style={{color: 'red'}}>{error}</p>}
                <button id="btn-login" type="submit">Log in</button>
            </form>
        </div>
    )
}