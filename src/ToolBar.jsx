import {
  Lock,
  Hand,
  MousePointer,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Pencil,
  Type,
  Image,
  Eraser,
  Shapes,
  Diamond,
} from "lucide-react";
import React from "react";

const tools = [
  //   { id: "lock", icon: Lock },
  //   { id: "hand", icon: Hand },
  { id: "selection", icon: MousePointer },
  { id: "rectangle", icon: Square },
  { id: "diamond", icon: Diamond },
  { id: "circle", icon: Circle },
  // { id: "arrow", icon: ArrowRight },
  { id: "line", icon: Minus },
  // { id: "draw", icon: Pencil },
  // { id: "text", icon: Type },
  // { id: "image", icon: Image },
  // { id: "erase", icon: Eraser },
  // { id: "shapes", icon: Shapes },
];

function Toolbar({ selectedTool, setSelectedTool }) {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center justify-center  gap-1 px-4 py-2 bg-white border border-gray-300 shadow-md rounded-xl">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isSelected = selectedTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={`p-2 rounded-lg hover:bg-gray-100 transition ${
                isSelected ? "bg-gray-200" : ""
              }`}
              title={tool.id}
            >
              <Icon className="w-5 h-5 text-gray-700" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
export default React.memo(Toolbar);
