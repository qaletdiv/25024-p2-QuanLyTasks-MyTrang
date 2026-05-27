'use client'
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import TaskComment from "@/components/features/comment/TaskComment";

export default function TaskDetail() {
    const { taskId } = useParams();

    const [task, setTask] = useState(null);
    const [description, setDescription] = useState("");
    const [checklist, setChecklist] = useState([]);
    const [users, setUsers] = useState([]);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchTask = async () => {
            const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`); 
            const data = await res.json();
            setTask(data.task);
            setDescription(data.task.description || "");
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

    const assignee = users.find(u => u.id === task?.assigneeId);

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
            const res = await fetch(
                `http://localhost:5000/api/tasks/${taskId}/checklist/${itemId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (res.ok) {
                setTask(prev => ({
                    ...prev,
                    checklist: prev.checklist.map(item =>
                        item.id === itemId
                            ? {
                                ...item,
                                isDone: !item.isDone
                            }
                            : item
                    )
                }));
            } else {
                console.error(
                    "Failed to toggle checklist item"
                );
            }
        } catch (error) {
            console.error(
                "Error updating checklist:",
                error
            );
        }
    };

    const handleAddChecklist = async (title) => {
        if (!title.trim()) return;

        try {
            const res = await fetch(
                `http://localhost:5000/api/tasks/${taskId}/checklist`,
                {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title
                    })
                }
            );

            if (res.ok) {
                const data = await res.json();

                setTask(prev => ({
                    ...prev,
                    checklist: [
                        ...(prev.checklist || []),
                        data.item
                    ]
                }));
            }
        } catch (error) {
            console.error(
                "Error while adding checklist:",
                error
            );
        }
    };

    const handleUpdateDeadline = async (date) => {
        try {
            const res = await fetch(`http://localhost:5000/api/tasks/${taskId}/deadline`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deadline: date })
            });
            if (res.ok) {
                setTask(prev => ({ ...prev, deadline: date })); 
                setIsEditing(false); 
            }
        } catch (err) {
            console.error("Lỗi cập nhật:", err);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 grid grid-cols-3 gap-8">

            <div className="col-span-2 space-y-6">

                <h1 className="text-2xl font-bold">
                    {task?.title}
                </h1>

                <div className="mt-4">
                    <label className="text-sm font-semibold text-gray-500 block mb-1">Deadline:</label>
                    
                    {isEditing ? (
                        <input 
                            type="date" 
                            defaultValue={task?.deadline}
                            className="p-2 border rounded dark:bg-[#2d2d2d] dark:text-white"
                            onBlur={(e) => handleUpdateDeadline(e.target.value)} 
                            autoFocus
                        />
                    ) : (
                        <div 
                            className="group flex items-center gap-2 p-2 border border-transparent hover:border-gray-300 rounded cursor-pointer transition-all w-fit"
                        >
                            <span className={task?.deadline ? "text-gray-800 dark:text-white" : "text-gray-400 italic"}>
                                {task?.deadline || "Haven't set up deadline yet!"}
                            </span>
                            
                        </div>
                        
                    )}
                    <button onClick={() => setIsEditing(true)} className="cursor-pointer p-2 border border-gray-300 rounded-lg text-xs underline transition-opacity">
                        ✒️
                    </button>
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
                    <h3 className="font-semibold mb-2">Checklist</h3>
                    {task?.checklist?.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 mb-2 p-2 hover:bg-gray-50 rounded">
                            <input 
                                type="checkbox" 
                                checked={item.isDone}
                                onChange={() => toggleChecklist(item.id)}
                                className="w-4 h-4"
                            />
                            <span className={item.isDone ? "line-through text-gray-400" : ""}>{item.title}</span>
                        </div>
                    ))}
                    <button 
                        onClick={() => {
                            const title = prompt("Checklist name:");
                            if (title) handleAddChecklist(title);
                        }}
                        className="text-blue-600 text-sm font-medium hover:underline"
                    >
                        + Add checklist
                    </button>
                </section>

                <section className="border-t pt-6">
                    <TaskComment 
                        activeTask={task} 
                        tasks={[task]}
                        setTasks={setTask} 
                    />
                </section>

            </div>

            <div className="col-span-1 space-y-4">

                <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">
                        Assignee
                    </p>

                    {assignee ? (
                        <div className="flex items-center gap-2 mt-2">
                            <img 
                                src={assignee.avatar} 
                                alt={assignee.name} 
                                className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                            />
                            <span className="text-sm font-medium text-gray-700">{assignee.name}</span>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 mt-2 italic">Not assigned yet!</p>
                    )}
                </div>

            </div>

        </div>
    );
}