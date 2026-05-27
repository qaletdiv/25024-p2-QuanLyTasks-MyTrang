import { useState } from "react";

export default function TaskComment({ activeTask, tasks, setTasks }) {
    const [commentText, setCommentText] = useState("");

    const handleAddComment = async (taskId) => {
        if (!commentText.trim()) return;

        try {
            const userId = localStorage.getItem('userId');

            const res = await fetch(
                `http://localhost:5000/api/tasks/${taskId}/comments`,
                {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': userId
                    },
                    body: JSON.stringify({
                        content: commentText
                    })
                }
            );

            const data = await res.json();

            if (res.ok) {
                setTasks(prevTask => ({
                    ...prevTask,
                    comments: [...(prevTask.comments || []), data.comment]
                }));

                setCommentText("");
            }
        } catch (error) {
            console.error(
                "Error while sending comment:",
                error
            );
        }
    };

    if (!activeTask) return <p>No task yet...!</p>;

    return (
        <div className="w-full">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Comments</h3>
            <div className="space-y-4 mb-4">
                {(activeTask.comments || []).map(c => (
                    <div key={c.id} className="text-sm border-b dark:border-gray-800 pb-2">
                        <span className="font-bold text-blue-500">{c.userName}: </span>
                        <span className="dark:text-gray-300">{c.content}</span>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 p-2 bg-gray-100 dark:bg-[#2d2d2d] rounded dark:text-white border dark:border-gray-700"
                    placeholder="Viết bình luận..."
                />
                <button
                    onClick={() => handleAddComment(activeTask.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Gửi
                </button>
            </div>
        </div>
    );
}