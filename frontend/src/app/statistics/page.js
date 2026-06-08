'use client'
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const calculateTaskStats = (boardTasks) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let stats = {
        total: boardTasks.length,
        todo: 0,
        progress: 0,
        completed: 0,
        overdue: 0,
        upcoming: 0,
        noDeadline: 0
    };

    boardTasks.forEach(task => {
        if (task.status === 'todo') stats.todo++;
        else if (task.status === 'in-progress') stats.progress++;
        else if (task.status === 'done') stats.completed++;

        if (task.status !== 'done') {
            if (!task.deadline) {
                stats.noDeadline++;
            } else {
                const taskDeadline = new Date(task.deadline);
                taskDeadline.setHours(0, 0, 0, 0);
                if (taskDeadline < now) {
                    stats.overdue++;
                } else {
                    stats.upcoming++;
                }
            }
        }
    });

    return stats;
};

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
        return <BoardDetailStats 
            board={selectedBoard} 
            tasks={tasks.filter(t => t.boardId === selectedBoard.id)} 
            onBack={() => setSelectedBoard(null)} 
        />;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {boards.map(board => {
                    const boardTasks = tasks.filter(t => t.boardId === board.id);
                    const stats = calculateTaskStats(boardTasks);
                    
                    return (
                        <div 
                            key={board.id} 
                            onClick={() => setSelectedBoard(board)}
                            className={`bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow border-2 cursor-pointer transition-all hover:shadow-lg 
                                ${stats.overdue > 0 ? 'border-red-500' : 'border-gray-100 dark:border-gray-800'}`}
                        >
                            <h2 className="text-xl font-bold mb-4">{board.title}</h2>
                            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                <div className="bg-gray-50 dark:bg-[#2d2d2d] p-2 rounded">
                                    <p className="text-gray-500 text-xs">Total Tasks</p>
                                    <p className="font-bold">{stats.total}</p>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                    <p className="text-green-600 dark:text-green-400 text-xs">Done</p>
                                    <p className="font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
                                </div>
                                <div className={`p-2 rounded ${stats.overdue > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-[#2d2d2d]'}`}>
                                    <p className={`text-xs ${stats.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>Overdue</p>
                                    <p className={`font-bold ${stats.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{stats.overdue}</p>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                    <p className="text-blue-600 dark:text-blue-400 text-xs">Upcoming</p>
                                    <p className="font-bold text-blue-600 dark:text-blue-400">{stats.upcoming}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function BoardDetailStats({ board, tasks, onBack }) {
    const stats = calculateTaskStats(tasks);

    const data = [
        { name: 'To Do', value: stats.todo, color: '#94a3b8' },
        { name: 'In Progress', value: stats.progress, color: '#3b82f6' },
        { name: 'Done', value: stats.completed, color: '#22c55e' }
    ];

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <button onClick={onBack} className="mb-4 text-blue-500 hover:underline">← Back</button>
            <h1 className="text-3xl font-bold mb-6">{board.title} - Detail</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-96 bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                    <h3 className="font-bold text-gray-600 dark:text-gray-300 mb-2">Task Status</h3>
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
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow border border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold text-gray-600 dark:text-gray-300 mb-4">Deadline Tracker (Chưa hoàn thành)</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b dark:border-gray-800">
                                <span className="text-red-500 font-medium">⚠️ Overdue (Trễ hạn)</span>
                                <span className="text-xl font-bold text-red-600">{stats.overdue}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b dark:border-gray-800">
                                <span className="text-blue-500 font-medium">⏳ Upcoming (Sắp tới/Còn hạn)</span>
                                <span className="text-xl font-bold text-blue-600">{stats.upcoming}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">⚪ No Deadline (Chưa set)</span>
                                <span className="text-xl font-bold text-gray-600">{stats.noDeadline}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-2xl shadow text-white flex justify-between items-center">
                        <div>
                            <p className="text-blue-100 text-sm">Total Completion</p>
                            <h2 className="text-3xl font-bold">
                                {stats.total === 0 ? "0%" : `${Math.round((stats.completed / stats.total) * 100)}%`}
                            </h2>
                        </div>
                        <div className="text-right">
                            <p className="text-blue-100 text-sm">Tasks Done</p>
                            <h2 className="text-3xl font-bold">{stats.completed} / {stats.total}</h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}