// src/screens/auth/components/BottomSection.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EdgeInsets } from 'react-native-safe-area-context';
import { getSystemFont } from '../../config/constants';

interface BottomSectionProps {
  insets: EdgeInsets;
  loading: boolean;
  googleLoading: boolean;
  handleGoogleAuth: () => void;
  handleFacebookAuth: () => void;
  handleSignUp: () => void;
  handleLogin: () => void;
}

const BottomSection: React.FC<BottomSectionProps> = ({
  insets,
  loading,
  googleLoading,
  handleGoogleAuth,
  handleFacebookAuth,
  handleSignUp,
  handleLogin,
}) => {
  return (
    <View style={styles.bottomSection}>
      {/* Social Authentication */}
      <View style={styles.socialSection}>
        <Text style={styles.socialTitle}>Connect with</Text>
        <View style={styles.socialGrid}>
          <TouchableOpacity 
            style={[styles.socialButton, styles.googleButton]}
            onPress={handleGoogleAuth}
            disabled={loading || googleLoading}
          >
            <View style={styles.socialButtonContent}>
              <View style={styles.socialIconContainer}>
                {googleLoading ? (
                  <View style={styles.loadingSpinner} />
                ) : (
                  <Ionicons name="logo-google" size={20} color="#4285f4" />
                )}
              </View>
              <Text style={[styles.socialButtonText, styles.googleButtonText]}>Google</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.socialButton, styles.facebookButton]}
            onPress={handleFacebookAuth}
            disabled={loading || googleLoading}
          >
            <View style={styles.socialButtonContent}>
              <View style={styles.socialIconContainer}>
                <Ionicons name="logo-facebook" size={20} color="#ffffff" />
              </View>
              <Text style={styles.socialButtonText}>Facebook</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.dividerSection}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Main CTA Buttons */}
      <View style={styles.ctaSection}>
        <View style={styles.ctaButtonContainer}>
          <TouchableOpacity 
            style={[styles.ctaButton, styles.signupButton]}
            onPress={handleSignUp}
            disabled={loading || googleLoading}
          >
            <Ionicons name="person-add-outline" size={18} color="#ffffff" />
            <Text style={styles.ctaButtonText}>
              {loading ? 'Loading...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.ctaButton, styles.loginButton]}
            onPress={handleLogin}
            disabled={loading || googleLoading}
          >
            <Ionicons name="log-in-outline" size={18} color="#fcd3aa" />
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom padding */}
      <View style={{ paddingBottom: insets.bottom + 20 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  bottomSection: {
    backgroundColor: 'transparent', // Let parent handle background color
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  socialSection: {
    alignItems: 'center',
    paddingTop: 24,
  },
  socialTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#fcd3aa', // Updated to new color scheme
    textAlign: 'center',
    marginBottom: 16,
  },
  socialGrid: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  socialButton: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    flex: 1,
    maxWidth: 175,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  googleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  facebookButton: {
    backgroundColor: 'rgba(24, 119, 242, 0.9)',
    borderColor: 'rgba(24, 119, 242, 0.3)',
  },
  socialIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
  },
  googleButtonText: {
    color: '#333333',
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285f4',
    opacity: 0.7,
  },
  dividerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(252, 211, 170, 0.15)', // Updated to new color scheme
  },
  dividerText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(252, 211, 170, 0.5)', // Updated to new color scheme
    marginHorizontal: 16,
  },
  ctaSection: {
    marginBottom: 24,
  },
  ctaButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  ctaButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  signupButton: {
    backgroundColor: '#0091ad', // Updated to new color scheme
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  ctaButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  loginButton: {
    backgroundColor: 'rgba(252, 211, 170, 0.1)', // Updated to new color scheme
    borderWidth: 2,
    borderColor: 'rgba(252, 211, 170, 0.2)', // Updated to new color scheme
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    flexDirection: 'row',
    gap: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#fcd3aa', // Updated to new color scheme
  },
});

export default BottomSection;