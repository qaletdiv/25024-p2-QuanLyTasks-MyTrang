'use client'
import { useState, useEffect } from "react";
import Link from "next/link";

export default function NotificationsPage() {
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="max-w-3xl mx-auto p-6 mt-8">
            <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <span>🔔</span>
                Your Notifications
            </h1>

            {loading ? (
                <p className="text-gray-500">
                    Loading notifications...
                </p>
            ) : notifs.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-gray-500 text-lg">
                        You don't have any notifications yet!
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifs.map(notif => (
                        <Link
                            href={`/boards/${notif.boardId}`}
                            key={notif.id}
                            className="block"
                        >
                            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 p-5 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer flex justify-between items-center group">

                                <div>
                                    <p className="text-gray-800 dark:text-gray-200 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {notif.message}
                                    </p>

                                    <p className="text-xs text-gray-400 mt-1">
                                        {notif.createdAt}
                                    </p>
                                </div>

                                {!notif.isRead && (
                                    <span className="h-3 w-3 bg-blue-600 rounded-full"></span>
                                )}

                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}