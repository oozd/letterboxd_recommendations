import React, { useRef, useState, useEffect } from "react";
import { Button } from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import "../../styles/RadarChart.scss";

const GENRES = [
  { key: "Action", label: "Action" },
  { key: "Comedy", label: "Comedy" },
  { key: "Drama", label: "Drama" },
  { key: "Romance", label: "Romance" },
  { key: "Documentary", label: "Doc" },
  { key: "Horror", label: "Horror" },
  { key: "Sci-Fi", label: "Sci-Fi" },
  { key: "Thriller", label: "Thriller" },
];

const RadarChart = ({ weights, onChange, onReset }) => {
  const svgRef = useRef(null);
  const [activeAxis, setActiveAxis] = useState(null);
  const [hoveredAxis, setHoveredAxis] = useState(null);

  const cx = 160;
  const cy = 160;
  const R = 100;

  const getAngle = (index) => {
    return -Math.PI / 2 + (index * 2 * Math.PI) / GENRES.length;
  };

  // Handle pointer down (both mouse and touch)
  const handlePointerDown = (index, e) => {
    e.preventDefault();
    setActiveAxis(index);
  };

  useEffect(() => {
    if (activeAxis === null) return;

    const handlePointerMove = (e) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();

      let clientX, clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;

      // Map client pixels to SVG viewBox space (320x320)
      const svgX = (mouseX / rect.width) * 320;
      const svgY = (mouseY / rect.height) * 320;

      const dx = svgX - cx;
      const dy = svgY - cy;

      const angle = getAngle(activeAxis);
      // Project mouse coordinates onto the axis unit vector
      const distance = dx * Math.cos(angle) + dy * Math.sin(angle);

      // Map to weight scale [0, 10]
      const weight = Math.max(0, Math.min(10, (distance / R) * 10));
      const roundedWeight = Math.round(weight);

      onChange(GENRES[activeAxis].key, roundedWeight);
    };

    const handlePointerUp = () => {
      setActiveAxis(null);
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove, { passive: false });
    window.addEventListener("touchend", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [activeAxis, onChange]);

  // Construct concentric background octagon rings
  const gridRings = [2, 4, 6, 8, 10].map((level) => {
    const points = GENRES.map((_, i) => {
      const angle = getAngle(i);
      const r = (level / 10) * R;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
    return { points, level };
  });

  // Construct connecting lines for the 8 axes
  const axesLines = GENRES.map((genre, i) => {
    const angle = getAngle(i);
    const x = cx + R * Math.cos(angle);
    const y = cy + R * Math.sin(angle);
    return { x, y, key: genre.key };
  });

  // Construct current filled weight polygon points
  const activePolygonPoints = GENRES.map((genre, i) => {
    const angle = getAngle(i);
    const weight = weights[genre.key] !== undefined ? weights[genre.key] : 5;
    const r = (weight / 10) * R;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(" ");

  // Coordinates for labels and handles
  const labelPositions = GENRES.map((genre, i) => {
    const angle = getAngle(i);
    const labelDist = R + 22;
    const x = cx + labelDist * Math.cos(angle);
    const y = cy + labelDist * Math.sin(angle);

    let textAnchor = "middle";
    if (Math.cos(angle) > 0.1) textAnchor = "start";
    else if (Math.cos(angle) < -0.1) textAnchor = "end";

    let dy = "0.35em";
    if (Math.sin(angle) > 0.5) dy = "0.8em";
    else if (Math.sin(angle) < -0.5) dy = "-0.3em";

    const weight = weights[genre.key] !== undefined ? weights[genre.key] : 5;

    return { x, y, textAnchor, dy, label: genre.label, weight, key: genre.key };
  });

  const handlePositions = GENRES.map((genre, i) => {
    const angle = getAngle(i);
    const weight = weights[genre.key] !== undefined ? weights[genre.key] : 5;
    const r = (weight / 10) * R;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y, key: genre.key, index: i, weight };
  });

  return (
    <div className="radar-chart-container">
      <div className="radar-chart-header">
        <h3 className="radar-chart-title">Tune Genre Weights</h3>
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          startIcon={<RestartAltIcon />}
          onClick={onReset}
          className="radar-reset-button"
        >
          Reset
        </Button>
      </div>
      <p className="radar-chart-subtitle">
        Drag vertices to adjust weights (0-10). Neutral is 5.
      </p>

      <div className="radar-svg-wrapper">
        <svg viewBox="0 0 320 320" ref={svgRef} className="radar-svg">
          {/* Background Concentric Octagons */}
          {gridRings.map((ring, index) => (
            <polygon
              key={`ring-${index}`}
              points={ring.points}
              className={`grid-ring grid-ring-${ring.level}`}
            />
          ))}

          {/* Grid Axes Lines */}
          {axesLines.map((axis, index) => (
            <line
              key={`axis-${index}`}
              x1={cx}
              y1={cy}
              x2={axis.x}
              y2={axis.y}
              className="grid-axis-line"
            />
          ))}

          {/* Active Filled Area Polygon */}
          <polygon points={activePolygonPoints} className="radar-active-area" />

          {/* Text Labels for Genres */}
          {labelPositions.map((label, index) => (
            <text
              key={`label-${index}`}
              x={label.x}
              y={label.y}
              textAnchor={label.textAnchor}
              dy={label.dy}
              className={`radar-label ${
                hoveredAxis === index || activeAxis === index ? "active" : ""
              }`}
            >
              {label.label} <tspan className="weight-num">{label.weight.toFixed(1)}</tspan>
            </text>
          ))}

          {/* Interactive Drag Handles */}
          {handlePositions.map((handle, index) => {
            const isHovered = hoveredAxis === index;
            const isActive = activeAxis === index;
            return (
              <g
                key={`handle-group-${index}`}
                onMouseEnter={() => setHoveredAxis(index)}
                onMouseLeave={() => setHoveredAxis(null)}
                onMouseDown={(e) => handlePointerDown(index, e)}
                onTouchStart={(e) => handlePointerDown(index, e)}
                style={{ cursor: "pointer" }}
              >
                {/* Visible handle outline/glow on hover/active */}
                {(isHovered || isActive) && (
                  <circle
                    cx={handle.x}
                    cy={handle.y}
                    r={12}
                    className="handle-glow"
                  />
                )}
                {/* Visible handle center */}
                <circle
                  cx={handle.x}
                  cy={handle.y}
                  r={isHovered || isActive ? 8 : 6}
                  className={`handle-point ${isActive ? "dragging" : ""}`}
                />
                {/* Large transparent interactive hit target */}
                <circle
                  cx={handle.x}
                  cy={handle.y}
                  r={18}
                  fill="transparent"
                  className="handle-hitbox"
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default RadarChart;
