import { Tabs } from 'expo-router';
import { Home, MapPin, PlusCircle, Trophy, Compass } from 'lucide-react-native';
import { View } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    height: 80,
                    paddingBottom: 15,
                    paddingTop: 10,
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#EEEEEE',
                },
                tabBarActiveTintColor: '#2E7D32',
                tabBarInactiveTintColor: '#757575',
                tabBarLabelStyle: {
                    fontFamily: 'Inter_500Medium',
                    fontSize: 10,
                    marginTop: 4,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                }}
            />

            <Tabs.Screen
                name="explore"
                options={{
                    href: null,
                }}
            />

            <Tabs.Screen
                name="map"
                options={{
                    title: 'Map',
                    tabBarIcon: ({ color }) => <MapPin size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="report"
                options={{
                    title: 'Report',
                    tabBarIcon: ({ focused }) => (
                        <View className="mb-4">
                            <PlusCircle size={32} color={focused ? '#2E7D32' : '#757575'} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="leaderboard"
                options={{
                    title: 'Rank',
                    tabBarIcon: ({ color }) => <Trophy size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <View style={{ width: 24, height: 24, backgroundColor: color, borderRadius: 12 }} />,
                }}
            />
        </Tabs>
    );
}
