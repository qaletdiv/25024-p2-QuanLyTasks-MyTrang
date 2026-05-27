'use client'
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import SideBar from "@/components/layout/SideBar"; 
import PrivateHeader from "@/components/layout/PrivateHeader";


export default function DashBoardLayout({ children }) {
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true); 
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const isPublicRoute = pathname === '/login' || pathname === '/register';

        if (!token && !isPublicRoute) {
            router.push('/login');
        } else {
            setIsAuth(!!token);
        }
        setLoading(false);
    }, [pathname, router]);

    if (loading) return null;

    return (
        <div className="flex h-screen dark:bg-[#0a0a0a] bg-gray-100"> 
            {isAuth && <SideBar/>}
            <div className="flex flex-col flex-1">
                {isAuth && <PrivateHeader/>}
                <main className="flex-1 p-4 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}