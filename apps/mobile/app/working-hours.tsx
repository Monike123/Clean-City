import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Clock, Calendar, Phone, AlertCircle } from 'lucide-react-native';

export default function WorkingHoursScreen() {
    const router = useRouter();

    const workingHoursData = [
        {
            title: 'Ward Offices',
            description: 'All 24 Municipal Ward Offices',
            hours: '10:00 AM - 6:00 PM',
            days: 'Monday - Saturday',
            phone: '1916',
            note: 'Closed on Sundays and Public Holidays',
            color: '#2E7D32',
        },
        {
            title: 'BMC Central',
            description: 'Municipal Corporation Head Office',
            hours: '10:00 AM - 6:00 PM',
            days: 'Monday - Saturday',
            phone: '022-22620251',
            note: 'WhatsApp: +91 8999 22 8999',
            color: '#1976D2',
        },
        {
            title: 'Chief Engineer SWM',
            description: 'Solid Waste Management Department',
            hours: '10:00 AM - 6:00 PM',
            days: 'Monday - Friday',
            phone: '022-24945186',
            note: 'Closed on Saturdays',
            color: '#7B1FA2',
        },
        {
            title: 'MPCB Mumbai',
            description: 'Pollution Control Board',
            hours: '10:00 AM - 5:30 PM',
            days: 'Monday - Friday',
            phone: '022-24010437',
            note: 'Government Office Hours',
            color: '#E65100',
        },
        {
            title: 'NGT Western Zone',
            description: 'National Green Tribunal',
            hours: '10:00 AM - 5:00 PM',
            days: 'Monday - Friday',
            phone: '020-26140446',
            note: 'Court working days only',
            color: '#C62828',
        },
    ];

    const publicHolidays = [
        'Republic Day (26 Jan)',
        'Holi',
        'Good Friday',
        'Maharashtra Day (1 May)',
        'Independence Day (15 Aug)',
        'Ganesh Chaturthi',
        'Dussehra',
        'Diwali',
        'Christmas (25 Dec)',
    ];

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <View>
                    <Text className="text-xl font-inter-bold text-text">Working Hours</Text>
                    <Text className="text-xs text-textLight font-inter">Office timings for all authorities</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
                {/* Emergency Notice */}
                <View className="bg-red-50 rounded-xl p-4 mb-4 border border-red-200">
                    <View className="flex-row items-center mb-2">
                        <AlertCircle size={18} color="#DC2626" />
                        <Text className="ml-2 font-inter-bold text-red-700">24/7 Emergency Helpline</Text>
                    </View>
                    <Text className="text-red-600 font-inter text-sm">
                        For urgent waste hazards, call <Text className="font-inter-bold">1916</Text> anytime
                    </Text>
                </View>

                {/* Working Hours Cards */}
                {workingHoursData.map((item, index) => (
                    <View
                        key={index}
                        className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm"
                    >
                        <View className="flex-row items-center mb-3">
                            <View
                                className="w-3 h-10 rounded-full mr-3"
                                style={{ backgroundColor: item.color }}
                            />
                            <View className="flex-1">
                                <Text className="text-base font-inter-bold text-text">{item.title}</Text>
                                <Text className="text-xs text-textLight font-inter">{item.description}</Text>
                            </View>
                        </View>

                        <View className="bg-gray-50 rounded-lg p-3">
                            <View className="flex-row items-center mb-2">
                                <Clock size={14} color="#6B7280" />
                                <Text className="ml-2 text-sm font-inter-medium text-text">{item.hours}</Text>
                            </View>
                            <View className="flex-row items-center mb-2">
                                <Calendar size={14} color="#6B7280" />
                                <Text className="ml-2 text-sm font-inter text-textLight">{item.days}</Text>
                            </View>
                            <View className="flex-row items-center mb-2">
                                <Phone size={14} color="#6B7280" />
                                <Text className="ml-2 text-sm font-inter text-textLight">{item.phone}</Text>
                            </View>
                            {item.note && (
                                <Text className="text-xs text-textLight font-inter italic mt-1">
                                    ℹ️ {item.note}
                                </Text>
                            )}
                        </View>
                    </View>
                ))}

                {/* Public Holidays */}
                <View className="bg-white rounded-xl p-4 mb-6 border border-gray-100 shadow-sm">
                    <Text className="text-base font-inter-bold text-text mb-3">
                        📅 Major Public Holidays
                    </Text>
                    <Text className="text-xs text-textLight font-inter mb-2">
                        Government offices remain closed on:
                    </Text>
                    <View className="flex-row flex-wrap">
                        {publicHolidays.map((holiday, i) => (
                            <View key={i} className="bg-gray-100 rounded-full px-3 py-1.5 mr-2 mb-2">
                                <Text className="text-xs font-inter text-gray-700">{holiday}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
