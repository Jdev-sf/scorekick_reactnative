import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useAccessibility } from '../../hooks/useAccessibility';

interface PageTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  transition?: 'slide' | 'fade' | 'scale' | 'flip' | 'carousel';
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  delay?: number;
  onAnimationComplete?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  isVisible,
  transition = 'slide',
  direction = 'right',
  duration = 300,
  delay = 0,
  onAnimationComplete,
}) => {
  const { shouldReduceMotion } = useAccessibility();
  
  const opacity = useSharedValue(isVisible ? 1 : 0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotateY = useSharedValue(0);

  const effectiveDuration = shouldReduceMotion() ? 150 : duration;

  useEffect(() => {
    const animationConfig = {
      duration: effectiveDuration,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    };

    if (shouldReduceMotion()) {
      // Simple fade for reduced motion
      opacity.value = withTiming(isVisible ? 1 : 0, animationConfig, (finished) => {
        if (finished && onAnimationComplete) {
          runOnJS(onAnimationComplete)();
        }
      });
      return;
    }

    if (isVisible) {
      // Reset all values for entrance
      switch (transition) {
        case 'slide':
          const slideDistance = direction === 'left' || direction === 'right' ? screenWidth : screenHeight;
          const initialOffset = direction === 'left' ? -slideDistance : 
                              direction === 'right' ? slideDistance :
                              direction === 'up' ? -slideDistance : slideDistance;
          
          if (direction === 'left' || direction === 'right') {
            translateX.value = initialOffset;
            translateX.value = withDelay(delay, withSpring(0, { damping: 15 }));
          } else {
            translateY.value = initialOffset;
            translateY.value = withDelay(delay, withSpring(0, { damping: 15 }));
          }
          break;

        case 'fade':
          opacity.value = 0;
          opacity.value = withDelay(delay, withTiming(1, animationConfig));
          break;

        case 'scale':
          scale.value = 0.8;
          opacity.value = 0;
          scale.value = withDelay(delay, withSpring(1, { damping: 12 }));
          opacity.value = withDelay(delay, withTiming(1, animationConfig));
          break;

        case 'flip':
          rotateY.value = 90;
          opacity.value = 0;
          rotateY.value = withDelay(delay, withSpring(0, { damping: 12 }));
          opacity.value = withDelay(delay, withTiming(1, animationConfig));
          break;

        case 'carousel':
          translateX.value = screenWidth;
          scale.value = 0.9;
          opacity.value = 0;
          translateX.value = withDelay(delay, withSpring(0, { damping: 15 }));
          scale.value = withDelay(delay, withSpring(1, { damping: 12 }));
          opacity.value = withDelay(delay, withTiming(1, animationConfig));
          break;
      }

      // Always animate opacity for entrance
      if (transition !== 'fade') {
        opacity.value = withDelay(delay, withTiming(1, animationConfig, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        }));
      }
    } else {
      // Exit animations
      switch (transition) {
        case 'slide':
          const slideDistance = direction === 'left' || direction === 'right' ? screenWidth : screenHeight;
          const exitOffset = direction === 'left' ? slideDistance : 
                           direction === 'right' ? -slideDistance :
                           direction === 'up' ? slideDistance : -slideDistance;
          
          if (direction === 'left' || direction === 'right') {
            translateX.value = withTiming(exitOffset, animationConfig);
          } else {
            translateY.value = withTiming(exitOffset, animationConfig);
          }
          break;

        case 'scale':
          scale.value = withTiming(0.8, animationConfig);
          break;

        case 'flip':
          rotateY.value = withTiming(-90, animationConfig);
          break;

        case 'carousel':
          translateX.value = withTiming(-screenWidth, animationConfig);
          scale.value = withTiming(0.9, animationConfig);
          break;
      }

      opacity.value = withTiming(0, animationConfig, (finished) => {
        if (finished && onAnimationComplete) {
          runOnJS(onAnimationComplete)();
        }
      });
    }
  }, [isVisible, transition, direction, delay, effectiveDuration, shouldReduceMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const transform = [];
    
    if (translateX.value !== 0) {
      transform.push({ translateX: translateX.value });
    }
    if (translateY.value !== 0) {
      transform.push({ translateY: translateY.value });
    }
    if (scale.value !== 1) {
      transform.push({ scale: scale.value });
    }
    if (rotateY.value !== 0) {
      transform.push({ rotateY: `${rotateY.value}deg` });
    }

    return {
      opacity: opacity.value,
      transform,
    };
  });

  if (!isVisible && opacity.value === 0) {
    return null;
  }

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// Staggered animation for lists
export const StaggeredList: React.FC<{
  children: React.ReactNode[];
  staggerDelay?: number;
  isVisible: boolean;
}> = ({ children, staggerDelay = 100, isVisible }) => {
  const { shouldReduceMotion } = useAccessibility();
  
  return (
    <>
      {children.map((child, index) => (
        <PageTransition
          key={index}
          isVisible={isVisible}
          transition={shouldReduceMotion() ? 'fade' : 'slide'}
          direction="up"
          delay={shouldReduceMotion() ? 0 : index * staggerDelay}
          duration={300}
        >
          {child}
        </PageTransition>
      ))}
    </>
  );
};

// Shared element transition
export const SharedElementTransition: React.FC<{
  children: React.ReactNode;
  sharedElementId: string;
  isActive: boolean;
}> = ({ children, sharedElementId, isActive }) => {
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      scale.value = withSequence(
        withSpring(1.05, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
      zIndex.value = 1000;
    } else {
      scale.value = withSpring(1, { damping: 12 });
      zIndex.value = 1;
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    zIndex: zIndex.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};