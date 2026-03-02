// src/navigation/TabNavigator.tsx

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import HomeScreen from "@/screens/HomeScreen";
import HistoryScreen from "@/screens/HistoryScreen";
import PreferencesScreen from "@/screens/PreferencesScreen";
import { COLORS } from "@/constants/colors";

export type TabParamList = {
    Home: undefined;
    History: undefined;
    Preferences: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: COLORS.surface,
                    borderTopColor: COLORS.border,
                    borderTopWidth: 1,
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textMuted,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: "Quét",
                    tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📷</Text>,
                }}
            />
            <Tab.Screen
                name="History"
                component={HistoryScreen}
                options={{
                    tabBarLabel: "Lịch sử",
                    tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🕐</Text>,
                }}
            />
            <Tab.Screen
                name="Preferences"
                component={PreferencesScreen}
                options={{
                    tabBarLabel: "Cài đặt",
                    tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⚙️</Text>,
                }}
            />
        </Tab.Navigator>
    );
}
