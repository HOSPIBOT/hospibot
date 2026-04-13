import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { WhatsAppAPI } from '../services/api';
const C = { p:'#0D7C66', wa:'#25D366', w:'#FFFFFF', t:'#1E293B', m:'#64748B', b:'#E2E8F0', bg:'#ECE5DD' };
export default function WhatsAppScreen() {
  const [convos, setConvos] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);
  useEffect(() => {
    WhatsAppAPI.conversations({ limit:30 }).then(r => setConvos(r.data.data??[])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);
  const openConvo = async (c: any) => {
    setSelected(c); setMessages([]);
    const r = await WhatsAppAPI.messages(c.id).catch(()=>({data:{messages:[]}}));
    setMessages(r.data.messages ?? r.data.data ?? []);
    setTimeout(()=>flatRef.current?.scrollToEnd({animated:true}), 100);
  };
  const send = async () => {
    if (!newMsg.trim() || !selected) return;
    setSending(true);
    try {
      await WhatsAppAPI.send(selected.waContactPhone || selected.patient?.phone, newMsg.trim());
      setMessages(m => [...m, { id: Date.now().toString(), direction:'OUTBOUND', content:newMsg.trim(), createdAt:new Date().toISOString() }]);
      setNewMsg('');
      setTimeout(()=>flatRef.current?.scrollToEnd({animated:true}), 100);
    } catch {} finally { setSending(false); }
  };
  if (selected) return (
    <KeyboardAvoidingView style={{flex:1,backgroundColor:C.bg}} behavior={Platform.OS==='ios'?'padding':'height'}>
      <View style={{backgroundColor:C.wa,padding:16,paddingTop:50,flexDirection:'row',alignItems:'center',gap:12}}>
        <TouchableOpacity onPress={()=>setSelected(null)}><Text style={{color:C.w,fontSize:22}}>‹</Text></TouchableOpacity>
        <View>
          <Text style={{color:C.w,fontSize:16,fontWeight:'700'}}>{selected.patient?.firstName||selected.waContactPhone||'Patient'}</Text>
          <Text style={{color:'rgba(255,255,255,0.8)',fontSize:12}}>{selected.patient?.phone||''}</Text>
        </View>
      </View>
      <FlatList ref={flatRef} data={messages} keyExtractor={m=>m.id} contentContainerStyle={{padding:12}}
        renderItem={({item:m})=>{
          const out = m.direction==='OUTBOUND';
          return <View style={{alignItems:out?'flex-end':'flex-start',marginBottom:8}}>
            <View style={{backgroundColor:out?'#DCF8C6':'#FFF',borderRadius:12,padding:10,maxWidth:'80%',shadowColor:'#000',shadowOffset:{width:0,height:1},shadowOpacity:0.1,shadowRadius:2,elevation:1}}>
              <Text style={{fontSize:14,color:C.t}}>{m.content||m.text||''}</Text>
              <Text style={{fontSize:10,color:C.m,marginTop:4,textAlign:out?'right':'left'}}>{new Date(m.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</Text>
            </View>
          </View>;
        }} />
      <View style={{backgroundColor:C.w,flexDirection:'row',padding:8,gap:8,alignItems:'center'}}>
        <TextInput style={{flex:1,backgroundColor:'#F0F2F5',borderRadius:24,paddingHorizontal:16,paddingVertical:10,fontSize:14,color:C.t}} placeholder="Type a message…" value={newMsg} onChangeText={setNewMsg} multiline />
        <TouchableOpacity onPress={send} disabled={sending||!newMsg.trim()} style={{width:44,height:44,borderRadius:22,backgroundColor:C.wa,justifyContent:'center',alignItems:'center',opacity:(!newMsg.trim()||sending)?0.5:1}}>
          <Text style={{color:C.w,fontSize:18}}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
  return (
    <View style={{flex:1,backgroundColor:C.w}}>
      <View style={{backgroundColor:C.wa,padding:16,paddingTop:50}}>
        <Text style={{color:C.w,fontSize:22,fontWeight:'900'}}>WhatsApp Inbox</Text>
        <Text style={{color:'rgba(255,255,255,0.8)',fontSize:13,marginTop:2}}>{convos.length} conversations</Text>
      </View>
      {loading ? <ActivityIndicator style={{marginTop:40}} size="large" color={C.wa}/> : (
        <FlatList data={convos} keyExtractor={c=>c.id}
          renderItem={({item:c})=>(
            <TouchableOpacity onPress={()=>openConvo(c)} style={{flexDirection:'row',padding:16,borderBottomWidth:1,borderBottomColor:C.b,alignItems:'center'}}>
              <View style={{width:48,height:48,borderRadius:24,backgroundColor:C.wa+'20',justifyContent:'center',alignItems:'center',marginRight:12}}>
                <Text style={{fontSize:20}}>{c.unreadCount>0?'💬':'✉️'}</Text>
              </View>
              <View style={{flex:1}}>
                <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                  <Text style={{fontSize:15,fontWeight:'700',color:C.t}}>{c.patient?.firstName||c.waContactPhone||'Unknown'} {c.patient?.lastName||''}</Text>
                  <Text style={{fontSize:11,color:C.m}}>{c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString('en-IN') : ''}</Text>
                </View>
                <Text style={{fontSize:13,color:C.m,marginTop:2}} numberOfLines={1}>{c.lastMessage||'Tap to view messages'}</Text>
              </View>
              {c.unreadCount>0 && <View style={{width:20,height:20,borderRadius:10,backgroundColor:C.wa,justifyContent:'center',alignItems:'center',marginLeft:8}}><Text style={{color:C.w,fontSize:11,fontWeight:'700'}}>{c.unreadCount}</Text></View>}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<View style={{alignItems:'center',marginTop:80}}><Text style={{fontSize:48,marginBottom:12}}>💬</Text><Text style={{fontSize:16,color:C.m}}>No conversations yet</Text></View>}
        />
      )}
    </View>
  );
}
