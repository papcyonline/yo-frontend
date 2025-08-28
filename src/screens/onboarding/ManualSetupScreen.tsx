import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSystemFont } from '../../config/constants';

interface ManualSetupScreenProps {
  navigation: any;
}

const ManualSetupScreen: React.FC<ManualSetupScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Manual Setup</Text>
          <Text style={styles.subtitle}>Complete your profile manually</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Text style={styles.placeholder}>Form fields will be added here</Text>
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => navigation.navigate('Welcome')}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 20,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#9ca3af',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
  },
  continueButton: {
    backgroundColor: '#15803d',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  continueButtonText: {
    fontSize: 18,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
});

export default ManualSetupScreen;