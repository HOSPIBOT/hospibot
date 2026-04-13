import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { AnalyticsAPI } from '../services/api';

const COLORS = {
  primary:   '#0D7C66',
  secondary: '#0A5E4F',
  background:'#F8FAFC',
  white:     '#FFFFFF',
  text:      '#1E293B',
  muted:     '#64748B',
  border:    '#E2E8F0',
  success:   '#10B981',
  warning:   '#F59E0B',
  danger:    '#EF4444',
  wa:        '#25D366',
};

interface KPI {
  label: string;
  value: string | number;
  color: string;
  emoji: string;
}

export default function DashboardScreen({ navigation }: any) {
  const [dashboard, setDashboard]     = useState<any>(null);
  const [notifications, setNotifs]    = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  const load = async () => {
    try {
      const [dashRes, notifRes] = await Promise.all([
        AnalyticsAPI.dashboard(),
        AnalyticsAPI.notifications(),
      ]);
      setDashboard(dashRes.data);
      setNotifs(notifRes.data ?? []);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const kpis: KPI[] = dashboard ? [
    { label: 'Total Patients',       value: (dashboard.totalPatients       || 0).toLocaleString('en-IN'), color: COLORS.primary,  emoji: '👥' },
    { label: 'Today\'s Appointments',value: (dashboard.todayAppointments   || 0).toLocaleString('en-IN'), color: COLORS.success,  emoji: '📅' },
    { label: 'Pending Lab Orders',   value: (dashboard.pendingLabOrders    || 0).toLocaleString('en-IN'), color: COLORS.warning,  emoji: '🧪' },
    { label: 'Unread Messages',      value: (dashboard.unreadConversations || 0).toLocaleString('en-IN'), color: COLORS.wa,       emoji: '💬' },
    { label: 'Monthly Revenue',      value: `₹${((dashboard.monthlyRevenue || 0) / 100).toLocaleString('en-IN')}`, color: '#3B82F6', emoji: '💰' },
    { label: 'Overdue Invoices',     value: (dashboard.overdueInvoices     || 0).toLocaleString('en-IN'), color: COLORS.danger,   emoji: '📋' },
  ] : [];

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading dashboard…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>HospiBot</Text>
        <Text style={styles.headerSub}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋</Text>
      </View>

      {/* Notifications */}
      {notifications.filter(n => n.type !== 'success').length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Action Required</Text>
          {notifications.filter(n => n.type !== 'success').slice(0, 3).map(n => (
            <TouchableOpacity key={n.id} style={[styles.notifCard, { borderLeftColor: n.type==='danger'?COLORS.danger:COLORS.warning }]} onPress={() => navigation.navigate(n.href?.replace('/clinical/','') || 'Dashboard')}>
              <Text style={styles.notifTitle}>{n.title}</Text>
              <Text style={styles.notifSub}>{n.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* KPI Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.grid}>
          {kpis.map(kpi => (
            <View key={kpi.label} style={styles.kpiCard}>
              <Text style={styles.kpiEmoji}>{kpi.emoji}</Text>
              <Text style={[styles.kpiValue, { color: kpi.color }]}>{kpi.value}</Text>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { label: 'New Patient',   screen: 'Patients',     emoji: '👤' },
            { label: 'Book Appt',     screen: 'Appointments', emoji: '📅' },
            { label: 'WhatsApp',      screen: 'WhatsApp',     emoji: '💬' },
            { label: 'Analytics',     screen: 'Analytics',    emoji: '📊' },
          ].map(a => (
            <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={() => navigation.navigate(a.screen)}>
              <Text style={styles.actionEmoji}>{a.emoji}</Text>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.background },
  loader:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loaderText:  { marginTop: 12, color: COLORS.muted, fontSize: 14 },
  header:      { backgroundColor: COLORS.primary, padding: 20, paddingTop: 50 },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  headerSub:   { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
  section:     { margin: 16, marginBottom: 0 },
  sectionTitle:{ fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard:     { width: '47%', backgroundColor: COLORS.white, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  kpiEmoji:    { fontSize: 24, marginBottom: 6 },
  kpiValue:    { fontSize: 22, fontWeight: '800' },
  kpiLabel:    { fontSize: 11, color: COLORS.muted, textAlign: 'center', marginTop: 3 },
  notifCard:   { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  notifTitle:  { fontSize: 13, fontWeight: '700', color: COLORS.text },
  notifSub:    { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  actionsGrid: { flexDirection: 'row', gap: 12 },
  actionBtn:   { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  actionEmoji: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.muted, textAlign: 'center' },
});
