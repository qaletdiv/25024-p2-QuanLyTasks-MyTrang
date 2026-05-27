'use client'
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Tooltip, Legend } from "recharts";

export default function Statistics() {
    const [boards, setBoards] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [selectedBoard, setSelectedBoard] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const userId = localStorage.getItem('userId');
            const [tasksRes, boardsRes] = await Promise.all([
                fetch('http://localhost:5000/api/tasks'),
                fetch('http://localhost:5000/api/boards', { headers: { 'x-user-id': userId } })
            ]);
            setTasks((await tasksRes.json()).tasks);
            setBoards((await boardsRes.json()).userBoards);
        };
        fetchData();
    }, []);
    if (selectedBoard) {
        return <BoardDetailStats board={selectedBoard} tasks={tasks.filter(t => t.boardId === selectedBoard.id)} onBack={() => setSelectedBoard(null)} />;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {boards.map(board => {
                    const boardTasks = tasks.filter(t => t.boardId === board.id);
                    const done = boardTasks.filter(t => t.status === 'done').length;
                    const isOverdue = board.deadline && new Date(board.deadline) < new Date();
                    return (
                        <div 
                            key={board.id} 
                            onClick={() => setSelectedBoard(board)}
                            className={`bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow border-2 cursor-pointer transition-all hover:shadow-lg 
                                ${isOverdue ? 'border-red-500' : 'border-gray-100 dark:border-gray-800'}`}
                        >
                            <h2 className="text-xl font-bold mb-2">{board.title}</h2>
                            <div className="mb-4">
                                {board.deadline ? (
                                    <p className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                                        {isOverdue ? `⚠️ Overdue from: ${board.deadline}` : `📅 Deadline: ${board.deadline}`}
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No deadline</p>
                                )}
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Total: {boardTasks.length} tasks</span>
                                <span className="text-green-500 font-semibold">Done: {done}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function BoardDetailStats({ board, tasks, onBack }) {
    const todo = tasks.filter(t => t.status === 'todo').length;
    const progress = tasks.filter(t => t.status === 'in-progress').length;
    const done = tasks.filter(t => t.status === 'done').length;
    const total = tasks.length;
    const data = [
        { name: 'To Do', value: todo, color: '#94a3b8' },
        { name: 'In Progress', value: progress, color: '#3b82f6' },
        { name: 'Done', value: done, color: '#22c55e' }
    ];

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <button onClick={onBack} className="mb-4 text-blue-500 hover:underline">← Back</button>
            <h1 className="text-3xl font-bold mb-6">{board.title} - Detail</h1>
            
            <div className="h-96 bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow border border-gray-100 dark:border-gray-800 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                            data={data} 
                            dataKey="value" 
                            nameKey="name"
                            innerRadius={70} 
                            outerRadius={90}
                            paddingAngle={5} 
                        >
                            {data.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
                {data.map((item) => (
                    <div key={item.name} className="bg-white dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                        <p className="text-sm text-gray-500">{item.name}</p>
                        <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}