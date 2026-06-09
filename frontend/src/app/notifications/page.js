'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const userId = localStorage.getItem('userId');
                const token = localStorage.getItem('token');

                const res = await fetch(
                    'http://localhost:5000/api/notifications',
                    {
                        method: "GET",
                        headers: {
                            'x-user-id': userId,
                            'authorization': `Bearer ${token}`
                        }
                    }
                );

                const data = await res.json();

                if (res.ok) {
                    setNotifs(data.notifications);
                }
            } catch (error) {
                console.log("Error loading notifications");
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    const markAsRead = async (notifId) => {
        try {
            await fetch(`http://localhost:5000/api/notifications/${notifId}/read`,
                {
                    method: "PUT"
                }
            );
            setNotifs(prev =>
                prev.map(n =>
                    n.id === notifId
                        ? { ...n, isRead: true }
                        : n
                )
            );
        } catch (error) {
            console.log("Error marking notification");
        }
    };

    const handleAccept = async (boardId, notifId) => {
        try {
            const userId = localStorage.getItem('userId');
            const res = await fetch(`http://localhost:5000/api/boards/${boardId}/accept-invite`, {
                method: "POST",
                headers: { 'x-user-id': userId }
            });

            if (res.ok) {
                markAsRead(notifId);
                router.push(`/b/${boardId}`); 
            } else {
                const data = await res.json();
                alert(data.message || "Error!");
            }
        } catch (error) {
            console.log("Error accepting invite");
            alert("Connection error to server!");
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 mt-8">
            <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <span>🔔</span>
                Your Notifications
            </h1>

            {loading ? (
                <p className="text-gray-500">Loading notifications...</p>
            ) : notifs.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-gray-500 text-lg">
                        You don't have any notifications yet!
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifs.map(notif => (
                        <div 
                            key={notif.id} 
                            className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 p-5 rounded-xl shadow-sm hover:shadow-md transition-all flex justify-between items-center group"
                        >
                            <div 
                                className="flex-1 cursor-pointer"
                                onClick={() => {
                                    if (notif.type === 'invite' && !notif.isRead) {
                                        alert("Click button below!");
                                    } else {
                                        markAsRead(notif.id);
                                        router.push(`/b/${notif.boardId}`);
                                    }
                                }}
                            >
                                <p className="text-gray-800 dark:text-gray-200 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {notif.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {notif.createdAt}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 ml-4">
                                {notif.type === 'invite' && !notif.isRead ? (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleAccept(notif.boardId, notif.id); }}
                                            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Accept
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                            className="px-3 py-1.5 bg-gray-100 dark:bg-[#2d2d2d] text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Deny
                                        </button>
                                    </div>
                                ) : (
                                    !notif.isRead && <span className="h-3 w-3 bg-blue-600 rounded-full"></span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}