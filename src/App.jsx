import React, { useCallback, useEffect, useRef, useState } from "react";
import rough from "roughjs";
import Toolbar from "./ToolBar";
import "./App.css";

const App = () => {
  const [selectedTool, setSelectedTool] = useState("line");
  const [elements, setElements] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef();
  const roughCanvasRef = useRef();

  useEffect(() => {
    // Initialize rough canvas once
    roughCanvasRef.current = rough.canvas(canvasRef.current);
  }, []);

  const renderElements = useCallback(() => {
    const context = canvasRef.current.getContext("2d");
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    elements.forEach(({ roughElement }) => {
      roughCanvasRef.current.draw(roughElement);
    });
  }, [elements]);

  useEffect(() => {
    renderElements();
  }, [elements]);

  const getRoughElement = (x1, y1, x2, y2) => {
    if (selectedTool === "line") {
      return roughCanvasRef.current.generator.line(x1, y1, x2, y2, {
        roughness: 1,
        strokeWidth: 2,
      });
    } else if (selectedTool === "rectangle") {
      return roughCanvasRef.current.generator.rectangle(
        x1,
        y1,
        x2 - x1,
        y2 - y1,
        {
          roughness: 1,
          strokeWidth: 2,
        }
      );
    } else if (selectedTool === "circle") {
      return roughCanvasRef.current.generator.circle(x1, y1, x2 - x1, y2 - y1, {
        roughness: 1,
        strokeWidth: 2,
      });
    } else if (selectedTool === "diamond") {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const width = Math.abs(x2 - x1);
      const height = Math.abs(y2 - y1);

      //t-p-b-l
      const points = [
        [cx, cy - height / 2],
        [cx + width / 2, cy],
        [cx, cy + height / 2],
        [cx - width / 2, cy],
      ];
      return roughCanvasRef.current.generator.polygon(points, {
        roughness: 1,
        strokeWidth: 2,
      });
    }
  };

  const createElement = (x1, y1, x2, y2) => {
    let roughElement = getRoughElement(x1, y1, x2, y2);

    return { x1, y1, x2, y2, roughElement };
  };

  const getCanvasCoordinates = (clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const onMouseDown = ({ clientX, clientY }) => {
    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(clientX, clientY);
    const element = createElement(x, y, x, y);
    setElements((prev) => [...prev, element]);
  };

  const onMouseMove = ({ clientX, clientY }) => {
    if (!isDrawing) return;

    const { x, y } = getCanvasCoordinates(clientX, clientY);
    const index = elements.length - 1;
    const { x1, y1 } = elements[index];
    const updatedPoint = createElement(x1, y1, x, y);

    setElements((prev) => {
      const newElements = [...prev];
      newElements[index] = updatedPoint;
      return newElements;
    });
  };

  const onMouseUp = () => {
    setIsDrawing(false);
  };

  return (
    <div className="app-wrapper handdrawn">
      <Toolbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
      <canvas
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        id="myCanvas"
        width={window.innerWidth}
        height={window.innerHeight}
        ref={canvasRef}
      ></canvas>
    </div>
  );
};

export default App;
