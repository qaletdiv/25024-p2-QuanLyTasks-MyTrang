'use client'
import { useEffect, useState } from "react"
import Image from "next/image";
import Link from "next/link";
import LightSwitch from "../features/light_switch/LightSwitch";

export default function PrivateHeader(){
    const [search, setSearch] = useState("");
    const [boards, setBoards] = useState([]);
    const [err, setErr] = useState("");
    
    const [searchResults, setSearchResults] = useState([]); 
    const [isSearch, setIsSearch] = useState(false);
    const [currU, setCurrU] = useState({});
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(()=>{
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        
        if(!userId) return;

        const fetchBoards = async () =>{
            try {
                const res = await fetch('http://localhost:5000/api/boards',{
                    method: "GET",
                    headers:{
                        'Content-Type': 'application/json',
                        'x-user-id': userId,
                        'authorization': `Bearer ${token}`
                    }
                });

                const data = await res.json();

                if(res.ok){
                    setBoards(data.userBoards);
                } else{
                    setErr(data.message);
                }

            } catch(err){
                setErr("Error connecting to server!");
            }
        }
        fetchBoards();

        //user info
        const fetchUser = async ()=>{
            try{
                const res = await fetch('http://localhost:5000/api/user',{
                    method: "GET",
                    headers:{
                        'Content-Type': 'application/json',
                        'x-user-id': userId,
                        'authorization': `Bearer ${token}`
                    }
                });
                const data = await res.json();

                if(res.ok){
                    setCurrU(data.currU);
                }
                else{
                    setErr(data.message);
                }
            }
            catch(err){
                setErr("Error connection to server!");
            }
        }
        fetchUser();

        const fetchUnreadNotifs = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/notifications/unread', {
                    method: "GET",
                    headers: {
                        'x-user-id': userId,
                        'authorization': `Bearer ${token}`
                    }
                });
                const data = await res.json();
                if(res.ok) {
                    setUnreadCount(data.unreadCount);
                }
            } catch(err) {
                console.log("Không tải được thông báo");
            }
        }
        fetchUnreadNotifs();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        setErr("");
        
        const keyword = search.trim();
        
        if(keyword){
            setIsSearch(true);

            const results = boards.filter(b => 
                b.title.toLowerCase().includes(keyword.toLowerCase())
            );

            setSearchResults(results);
        } else {
            setIsSearch(false);
            setSearchResults([]);
        }
    }

    return (
        <header id="private" className="h-16 bg-white dark:bg-[#0a0a0a] border-b dark:border-gray-800 transition-colors duration-300">
            <form className="search-place" onSubmit={handleSearch}>
                <input 
                    className="search-bar bg-gray-50 dark:bg-[#1a1a1a] text-black dark:text-white border-gray-300 dark:border-gray-600 transition-colors"
                    type="text" 
                    placeholder="What are you finding?" 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                />

                <button type="submit" id="search-icon" className="dark:text-white">
                    🔍
                </button>
            </form>
            <Link
                href="/notifications"
                className="relative p-1 text-gray-500 hover:text-blue-500 transition-colors flex items-center justify-center"
            >
                <span className="text-xl">🔔</span>

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-[#0a0a0a] animate-bounce">
                        {unreadCount}
                    </span>
                )}
            </Link>
            <LightSwitch/>
            <div className="user-place flex items-center gap-4">
                {currU.name && (
                    <Link href={'/settings'} className="font-[family-name:var(--font-geist-sans)] text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
                        {currU.name}
                    </Link>
                )}
                {currU.avatar && (
                    <Link href={'/settings'}>
                        <Image className="object-cover rounded-full" height={40} width={40} src={currU.avatar} alt="user-avatar" priority />
                    </Link>
                )}
            </div>
        </header>
    )
}