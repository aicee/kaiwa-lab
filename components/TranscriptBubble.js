export default function TranscriptBubble({ message }) {
  return <div className={`transcript-row ${message.speaker}`}>
    <span className="chat-avatar">{message.speaker === "ai" ? "花" : "YOU"}</span>
    <div><small>{message.speaker === "ai" ? "Kaiwa Lab Tutor" : "YOU"}</small><div className="chat-bubble"><p>{message.jp}</p></div></div>
  </div>;
}
