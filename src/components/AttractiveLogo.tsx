import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../utils/colors';

const AttractiveLogo = ({ size = 100 }: { size?: number }) => {
  const rimSize = size * 0.82;
  const centerSize = size * 0.54;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.halo,
          {
            width: size * 1.18,
            height: size * 1.18,
            borderRadius: size * 0.59,
          },
        ]}
      />
      <LinearGradient
        colors={['#FFD7BA', '#FF7F88', '#7B1038']}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        style={[
          styles.gradient,
          {
            borderRadius: size * 0.36,
            padding: size * 0.07,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.34)', 'rgba(255,255,255,0.06)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.innerGlow, { borderRadius: size * 0.27 }]}
        >
          <View
            style={[
              styles.rim,
              {
                width: rimSize,
                height: rimSize,
                borderRadius: rimSize / 2,
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.markWrap,
                { width: centerSize, height: centerSize, borderRadius: centerSize / 2 },
              ]}
            >
              <View style={styles.monogramWrap}>
                <Text style={[styles.logoMark, { fontSize: size * 0.34 }]}>A</Text>
                <View style={[styles.logoBar, { width: size * 0.16 }]} />
              </View>
            </LinearGradient>
          </View>
          <View
            style={[
              styles.sparkle,
              {
                width: size * 0.16,
                height: size * 0.16,
                borderRadius: size * 0.08,
                top: size * 0.2,
                right: size * 0.18,
              },
            ]}
          />
          <View
            style={[
              styles.sparkleMini,
              {
                width: size * 0.08,
                height: size * 0.08,
                borderRadius: size * 0.04,
                bottom: size * 0.2,
                left: size * 0.18,
              },
            ]}
          />
        </LinearGradient>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  halo: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 104, 133, 0.24)',
    transform: [{ scaleX: 1.05 }, { scaleY: 0.92 }],
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#7B1038',
    shadowOpacity: 0.42,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  innerGlow: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rim: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(106, 15, 49, 0.26)',
  },
  markWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  monogramWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: {
    color: '#fff',
    fontWeight: '900',
    letterSpacing: -2,
  },
  logoBar: {
    marginTop: -4,
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  sparkle: {
    position: 'absolute',
    backgroundColor: '#FFE1A8',
    transform: [{ rotate: '18deg' }],
    shadowColor: '#FFE1A8',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  sparkleMini: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.65)',
    transform: [{ rotate: '18deg' }],
  },
});

export default AttractiveLogo;
