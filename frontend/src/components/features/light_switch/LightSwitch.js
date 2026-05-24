'use client'
import { useEffect, useState } from "react";

export default function LightSwitch(){
    const [isDark, setIsDark] = useState(false);
    useEffect(()=>{
        const theme = localStorage.getItem('theme');
        if(theme === "dark"){
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    },[]);
    const toggleTheme = ()=>{
        if(isDark){
            setIsDark(false);
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        else{
            setIsDark(true);
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    };
    return(
        <button onClick={toggleTheme} className="mx-4 p-1 text-xl rounded-full bg-gray-200 dark:bg-gray-700 hover:scale-110 transition-transform">
            {isDark ? "🌔" : "☀️"}
        </button>
    )
}