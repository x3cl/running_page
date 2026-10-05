import {
  formatPace,
  titleForRun,
  formatRunTime,
  Activity,
  RunIds,
  getClimbCategory,
  isManualClimbRecord,
  isFitnessActivity,
  M_TO_DIST,
  M_TO_ELEV,
} from '@/utils/utils';
import { SHOW_ELEVATION_GAIN } from '@/utils/const';
import styles from './style.module.css';

interface IRunRowProperties {
  elementIndex: number;
  locateActivity: (_runIds: RunIds) => void;
  run: Activity;
  runIndex: number;
  setRunIndex: (_ndex: number) => void;
}

const RunRow = ({
  elementIndex,
  locateActivity,
  run,
  runIndex,
  setRunIndex,
}: IRunRowProperties) => {
  const climbCat = getClimbCategory(run);
  const isFitness = isFitnessActivity(run);
  const isManual = climbCat ? isManualClimbRecord(run) : false;

  const distance = isManual
    ? '-'
    : isFitness
    ? run.distance > 0
      ? (run.distance / M_TO_DIST).toFixed(2)
      : '-'
    : (run.distance / M_TO_DIST).toFixed(2);
  const paceParts = (climbCat || isFitness) ? null : (run.average_speed ? formatPace(run.average_speed) : null);
  const heartRate = run.average_heartrate;
  const runTime = isManual ? '手动打卡' : formatRunTime(run.moving_time);
  const handleClick = () => {
    if (runIndex === elementIndex) {
      setRunIndex(-1);
      locateActivity([]);
      return;
    }
    setRunIndex(elementIndex);
    locateActivity([run.run_id]);
  };

  return (
    <tr
      className={`${styles.runRow} ${runIndex === elementIndex ? styles.selected : ''}`}
      key={run.start_date_local}
      onClick={handleClick}
    >
      <td>
        {titleForRun(run)}
        {isFitness && (
          <span
            style={{
              marginLeft: '6px',
              padding: '1px 6px',
              fontSize: '10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(204, 255, 0, 0.15)',
              color: '#ccff00',
              border: '1px solid rgba(204, 255, 0, 0.35)',
              whiteSpace: 'nowrap',
            }}
          >
            🏋️ 室内健身
          </span>
        )}
        {climbCat === 'indoor_bouldering' && (
          <span
            style={{
              marginLeft: '6px',
              padding: '1px 6px',
              fontSize: '10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 204, 0, 0.15)',
              color: '#ffcc00',
              border: '1px solid rgba(255, 204, 0, 0.35)',
              whiteSpace: 'nowrap',
            }}
          >
            {isManual ? '🧗‍♂️ 抱石·打卡' : '🧗‍♂️ 抱石'}
          </span>
        )}
        {climbCat === 'indoor_climbing' && (
          <span
            style={{
              marginLeft: '6px',
              padding: '1px 6px',
              fontSize: '10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 106, 0, 0.15)',
              color: '#ff6a00',
              border: '1px solid rgba(255, 106, 0, 0.35)',
              whiteSpace: 'nowrap',
            }}
          >
            {isManual ? '🧗 室内高壁·打卡' : '🧗 室内攀岩'}
          </span>
        )}
        {climbCat === 'outdoor_climbing' && (
          <span
            style={{
              marginLeft: '6px',
              padding: '1px 6px',
              fontSize: '10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(0, 229, 255, 0.15)',
              color: '#00e5ff',
              border: '1px solid rgba(0, 229, 255, 0.35)',
              whiteSpace: 'nowrap',
            }}
          >
            {isManual ? '🧗‍♀️ 室外野攀·手动打卡' : '🧗‍♀️ 室外野攀'}
          </span>
        )}
      </td>
      <td>{distance}</td>
      {SHOW_ELEVATION_GAIN && (
        <td>{((run.elevation_gain ?? 0) * M_TO_ELEV).toFixed(1)}</td>
      )}
      {paceParts && <td>{paceParts}</td>}
      <td>{heartRate && heartRate.toFixed(0)}</td>
      <td>{runTime}</td>
      <td className={styles.runDate}>{run.start_date_local}</td>
    </tr>
  );
};

export default RunRow;
