export default function ProgressBar({ completed, total }) {
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="progress-panel">
      <div className="progress-labels">
        <span>Progress</span>
        <span>{percent}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
