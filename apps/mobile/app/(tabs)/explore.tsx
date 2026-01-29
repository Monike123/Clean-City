import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, MapPin, Clock, X } from 'lucide-react-native';
import { ReportService } from '../../services/reportService';
import { CacheService } from '../../services/cacheService';
import { formatDistanceToNow } from 'date-fns';
import { getImageUri } from '../../utils/imageUtils';

const CATEGORIES = ['All', 'Plastic', 'Organic', 'Construction', 'E-Waste', 'Medical', 'Hazardous', 'Mixed'];
const STATUSES = ['All', 'submitted', 'verified', 'IN_PROGRESS', 'RESOLVED'];

export default function ExploreScreen() {
    const router = useRouter();
    const [allReports, setAllReports] = useState<any[]>([]);
    const [filteredReports, setFilteredReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadReports();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchQuery, selectedCategory, selectedStatus, allReports]);

    const loadReports = async () => {
        try {
            // Try cache first
            const cacheKey = 'all_reports_explore';
            const cached = await CacheService.get(cacheKey);

            if (cached && !refreshing) {
                setAllReports(cached);
                setLoading(false);
            }

            // Fetch fresh data
            const reports = await ReportService.getAllReports();

            // Cache it
            await CacheService.set(cacheKey, reports);

            setAllReports(reports);
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...allReports];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                r.description?.toLowerCase().includes(query) ||
                r.waste_category?.toLowerCase().includes(query) ||
                JSON.stringify(r.location).toLowerCase().includes(query)
            );
        }

        // Category filter
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(r =>
                r.waste_category?.toLowerCase() === selectedCategory.toLowerCase()
            );
        }

        // Status filter
        if (selectedStatus !== 'All') {
            filtered = filtered.filter(r =>
                r.status?.toLowerCase() === selectedStatus.toLowerCase()
            );
        }

        setFilteredReports(filtered);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadReports();
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('All');
        setSelectedStatus('All');
    };

    if (loading && allReports.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color="#2E7D32" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="bg-white px-5 py-4 border-b border-gray-100">
                <Text className="text-2xl font-inter-bold text-text mb-4">Explore Reports</Text>

                {/* Search Bar */}
                <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-3">
                    <Search size={20} color="#757575" />
                    <TextInput
                        className="flex-1 ml-3 text-text font-inter"
                        placeholder="Search by location, category..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X size={20} color="#757575" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter Toggle & Clear */}
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => setShowFilters(!showFilters)}
                        className="flex-row items-center bg-primary/10 px-4 py-2 rounded-full"
                    >
                        <Filter size={16} color="#2E7D32" />
                        <Text className="text-primary font-inter-bold ml-2 text-sm">Filters</Text>
                    </TouchableOpacity>

                    {(selectedCategory !== 'All' || selectedStatus !== 'All' || searchQuery) && (
                        <TouchableOpacity onPress={clearFilters}>
                            <Text className="text-gray-500 font-inter text-sm underline">Clear All</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filter Options */}
            {showFilters && (
                <View className="bg-white px-5 py-4 border-b border-gray-100">
                    {/* Category Filter */}
                    <Text className="text-xs font-inter-bold text-gray-500 mb-2">CATEGORY</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-4"
                    >
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full mr-2 ${selectedCategory === cat ? 'bg-primary' : 'bg-gray-100'
                                    }`}
                            >
                                <Text className={`text-xs font-inter-bold ${selectedCategory === cat ? 'text-white' : 'text-gray-600'
                                    }`}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Status Filter */}
                    <Text className="text-xs font-inter-bold text-gray-500 mb-2">STATUS</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    >
                        {STATUSES.map(status => (
                            <TouchableOpacity
                                key={status}
                                onPress={() => setSelectedStatus(status)}
                                className={`px-4 py-2 rounded-full mr-2 ${selectedStatus === status ? 'bg-primary' : 'bg-gray-100'
                                    }`}
                            >
                                <Text className={`text-xs font-inter-bold capitalize ${selectedStatus === status ? 'text-white' : 'text-gray-600'
                                    }`}>
                                    {status}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Results Count */}
            <View className="px-5 py-3 bg-gray-50">
                <Text className="text-sm text-textLight font-inter">
                    {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'} found
                </Text>
            </View>

            {/* Reports List */}
            <ScrollView
                className="flex-1 px-5"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
                }
            >
                {filteredReports.length === 0 ? (
                    <View className="flex-1 justify-center items-center py-20">
                        <Search size={48} color="#D1D5DB" />
                        <Text className="text-textLight font-inter mt-4">No reports found</Text>
                        <Text className="text-xs text-textLight font-inter mt-1">Try adjusting your filters</Text>
                    </View>
                ) : (
                    filteredReports.map((report) => {
                        let locationText = 'Unknown Location';
                        if (report.location) {
                            const loc = typeof report.location === 'object' ? report.location : JSON.parse(report.location);
                            locationText = loc.address || `${loc.latitude?.toFixed(2)}, ${loc.longitude?.toFixed(2)}`;
                        }

                        return (
                            <TouchableOpacity
                                key={report.id}
                                className="bg-white rounded-2xl mb-4 shadow-sm overflow-hidden"
                                onPress={() => router.push(`/report/${report.id}`)}
                                activeOpacity={0.7}
                            >
                                {/* Image */}
                                {report.media_file && (() => {
                                    const imageUri = getImageUri(report.media_file);
                                    return imageUri ? (
                                        <Image
                                            source={{ uri: imageUri }}
                                            className="w-full h-48"
                                            resizeMode="cover"
                                        />
                                    ) : null;
                                })()}

                                {/* Details */}
                                <View className="p-4">
                                    {/* Category & Status */}
                                    <View className="flex-row justify-between items-center mb-2">
                                        <Text className="text-base font-inter-bold text-text capitalize">
                                            {report.waste_category || 'Waste Report'}
                                        </Text>
                                        <View className={`px-3 py-1 rounded-full ${report.status === 'RESOLVED' ? 'bg-green-100' :
                                            report.status === 'IN_PROGRESS' ? 'bg-blue-100' :
                                                report.status === 'verified' ? 'bg-green-100' :
                                                    'bg-orange-100'
                                            }`}>
                                            <Text className={`text-xs font-inter-bold ${report.status === 'RESOLVED' ? 'text-green-700' :
                                                report.status === 'IN_PROGRESS' ? 'text-blue-700' :
                                                    report.status === 'verified' ? 'text-green-700' :
                                                        'text-orange-700'
                                                }`}>
                                                {report.status || 'submitted'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Location */}
                                    <View className="flex-row items-center mb-2">
                                        <MapPin size={14} color="#757575" />
                                        <Text className="text-xs text-textLight ml-2 font-inter flex-1" numberOfLines={1}>
                                            {locationText}
                                        </Text>
                                    </View>

                                    {/* Time */}
                                    <View className="flex-row items-center mb-3">
                                        <Clock size={14} color="#757575" />
                                        <Text className="text-xs text-textLight ml-2 font-inter">
                                            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                                        </Text>
                                    </View>

                                    {/* Description */}
                                    {report.description && (
                                        <Text className="text-sm text-gray-600 font-inter" numberOfLines={2}>
                                            {report.description}
                                        </Text>
                                    )}

                                    {/* Likes count if available */}
                                    {report.likes_count > 0 && (
                                        <View className="mt-3 pt-3 border-t border-gray-100">
                                            <Text className="text-xs text-gray-500 font-inter">
                                                👍 {report.likes_count} {report.likes_count === 1 ? 'like' : 'likes'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}

                <View className="h-6" />
            </ScrollView>
        </SafeAreaView>
    );
}
