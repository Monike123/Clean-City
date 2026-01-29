import { View, Text, Image, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown, MapPin, Search } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const PodiumItem = ({ user }: { user: any }) => {
    if (!user) return null;
    const isFirst = user.rank === 1;
    return (
        <View className={`items-center mx-2 ${isFirst ? '-mt-8' : ''}`}>
            {isFirst && <Crown size={32} color="#FFD700" className="mb-1" />}
            <View className={`border-4 rounded-full overflow-hidden ${isFirst ? 'border-yellow-400 w-24 h-24' :
                user.rank === 2 ? 'border-gray-300 w-20 h-20' : 'border-orange-400 w-20 h-20'
                }`}>
                <Image source={{ uri: user.avatar }} className="w-full h-full" />
            </View>
            <View className={`rounded-full px-3 py-1 mt-[-12px] z-10 ${isFirst ? 'bg-yellow-400' : user.rank === 2 ? 'bg-gray-300' : 'bg-orange-400'
                }`}>
                <Text className="text-white font-bold text-xs">{user.rank}</Text>
            </View>
            <Text className="font-bold text-white mt-1 text-center" numberOfLines={1}>{user.name}</Text>
            <Text className="text-green-100 text-xs text-center">{user.points} pts</Text>
        </View>
    );
};

const RankItem = ({ item }: { item: any }) => (
    <View className={`flex-row items-center p-4 mb-2 rounded-xl ${item.name === 'You' ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-100 shadow-sm'
        }`}>
        <Text className="font-bold text-gray-400 w-8 text-lg">{item.rank}</Text>
        <Image source={{ uri: item.avatar }} className="w-10 h-10 rounded-full bg-gray-200" />
        <View className="flex-1 ml-3">
            <Text className="font-bold text-text text-base">{item.name}</Text>
            <View className="flex-row items-center">
                <MapPin size={10} color="#9CA3AF" />
                <Text className="text-xs text-textLight ml-1">{item.city}</Text>
            </View>
        </View>
        <View className="items-end">
            <Text className="font-bold text-primary text-base">{item.points}</Text>
            <Text className="text-xs text-textLight">EcoPoints</Text>
        </View>
    </View>
);

export default function LeaderboardScreen() {
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, eco_points, avatar_url')
                .order('eco_points', { ascending: false })
                .limit(20);

            if (error) throw error;

            const formatted = data?.map((u, index) => ({
                id: u.id,
                name: u.full_name || 'Anonymous',
                points: u.eco_points || 0,
                rank: index + 1,
                avatar: u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name}&background=random`,
                city: 'Earth' // Profiles table doesn't have city, defaulting
            })) || [];

            setLeaderboardData(formatted);
        } catch (e) {
            console.error('Leaderboard error', e);
        } finally {
            setLoading(false);
        }
    };

    const top3 = [
        leaderboardData.find(u => u.rank === 2),
        leaderboardData.find(u => u.rank === 1),
        leaderboardData.find(u => u.rank === 3),
    ].filter(Boolean);

    const rest = leaderboardData.filter(u => u.rank > 3);

    if (loading) {
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            {/* Background Header */}
            <View className="absolute top-0 w-full h-[380px] bg-primary rounded-b-[40px]" />

            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-5 py-2 flex-row justify-between items-center mb-4">
                    <Text className="text-white text-2xl font-inter-bold">Leaderboard</Text>
                    <View className="bg-white/20 p-2 rounded-full">
                        <Search size={20} color="white" />
                    </View>
                </View>

                {/* Podium */}
                <View className="flex-row justify-center items-end mb-8 px-4 h-48">
                    {top3.map((user) => (
                        <PodiumItem key={user.id} user={user} />
                    ))}
                </View>

                {/* List */}
                <View className="flex-1 bg-white mx-0 rounded-t-3xl shadow-lg mt-2 overflow-hidden">
                    <View className="flex-row justify-center py-3">
                        <View className="w-12 h-1 bg-gray-200 rounded-full" />
                    </View>
                    <FlatList
                        data={rest}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <RankItem item={item} />}
                        contentContainerStyle={{ padding: 20, paddingTop: 10 }}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </SafeAreaView>
        </View>
    );
}
