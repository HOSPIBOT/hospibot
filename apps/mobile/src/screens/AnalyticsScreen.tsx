import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { AnalyticsAPI } from '../services/api';
const C = { p:'#0D7C66', w:'#FFFFFF', t:'#1E293B', m:'#64748B', b:'#E2E8F0', bg:'#F8FAFC' };
const fmt = (n: number, prefix='₹') => n >= 10000000 ? `${prefix}${(n/10000000).toFixed(1)}Cr` : n >= 100000 ? `${prefix}${(n/100000).toFixed(1)}L` : n >= 1000 ? `${prefix}${(n/1000).toFixed(1)}K` : `${prefix}${n}`;
export default function AnalyticsScreen() {
  const [dash, setDash] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    try {
      const [d, t] = await Promise.all([AnalyticsAPI.dashboard(), AnalyticsAPI.topDoctors({limit:5})]);
      setDash(d.data); setDocs(t.data??[]);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(()=>{load();},[]);
  if (loading) return <ActivityIndicator style={{flex:1,justifyContent:'center'}} size="large" color={C.p}/>;
  const kpis = dash ? [
    {label:'Total Patients',  value:(dash.totalPatients||0).toLocaleString('en-IN'),  color:'#3B82F6', emoji:'👥'},
    {label:'Monthly Revenue', value:fmt((dash.monthlyRevenue||0)/100),                color:C.p,       emoji:'💰'},
    {label:'Total Appts',     value:(dash.totalAppointments||0).toLocaleString('en-IN'), color:'#8B5CF6',emoji:'📅'},
    {label:'Avg Daily Visits',value:Math.round((dash.totalPatients||0)/30)||0,         color:'#F59E0B', emoji:'🏥'},
  ] : [];
  return (
    <ScrollView style={{flex:1,backgroundColor:C.bg}} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}} tintColor={C.p}/>}>
      <View style={{backgroundColor:C.p,padding:16,paddingTop:50}}>
        <Text style={{color:C.w,fontSize:22,fontWeight:'900'}}>Analytics</Text>
        <Text style={{color:'rgba(255,255,255,0.8)',fontSize:13,marginTop:2}}>Platform performance overview</Text>
      </View>
      <View style={{padding:16}}>
        <Text style={{fontSize:16,fontWeight:'700',color:C.t,marginBottom:12}}>Key Metrics</Text>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>
          {kpis.map(k=>(
            <View key={k.label} style={{width:'47%',backgroundColor:C.w,borderRadius:16,padding:16,alignItems:'center',shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.06,shadowRadius:8,elevation:2}}>
              <Text style={{fontSize:24,marginBottom:6}}>{k.emoji}</Text>
              <Text style={{fontSize:22,fontWeight:'800',color:k.color}}>{k.value}</Text>
              <Text style={{fontSize:11,color:C.m,textAlign:'center',marginTop:3}}>{k.label}</Text>
            </View>
          ))}
        </View>
      </View>
      {docs.length > 0 && (
        <View style={{paddingHorizontal:16,paddingBottom:16}}>
          <Text style={{fontSize:16,fontWeight:'700',color:C.t,marginBottom:12}}>Top Doctors</Text>
          {docs.map((d,i)=>(
            <View key={d.id||i} style={{backgroundColor:C.w,borderRadius:16,padding:14,marginBottom:8,flexDirection:'row',alignItems:'center',shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.06,shadowRadius:8,elevation:2}}>
              <View style={{width:36,height:36,borderRadius:10,backgroundColor:i===0?'#F59E0B':i===1?'#94A3B8':'#CD7F32',justifyContent:'center',alignItems:'center',marginRight:12}}>
                <Text style={{color:C.w,fontWeight:'900',fontSize:14}}>#{i+1}</Text>
              </View>
              <View style={{flex:1}}>
                <Text style={{fontSize:14,fontWeight:'700',color:C.t}}>Dr. {d.firstName||d.user?.firstName||''} {d.lastName||d.user?.lastName||''}</Text>
                <Text style={{fontSize:12,color:C.m}}>{d.appointmentCount||d.totalAppointments||0} appointments</Text>
              </View>
              <Text style={{fontSize:13,fontWeight:'700',color:C.p}}>{fmt((d.revenue||d.totalRevenue||0)/100)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
