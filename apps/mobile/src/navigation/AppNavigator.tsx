import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// ── Screen imports (to be implemented) ─────────────────────────────────────
import LoginScreen        from '../screens/LoginScreen';
import DashboardScreen    from '../screens/DashboardScreen';
import PatientsScreen     from '../screens/PatientsScreen';
import PatientDetailScreen from '../screens/PatientDetailScreen';
import AppointmentsScreen  from '../screens/AppointmentsScreen';
import WhatsAppScreen      from '../screens/WhatsAppScreen';
import AnalyticsScreen     from '../screens/AnalyticsScreen';
import ProfileScreen       from '../screens/ProfileScreen';

const Stack  = createStackNavigator();
const Tab    = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor:   '#0D7C66',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { borderTopColor: '#E2E8F0', paddingBottom: 4, height: 60 },
        headerStyle: { backgroundColor: '#0D7C66' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}>
      <Tab.Screen name="Dashboard"    component={DashboardScreen}    options={{ title: 'Dashboard'  }} />
      <Tab.Screen name="Patients"     component={PatientsScreen}     options={{ title: 'Patients'   }} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} options={{ title: 'Appts'      }} />
      <Tab.Screen name="WhatsApp"     component={WhatsAppScreen}     options={{ title: 'WhatsApp'   }} />
      <Tab.Screen name="Analytics"    component={AnalyticsScreen}    options={{ title: 'Analytics'  }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login"         component={LoginScreen}        />
        <Stack.Screen name="Main"          component={MainTabs}           />
        <Stack.Screen name="PatientDetail" component={PatientDetailScreen}
          options={{ headerShown: true, title: 'Patient Details', headerStyle: { backgroundColor: '#0D7C66' }, headerTintColor: '#FFF' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
