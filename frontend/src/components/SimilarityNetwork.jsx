// Visualizes RAG similarity search: the new message as a central node,
// connected to past similar messages, with line thickness/opacity = similarity score.
function SimilarityNetwork({ message, matches }) {
  const width = 400;
  const height = 280;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 95;

  const truncate = (text, n) => (text && text.length > n ? text.slice(0, n) + '…' : text || '');

  const nodes = matches.map((m, i) => {
    const angle = (i / matches.length) * 2 * Math.PI - Math.PI / 2;
    return {
      ...m,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* connecting lines, drawn first so nodes sit on top */}
      {nodes.map((n, i) => (
        <line
          key={`line-${i}`}
          x1={cx}
          y1={cy}
          x2={n.x}
          y2={n.y}
          stroke="#5B7B8C"
          strokeWidth={1 + n.score * 6}
          opacity={0.25 + n.score * 0.6}
          strokeLinecap="round"
        />
      ))}

      {/* past-message nodes */}
      {nodes.map((n, i) => (
        <g key={`node-${i}`}>
          <title>{`"${n.text}" — ${Math.round(n.score * 100)}% similar`}</title>
          <circle cx={n.x} cy={n.y} r={30} fill="white" stroke="#5B7B8C" strokeWidth={1.5} />
          <text
            x={n.x}
            y={n.y - 2}
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
            fill="#5B7B8C"
            style={{ fontFamily: 'IBM Plex Mono' }}
          >
            {Math.round(n.score * 100)}%
          </text>
          <text
            x={n.x}
            y={n.y + 46}
            textAnchor="middle"
            fontSize="8.5"
            fill="#2B2620"
            style={{ fontFamily: 'Inter' }}
          >
            {truncate(n.text, 22)}
          </text>
        </g>
      ))}

      {/* central node = the message just logged */}
      <circle cx={cx} cy={cy} r={34} fill="#C9A227" />
      <title>{message}</title>
      <text
        x={cx}
        y={cy - 3}
        textAnchor="middle"
        fontSize="9"
        fontWeight="600"
        fill="#1F3D2B"
        style={{ fontFamily: 'Inter' }}
      >
        New
      </text>
      <text
        x={cx}
        y={cy + 9}
        textAnchor="middle"
        fontSize="9"
        fontWeight="600"
        fill="#1F3D2B"
        style={{ fontFamily: 'Inter' }}
      >
        message
      </text>
    </svg>
  );
}

export default SimilarityNetwork;
