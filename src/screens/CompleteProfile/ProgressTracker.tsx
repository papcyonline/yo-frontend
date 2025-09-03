// Clean Progress Tracker Component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { QuestionPhase, rewardTiers } from './smartQuestionFlow';

const { width } = Dimensions.get('window');

interface ProgressTrackerProps {
  currentPoints: number;
  maxPoints: number;
  currentPhase: QuestionPhase;
  questionProgress: number;
  animatedValue: Animated.Value;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  currentPoints,
  maxPoints,
  currentPhase,
  questionProgress,
  animatedValue
}) => {
  const overallProgress = (currentPoints / maxPoints) * 100;
  const currentTier = rewardTiers.find(tier => currentPoints >= tier.points) || rewardTiers[0];
  const nextTier = rewardTiers.find(tier => tier.points > currentPoints);

  const getPhaseColor = (phaseId: string) => {
    switch (phaseId) {
      case 'essential': return '#0091ad';
      case 'core': return '#04a7c7';
      case 'rich': return '#fcd3aa';
      default: return '#666666';
    }
  };

  return (
    <View style={styles.container}>
      {/* Current Phase */}
      <View style={styles.phaseSection}>
        <View style={styles.phaseHeader}>
          <View style={[styles.phaseIcon, { backgroundColor: `${getPhaseColor(currentPhase.id)}20` }]}>
            <Ionicons 
              name={currentPhase.id === 'essential' ? 'person' : currentPhase.id === 'core' ? 'heart' : 'star'} 
              size={18} 
              color={getPhaseColor(currentPhase.id)} 
            />
          </View>
          <View style={styles.phaseInfo}>
            <Text style={styles.phaseTitle}>{currentPhase.name} Phase</Text>
            <Text style={styles.phaseTime}>{currentPhase.estimatedTime}</Text>
          </View>
          <Text style={styles.phaseProgress}>{Math.round(questionProgress)}%</Text>
        </View>
        
        <View style={styles.phaseProgressBar}>
          <View 
            style={[
              styles.phaseProgressFill,
              { 
                width: `${questionProgress}%`,
                backgroundColor: getPhaseColor(currentPhase.id)
              }
            ]} 
          />
        </View>
      </View>

      {/* Overall Progress */}
      <View style={styles.overallSection}>
        <View style={styles.overallHeader}>
          <Text style={styles.overallTitle}>Total Progress</Text>
          <Text style={styles.overallPoints}>{currentPoints}/{maxPoints} pts</Text>
        </View>
        
        <View style={styles.overallProgressBar}>
          <Animated.View
            style={[
              styles.overallProgressFill,
              {
                width: animatedValue.interpolate({
                  inputRange: [0, maxPoints],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
              }
            ]}
          >
            <LinearGradient
              colors={['#0091ad', '#04a7c7', '#fcd3aa']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressGradient}
            />
          </Animated.View>
        </View>
        
        <Text style={styles.overallPercentage}>
          {Math.round(overallProgress)}% Complete
        </Text>
      </View>

      {/* Current Benefits */}
      <View style={styles.benefitsSection}>
        <Text style={styles.benefitsTitle}>Current Level: {currentTier.reward}</Text>
        <View style={styles.benefitsList}>
          {currentTier.benefits.slice(0, 2).map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={14} color="#4ade80" />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Next Milestone */}
      {nextTier && (
        <View style={styles.nextMilestone}>
          <Text style={styles.nextMilestoneTitle}>
            Next: {nextTier.reward}
          </Text>
          <Text style={styles.nextMilestonePoints}>
            {nextTier.points - currentPoints} more points
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.1)',
  },
  
  // Phase Section
  phaseSection: {
    marginBottom: 20,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  phaseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  phaseInfo: {
    flex: 1,
  },
  phaseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  phaseTime: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
  },
  phaseProgress: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fcd3aa',
  },
  phaseProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  phaseProgressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Overall Section
  overallSection: {
    marginBottom: 20,
  },
  overallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overallTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  overallPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fcd3aa',
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },
  overallPercentage: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(252,211,170,0.8)',
    textAlign: 'center',
  },

  // Benefits Section
  benefitsSection: {
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ade80',
    marginBottom: 8,
  },
  benefitsList: {
    gap: 4,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 8,
    flex: 1,
  },

  // Next Milestone
  nextMilestone: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(252,211,170,0.1)',
  },
  nextMilestoneTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0091ad',
  },
  nextMilestonePoints: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(0,145,173,0.8)',
    marginTop: 2,
  },
});

export default ProgressTracker;