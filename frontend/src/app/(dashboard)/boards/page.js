'use client'
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Boards() {
    const [err, setErr] = useState("");
    const [boards, setBoards] = useState([]);
    const [isPopUp, setIsPopUp] = useState(false);
    const [boardN, setBoardN] = useState("");
    const [deadline, setDeadline] = useState("");

    useEffect(() => {
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
        setErr("");       
        const boardNameTrimmed = boardN.trim();
        if (!boardNameTrimmed) {
            setErr("Board name cannot be empty!");
            return;
        }
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5000/api/boards', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId,
                    'authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title: boardNameTrimmed, deadline })
            });
            const data = await res.json();
            if (res.ok) {
                setBoards([...boards, data.newB]);
                setBoardN("");
                setIsPopUp(false);
                console.log(data.message);
            } else {
                setErr(data.message);
            }
        } catch (err) {
            setErr("Error connecting to server!");
        } 
    }

    const handleDeleteBoard = async (e,boardId) => {
        e.stopPropagation(); 
        e.preventDefault();
        if (!confirm("Bạn có chắc chắn muốn xóa board này?")) return;
        
        await fetch(`http://localhost:5000/api/boards/${boardId}`, {
            method: 'DELETE'
        });
        setBoard(prev => prev.filter(b => b.id !== boardId));
    };

    const handleEditBoard = async (e,boardId, currentTitle) => {
        e.stopPropagation(); 
        e.preventDefault();
        const newTitle = prompt("Nhập tên board mới:", currentTitle);
        if (!newTitle || newTitle === currentTitle) return;
        
        const res = await fetch(`http://localhost:5000/api/boards/${boardId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle })
        });
        
        if (res.ok) {
            setBoard(prev => prev.map(b => b.id === boardId ? { ...b, title: newTitle } : b));
        }
    };

    return (
        <div className="p-6">
            {err && <p className="text-red-500 font-bold mb-4">{err}</p>}
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

                        <form onSubmit={e => handleSubmit(e)} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                    Board's name:
                                </label>
                                <input 
                                    className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    type="text" 
                                    value={boardN} 
                                    onChange={e => setBoardN(e.target.value)}
                                    placeholder="VD: Kế hoạch thực tập, Đồ án..."
                                    autoFocus
                                />
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-gray-600">Deadline:</label>
                                    <input 
                                        type="date" 
                                        value={deadline} 
                                        onChange={(e) => setDeadline(e.target.value)}
                                        className="p-2 border rounded"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button 
                                    type="button" 
                                    onClick={toggleCross}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md"
                                >
                                    Create
                                </button>

                            </div>
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
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                    {board.title}
                                    <div className="flex gap-2 mt-4">
                                        <button 
                                            onClick={(e) => handleEditBoard(e,board.id, board.title)}
                                            className="text-blue-500 underline"
                                        >
                                            ✒️
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeleteBoard(e,board.id)}
                                            className="text-red-500 underline"
                                        >
                                            ❌
                                        </button>
                                    </div>
                                </h3>
                                <div className="mt-2 text-xs font-medium text-gray-500">
                                    {board.deadline ? (
                                        <span className={new Date(board.deadline) < new Date() ? "text-red-500" : "text-green-600"}>
                                            📅 Deadline: {board.deadline}
                                        </span>
                                    ) : (
                                        <span className="italic text-gray-400">Không có deadline</span>
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