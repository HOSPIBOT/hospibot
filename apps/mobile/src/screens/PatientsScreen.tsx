import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { PatientsAPI } from '../services/api';
const C = { p:'#0D7C66', w:'#FFFFFF', t:'#1E293B', m:'#64748B', b:'#E2E8F0', bg:'#F8FAFC' };
export default function PatientsScreen({ navigation }: any) {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try { const r = await PatientsAPI.list({ search: search||undefined, limit: 30 }); setPatients(r.data.data??[]); }
      catch {}  finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);
  const ageFromDOB = (dob: string) => dob ? Math.floor((Date.now()-new Date(dob).getTime())/(1000*60*60*24*365.25)) : null;
  return (
    <View style={{flex:1,backgroundColor:C.bg}}>
      <View style={{backgroundColor:C.p,padding:16,paddingTop:50}}>
        <Text style={{color:C.w,fontSize:22,fontWeight:'900',marginBottom:12}}>Patients</Text>
        <View style={{backgroundColor:'rgba(255,255,255,0.2)',borderRadius:12,flexDirection:'row',alignItems:'center',paddingHorizontal:12,paddingVertical:10}}>
          <Text style={{color:'rgba(255,255,255,0.6)',marginRight:8}}>🔍</Text>
          <TextInput style={{flex:1,color:C.w,fontSize:14}} placeholder="Search name, phone, ID…" placeholderTextColor="rgba(255,255,255,0.5)" value={search} onChangeText={setSearch} />
        </View>
      </View>
      {loading ? <ActivityIndicator style={{marginTop:40}} size="large" color={C.p}/> : (
        <FlatList
          data={patients}
          keyExtractor={p=>p.id}
          contentContainerStyle={{padding:16}}
          renderItem={({item:p}) => {
            const age = ageFromDOB(p.dateOfBirth);
            return (
              <TouchableOpacity onPress={()=>navigation.navigate('PatientDetail',{patient:p})}
                style={{backgroundColor:C.w,borderRadius:16,padding:16,marginBottom:10,flexDirection:'row',alignItems:'center',shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.06,shadowRadius:8,elevation:2}}>
                <View style={{width:44,height:44,borderRadius:14,backgroundColor:C.p,justifyContent:'center',alignItems:'center',marginRight:14}}>
                  <Text style={{color:C.w,fontSize:16,fontWeight:'900'}}>{p.firstName?.[0]}{p.lastName?.[0]||''}</Text>
                </View>
                <View style={{flex:1}}>
                  <Text style={{fontSize:15,fontWeight:'700',color:C.t}}>{p.firstName} {p.lastName||''}</Text>
                  <Text style={{fontSize:12,color:C.m,marginTop:2}}>{p.phone}{age?` · ${age} yrs`:''}{p.bloodGroup?` · ${p.bloodGroup}`:''}</Text>
                </View>
                <Text style={{color:C.m,fontSize:16}}>›</Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<View style={{alignItems:'center',marginTop:60}}><Text style={{fontSize:40,marginBottom:12}}>👥</Text><Text style={{fontSize:15,color:C.m}}>No patients found</Text></View>}
        />
      )}
    </View>
  );
}
