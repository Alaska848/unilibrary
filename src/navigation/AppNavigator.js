// src/navigation/AppNavigator.js
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS } from '../utils/theme';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main screens
import HomeScreen from '../screens/main/HomeScreen';
import CatalogScreen from '../screens/main/CatalogScreen';
import BookDetailScreen from '../screens/main/BookDetailScreen';
import MyBooksScreen from '../screens/main/MyBooksScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SubmitBookScreen from '../screens/main/SubmitBookScreen';

// Admin screens
import AdminBooksScreen from '../screens/admin/AdminBooksScreen';
import AdminBorrowingLogScreen from '../screens/admin/AdminBorrowingLogScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminFacultyRequestsScreen from '../screens/admin/AdminFacultyRequestsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Auth Stack ───────────────────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// ─── User Tab Navigator ───────────────────────────────────────────────────────
function UserTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: COLORS.borderLight,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: FONTS.sizes.xs,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Catalog: focused ? 'book' : 'book-outline',
            MyBooks: focused ? 'library' : 'library-outline',
            Submit: focused ? 'add-circle' : 'add-circle-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Catalog" component={CatalogScreen} options={{ tabBarLabel: 'Catalog' }} />
      <Tab.Screen name="MyBooks" component={MyBooksScreen} options={{ tabBarLabel: 'My Books' }} />
      <Tab.Screen name="Submit" component={SubmitBookScreen} options={{ tabBarLabel: 'Submit' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ─── Admin Tab Navigator ──────────────────────────────────────────────────────
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: COLORS.borderLight,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: FONTS.sizes.xs,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            AdminHome: focused ? 'home' : 'home-outline',
            AdminBooks: focused ? 'book' : 'book-outline',
            AdminBorrowingLog: focused ? 'list' : 'list-outline',
            AdminUsers: focused ? 'people' : 'people-outline',
            AdminFacultyRequests: focused ? 'document-text' : 'document-text-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="AdminHome" component={HomeScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="AdminBooks" component={AdminBooksScreen} options={{ tabBarLabel: 'Books' }} />
      <Tab.Screen name="AdminBorrowingLog" component={AdminBorrowingLogScreen} options={{ tabBarLabel: 'Loans' }} />
      <Tab.Screen name="AdminUsers" component={AdminUsersScreen} options={{ tabBarLabel: 'Users' }} />
      <Tab.Screen name="AdminFacultyRequests" component={AdminFacultyRequestsScreen} options={{ tabBarLabel: 'Requests' }} />
    </Tab.Navigator>
  );
}

// ─── Root Stack (wraps tabs + modal screens) ──────────────────────────────────
function RootStack({ role }) {
  const MainTabs = role === 'admin' ? AdminTabs : UserTabs;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="BookDetail"
        component={BookDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user && role ? <RootStack role={role} /> : <AuthStack />}
    </NavigationContainer>
  );
}
