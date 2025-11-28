import { useMemo } from 'react';
import { useNetworkStore } from '../../store/networkStore';
import styles from './HUD.module.css';

export function MetricsDisplay() {
  const { snapshot, metricsHistory } = useNetworkStore();
  
  const currentLoss = snapshot?.loss ?? 0;
  const currentAccuracy = snapshot?.accuracy ?? 0;
  const prediction = snapshot?.prediction ?? '-';
  const label = snapshot?.label ?? '-';
  const isCorrect = snapshot?.isCorrect ?? true;
  const epoch = snapshot?.epoch ?? 0;
  const batch = snapshot?.batch ?? 0;
  
  // Mini chart data
  const chartData = useMemo(() => {
    const maxPoints = 50;
    const losses = metricsHistory.losses.slice(-maxPoints);
    const accuracies = metricsHistory.accuracies.slice(-maxPoints);
    
    return { losses, accuracies };
  }, [metricsHistory]);
  
  return (
    <div className={styles.metricsPanel}>
      <h3 className={styles.panelTitle}>Metrics</h3>
      
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Epoch</span>
          <span className={styles.metricValue}>{epoch + 1}</span>
        </div>
        
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Batch</span>
          <span className={styles.metricValue}>{batch}</span>
        </div>
        
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Loss</span>
          <span className={styles.metricValue}>{currentLoss.toFixed(4)}</span>
        </div>
        
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Accuracy</span>
          <span className={styles.metricValue}>{(currentAccuracy * 100).toFixed(1)}%</span>
        </div>
      </div>
      
      <div className={styles.divider} />
      
      <div className={styles.predictionSection}>
        <h4 className={styles.sectionTitle}>Current Sample</h4>
        <div className={styles.predictionDisplay}>
          <div className={styles.predictionBox}>
            <span className={styles.predictionLabel}>True Label</span>
            <span className={styles.predictionDigit}>{label}</span>
          </div>
          <div className={styles.predictionArrow}>→</div>
          <div className={`${styles.predictionBox} ${isCorrect ? styles.correct : styles.incorrect}`}>
            <span className={styles.predictionLabel}>Predicted</span>
            <span className={styles.predictionDigit}>{prediction}</span>
          </div>
        </div>
        <div className={`${styles.resultBadge} ${isCorrect ? styles.correct : styles.incorrect}`}>
          {isCorrect ? '✓ Correct' : '✗ Wrong'}
        </div>
      </div>
      
      {/* Mini Loss Chart */}
      {chartData.losses.length > 0 && (
        <div className={styles.chartSection}>
          <h4 className={styles.sectionTitle}>Loss History</h4>
          <MiniChart data={chartData.losses} color="#00ffff" />
        </div>
      )}
      
      {/* Mini Accuracy Chart */}
      {chartData.accuracies.length > 0 && (
        <div className={styles.chartSection}>
          <h4 className={styles.sectionTitle}>Accuracy History</h4>
          <MiniChart data={chartData.accuracies} color="#00ff88" />
        </div>
      )}
    </div>
  );
}

interface MiniChartProps {
  data: number[];
  color: string;
}

function MiniChart({ data, color }: MiniChartProps) {
  const { path, maxVal, minVal } = useMemo(() => {
    if (data.length === 0) return { path: '', maxVal: 1, minVal: 0 };
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const width = 200;
    const height = 40;
    const padding = 2;
    
    const points = data.map((val, i) => {
      const x = padding + (i / (data.length - 1 || 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    });
    
    return {
      path: `M ${points.join(' L ')}`,
      maxVal: max,
      minVal: min,
    };
  }, [data]);
  
  return (
    <div className={styles.miniChart}>
      <svg viewBox="0 0 200 40" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Fill area */}
        <path
          d={`${path} L 198,38 L 2,38 Z`}
          fill={`url(#gradient-${color})`}
        />
        
        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className={styles.chartLabels}>
        <span>{minVal.toFixed(2)}</span>
        <span>{maxVal.toFixed(2)}</span>
      </div>
    </div>
  );
}

