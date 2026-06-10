'use client'
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import TaskComment from "@/components/features/comment/TaskComment";
import Link from "next/link";
import { bgOptions } from "@/app/(dashboard)/boards/page";

export default function BoardDetail() {
    const param = useParams();
    const id = param?.boardId;

    const [editingColId, setEditingColId] = useState(null);
    const [editColTitle, setEditColTitle] = useState("");
    const [isAddingCol, setIsAddingCol] = useState(false);
    const [newColTitle, setNewColTitle] = useState("");

    const [board, setBoard] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [err, setErr] = useState("");
    const [isAddingTask, setIsAddingTask] = useState(null);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editTaskTitle, setEditTaskTitle] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [assignDropdownId, setAssignDropdownId] = useState(null);
    const [filterMyTasks, setFilterMyTasks] = useState(false); 
    const [currentUserId, setCurrentUserId] = useState(null); 

    useEffect(() => {
        if (!id) return;

        const fetchBoardDetail = async () => {
            try {
                const userId = localStorage.getItem('userId');
                const token = localStorage.getItem('token');
                setCurrentUserId(Number(userId));
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
                    console.log("Tasks loaded from server:", data.tasks);
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

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [newBoardTitle, setNewBoardTitle] = useState("");
    const [selectedBg, setSelectedBg] = useState("");

    if (err) return <div className="p-6 text-red-500 font-bold">
        <Link 
            href={'/boards'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-200 font-medium transition-all hover:border-blue-500 hover:text-blue-600 hover:shadow-lg hover:shadow-blue-500/10 active:scale-95"
        >
            <span className="text-sm">←</span>
            <span>Back to Boards</span>
        </Link>
        <div className="m-5 ">{err}</div>
        </div>;
    if (!board) return <div className="p-6 text-gray-500">No board yet...</div>;

    const displayedTasks = filterMyTasks 
        ? tasks.filter(t => t.assigneeId === currentUserId) 
        : tasks;

    const todoTasks = displayedTasks.filter(t => t.status === 'todo');
    const inProgressTasks = displayedTasks.filter(t => t.status === 'in-progress');
    const doneTasks = displayedTasks.filter(t => t.status === 'done');

    const handleCreateTask = async (e, columnId) => {
        e.preventDefault();
        e.stopPropagation(); 
        const titleTrimmed = newTaskTitle.trim();

        if (!titleTrimmed) {
            setIsAddingTask(null);
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
                body: JSON.stringify({ title: titleTrimmed, status: columnId }) 
            });

            const data = await res.json();

            if (res.ok) {
                setTasks([...tasks, data.task]);
                setNewTaskTitle("");
                setIsAddingTask(null);
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert("Error creating task!");
        }
    };

    const handleDeleteTask = async (e,taskId) => {
        e.preventDefault();
        e.stopPropagation(); 
        setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));

        try {
            await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
                method: "DELETE"
            });
        } catch (error) {
            console.log("Error connection server!");
        }
    };

    const handleSaveEdit = async (e,taskId) => {
        e.preventDefault();
        e.stopPropagation();
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
        const currentUserId = localStorage.getItem('userId');

        try {
            await fetch(`http://localhost:5000/api/tasks/${taskId}/status`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': currentUserId
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
                    body: JSON.stringify({ email: inviteEmail })
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

    const handleAssignTask = async (taskId, userId) => {
        try {
            const currentUserId = localStorage.getItem('userId');
            const res = await fetch(
                `http://localhost:5000/api/tasks/${taskId}/assign`,
                {
                    method: "PUT",
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': currentUserId
                    },
                    body: JSON.stringify({
                        assigneeId: userId
                    })
                }
            );

            const data = await res.json();
            if (res.ok) {
                setTasks(prevTasks =>
                    prevTasks.map(t =>
                        t.id === taskId
                            ? {
                                ...t,
                                assigneeId: userId,
                                assigneeName: userId ? data.assigneeData.assigneeName : null,
                                assigneeAvatar: userId ? data.assigneeData.assigneeAvatar : null
                            }
                            : t
                    )
                );

                setAssignDropdownId(null);
            }
        } catch (error) {
            console.log("Assignment error");
        }
    };

    const isOverdue = (deadline) => {
        if (!deadline) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        return new Date(deadline) < today;
    };

    const handleUpdateBoard = async () => {
        const updateData = {};
        if (newBoardTitle.trim() !== "") updateData.title = newBoardTitle;
        if (selectedBg) updateData.bg = selectedBg;

        const res = await fetch(`http://localhost:5000/api/boards/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (res.ok) {
            const data = await res.json();
            setBoard(data.board); 
            setIsSettingsOpen(false);
            alert("Cập nhật thành công!");
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!confirm(memberId === currentUserId ? "Bạn có chắc chắn muốn rời Board này?" : "Bạn có chắc chắn muốn xóa thành viên này?")) return;

        try {
            const res = await fetch(`http://localhost:5000/api/boards/${id}/members/${memberId}`, {
                method: "DELETE",
                headers: { 'x-user-id': currentUserId }
            });

            if (res.ok) {
                setBoard(prev => ({
                    ...prev,
                    membersData: prev.membersData.filter(m => m.id !== memberId)
                }));
                
                if (memberId === currentUserId) {
                    window.location.href = '/boards';
                }
            } else {
                alert("Cannot do this action!");
            }
        } catch (error) {
            alert("Error connection to server!");
        }
    };

    const saveColumnsToServer = async (newColumns) => {
        try {
            await fetch(`http://localhost:5000/api/boards/${id}/columns`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ columns: newColumns })
            });
        } catch (error) {
            console.log("Error saving columns");
        }
    };
    const handleAddColumn = (e) => {
        e.preventDefault();
        if (!newColTitle.trim()) return setIsAddingCol(false);
        
        const newCol = { 
            id: `col-${Date.now()}`, 
            title: newColTitle.trim() 
        };
        const updatedColumns = [...(board.columns || []), newCol];
        
        setBoard({ ...board, columns: updatedColumns });
        saveColumnsToServer(updatedColumns);
        setNewColTitle("");
        setIsAddingCol(false);
    };

    const handleDeleteColumn = (colId) => {
        if (!confirm("Xóa cột này sẽ không xóa task bên trong. Bạn có chắc không?")) return;
        const updatedColumns = board.columns.filter(c => c.id !== colId);
        setBoard({ ...board, columns: updatedColumns });
        saveColumnsToServer(updatedColumns);
    };

    const handleSaveColEdit = (colId) => {
        if (!editColTitle.trim()) return setEditingColId(null);
        const updatedColumns = board.columns.map(c => 
            c.id === colId ? { ...c, title: editColTitle } : c
        );
        setBoard({ ...board, columns: updatedColumns });
        saveColumnsToServer(updatedColumns);
        setEditingColId(null);
    };

    const handleMoveColumn = (index, direction) => {
        const updatedColumns = [...board.columns];
        if (direction === 'left' && index > 0) {
            [updatedColumns[index - 1], updatedColumns[index]] = [updatedColumns[index], updatedColumns[index - 1]];
        } else if (direction === 'right' && index < updatedColumns.length - 1) {
            [updatedColumns[index], updatedColumns[index + 1]] = [updatedColumns[index + 1], updatedColumns[index]];
        }
        setBoard({ ...board, columns: updatedColumns });
        saveColumnsToServer(updatedColumns);
    };

   return (
        <div className="p-6 h-screen flex flex-col bg-cover bg-center bg-fixed transition-all duration-500"
        style={{ 
            backgroundImage: board.bg ? `url(${board.bg})` : 'none',
            backgroundColor: board.bg ? 'transparent' : '#f3f4f6'
        }}>
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl w-96 border dark:border-gray-700">
                        <h2 className="text-lg font-bold mb-4 dark:text-white">Board Settings</h2>
                        
                        <label className="block text-sm mb-2">Board Name</label>
                        <input 
                            value={newBoardTitle} 
                            onChange={e => setNewBoardTitle(e.target.value)}
                            className="w-full p-2 mb-4 bg-gray-50 dark:bg-[#2d2d2d] rounded border dark:border-gray-600"
                        />

                        <label className="block text-sm mb-2">Change background</label>
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            {bgOptions.map(url => (
                                <img key={url} src={url} 
                                    onClick={() => setSelectedBg(url)}
                                    className={`h-12 w-full object-cover rounded cursor-pointer ${selectedBg === url ? 'ring-2 ring-blue-500' : ''}`}
                                />
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handleUpdateBoard} className="flex-1 bg-blue-600 text-white py-2 rounded">Save</button>
                            <button onClick={() => setIsSettingsOpen(false)} className="flex-1 bg-gray-200 py-2 rounded">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] -z-10" />
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                <div className="flex items-center gap-3">
                    <Link href={'/boards'} className="flex items-center gap-2 bg-white dark:bg-[#2d2d2d] p-1 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm"> ⬅️ Back</Link>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight bg-white dark:bg-[#2d2d2d] rounded-lg py-2 px-5">
                        {board.title}
                    </h1>
                    { board.ownerId === currentUserId &&
                        <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-2 bg-white dark:bg-[#2d2d2d] p-1 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm"
                        title="Board Settings"
                    >
                        ⚙️ Settings
                    </button>
                    }
                </div>
                
                <div className="flex items-center gap-2">
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
                            board.ownerId === currentUserId && (
                                <button 
                                    onClick={() => setIsInviting(true)}
                                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-[#2d2d2d] hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-all"
                                >
                                    <span>👤</span> Add member
                                </button>
                            )
                        )}
                        <button
                            onClick={() => setFilterMyTasks(!filterMyTasks)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ml-3 ${
                                filterMyTasks 
                                ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' 
                                : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200 dark:bg-[#2d2d2d] dark:text-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            <span>🎯</span> {filterMyTasks ? "Đang lọc Task của tôi" : "Task của tôi"}
                        </button>
                        {board?.ownerId !== currentUserId && (
                    <button 
                        onClick={() => handleRemoveMember(currentUserId)}
                        className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-all"
                    >
                            <span>🚪</span> Leave
                        </button>
                    )}
                    </div>
                </div>
                
            </div>


            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-6 min-w-max pb-4 h-full items-start">
                    
                    {board.columns?.map((col, index) => {
                        const columnTasks = displayedTasks.filter(t => t.status === col.id);

                        return (
                            <div key={col.id} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)} className="w-80 shrink-0 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl p-4 flex flex-col max-h-full">
                                <div className="flex justify-between items-center mb-4 group">
                                    {editingColId === col.id ? (
                                        <input
                                            autoFocus
                                            value={editColTitle}
                                            onChange={(e) => setEditColTitle(e.target.value)}
                                            onBlur={() => handleSaveColEdit(col.id)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveColEdit(col.id) }}
                                            className="bg-white dark:bg-[#2d2d2d] border border-blue-500 rounded px-2 py-1 w-full text-sm font-bold focus:outline-none"
                                        />
                                    ) : (
                                        <h2 
                                            onClick={() => { setEditingColId(col.id); setEditColTitle(col.title); }}
                                            className="font-bold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 transition-colors flex-1"
                                            title="Click để sửa tên"
                                        >
                                            {col.title} <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs ml-2 font-normal">{columnTasks.length}</span>
                                        </h2>
                                    )}

                                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                        <button onClick={() => handleMoveColumn(index, 'left')} disabled={index === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-30">◀</button>
                                        <button onClick={() => handleMoveColumn(index, 'right')} disabled={index === board.columns.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-30">▶</button>
                                        {board.ownerId === currentUserId && (
                                            <button onClick={() => handleDeleteColumn(col.id)} className="text-red-400 hover:text-red-600 ml-1">✖</button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3">
                                    {columnTasks.map(t => (
                                        <div
                                            key={t.id}
                                            draggable={editingTaskId !== t.id}
                                            onDragStart={(e) => handleDragStart(e, t.id)}
                                            className="group bg-white dark:bg-[#2d2d2d] p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing hover:ring-2 ring-blue-400 transition-all flex flex-col gap-2"
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                {editingTaskId === t.id ? (
                                                    <input
                                                        autoFocus
                                                        value={editTaskTitle}
                                                        onChange={(e) => setEditTaskTitle(e.target.value)}
                                                        onBlur={(e) => handleSaveEdit(e,t.id)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(e,t.id) }}
                                                        className="w-full bg-transparent border-b-2 border-blue-500 focus:outline-none dark:text-white"
                                                    />
                                                ) : (
                                                    <>
                                                        <Link href={`/task/${t.id}`} className="flex-1 overflow-hidden break-words text-sm font-medium text-blue-700 hover:underline dark:text-gray-200">
                                                            {t.title}
                                                        </Link>
                                                        <div className="task-card">
                                                            {t.deadline && (
                                                                <p className={`text-xs ${isOverdue(t.deadline) ? "text-red-500 font-bold" : "text-gray-400"}`}>
                                                                    {t.deadline ? `⏰ Deadline: ${t.deadline}` : "No deadline yet!"}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                            <button onClick={() => { setEditingTaskId(t.id); setEditTaskTitle(t.title); }} className="text-gray-400 hover:text-blue-500 text-xs" title="Sửa">✏️</button>
                                                            <button onClick={(e) => handleDeleteTask(e,t.id)} className="text-gray-400 hover:text-red-500 text-xs" title="Xóa">🗑️</button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <div className="relative flex justify-end mt-1">
                                                <button
                                                    onClick={() => setAssignDropdownId(assignDropdownId === t.id ? null : t.id)}
                                                    className="focus:outline-none hover:opacity-80 transition-opacity"
                                                    title={t.assigneeId ? `Assigned to: ${t.assigneeName}` : "No assignee yet, click to assign!"}
                                                >
                                                    {t.assigneeId ? (
                                                        <img
                                                            src={t.assigneeAvatar || `https://ui-avatars.com/api/?name=${t.assigneeName}&background=random&color=fff`}
                                                            alt={t.assigneeName}
                                                            className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-[#2d2d2d] object-cover shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                            <span className="text-[10px]">👤</span>
                                                        </div>
                                                    )}
                                                </button>

                                                {assignDropdownId === t.id && (
                                                    <div className="absolute right-[-10px] top-full mt-2 w-48 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-50 py-1 overflow-hidden">
                                                        <p className="px-3 py-2 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-100 dark:border-gray-800 tracking-wider">
                                                            Assign to
                                                        </p>
                                                        <button
                                                            onClick={() => handleAssignTask(t.id, null)}
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                                                        >
                                                            Unassigned
                                                        </button>
                                                        {board.membersData?.map(m => (
                                                            <button
                                                                key={m.id}
                                                                onClick={() => handleAssignTask(t.id, m.id)}
                                                                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:text-gray-200 flex items-center gap-2 transition-colors"
                                                            >
                                                                <img src={m.avatar || `https://ui-avatars.com/api/?name=${m.name}`} className="w-5 h-5 rounded-full" alt="avatar" />
                                                                <span className="truncate">{m.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {isAddingTask === col.id ? (
                                        <form onSubmit={(e) => handleCreateTask(e, col.id)} className="mt-2">
                                            <input 
                                                type="text" autoFocus placeholder="Nhập tiêu đề task..." value={newTaskTitle}
                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                                className="w-full p-2 rounded-lg bg-white dark:bg-[#2d2d2d] border-2 border-blue-500 focus:outline-none dark:text-white shadow-sm"
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">Add</button>
                                                <button type="button" onClick={() => { setIsAddingTask(null); setNewTaskTitle(""); }} className="px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 text-sm rounded transition-colors">Cancel</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <button onClick={() => setIsAddingTask(col.id)} className="w-full text-left text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 p-2 rounded-lg mt-2 transition-colors text-sm font-medium">
                                            + Add a card
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {board.ownerId === currentUserId && (
                        <div className="w-80 shrink-0">
                            {isAddingCol ? (
                                <form onSubmit={handleAddColumn} className="bg-gray-100 dark:bg-[#1a1a1a] p-3 rounded-xl">
                                    <input 
                                        autoFocus type="text" placeholder="Tên cột mới..." value={newColTitle}
                                        onChange={(e) => setNewColTitle(e.target.value)}
                                        className="w-full p-2 rounded bg-white dark:bg-[#2d2d2d] border border-blue-500 focus:outline-none mb-2"
                                    />
                                    <div className="flex gap-2">
                                        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Save</button>
                                        <button type="button" onClick={() => setIsAddingCol(false)} className="text-gray-500 px-2">✕</button>
                                    </div>
                                </form>
                            ) : (
                                <button 
                                    onClick={() => setIsAddingCol(true)}
                                    className="w-full bg-white/50 dark:bg-[#1a1a1a]/50 hover:bg-gray-200 dark:hover:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 font-bold py-3 px-4 rounded-xl flex items-center gap-2 transition-colors"
                                >
                                    <span>+</span> Add another list
                                </button>
                            )}
                        </div>
                    )}

                    <aside className="w-64 bg-white dark:bg-[#1a1a1a] border-l border-gray-200 dark:border-gray-800 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300">
                                Members ({board.membersData?.length || 0})
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {board.membersData?.map(member => (
                                <div key={member.id} className="flex items-center gap-3 group rounded-xl">
                                    <img 
                                        src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}`}
                                        className="w-9 h-9 rounded-full object-cover"
                                        alt={member.name}
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate flex-1">
                                        {member.name} {member.id === board.ownerId && "👑"}
                                    </span>
                                    {(board.ownerId === currentUserId || member.id === currentUserId) && member.id !== board.ownerId && (
                                        <button 
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            {member.id === currentUserId ? "" : "Delete"}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
                
            </div>
            
        </div>
    )
}