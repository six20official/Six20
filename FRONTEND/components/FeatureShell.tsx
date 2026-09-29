"use client";
import Link from "next/link";
import { ArrowLeft, Bell, Compass, Gamepad2, Home, MessageCircle, Radio, ShoppingBag, User, Wallet } from "lucide-react";
import type { ReactNode } from "react";

const nav=[['Home','/',Home],['Discover','/discover',Compass],['LIVE','/live',Radio],['Messages','/messages',MessageCircle],['Notifications','/notifications',Bell],['Marketplace','/marketplace',ShoppingBag],['Wallet','/wallet',Wallet],['Games','/games',Gamepad2],['Profile','/profile',User]] as const;
export default function FeatureShell({title,subtitle,children}:{title:string;subtitle:string;children:ReactNode}){
 return <main style={{minHeight:'100vh',background:'#050b08',color:'#fff',fontFamily:'Arial,Helvetica,sans-serif'}}>
  <header style={{position:'sticky',top:0,zIndex:10,display:'flex',alignItems:'center',gap:18,padding:'16px 22px',background:'rgba(5,11,8,.96)',borderBottom:'1px solid #1d3027'}}>
   <Link href="/" style={{display:'flex',alignItems:'center',gap:7,color:'#fff',textDecoration:'none'}}><ArrowLeft size={19}/> HowFar</Link>
   <nav style={{display:'flex',gap:8,overflowX:'auto'}}>{nav.map(([label,href,Icon])=><Link key={href} href={href} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 11px',borderRadius:10,color:href===`/${title.toLowerCase()}`?'#69f5a2':'#b7c5be',textDecoration:'none',whiteSpace:'nowrap',background:href===`/${title.toLowerCase()}`?'#123b28':'transparent'}}><Icon size={16}/>{label}</Link>)}</nav>
  </header>
  <section style={{maxWidth:1100,margin:'0 auto',padding:'34px 20px 60px'}}>
   <h1 style={{fontSize:36,margin:'0 0 8px'}}>{title}</h1><p style={{color:'#9eafa7',marginTop:0}}>{subtitle}</p>{children}
  </section>
 </main>
}
export function Card({children}:{children:ReactNode}){return <div style={{background:'#0b1510',border:'1px solid #1b2b24',borderRadius:18,padding:18}}>{children}</div>}
export const btn={background:'#35d978',color:'#041009',border:0,borderRadius:11,padding:'10px 15px',fontWeight:700,cursor:'pointer'} as const;
export const ghost={background:'#101d16',color:'#d8e4de',border:'1px solid #294037',borderRadius:11,padding:'10px 15px',cursor:'pointer'} as const;
