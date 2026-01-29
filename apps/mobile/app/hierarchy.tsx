import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ChevronLeft, Phone, Mail, MapPin, Clock, Building2,
    Shield, Landmark, Scale, ChevronRight
} from 'lucide-react-native';
import {
    WARD_CONTACTS, CENTRAL_CONTACTS, LEVEL_NAMES,
    EscalationLevel, HierarchyContact
} from '../constants/hierarchy';

type Section = 'WARD' | 'CENTRAL';

export default function HierarchyScreen() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<Section>('WARD');
    const [expandedWard, setExpandedWard] = useState<string | null>(null);

    const getLevelIcon = (level: EscalationLevel) => {
        switch (level) {
            case 'WARD': return <Building2 size={20} color="#2E7D32" />;
            case 'BMC': return <Landmark size={20} color="#1976D2" />;
            case 'CHIEF_ENGINEER': return <Shield size={20} color="#7B1FA2" />;
            case 'MPCB': return <Scale size={20} color="#E65100" />;
            case 'NGT': return <Scale size={20} color="#C62828" />;
            default: return <Building2 size={20} color="#666" />;
        }
    };

    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const handleEmail = (email: string) => {
        Linking.openURL(`mailto:${email}`);
    };

    const renderContactCard = (contact: HierarchyContact, index: number) => (
        <View
            key={`${contact.level}-${contact.wardCode || index}`}
            className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm"
        >
            <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                    {getLevelIcon(contact.level)}
                </View>
                <View className="flex-1">
                    <Text className="text-base font-inter-bold text-text">
                        {contact.wardCode ? `Ward ${contact.wardCode}` : contact.name}
                    </Text>
                    <Text className="text-xs text-textLight font-inter">
                        {contact.designation} {contact.area ? `• ${contact.area}` : ''}
                    </Text>
                </View>
            </View>

            {/* Contact Actions */}
            <View className="flex-row gap-2 mb-3">
                <TouchableOpacity
                    className="flex-1 bg-green-50 py-2.5 rounded-lg flex-row items-center justify-center"
                    onPress={() => handleCall(contact.phone)}
                >
                    <Phone size={16} color="#2E7D32" />
                    <Text className="ml-2 text-green-700 font-inter-medium text-sm">Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className="flex-1 bg-blue-50 py-2.5 rounded-lg flex-row items-center justify-center"
                    onPress={() => handleEmail(contact.email)}
                >
                    <Mail size={16} color="#1976D2" />
                    <Text className="ml-2 text-blue-700 font-inter-medium text-sm">Email</Text>
                </TouchableOpacity>
            </View>

            {/* Address & Hours */}
            <View className="bg-gray-50 rounded-lg p-3">
                <View className="flex-row items-start mb-2">
                    <MapPin size={14} color="#9CA3AF" className="mt-0.5" />
                    <Text className="ml-2 text-xs text-textLight font-inter flex-1">
                        {contact.address}
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <Clock size={14} color="#9CA3AF" />
                    <Text className="ml-2 text-xs text-textLight font-inter">
                        {contact.workingHours} • {contact.workingDays}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <View>
                    <Text className="text-xl font-inter-bold text-text">Government Hierarchy</Text>
                    <Text className="text-xs text-textLight font-inter">Contact officials for escalation</Text>
                </View>
            </View>

            {/* Section Tabs */}
            <View className="flex-row px-4 py-3 bg-white border-b border-gray-100">
                <TouchableOpacity
                    className={`flex-1 py-2.5 rounded-lg mr-2 ${activeSection === 'WARD' ? 'bg-green-600' : 'bg-gray-100'}`}
                    onPress={() => setActiveSection('WARD')}
                >
                    <Text className={`text-center font-inter-medium ${activeSection === 'WARD' ? 'text-white' : 'text-gray-600'}`}>
                        Ward Offices (24)
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 py-2.5 rounded-lg ${activeSection === 'CENTRAL' ? 'bg-green-600' : 'bg-gray-100'}`}
                    onPress={() => setActiveSection('CENTRAL')}
                >
                    <Text className={`text-center font-inter-medium ${activeSection === 'CENTRAL' ? 'text-white' : 'text-gray-600'}`}>
                        Central Authorities
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Escalation Info */}
            <View className="mx-4 mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <Text className="text-xs font-inter-medium text-amber-800">
                    ⚠️ Complaints auto-escalate if not resolved within SLA deadline
                </Text>
                <Text className="text-xs text-amber-600 font-inter mt-1">
                    Ward → BMC → Chief Engineer → MPCB → NGT
                </Text>
            </View>

            {/* Contact List */}
            <ScrollView className="flex-1 px-4 pt-3" showsVerticalScrollIndicator={false}>
                {activeSection === 'WARD' ? (
                    <>
                        <Text className="text-sm font-inter-medium text-textLight mb-3">
                            24 Municipal Wards • Toll: 1916
                        </Text>
                        {WARD_CONTACTS.map((contact, i) => renderContactCard(contact, i))}
                    </>
                ) : (
                    <>
                        <Text className="text-sm font-inter-medium text-textLight mb-3">
                            Escalation Levels 2-5
                        </Text>
                        {CENTRAL_CONTACTS.map((contact, i) => renderContactCard(contact, i))}
                    </>
                )}
                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
