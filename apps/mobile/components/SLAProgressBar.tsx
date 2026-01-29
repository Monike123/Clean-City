import React from 'react';
import { View, Text } from 'react-native';
import { SLACalculator } from '../services/slaCalculator';

interface SLAProgressBarProps {
    submittedAt: string;
    slaDeadline: string;
    severity: string;
}

export const SLAProgressBar: React.FC<SLAProgressBarProps> = ({
    submittedAt,
    slaDeadline,
    severity
}) => {
    if (!slaDeadline) return null;

    const progress = SLACalculator.getProgress(submittedAt, slaDeadline);
    const timeRemaining = SLACalculator.getTimeRemainingText(slaDeadline);
    const statusColor = SLACalculator.getStatusColor(slaDeadline, severity);
    const isBreached = SLACalculator.hasBreached(slaDeadline);
    const isWarning = SLACalculator.isInWarningZone(slaDeadline, severity);

    return (
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm font-inter-medium text-textLight">
                    Resolution Timeline
                </Text>
                <Text
                    className="text-sm font-inter-bold"
                    style={{ color: statusColor }}
                >
                    {timeRemaining}
                </Text>
            </View>

            {/* Progress Bar */}
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <View
                    className="h-full rounded-full"
                    style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: statusColor
                    }}
                />
            </View>

            {/* Status Message */}
            {isBreached && (
                <View className="flex-row items-center mt-1">
                    <Text className="text-xs font-inter-medium text-red-600">
                        ⚠️ SLA deadline exceeded - Complaint may be escalated
                    </Text>
                </View>
            )}
            {isWarning && !isBreached && (
                <View className="flex-row items-center mt-1">
                    <Text className="text-xs font-inter-medium text-amber-600">
                        ⏰ Approaching deadline
                    </Text>
                </View>
            )}
        </View>
    );
};

export default SLAProgressBar;
