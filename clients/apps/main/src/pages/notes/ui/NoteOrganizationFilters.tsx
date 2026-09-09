import { Selector, TextInput } from '@astryxdesign/core';
import { useEffect, useState } from 'react';

export function NoteOrganizationFilters({archive,tag,onChange}:{archive:string;tag:string;onChange:(archive:string,tag:string)=>void}) {
  const [draft,setDraft]=useState(tag);
  useEffect(()=>setDraft(tag),[tag]);
  useEffect(()=>{
    if(draft.trim()===tag) return;
    const timer=window.setTimeout(()=>onChange(archive,draft.trim()),300);
    return ()=>window.clearTimeout(timer);
  },[draft,tag,archive,onChange]);
  return <>
    <Selector label="보관 필터" isLabelHidden size="sm" value={archive} onChange={value=>onChange(value,tag)} options={[
      {value:'active',label:'보관 제외'},{value:'archived',label:'보관한 메모'},{value:'all',label:'보관 포함'},
    ]}/>
    <TextInput label="태그 필터" isLabelHidden placeholder="태그로 필터" size="sm" width="9rem" value={draft} onChange={value=>setDraft(value.slice(0,40))} hasClear />
  </>;
}
