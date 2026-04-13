import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export default function AnalyticsScreen() {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>AnalyticsScreen</Text>
      <Text style={styles.s}>Implementation coming soon</Text>
    </View>
  );
}
const styles = StyleSheet.create({ c:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F8FAFC'}, t:{fontSize:20,fontWeight:'800',color:'#1E293B'}, s:{fontSize:13,color:'#64748B',marginTop:8} });
