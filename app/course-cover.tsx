'use client';
import type {ReactNode} from 'react';import Thumbnail from './thumbnail';import type {Resource} from '../lib/learning';
export default function CourseCover({resource,className='',fallback=null}:{resource:Resource;className?:string;fallback?:ReactNode}){return resource.coverImage?<img className={'youtube-thumbnail custom-cover '+className} src={resource.coverImage} alt="" loading="lazy"/>:<Thumbnail src={resource.thumbnailUrl} className={className} fallback={fallback}/>;}
