'use client'
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"

export default function BoardDetail() {
    const param = useParams();
    const id = param?.boardId;

    const [board, setBoard] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [err, setErr] = useState("");
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editTaskTitle, setEditTaskTitle] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");

    useEffect(() => {
        if (!id) return;

        const fetchBoardDetail = async () => {
            try {
                const userId = localStorage.getItem('userId');
                const token = localStorage.getItem('token');
                
                const res = await fetch(`http://localhost:5000/api/boards/${id}`, {
                    method: "GET",
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': userId,
                        'authorization': `Bearer ${token}`
                    }
                });

                const data = await res.json();
                
                if (res.ok) {
                    setBoard(data.board);
                    setTasks(data.tasks);
                } else {
                    setErr(data.message);
                }
            } catch (error) {
                setErr("Error connecting to server!");
            }
        };

        fetchBoardDetail();
    }, [id]);

    if (err) return <div className="p-6 text-red-500 font-bold">{err}</div>;
    if (!board) return <div className="p-6 text-gray-500">No board yet...</div>;

    const todoTasks = tasks.filter(t => t.status === 'todo');
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
    const doneTasks = tasks.filter(t => t.status === 'done');

    const handleCreateTask = async (e) => {
        e.preventDefault();

        const titleTrimmed = newTaskTitle.trim();

        if (!titleTrimmed) {
            setIsAddingTask(false);
            return;
        }

        try {
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('token');

            const res = await fetch(`http://localhost:5000/api/boards/${id}/tasks`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId,
                    'authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title: titleTrimmed })
            });

            const data = await res.json();

            if (res.ok) {
                setTasks([...tasks, data.task]);
                setNewTaskTitle("");
                setIsAddingTask(false);
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert("Error creating task!");
        }
    };

    const handleDeleteTask = async (taskId) => {
        setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));

        try {
            await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
                method: "DELETE"
            });
        } catch (error) {
            console.log("Error connection server!");
        }
    };

    const handleSaveEdit = async (taskId) => {
        if (!editTaskTitle.trim()) {
            setEditingTaskId(null);
            return;
        }

        setTasks(prevTasks =>
            prevTasks.map(t =>
                t.id === taskId
                    ? { ...t, title: editTaskTitle }
                    : t
            )
        );
        setEditingTaskId(null);
        try {
            await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: editTaskTitle })
            });
        } catch (error) {
            console.log("Lỗi đồng bộ sửa lên server");
        }
    };

    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, newStatus) => {
        e.preventDefault();

        const taskId = Number(e.dataTransfer.getData("taskId"));

        if (!taskId) return;

        setTasks(prevTasks =>
            prevTasks.map(t =>
                t.id === taskId
                    ? { ...t, status: newStatus }
                    : t
            )
        );

        try {
            await fetch(`http://localhost:5000/api/tasks/${taskId}/status`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (error) {
            console.log("Lỗi khi đồng bộ trạng thái lên Server");
        }
    };

    const handleInviteMember = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        try {
            const token = localStorage.getItem('token');

            const res = await fetch(
                `http://localhost:5000/api/boards/${id}/members`,
                {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                        'authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        email: inviteEmail
                    })
                }
            );

            const data = await res.json();
            if (res.ok) {
                alert(data.message);

                setIsInviting(false);
                setInviteEmail("");
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert("Server connection error!");
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="mb-6 flex justify-between items-end border-b border-gray-200 dark:border-gray-800 pb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                        {board.title}
                    </h1>
                </div>

                <div className="relative">
                    {isInviting ? (
                        <form onSubmit={handleInviteMember} className="flex items-center gap-2 bg-white dark:bg-[#2d2d2d] p-1 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm">
                            <input 
                                autoFocus
                                type="email"
                                placeholder="Input email..."
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="px-3 py-1.5 bg-transparent focus:outline-none text-sm dark:text-white w-48"
                            />
                            <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded hover:bg-blue-700 transition-colors">
                                Invite
                            </button>
                            <button 
                                type="button" 
                                onClick={() => { setIsInviting(false); setInviteEmail(""); }}
                                className="text-gray-500 hover:text-red-500 px-2"
                            >
                                ✖
                            </button>
                        </form>
                    ) : (
                        <button 
                            onClick={() => setIsInviting(true)}
                            className="flex items-center gap-2 bg-gray-100 dark:bg-[#2d2d2d] hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <span>👤</span> Add member
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-6 min-w-max pb-4 h-full">
                    
                    <div className="w-80 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl p-4 flex flex-col max-h-full" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'todo')}>
                        <h2 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex justify-between items-center">
                            <span>To Do</span>
                            <span className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-xs">
                                {todoTasks.length}
                            </span>
                        </h2>

                        <div className="flex-1 overflow-y-auto space-y-3">
                            {todoTasks.map(t => (
                                <div
                                    key={t.id}
                                    draggable={editingTaskId !== t.id}
                                    onDragStart={(e) => handleDragStart(e, t.id)}
                                    className="group bg-white dark:bg-[#2d2d2d] p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing hover:ring-2 ring-blue-400 transition-all flex justify-between items-start gap-2"
                                >
                                    {editingTaskId === t.id ? (
                                        <input
                                            autoFocus
                                            value={editTaskTitle}
                                            onChange={(e) => setEditTaskTitle(e.target.value)}
                                            onBlur={() => handleSaveEdit(t.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit(t.id)
                                            }}
                                            className="w-full bg-transparent border-b-2 border-blue-500 focus:outline-none dark:text-white"
                                        />
                                    ) : (
                                        <>
                                            <span className="flex-1 overflow-hidden break-words text-sm">
                                                {t.title}
                                            </span>

                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditingTaskId(t.id);
                                                        setEditTaskTitle(t.title);
                                                    }}
                                                    className="text-gray-400 hover:text-blue-500 text-xs"
                                                    title="Sửa"
                                                >
                                                    ✏️
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteTask(t.id)}
                                                    className="text-gray-400 hover:text-red-500 text-xs"
                                                    title="Xóa"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}

                            {isAddingTask ? (
                                <form onSubmit={handleCreateTask} className="mt-2">
                                    <input 
                                        type="text"
                                        autoFocus
                                        placeholder="Nhập tiêu đề task..."
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        className="w-full p-2 rounded-lg bg-white dark:bg-[#2d2d2d] border-2 border-blue-500 focus:outline-none dark:text-white shadow-sm"
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                                            Add
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => { setIsAddingTask(false); setNewTaskTitle(""); }}
                                            className="px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 text-sm rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <button 
                                    onClick={() => setIsAddingTask(true)}
                                    className="w-full text-left text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 p-2 rounded-lg mt-2 transition-colors font-medium"
                                >
                                    + Add new card...
                                </button>
                            )}
                        </div>
                    </div>

                    <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'in-progress')} className="w-80 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl p-4 flex flex-col max-h-full">
                        <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-4 flex justify-between items-center">
                            <span>In Progress</span>
                            <span className="bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-full text-xs">
                                {inProgressTasks.length}
                            </span>
                        </h2>

                        <div className="flex-1 overflow-y-auto space-y-3">
                            {inProgressTasks.map(t => (
                                <div
                                    key={t.id}
                                    draggable={editingTaskId !== t.id}
                                    onDragStart={(e) => handleDragStart(e, t.id)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, 'in-progress')}
                                    className="group bg-white dark:bg-[#2d2d2d] p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing hover:ring-2 ring-blue-400 transition-all flex justify-between items-start gap-2"
                                >
                                    {editingTaskId === t.id ? (
                                        <input
                                            autoFocus
                                            value={editTaskTitle}
                                            onChange={(e) => setEditTaskTitle(e.target.value)}
                                            onBlur={() => handleSaveEdit(t.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit(t.id)
                                            }}
                                            className="w-full bg-transparent border-b-2 border-blue-500 focus:outline-none dark:text-white"
                                        />
                                    ) : (
                                        <>
                                            <span className="flex-1 overflow-hidden break-words text-sm">
                                                {t.title}
                                            </span>

                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditingTaskId(t.id);
                                                        setEditTaskTitle(t.title);
                                                    }}
                                                    className="text-gray-400 hover:text-blue-500 text-xs"
                                                    title="Sửa"
                                                >
                                                    ✏️
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteTask(t.id)}
                                                    className="text-gray-400 hover:text-red-500 text-xs"
                                                    title="Xóa"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'done')} className="w-80 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl p-4 flex flex-col max-h-full">
                        <h2 className="font-bold text-green-600 dark:text-green-400 mb-4 flex justify-between items-center">
                            <span>Done</span>
                            <span className="bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full text-xs">
                                {doneTasks.length}
                            </span>
                        </h2>

                        <div className="flex-1 overflow-y-auto space-y-3">
                            {doneTasks.map(t => (
                                <div
                                    key={t.id}
                                    draggable={editingTaskId !== t.id}
                                    onDragStart={(e) => handleDragStart(e, t.id)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, 'done')}
                                    className="group bg-white dark:bg-[#2d2d2d] p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing hover:ring-2 ring-blue-400 transition-all flex justify-between items-start gap-2"
                                >
                                    {editingTaskId === t.id ? (
                                        <input
                                            autoFocus
                                            value={editTaskTitle}
                                            onChange={(e) => setEditTaskTitle(e.target.value)}
                                            onBlur={() => handleSaveEdit(t.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit(t.id)
                                            }}
                                            className="w-full bg-transparent border-b-2 border-blue-500 focus:outline-none dark:text-white"
                                        />
                                    ) : (
                                        <>
                                            <span className="flex-1 overflow-hidden break-words text-sm">
                                                {t.title}
                                            </span>

                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditingTaskId(t.id);
                                                        setEditTaskTitle(t.title);
                                                    }}
                                                    className="text-gray-400 hover:text-blue-500 text-xs"
                                                    title="Sửa"
                                                >
                                                    ✏️
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteTask(t.id)}
                                                    className="text-gray-400 hover:text-red-500 text-xs"
                                                    title="Xóa"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}