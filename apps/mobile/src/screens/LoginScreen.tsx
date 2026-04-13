import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { AuthAPI, setTokens } from '../services/api';
const C = { p:'#0D7C66', w:'#FFFFFF', t:'#1E293B', m:'#64748B', b:'#E2E8F0', bg:'#F8FAFC' };
export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [loading, setLoading] = useState(false);
  const login = async () => {
    if (!email || !pw) { Alert.alert('Error','Email and password required'); return; }
    setLoading(true);
    try {
      const res = await AuthAPI.login(email.trim().toLowerCase(), pw);
      setTokens(res.data.accessToken, res.data.refreshToken);
      navigation.replace('Main');
    } catch (e: any) { Alert.alert('Login Failed', e?.response?.data?.message || 'Check credentials'); }
    finally { setLoading(false); }
  };
  return (
    <KeyboardAvoidingView style={{flex:1,backgroundColor:C.bg}} behavior={Platform.OS==='ios'?'padding':'height'}>
      <View style={{flex:1,justifyContent:'center',padding:28}}>
        <View style={{alignItems:'center',marginBottom:40}}>
          <View style={{width:72,height:72,borderRadius:20,backgroundColor:C.p,justifyContent:'center',alignItems:'center',marginBottom:12}}>
            <Text style={{color:C.w,fontSize:32,fontWeight:'900'}}>H</Text>
          </View>
          <Text style={{fontSize:28,fontWeight:'900',color:C.t}}>HospiBot</Text>
          <Text style={{fontSize:13,color:C.m,marginTop:4}}>WhatsApp-First Healthcare OS</Text>
        </View>
        <View style={{backgroundColor:C.w,borderRadius:20,padding:20,shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.08,shadowRadius:16,elevation:4}}>
          {[{label:'Email',value:email,set:setEmail,key:'email',secure:false},{label:'Password',value:pw,set:setPw,key:'password',secure:true}].map(f=>(
            <View key={f.key} style={{marginBottom:16}}>
              <Text style={{fontSize:11,fontWeight:'700',color:C.m,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{f.label}</Text>
              <TextInput style={{backgroundColor:'#F8FAFC',borderRadius:12,borderWidth:1,borderColor:C.b,paddingHorizontal:16,paddingVertical:12,fontSize:14,color:C.t}}
                value={f.value} onChangeText={f.set} secureTextEntry={f.secure} autoCapitalize="none" placeholderTextColor="#94A3B8" placeholder={f.key==='email'?'admin@hospital.com':'Password'} onSubmitEditing={f.key==='password'?login:undefined} />
            </View>
          ))}
          <TouchableOpacity style={{backgroundColor:C.p,borderRadius:14,paddingVertical:15,alignItems:'center',marginTop:8,opacity:loading?0.6:1}} onPress={login} disabled={loading}>
            {loading ? <ActivityIndicator color={C.w}/> : <Text style={{color:C.w,fontSize:15,fontWeight:'800'}}>Sign In →</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
