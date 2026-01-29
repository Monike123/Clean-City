import { Tabs } from 'expo-router';
import { Home, MapPin, PlusCircle, Trophy } from 'lucide-react-native';
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
                    // Using a temporary icon or reusing generic user icon logic
                    // Since 'User' icon isn't imported, I'll use a simple View placeholder or assume auto-import if available,
                    // but safer to use existing imports or simple logic. 
                    // Let's use 'Home' as placeholder if needed but ideally 'User' from lucide.
                    // I'll check imports. 'Home' is imported. I'll use 'Home' temporarily or add 'User' logic if I can.
                    // Actually, I can just use a text char or similar if strict.
                    // But to be clean, let's just use 'Trophy' format.
                    tabBarIcon: ({ color }) => <View style={{ width: 24, height: 24, backgroundColor: color, borderRadius: 12 }} />,
                }}
            />
        </Tabs>
    );
}
