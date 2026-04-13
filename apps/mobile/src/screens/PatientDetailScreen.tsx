import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { PatientsAPI, WhatsAppAPI } from '../services/api';
const C = { p:'#0D7C66', w:'#FFFFFF', t:'#1E293B', m:'#64748B', bg:'#F8FAFC', s:'#10B981', d:'#EF4444' };
const ageFromDOB = (d: string) => d ? Math.floor((Date.now()-new Date(d).getTime())/(1000*60*60*24*365.25)) : null;
export default function PatientDetailScreen({ route }: any) {
  const { patient: initial } = route.params;
  const [patient, setPatient] = useState<any>(initial);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'overview'|'appointments'|'prescriptions'|'billing'>('overview');
  const [sending, setSending] = useState(false);
  useEffect(()=>{
    PatientsAPI.get(initial.id).then(r=>setPatient(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  },[]);
  const sendWhatsApp = (msg: string) => {
    if (!patient?.phone) { Alert.alert('No phone','No phone number on record'); return; }
    Alert.alert('Send WhatsApp','Send this message via WhatsApp?',[{text:'Cancel'},{text:'Send',onPress:async()=>{
      setSending(true);
      try { await WhatsAppAPI.send(patient.phone, msg); Alert.alert('Sent!','Message delivered'); } catch {}
      finally { setSending(false); }
    }}]);
  };
  const age = ageFromDOB(patient?.dateOfBirth);
  const TABS: {key:typeof tab;label:string}[] = [{key:'overview',label:'Overview'},{key:'appointments',label:'Appts'},{key:'prescriptions',label:'Rx'},{key:'billing',label:'Billing'}];
  return (
    <View style={{flex:1,backgroundColor:C.bg}}>
      {/* Patient header */}
      <View style={{backgroundColor:C.p,padding:20}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:16}}>
          <View style={{width:56,height:56,borderRadius:18,backgroundColor:'rgba(255,255,255,0.2)',justifyContent:'center',alignItems:'center'}}>
            <Text style={{color:C.w,fontSize:22,fontWeight:'900'}}>{patient?.firstName?.[0]}{patient?.lastName?.[0]||''}</Text>
          </View>
          <View>
            <Text style={{color:C.w,fontSize:18,fontWeight:'800'}}>{patient?.firstName} {patient?.lastName||''}</Text>
            <Text style={{color:'rgba(255,255,255,0.8)',fontSize:13}}>{age?`${age} yrs · `:''}{patient?.gender||''} · {patient?.phone||''}</Text>
            {patient?.bloodGroup && <Text style={{color:'rgba(255,255,255,0.7)',fontSize:12}}>Blood: {patient.bloodGroup} · ID: {patient?.healthId||'—'}</Text>}
          </View>
        </View>
        <View style={{flexDirection:'row',gap:8,marginTop:16}}>
          <TouchableOpacity onPress={()=>sendWhatsApp(`Hi ${patient?.firstName}, this is a message from ${patient?.tenantName||'the hospital'}. How are you doing?`)}
            style={{flex:1,paddingVertical:8,backgroundColor:'#25D366',borderRadius:12,alignItems:'center',flexDirection:'row',justifyContent:'center',gap:6}}>
            <Text style={{color:C.w,fontWeight:'700',fontSize:13}}>💬 WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Tabs */}
      <View style={{flexDirection:'row',backgroundColor:C.w,paddingHorizontal:16,paddingVertical:8,gap:4,borderBottomWidth:1,borderBottomColor:'#E2E8F0'}}>
        {TABS.map(t=><TouchableOpacity key={t.key} onPress={()=>setTab(t.key)} style={{flex:1,paddingVertical:8,borderRadius:10,alignItems:'center',backgroundColor:tab===t.key?C.p+'15':'transparent'}}>
          <Text style={{fontSize:12,fontWeight:'700',color:tab===t.key?C.p:C.m}}>{t.label}</Text>
        </TouchableOpacity>)}
      </View>
      <ScrollView style={{flex:1,padding:16}}>
        {tab==='overview' && (
          <View>
            {patient?.allergies?.length>0 && <View style={{backgroundColor:'#FEF3C7',borderRadius:14,padding:14,marginBottom:16,borderLeftWidth:4,borderLeftColor:'#F59E0B'}}><Text style={{fontWeight:'700',color:'#92400E'}}>⚠️ Allergies: {patient.allergies.join(', ')}</Text></View>}
            {[['Email',patient?.email],['Address',patient?.address],['City',patient?.city],['Insurance',patient?.insuranceProvider],['Policy No',patient?.insurancePolicyNo],['Health ID',patient?.healthId],['ABHA',patient?.abhaId]].filter(([,v])=>v).map(([k,v])=>(
              <View key={String(k)} style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#F1F5F9'}}>
                <Text style={{color:C.m,fontSize:13}}>{k}</Text>
                <Text style={{color:C.t,fontSize:13,fontWeight:'600',maxWidth:'60%',textAlign:'right'}}>{String(v)}</Text>
              </View>
            ))}
          </View>
        )}
        {tab==='appointments' && (patient?.appointments??[]).map((a:any)=>(
          <View key={a.id} style={{backgroundColor:C.w,borderRadius:14,padding:14,marginBottom:8}}>
            <Text style={{fontWeight:'700',color:C.t}}>{new Date(a.scheduledAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})} · {new Date(a.scheduledAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</Text>
            {a.doctor && <Text style={{color:C.p,fontSize:12,marginTop:4}}>Dr. {a.doctor.user?.firstName} {a.doctor.user?.lastName||''}</Text>}
            <View style={{paddingHorizontal:8,paddingVertical:3,borderRadius:8,backgroundColor:a.status==='COMPLETED'?C.s+'20':a.status==='CANCELLED'?C.d+'20':'#3B82F620',alignSelf:'flex-start',marginTop:6}}>
              <Text style={{fontSize:11,fontWeight:'700',color:a.status==='COMPLETED'?C.s:a.status==='CANCELLED'?C.d:'#3B82F6'}}>{a.status}</Text>
            </View>
          </View>
        ))}
        {tab==='prescriptions' && (patient?.prescriptions??[]).map((rx:any)=>(
          <View key={rx.id} style={{backgroundColor:C.w,borderRadius:14,padding:14,marginBottom:8}}>
            <View style={{flexDirection:'row',justifyContent:'space-between'}}>
              <Text style={{fontWeight:'700',color:C.t}}>{new Date(rx.createdAt).toLocaleDateString('en-IN')}</Text>
              <View style={{paddingHorizontal:8,paddingVertical:3,borderRadius:8,backgroundColor:rx.isActive?C.s+'20':'#94A3B820'}}><Text style={{fontSize:11,fontWeight:'700',color:rx.isActive?C.s:C.m}}>{rx.isActive?'Active':'Expired'}</Text></View>
            </View>
            {(rx.medications as any[])?.slice(0,3).map((m:any,i:number)=><Text key={i} style={{fontSize:13,color:C.m,marginTop:4}}>• {m.name} {m.dosage||''} — {m.frequency||''}</Text>)}
          </View>
        ))}
        {tab==='billing' && (patient?.invoices??[]).map((inv:any)=>(
          <View key={inv.id} style={{backgroundColor:C.w,borderRadius:14,padding:14,marginBottom:8}}>
            <View style={{flexDirection:'row',justifyContent:'space-between'}}>
              <Text style={{fontWeight:'700',color:C.t,fontFamily:'monospace'}}>{inv.invoiceNumber}</Text>
              <Text style={{fontWeight:'700',color:inv.dueAmount>0?C.d:C.s}}>₹{((inv.totalAmount||0)/100).toLocaleString('en-IN')}</Text>
            </View>
            <Text style={{fontSize:12,color:C.m,marginTop:4}}>{new Date(inv.createdAt).toLocaleDateString('en-IN')} · {inv.status}</Text>
            {inv.dueAmount>0 && <Text style={{fontSize:12,color:C.d,fontWeight:'600',marginTop:4}}>Due: ₹{((inv.dueAmount||0)/100).toLocaleString('en-IN')}</Text>}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
