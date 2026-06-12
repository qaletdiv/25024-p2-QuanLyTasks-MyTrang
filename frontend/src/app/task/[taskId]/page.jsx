'use client'
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import TaskComment from "@/components/features/comment/TaskComment";
import Link from "next/link";

export default function TaskDetail() {
    const { taskId } = useParams();

    const [task, setTask] = useState(null);
    const [description, setDescription] = useState("");
    const [checklist, setChecklist] = useState([]);
    const [users, setUsers] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [boardId, setBoardId] = useState(null);

    const [isAssigning, setIsAssigning] = useState(false); 

    useEffect(() => {
        const fetchTask = async () => {
            const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`); 
            const data = await res.json();
            setTask(data.task);
            setDescription(data.task.description || "");
            setBoardId(data.task.boardId);
        };
        if (taskId) fetchTask();
    }, [taskId]);

    useEffect(() => {
        const fetchUsers = async () => {
            const res = await fetch('http://localhost:5000/api/users');
            const data = await res.json();
            setUsers(data.users);
        };
        fetchUsers();
    }, []);

    const assignee = users.find(u => Number(u.id) === Number(task?.assigneeId));

    const handleSaveDescription = async () => {
        try {
            await fetch(`http://localhost:5000/api/tasks/${taskId}/description`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description })
            });
            alert("Đã lưu mô tả!");
        } catch (error) {
            console.error("Lỗi lưu mô tả");
        }
    };

    const toggleChecklist = async (itemId) => {
        try {
            const userId = localStorage.getItem('userId');
            const res = await fetch(`http://localhost:5000/api/tasks/${taskId}/checklist/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId }
            });
            if (res.ok) {
                const data = await res.json();
                setTask(data.task);
            }
        } catch (error) { console.error(error); }
    };

    const handleAddChecklist = async (title) => {
        if (!title.trim()) return;
        try {
            const userId = localStorage.getItem('userId');
            const res = await fetch(`http://localhost:5000/api/tasks/${taskId}/checklist`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
                body: JSON.stringify({ title })
            });
            if (res.ok) {
                const data = await res.json();
                setTask(data.task);
            }
        } catch (error) { console.error(error); }
    };

    const handleUpdateDeadline = async (date) => {
        try {
            const userId = localStorage.getItem('userId');
            const res = await fetch(`http://localhost:5000/api/tasks/${taskId}/deadline`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
                body: JSON.stringify({ deadline: date })
            });
            if (res.ok) {
                const data = await res.json();
                setTask(data.task)
                setIsEditing(false); 
            }
        } catch (err) { console.error(err); }
    };

    const handleAssignTask = async (userId) => {
        try {
            const currentUserId = localStorage.getItem('userId');
            const res = await fetch(`http://localhost:5000/api/tasks/${taskId}/assign`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json', 'x-user-id': currentUserId },
                body: JSON.stringify({ assigneeId: userId })
            });
            
            if (res.ok) {
                const taskRes = await fetch(`http://localhost:5000/api/tasks/${taskId}`); 
                const data = await taskRes.json();
                setTask(data.task);
                setIsAssigning(false);
            }
        } catch (error) { 
            console.error("Assignment error"); 
        }
    };

    const handleAddLabel = async (label) => {
        if (!label.trim()) return;
        try {
            const userId = localStorage.getItem('userId');
            const res = await fetch(`http://localhost:5000/api/tasks/${taskId}/labels`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
                body: JSON.stringify({ label })
            });
            if (res.ok) {
                const data = await res.json();
                setTask(data.task);
            }
        } catch (error) { console.error(error); }
    };

    const handleRemoveLabel = async (label) => {
        try {
            const userId = localStorage.getItem('userId');
            const res = await fetch(`http://localhost:5000/api/tasks/${taskId}/labels/${encodeURIComponent(label)}`, {
                method: "DELETE",
                headers: { 'x-user-id': userId }
            });
            if (res.ok) {
                const data = await res.json();
                setTask(data.task);
            }
        } catch (error) { console.error(error); }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 grid grid-cols-3 gap-8">

            <div className="col-span-2 space-y-6">
                <Link href={`/b/${boardId}`} className="flex items-center gap-2 bg-white dark:bg-[#2d2d2d] p-1 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm"> ⬅️ Back</Link>
                <h1 className="text-2xl font-bold dark:text-white">
                    {task?.title}
                </h1>
                <div className="mt-4">
                    <label className="text-sm font-semibold text-gray-500 block mb-1">Deadline:</label>
                    
                    {isEditing ? (
                        <input 
                            type="date" 
                            defaultValue={task?.deadline}
                            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-[#2d2d2d] dark:text-white dark:border-gray-600 shadow-sm"
                            onBlur={(e) => handleUpdateDeadline(e.target.value)} 
                            autoFocus
                        />
                    ) : (
                        <div 
                            onClick={() => setIsEditing(true)}
                            className="group flex items-center gap-2 p-2 bg-gray-50 hover:bg-blue-50 dark:bg-[#2d2d2d] dark:hover:bg-[#1a1a1a] border border-transparent hover:border-blue-200 rounded-lg cursor-pointer transition-all w-fit"
                        >
                            <span className={task?.deadline ? "text-blue-600 dark:text-blue-400 font-bold" : "text-gray-400 italic font-medium"}>
                                {task?.deadline ? `⏰ ${task.deadline}` : "Set deadline!"}
                            </span>
                            <span className="opacity-0 group-hover:opacity-100 text-xs">✏️</span>
                        </div>
                    )}
                </div>
                <div className="mt-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <label className="text-sm font-semibold text-gray-500 block mb-2">🏷️ Labels:</label>
                    <div className="flex flex-wrap gap-2 items-center">
                        {task?.labels?.map((lbl, idx) => (
                            <span 
                                key={idx} 
                                className="group flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-bold shadow-sm transition-all hover:bg-blue-200"
                            >
                                {lbl}
                                <button 
                                    onClick={() => handleRemoveLabel(lbl)} 
                                    className="hidden group-hover:inline-block text-red-500 hover:text-red-700 ml-1 font-bold"
                                    title="Xóa nhãn này"
                                >
                                    ✖
                                </button>
                            </span>
                        ))}
                        <button 
                            onClick={() => {
                                const lbl = prompt("Input name of label");
                                if (lbl) handleAddLabel(lbl);
                            }} 
                            className="text-xs border-2 border-dashed border-gray-300 text-gray-500 px-3 py-1 rounded-full hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-[#1a1a1a] transition-colors font-medium"
                        >
                            + Add label
                        </button>
                    </div>
                </div>

                <section className="mb-6">
                    <h3 className="text-lg font-bold mb-2 dark:text-white">Description</h3>
                    <textarea 
                        className="w-full h-32 p-3 bg-gray-50 dark:bg-[#2d2d2d] rounded-lg border dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Add description for this..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={handleSaveDescription} 
                    />
                </section>

               <section className="mt-6">
                    <h3 className="font-semibold mb-2 dark:text-white">Checklist</h3>
                    {task?.checklist?.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 mb-2 p-2 hover:bg-gray-50 dark:hover:bg-[#2d2d2d] rounded">
                            <input 
                                type="checkbox" 
                                checked={item.isDone}
                                onChange={() => toggleChecklist(item.id)}
                                className="w-4 h-4"
                            />
                            <span className={item.isDone ? "line-through text-gray-400" : "dark:text-gray-200"}>{item.title}</span>
                        </div>
                    ))}
                    <button 
                        onClick={() => {
                            const title = prompt("Checklist name:");
                            if (title) handleAddChecklist(title);
                        }}
                        className="text-blue-600 text-sm font-medium hover:underline mt-2"
                    >
                        + Add checklist
                    </button>
                </section>

                <section className="border-t dark:border-gray-800 pt-6">
                    <TaskComment 
                        activeTask={task} 
                        tasks={[task]}
                        setTasks={setTask} 
                    />
                </section>

            </div>

            <div className="col-span-1 space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-[#2d2d2d] rounded-lg relative border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Assignee
                        </p>
                        <button 
                            onClick={() => setIsAssigning(!isAssigning)} 
                            className="text-[11px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-200 transition-colors font-bold uppercase"
                        >
                            Change
                        </button>
                    </div>

                    {assignee ? (
                        <div className="flex items-center gap-3">
                            <img 
                                src={assignee.avatar} 
                                alt={assignee.name} 
                                className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-600 shadow-sm object-cover"
                            />
                            <span className="text-sm font-bold text-gray-800 dark:text-white">{assignee.name}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                            <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                👤
                            </div>
                            <span className="text-sm italic">Not assigned yet!</span>
                        </div>
                    )}

                    {isAssigning && (
                        <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg z-10 max-h-56 overflow-y-auto">
                            <div 
                                className="p-3 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer text-sm text-red-500 font-medium transition-colors border-b dark:border-gray-800"
                                onClick={() => handleAssignTask(null)}
                            >
                                ❌ Unassigned
                            </div>
                            {users.map(u => (
                                <div 
                                    key={u.id} 
                                    className="p-3 hover:bg-blue-50 dark:hover:bg-[#2d2d2d] cursor-pointer flex items-center gap-3 text-sm transition-colors"
                                    onClick={() => handleAssignTask(u.id)}
                                >
                                    <img src={u.avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                                    <span className="dark:text-white font-medium">{u.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white dark:bg-[#1a1a1a] rounded-lg border dark:border-gray-700 shadow-sm">
                    <h3 className="font-bold text-sm mb-3 dark:text-white">Activity Log</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {task?.history?.length > 0 ? (
                            task.history.map(log => (
                                <div key={log.id} className="text-xs border-l-2 border-blue-500 pl-3 py-1">
                                    <p className="dark:text-gray-300">
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">{log.userName}</span> {log.action}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{log.createdAt}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-400 italic">No activity yet.</p>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}