"use client"
import { getBezierPath, type EdgeProps } from "reactflow"

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <path id={id} style={style} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd} />
      {data?.label && (
        <text>
          <textPath href={`#${id}`} style={{ fontSize: 12, fill: "#374151" }} startOffset="50%" textAnchor="middle">
            {data.label}
          </textPath>
        </text>
      )}
    </>
  )
} 