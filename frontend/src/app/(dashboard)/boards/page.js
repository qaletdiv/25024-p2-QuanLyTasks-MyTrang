'use client'
import { useState, useEffect } from "react";
import Link from "next/link";

export const bgOptions = [
    "https://i.pinimg.com/736x/2d/31/44/2d31441b2848a342a707b22b3b5f44d1.jpg",
    "https://i.pinimg.com/1200x/c7/c5/59/c7c55995d7f0c37f4bd9755fea997593.jpg",
    "https://i.pinimg.com/736x/2a/fb/2f/2afb2f7d27e33a9ef32d29bfd2292217.jpg",
    "https://i.pinimg.com/1200x/90/7f/b0/907fb02e27016f459cafa3047a368358.jpg",
    "https://i.pinimg.com/736x/75/78/cc/7578cc98dcfbad679838f0095e329e77.jpg",
    "https://i.pinimg.com/736x/26/69/be/2669beca7c00ee17a01b960eb85e9e2e.jpg",
];

export default function Boards() {
    const [err, setErr] = useState("");
    const [boards, setBoards] = useState([]);
    const [isPopUp, setIsPopUp] = useState(false);
    const [boardN, setBoardN] = useState("");
    const [currentUserId, setCurrentUserId] = useState(null);

    //make COLOR 🫠
    const [bg, setBg] = useState(bgOptions[0]);
    const [inviteEmail, setInviteEmail] = useState("");

    useEffect(() => {
        setCurrentUserId(Number(localStorage.getItem('userId')));
        const fetchBoards = async () => {
            try {
                const userId = localStorage.getItem('userId');
                const token = localStorage.getItem('token');
                
                const res = await fetch('http://localhost:5000/api/boards', {
                    method: "GET",
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': userId,
                        'authorization': `Bearer ${token}`
                    }
                });
                const data = await res.json();
                
                if (!res.ok) {
                    alert(data.message);
                    setErr(data.message);
                } else {
                    setBoards(data.userBoards); 
                }
            } catch (err) {
                setErr("Cannot connect to server!");
            }
        }
        fetchBoards();
    }, []);

    const togglePopUp = ()=>{
        setIsPopUp(true);
    }

    const toggleCross = ()=>{
        setIsPopUp(false);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const boardNameTrimmed = boardN.trim();
        if (!boardNameTrimmed) return setErr("Board name required!");

        const userId = localStorage.getItem('userId');
        try {
            const res = await fetch('http://localhost:5000/api/boards', {
                method: "POST",
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
                body: JSON.stringify({ title: boardNameTrimmed, bg, inviteEmail })
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.message);
                return setErr(data.message);
            }
            setBoards([...boards, data.newB]);
            setIsPopUp(false);
            setBoardN("");
            setInviteEmail("");
            setErr("");
        } catch (err) { setErr("Error connecting to server!"); }
    }

    const handleDeleteBoard = async (e,boardId) => {
        e.stopPropagation(); 
        e.preventDefault();
        if (!confirm("Bạn có chắc chắn muốn xóa board này?")) return;
        const userId = localStorage.getItem('userId');
        await fetch(`http://localhost:5000/api/boards/${boardId}`, {
            method: 'DELETE',
            headers:{
                'Content-Type': 'application/json',
                'x-user-id': userId
            }
        });
        setBoards(prev => prev.filter(b => b.id !== boardId));
    };

    return (
        <div className="p-6">
            {boards.length === 0 && <p className="text-gray-500 italic">You have no boards yet!</p>}

            {isPopUp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
                    <div className="relative w-full max-w-md bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-800 animate-fade-in-up">
                        <button 
                            onClick={toggleCross} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            ❌
                        </button>

                        <h2 className="text-xl font-bold mb-5 text-gray-800 dark:text-gray-100">
                            Create new board
                        </h2>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <label><strong>Name Board</strong></label>
                            <input 
                                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] border dark:border-gray-600"
                                type="text" value={boardN} onChange={e => setBoardN(e.target.value)} placeholder="Tên Board..." 
                            />
                            <label><strong>Invite members</strong></label>
                            <input 
                                type="email" 
                                placeholder="Invite email..." 
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-[#1a1a1a]"
                            />
                            <div className="grid grid-cols-3 gap-2">
                                {bgOptions.map(option => (
                                    <img 
                                        key={option} src={option} alt="bg"
                                        onClick={() => setBg(option)}
                                        className={`cursor-pointer rounded h-16 object-cover border-2 ${bg === option ? 'border-blue-500' : 'border-transparent'}`}
                                    />
                                ))}
                            </div>

                            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
                        </form>
                        
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div onClick={togglePopUp} className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[100px] group"
                >
                    ➕ Create new
                </div>
                {boards.map((board) => (
                    <Link href={`/b/${board.id}`} key={board.id}>
                        <div 
                            className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[160px] group"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-4">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {board.title}
                                    </h3>
                                    {board.ownerId === currentUserId && (
                                        <button 
                                            onClick={(e) => handleDeleteBoard(e, board.id)}
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                            title="Xóa board"
                                        >
                                            ❌
                                        </button>
                                    )}
                                </div>
                                
                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                    👑 Host: <span className="font-medium text-gray-600 dark:text-gray-300">{board.ownerName}</span>
                                </p>
                            </div>
                            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3 mt-4">
                                <div className="text-sm text-gray-500 font-medium flex items-center gap-1">
                                    📋 {board.tasksCount || 0} Tasks
                                </div>
                                <div className="flex -space-x-2 overflow-hidden">
                                    {board.membersData && board.membersData.map((mem, i) => (
                                        <img
                                            key={mem.id || i}
                                            className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#1a1a1a] object-cover bg-gray-200"
                                            src={mem.avatar || `https://ui-avatars.com/api/?name=${mem.name}&background=random`}
                                            alt={mem.name}
                                            title={mem.name} 
                                        />
                                    ))}
                                </div>
                                
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}