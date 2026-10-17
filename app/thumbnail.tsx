'use client';
import {useState,type ReactNode} from 'react';
import {safeThumbnail} from '../lib/youtube';
export default function Thumbnail({src,fallback=null,className=''}:{src?:string;fallback?:ReactNode;className?:string}){
 const [failed,setFailed]=useState('');const url=safeThumbnail(src||'');
 return url&&failed!==url?<img className={'youtube-thumbnail '+className} src={url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(url)}/>:<>{fallback}</>;
}
