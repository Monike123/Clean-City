import { Tabs } from 'expo-router';
import { Home, ClipboardList, Search, User, Map } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function WorkerTabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#2E7D32',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopColor: '#E5E7EB',
                    borderTopWidth: 1,
                    height: Platform.OS === 'ios' ? 90 : 85,
                    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
                    paddingTop: 8,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -3 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                },
                tabBarLabelStyle: {
                    fontFamily: 'Inter_500Medium',
                    fontSize: 11,
                    marginTop: 2,
                },
                tabBarIconStyle: {
                    marginTop: 4,
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Home size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="tasks"
                options={{
                    title: 'My Tasks',
                    tabBarIcon: ({ color }) => <ClipboardList size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="explore-tasks"
                options={{
                    title: 'Explore',
                    tabBarIcon: ({ color }) => <Search size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: 'Map',
                    tabBarIcon: ({ color }) => <Map size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <User size={22} color={color} />,
                }}
            />
            {/* Hidden screens */}
            <Tabs.Screen name="leaderboard" options={{ href: null }} />
            <Tabs.Screen name="achievements" options={{ href: null }} />
        </Tabs>
    );
}
