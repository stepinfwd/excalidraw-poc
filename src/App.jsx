import React, { useEffect, useLayoutEffect, useState } from "react";
import rough from "roughjs/bundled/rough.esm";
import "./App.css";
import Toolbar from "./ToolBar";

const generator = rough.generator();

const createElement = (id, x1, y1, x2, y2, type) => {
  let roughElement;
  if (type === "line") {
    roughElement = generator.line(x1, y1, x2, y2);
  } else if (type === "rectangle") {
    roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
  } else if (type === "circle") {
    roughElement = generator.circle(x1, y1, x2 - x1, y2 - y1);
  } else if (type === "diamond") {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    const points = [
      [cx, cy - height / 2],
      [cx + width / 2, cy],
      [cx, cy + height / 2],
      [cx - width / 2, cy],
    ];
    roughElement = generator.polygon(points);
  }
  return { id, x1, y1, x2, y2, type, roughElement };
};

const nearPoint = (x, y, x1, y1, name) =>
  Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;

const distance = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

const positionWithinElement = (x, y, element) => {
  const { type, x1, y1, x2, y2 } = element;

  if (type === "rectangle") {
    const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
    return (
      nearPoint(x, y, x1, y1, "tl") ||
      nearPoint(x, y, x2, y1, "tr") ||
      nearPoint(x, y, x1, y2, "bl") ||
      nearPoint(x, y, x2, y2, "br") ||
      inside
    );
  }

  if (type === "line") {
    const a = { x: x1, y: y1 };
    const b = { x: x2, y: y2 };
    const c = { x, y };
    const offset = distance(a, b) - (distance(a, c) + distance(b, c));
    const inside = Math.abs(offset) < 1 ? "inside" : null;
    return (
      nearPoint(x, y, x1, y1, "start") ||
      nearPoint(x, y, x2, y2, "end") ||
      inside
    );
  }

  if (type === "circle") {
    const radiusX = Math.abs(x2 - x1) / 2;
    const radiusY = Math.abs(y2 - y1) / 2;
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const normalizedX = x - centerX;
    const normalizedY = y - centerY;

    const inside =
      normalizedX ** 2 / radiusX ** 2 + normalizedY ** 2 / radiusY ** 2 <= 1;

    return inside ? "inside" : null;
  }

  if (type === "diamond") {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const dx = Math.abs(x - cx);
    const dy = Math.abs(y - cy);
    const width = Math.abs(x2 - x1) / 2;
    const height = Math.abs(y2 - y1) / 2;
    return dx / width + dy / height <= 1 ? "inside" : null;
  }

  return null;
};

const getElementAtPosition = (x, y, elements) =>
  elements
    .map((el) => ({ ...el, position: positionWithinElement(x, y, el) }))
    .find((el) => el.position !== null);

const cursorForPosition = (position) => {
  switch (position) {
    case "tl":
    case "br":
    case "start":
    case "end":
      return "nwse-resize";
    case "tr":
    case "bl":
      return "nesw-resize";
    default:
      return "move";
  }
};

const resizedCoordinates = (clientX, clientY, position, coords) => {
  const { x1, y1, x2, y2 } = coords;
  switch (position) {
    case "tl":
    case "start":
      return { x1: clientX, y1: clientY, x2, y2 };
    case "tr":
      return { x1, y1: clientY, x2: clientX, y2 };
    case "bl":
      return { x1: clientX, y1, x2, y2: clientY };
    case "br":
    case "end":
      return { x1, y1, x2: clientX, y2: clientY };
    default:
      return null;
  }
};

const adjustElementCoordinates = (element) => {
  const { x1, y1, x2, y2, type } = element;
  if (type === "rectangle" || type === "diamond") {
    return {
      x1: Math.min(x1, x2),
      y1: Math.min(y1, y2),
      x2: Math.max(x1, x2),
      y2: Math.max(y1, y2),
    };
  } else {
    return x1 < x2 || (x1 === x2 && y1 < y2)
      ? { x1, y1, x2, y2 }
      : { x1: x2, y1: y2, x2: x1, y2: y1 };
  }
};

const useHistory = (initialState) => {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState([initialState]);

  const setState = (action, overwrite = false) => {
    const newState =
      typeof action === "function" ? action(history[index]) : action;
    if (overwrite) {
      const copy = [...history];
      copy[index] = newState;
      setHistory(copy);
    } else {
      const updated = [...history.slice(0, index + 1), newState];
      setHistory(updated);
      setIndex(index + 1);
    }
  };

  const undo = () => index > 0 && setIndex(index - 1);
  const redo = () => index < history.length - 1 && setIndex(index + 1);

  return [history[index], setState, undo, redo];
};

const App = () => {
  const [elements, setElements, undo, redo] = useHistory([]);
  const [tool, setTool] = useState("line");
  const [action, setAction] = useState("none");
  const [selectedElement, setSelectedElement] = useState(null);

  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const roughCanvas = rough.canvas(canvas);
    elements.forEach(({ roughElement }) => roughCanvas.draw(roughElement));
  }, [elements]);

  useEffect(() => {
    const listener = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.shiftKey ? redo() : undo();
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [undo, redo]);

  const updateElement = (id, x1, y1, x2, y2, type) => {
    const updated = createElement(id, x1, y1, x2, y2, type);
    const copy = [...elements];
    copy[id] = updated;
    setElements(copy, true);
  };

  const handleMouseDown = (e) => {
    const { clientX, clientY } = e;
    if (tool === "selection") {
      const el = getElementAtPosition(clientX, clientY, elements);
      if (el) {
        const offsetX = clientX - el.x1;
        const offsetY = clientY - el.y1;
        setSelectedElement({ ...el, offsetX, offsetY });
        setAction(el.position === "inside" ? "moving" : "resizing");
      }
    } else {
      const id = elements.length;
      const element = createElement(
        id,
        clientX,
        clientY,
        clientX,
        clientY,
        tool
      );
      setElements((prev) => [...prev, element]);
      setSelectedElement(element);
      setAction("drawing");
    }
  };

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;

    if (tool === "selection") {
      const el = getElementAtPosition(clientX, clientY, elements);
      e.target.style.cursor = el ? cursorForPosition(el.position) : "default";
    }

    if (action === "drawing") {
      const index = elements.length - 1;
      const { x1, y1 } = elements[index];
      updateElement(index, x1, y1, clientX, clientY, tool);
    } else if (action === "moving") {
      const { id, x1, y1, x2, y2, offsetX, offsetY, type } = selectedElement;
      const width = x2 - x1;
      const height = y2 - y1;
      const newX1 = clientX - offsetX;
      const newY1 = clientY - offsetY;
      updateElement(id, newX1, newY1, newX1 + width, newY1 + height, type);
    } else if (action === "resizing") {
      const { id, type, position, ...coords } = selectedElement;
      const { x1, y1, x2, y2 } = resizedCoordinates(
        clientX,
        clientY,
        position,
        coords
      );
      updateElement(id, x1, y1, x2, y2, type);
    }
  };

  const handleMouseUp = () => {
    if (selectedElement) {
      const index = selectedElement.id;
      const el = elements[index];
      if (action === "drawing" || action === "resizing") {
        const { x1, y1, x2, y2 } = adjustElementCoordinates(el);
        updateElement(index, x1, y1, x2, y2, el.type);
      }
    }
    setAction("none");
    setSelectedElement(null);
  };

  return (
    <div className="app-wrapper handdrawn">
      <Toolbar selectedTool={tool} setSelectedTool={setTool} />

      <div style={{ position: "fixed", bottom: 10, left: 10 }}>
        <button className="undo-redo" onClick={undo}>
          Undo
        </button>
        <button className="undo-redo" onClick={redo}>
          Redo
        </button>
      </div>
      <canvas
        id="canvas"
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
};

export default App;
