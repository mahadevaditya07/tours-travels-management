export default function ErrorMessage({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="notice error">
      {message} {onRetry && <button onClick={onRetry} className="btn btn-secondary" style={{marginLeft: 10, padding: "7px 10px"}}>Retry</button>}
    </div>
  );
}