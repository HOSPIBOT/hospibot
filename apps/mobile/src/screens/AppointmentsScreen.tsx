import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AppointmentsAPI } from '../services/api';
const C = { p:'#0D7C66', w:'#FFFFFF', t:'#1E293B', m:'#64748B', b:'#E2E8F0', bg:'#F8FAFC', s:'#10B981', d:'#EF4444', warn:'#F59E0B' };
const STATUS_COLORS: Record<string,string> = { CONFIRMED:C.s, PENDING:C.warn, COMPLETED:C.m, CANCELLED:C.d, CHECKED_IN:'#3B82F6' };
const fmt = (d: string) => new Date(d).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
export default function AppointmentsScreen() {
  const [appts, setAppts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'today'|'upcoming'>('today');
  const load = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0,10);
      const params = tab==='today' ? { from:today, to:today, limit:50 } : { from:today, limit:50, status:'PENDING,CONFIRMED' };
      const r = await AppointmentsAPI.list(params);
      setAppts(r.data.data ?? []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [tab]);
  useEffect(() => { load(); }, [load]);
  const updateStatus = async (id: string, status: string) => {
    try { await AppointmentsAPI.updateStatus(id, status); load(); } catch { Alert.alert('Error','Failed to update'); }
  };
  return (
    <View style={{flex:1,backgroundColor:C.bg}}>
      <View style={{backgroundColor:C.p,padding:16,paddingTop:50}}>
        <Text style={{color:C.w,fontSize:22,fontWeight:'900',marginBottom:12}}>Appointments</Text>
        <View style={{flexDirection:'row',backgroundColor:'rgba(0,0,0,0.2)',borderRadius:12,padding:3}}>
          {(['today','upcoming'] as const).map(t=>(
            <TouchableOpacity key={t} onPress={()=>setTab(t)} style={{flex:1,paddingVertical:8,borderRadius:10,alignItems:'center',backgroundColor:tab===t?C.w:'transparent'}}>
              <Text style={{fontWeight:'700',fontSize:13,color:tab===t?C.p:'rgba(255,255,255,0.8)',textTransform:'capitalize'}}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {loading ? <ActivityIndicator style={{marginTop:40}} size="large" color={C.p}/> : (
        <FlatList data={appts} keyExtractor={a=>a.id} contentContainerStyle={{padding:16}} onRefresh={()=>{setRefreshing(true);load();}} refreshing={refreshing}
          renderItem={({item:a})=>(
            <View style={{backgroundColor:C.w,borderRadius:16,padding:16,marginBottom:10,shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.06,shadowRadius:8,elevation:2}}>
              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'}}>
                <View style={{flex:1}}>
                  <Text style={{fontSize:16,fontWeight:'700',color:C.t}}>{a.patient?.firstName} {a.patient?.lastName||''}</Text>
                  <Text style={{fontSize:12,color:C.m,marginTop:2}}>{a.patient?.phone} · {fmt(a.scheduledAt)}</Text>
                  {a.doctor && <Text style={{fontSize:12,color:C.p,marginTop:2,fontWeight:'600'}}>Dr. {a.doctor.user?.firstName} {a.doctor.user?.lastName||''}</Text>}
                </View>
                <View style={{paddingHorizontal:10,paddingVertical:4,borderRadius:8,backgroundColor:STATUS_COLORS[a.status]+'20'}}>
                  <Text style={{fontSize:11,fontWeight:'700',color:STATUS_COLORS[a.status]||C.m}}>{a.status}</Text>
                </View>
              </View>
              <View style={{flexDirection:'row',gap:8,marginTop:12}}>
                {a.status==='PENDING' && <TouchableOpacity onPress={()=>updateStatus(a.id,'CONFIRMED')} style={{flex:1,paddingVertical:8,backgroundColor:C.s+'15',borderRadius:10,alignItems:'center'}}><Text style={{color:C.s,fontWeight:'700',fontSize:12}}>✓ Confirm</Text></TouchableOpacity>}
                {a.status==='CONFIRMED' && <TouchableOpacity onPress={()=>updateStatus(a.id,'CHECKED_IN')} style={{flex:1,paddingVertical:8,backgroundColor:'#3B82F6'+'15',borderRadius:10,alignItems:'center'}}><Text style={{color:'#3B82F6',fontWeight:'700',fontSize:12}}>Check In</Text></TouchableOpacity>}
                {a.status==='CHECKED_IN' && <TouchableOpacity onPress={()=>updateStatus(a.id,'COMPLETED')} style={{flex:1,paddingVertical:8,backgroundColor:C.p+'15',borderRadius:10,alignItems:'center'}}><Text style={{color:C.p,fontWeight:'700',fontSize:12}}>Complete</Text></TouchableOpacity>}
                {!['CANCELLED','COMPLETED'].includes(a.status) && <TouchableOpacity onPress={()=>Alert.alert('Cancel Appointment','Are you sure?',[{text:'No'},{text:'Yes, Cancel',onPress:()=>updateStatus(a.id,'CANCELLED')}])} style={{paddingVertical:8,paddingHorizontal:16,backgroundColor:C.d+'15',borderRadius:10}}><Text style={{color:C.d,fontWeight:'700',fontSize:12}}>Cancel</Text></TouchableOpacity>}
              </View>
            </View>
          )}
          ListEmptyComponent={<View style={{alignItems:'center',marginTop:60}}><Text style={{fontSize:40,marginBottom:12}}>📅</Text><Text style={{fontSize:15,color:C.m}}>No appointments {tab}</Text></View>}
        />
      )}
    </View>
  );
}
