export default function TranscriptBubble({ message, romaji, translation }) {
  return <div className={`transcript-row ${message.speaker}`}>
    <span className="chat-avatar">{message.speaker === "ai" ? "花" : "YOU"}</span>
    <div><small>{message.speaker === "ai" ? "Kaiwa Lab Tutor" : "YOU"}</small><div className="chat-bubble"><p>{message.jp}</p>{romaji && <i>{message.romaji}</i>}{translation && <span>{message.en}</span>}</div></div>
  </div>;
}
