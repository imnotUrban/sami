"use client"

export function ConnectionStyles() {
  return (
    <style jsx global>{`
      .react-flow__handle {
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      
      .react-flow__node:hover .react-flow__handle {
        opacity: 1;
      }
      
      .react-flow__handle-connecting {
        opacity: 1 !important;
      }
      
      .react-flow__connection-line {
        stroke: #10b981;
        stroke-width: 2;
        stroke-dasharray: 5,5;
      }
      
      .react-flow__edge.react-flow__edge-step {
        stroke-width: 2;
      }
      
      .react-flow__edge {
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .react-flow__edge:hover {
        stroke-width: 3;
        filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.4));
      }
      
      .react-flow__edge.react-flow__edge-selected {
        stroke-width: 3;
        filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.6));
      }
      
      .react-flow__edge-label {
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .react-flow__edge-label:hover {
        transform: scale(1.05);
      }
    `}</style>
  )
} 