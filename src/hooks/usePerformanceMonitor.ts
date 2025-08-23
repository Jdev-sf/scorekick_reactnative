import { useEffect, useRef, useState, useCallback } from 'react';
import { InteractionManager } from 'react-native';

interface PerformanceMetrics {
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
  frameDrops: number;
  jsExecutionTime: number;
}

interface PerformanceThresholds {
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
  frameDrops: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  renderTime: 100, // ms
  interactionTime: 50, // ms
  memoryUsage: 100 * 1024 * 1024, // 100MB
  frameDrops: 5, // per second
};

export const usePerformanceMonitor = (
  componentName: string,
  thresholds: Partial<PerformanceThresholds> = {}
) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    interactionTime: 0,
    memoryUsage: 0,
    frameDrops: 0,
    jsExecutionTime: 0,
  });

  const [warnings, setWarnings] = useState<string[]>([]);
  const renderStartTime = useRef<number>(0);
  const interactionStartTime = useRef<number>(0);
  const frameDropCounter = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);

  const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  // Start render timing
  const startRenderTiming = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  // End render timing
  const endRenderTiming = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    
    setMetrics(prev => ({ ...prev, renderTime }));
    
    if (renderTime > finalThresholds.renderTime) {
      setWarnings(prev => [
        ...prev,
        `${componentName}: Slow render detected (${renderTime.toFixed(2)}ms)`
      ]);
    }
  }, [componentName, finalThresholds.renderTime]);

  // Start interaction timing
  const startInteractionTiming = useCallback(() => {
    interactionStartTime.current = performance.now();
  }, []);

  // End interaction timing
  const endInteractionTiming = useCallback(() => {
    const interactionTime = performance.now() - interactionStartTime.current;
    
    setMetrics(prev => ({ ...prev, interactionTime }));
    
    if (interactionTime > finalThresholds.interactionTime) {
      setWarnings(prev => [
        ...prev,
        `${componentName}: Slow interaction detected (${interactionTime.toFixed(2)}ms)`
      ]);
    }
  }, [componentName, finalThresholds.interactionTime]);

  // Monitor frame drops
  useEffect(() => {
    let animationFrame: number;
    
    const checkFrameDrops = () => {
      const currentTime = performance.now();
      
      if (lastFrameTime.current > 0) {
        const frameDuration = currentTime - lastFrameTime.current;
        
        // Ideal frame duration is ~16.67ms (60fps)
        if (frameDuration > 33) { // More than 2 frames worth
          frameDropCounter.current++;
        }
      }
      
      lastFrameTime.current = currentTime;
      animationFrame = requestAnimationFrame(checkFrameDrops);
    };
    
    animationFrame = requestAnimationFrame(checkFrameDrops);
    
    // Check frame drops every second
    const frameDropInterval = setInterval(() => {
      const frameDrops = frameDropCounter.current;
      frameDropCounter.current = 0;
      
      setMetrics(prev => ({ ...prev, frameDrops }));
      
      if (frameDrops > finalThresholds.frameDrops) {
        setWarnings(prev => [
          ...prev,
          `${componentName}: Frame drops detected (${frameDrops} drops/sec)`
        ]);
      }
    }, 1000);
    
    return () => {
      cancelAnimationFrame(animationFrame);
      clearInterval(frameDropInterval);
    };
  }, [componentName, finalThresholds.frameDrops]);

  // Monitor memory usage
  useEffect(() => {
    const checkMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = memory.usedJSHeapSize;
        
        setMetrics(prev => ({ ...prev, memoryUsage }));
        
        if (memoryUsage > finalThresholds.memoryUsage) {
          setWarnings(prev => [
            ...prev,
            `${componentName}: High memory usage detected (${(memoryUsage / 1024 / 1024).toFixed(2)}MB)`
          ]);
        }
      }
    };
    
    const memoryInterval = setInterval(checkMemoryUsage, 5000);
    checkMemoryUsage(); // Initial check
    
    return () => clearInterval(memoryInterval);
  }, [componentName, finalThresholds.memoryUsage]);

  // Clear warnings
  const clearWarnings = useCallback(() => {
    setWarnings([]);
  }, []);

  // Get performance report
  const getPerformanceReport = useCallback(() => {
    return {
      componentName,
      metrics,
      warnings,
      timestamp: Date.now(),
    };
  }, [componentName, metrics, warnings]);

  // Log performance issues
  const logPerformanceIssues = useCallback(() => {
    if (warnings.length > 0) {
      console.warn(`Performance issues in ${componentName}:`, warnings);
    }
  }, [componentName, warnings]);

  return {
    metrics,
    warnings,
    startRenderTiming,
    endRenderTiming,
    startInteractionTiming,
    endInteractionTiming,
    clearWarnings,
    getPerformanceReport,
    logPerformanceIssues,
  };
};

// Hook for monitoring component lifecycle performance
export const useComponentPerformance = (componentName: string) => {
  const {
    startRenderTiming,
    endRenderTiming,
    metrics,
    warnings,
    getPerformanceReport,
  } = usePerformanceMonitor(componentName);

  // Monitor mount time
  useEffect(() => {
    startRenderTiming();
    
    // Use InteractionManager to measure after all interactions complete
    const interaction = InteractionManager.runAfterInteractions(() => {
      endRenderTiming();
    });
    
    return () => interaction.cancel();
  }, [startRenderTiming, endRenderTiming]);

  // Monitor re-render performance
  useEffect(() => {
    startRenderTiming();
    endRenderTiming();
  });

  return {
    metrics,
    warnings,
    getPerformanceReport,
  };
};

// Global performance manager
class PerformanceManager {
  private reports: any[] = [];
  private maxReports = 100;

  addReport(report: any) {
    this.reports.push(report);
    
    if (this.reports.length > this.maxReports) {
      this.reports.shift();
    }
  }

  getReports() {
    return this.reports;
  }

  getAverageMetrics() {
    if (this.reports.length === 0) return null;
    
    const sums = this.reports.reduce((acc, report) => {
      Object.keys(report.metrics).forEach(key => {
        acc[key] = (acc[key] || 0) + report.metrics[key];
      });
      return acc;
    }, {});
    
    const averages: any = {};
    Object.keys(sums).forEach(key => {
      averages[key] = sums[key] / this.reports.length;
    });
    
    return averages;
  }

  getSlowComponents() {
    return this.reports
      .filter(report => report.warnings.length > 0)
      .map(report => ({
        component: report.componentName,
        warnings: report.warnings,
        renderTime: report.metrics.renderTime,
      }))
      .sort((a, b) => b.renderTime - a.renderTime);
  }

  clearReports() {
    this.reports = [];
  }
}

export const performanceManager = new PerformanceManager();

// Hook to integrate with global performance manager
export const useGlobalPerformanceTracking = (componentName: string) => {
  const performance = usePerformanceMonitor(componentName);
  
  useEffect(() => {
    // Report performance data every 10 seconds
    const interval = setInterval(() => {
      const report = performance.getPerformanceReport();
      performanceManager.addReport(report);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [performance]);
  
  return performance;
};