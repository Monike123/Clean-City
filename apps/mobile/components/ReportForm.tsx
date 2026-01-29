import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Pressable } from 'react-native';
import { ChevronDown, Check, AlertCircle } from 'lucide-react-native';

// Options for dropdowns
export const WASTE_CATEGORIES = [
    { label: 'Plastic Waste', value: 'plastic' },
    { label: 'Organic/Food Waste', value: 'organic' },
    { label: 'Construction Debris', value: 'construction' },
    { label: 'E-Waste (Electronics)', value: 'e_waste' },
    { label: 'Medical Waste', value: 'medical' },
    { label: 'Hazardous Materials', value: 'hazardous' },
    { label: 'Mixed/General Waste', value: 'mixed' },
];

export const SEVERITY_LEVELS = [
    { label: '🟢 Low - Small amount', value: 'low' },
    { label: '🟡 Medium - Noticeable pile', value: 'medium' },
    { label: '🟠 High - Large area', value: 'high' },
    { label: '🔴 Critical - Urgent hazard', value: 'critical' },
];

export const SIZE_ESTIMATES = [
    { label: 'Small (fits in a bag)', value: 'small' },
    { label: 'Medium (several bags)', value: 'medium' },
    { label: 'Large (wheelbarrow size)', value: 'large' },
    { label: 'Very Large (truck needed)', value: 'very_large' },
];

interface DropdownProps {
    label: string;
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
}

export function Dropdown({ label, options, value, onChange, placeholder = 'Select...', required, error }: DropdownProps) {
    const [visible, setVisible] = useState(false);
    const selectedOption = options.find(o => o.value === value);

    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>
                {label} {required && <Text style={styles.required}>*</Text>}
            </Text>
            <TouchableOpacity
                style={[styles.dropdown, error && styles.dropdownError]}
                onPress={() => setVisible(true)}
                activeOpacity={0.7}
            >
                <Text style={[styles.dropdownText, !selectedOption && styles.placeholder]}>
                    {selectedOption?.label || placeholder}
                </Text>
                <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
            {error && (
                <View style={styles.errorRow}>
                    <AlertCircle size={12} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            <Modal visible={visible} transparent animationType="fade">
                <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>{label}</Text>
                        <ScrollView style={styles.optionsList}>
                            {options.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[styles.option, value === option.value && styles.optionSelected]}
                                    onPress={() => { onChange(option.value); setVisible(false); }}
                                >
                                    <Text style={[styles.optionText, value === option.value && styles.optionTextSelected]}>
                                        {option.label}
                                    </Text>
                                    {value === option.value && <Check size={18} color="#2E7D32" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

interface ReportFormProps {
    wasteCategory: string;
    setWasteCategory: (v: string) => void;
    severity: string;
    setSeverity: (v: string) => void;
    sizeEstimate: string;
    setSizeEstimate: (v: string) => void;
    description: string;
    setDescription: (v: string) => void;
    errors?: { [key: string]: string };
}

export function ReportForm({
    wasteCategory, setWasteCategory,
    severity, setSeverity,
    sizeEstimate, setSizeEstimate,
    description, setDescription,
    errors = {}
}: ReportFormProps) {
    return (
        <View style={styles.form}>
            <Dropdown
                label="Waste Type"
                options={WASTE_CATEGORIES}
                value={wasteCategory}
                onChange={setWasteCategory}
                placeholder="Select waste type..."
                required
                error={errors.wasteCategory}
            />

            <Dropdown
                label="Severity Level"
                options={SEVERITY_LEVELS}
                value={severity}
                onChange={setSeverity}
                placeholder="How serious is it?"
                required
                error={errors.severity}
            />

            <Dropdown
                label="Estimated Size"
                options={SIZE_ESTIMATES}
                value={sizeEstimate}
                onChange={setSizeEstimate}
                placeholder="How big is the waste?"
                required
                error={errors.sizeEstimate}
            />

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                    Description <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                    style={[styles.textArea, errors.description && styles.dropdownError]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe what you see..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    maxLength={500}
                />
                <Text style={styles.charCount}>{description.length}/500</Text>
                {errors.description && (
                    <View style={styles.errorRow}>
                        <AlertCircle size={12} color="#EF4444" />
                        <Text style={styles.errorText}>{errors.description}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

// Validation helper
export function validateReportForm(data: { wasteCategory: string; severity: string; sizeEstimate: string; description: string }) {
    const errors: { [key: string]: string } = {};

    if (!data.wasteCategory) errors.wasteCategory = 'Please select waste type';
    if (!data.severity) errors.severity = 'Please select severity';
    if (!data.sizeEstimate) errors.sizeEstimate = 'Please select size';
    if (!data.description || data.description.trim().length < 10) {
        errors.description = 'Description must be at least 10 characters';
    }

    return { isValid: Object.keys(errors).length === 0, errors };
}

const styles = StyleSheet.create({
    form: {
        gap: 16,
    },
    fieldContainer: {
        marginBottom: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    required: {
        color: '#EF4444',
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 14,
    },
    dropdownError: {
        borderColor: '#EF4444',
    },
    dropdownText: {
        fontSize: 15,
        color: '#1F2937',
    },
    placeholder: {
        color: '#9CA3AF',
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '60%',
        paddingBottom: 34,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    optionsList: {
        paddingHorizontal: 16,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    optionSelected: {
        backgroundColor: '#E8F5E9',
    },
    optionText: {
        fontSize: 15,
        color: '#374151',
    },
    optionTextSelected: {
        color: '#2E7D32',
        fontWeight: '600',
    },
    textArea: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#1F2937',
        minHeight: 100,
    },
    charCount: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 4,
    },
});
