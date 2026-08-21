export default function Loading({ text = "Loading..." }) {
  return <div className="loading"><div><div className="spinner" /><p>{text}</p></div></div>;
}