import {
  formatPace,
  titleForRun,
  formatRunTime,
  Activity,
  RunIds,
} from '@/utils/utils';
import { SHOW_ELEVATION_GAIN } from '@/utils/const';
import { M_TO_DIST, M_TO_ELEV } from '@/utils/utils';
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
  const isZeroDist = !run.distance || run.distance === 0;
  const isZeroTime =
    !run.moving_time ||
    run.moving_time === '0:00:00' ||
    run.moving_time === '0';
  const name = (run.name || '').toLowerCase();
  const type = (run.type || '').toLowerCase();
  const isManualClimb =
    (type.includes('climb') ||
      type.includes('boulder') ||
      type.includes('mountaineering') ||
      name.includes('攀岩') ||
      name.includes('野攀') ||
      name.includes('抱石')) &&
    isZeroDist &&
    isZeroTime;

  const distance = isManualClimb ? '-' : (run.distance / M_TO_DIST).toFixed(2);
  const paceParts = run.average_speed ? formatPace(run.average_speed) : null;
  const heartRate = run.average_heartrate;
  const runTime = isManualClimb ? '手动打卡' : formatRunTime(run.moving_time);
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
        {isManualClimb && (
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
            手动打卡
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
