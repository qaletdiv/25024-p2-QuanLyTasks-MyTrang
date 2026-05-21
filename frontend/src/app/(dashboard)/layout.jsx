'use client'
import { useState, useEffect } from "react";
import SideBar from "@/components/layout/SideBar"; 
import PrivateHeader from "@/components/layout/PrivateHeader";
import PublicHeader from "@/components/layout/PublicHeader";

export default function DashBoardLayout({ children }) {
    const [isAuth, setIsAuth] = useState(false);
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuth(!!token);
    }, []);

    return (
        <div className="flex h-screen dark:bg-[#0a0a0a] bg-gray-100"> 
            {isAuth && <SideBar/>}
            <div className="flex flex-col flex-1">
                {isAuth ? <PrivateHeader/> : <PublicHeader/>}
                <main className="flex-1 p-4 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}