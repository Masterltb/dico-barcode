// src/navigation/RootNavigator.tsx

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TabNavigator } from "./TabNavigator";
import ResultScreen from "@/screens/ResultScreen";
import ContributeScreen from "@/screens/ContributeScreen";
import { COLORS } from "@/constants/colors";

export type RootStackParamList = {
    Tabs: undefined;
    Result: { barcode: string };
    Contribute: { barcode: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: COLORS.background },
                }}
            >
                <Stack.Screen name="Tabs" component={TabNavigator} />
                <Stack.Screen
                    name="Result"
                    component={ResultScreen}
                    options={{ presentation: "modal", animation: "slide_from_bottom" }}
                />
                <Stack.Screen
                    name="Contribute"
                    component={ContributeScreen}
                    options={{ presentation: "modal", animation: "slide_from_bottom" }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
