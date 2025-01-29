import React, { useRef, useEffect, useState } from 'react';
import { Trash2, Undo, Square, Circle, Pencil, Eraser, Sword, Shield, Users, Crosshair, Skull, Dumbbell } from 'lucide-react';

type DrawingTool = 'pencil' | 'eraser' | 'square' | 'circle' | 'icons';

interface Icon {
  id: string;
  x: number;
  y: number;
  type: string;
}

interface HistoryState {
  imageData: ImageData;
  icons: Icon[];
}

const WarStrategy = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [drawHistory, setDrawHistory] = useState<HistoryState[]>([]);
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pencil');
  const [currentColor, setCurrentColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(2);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [placedIcons, setPlacedIcons] = useState<Icon[]>([]);
  const [draggedIcon, setDraggedIcon] = useState<string | null>(null);

  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#ffffff'];

  const strategyIcons = [
    { id: 'ct', label: 'CT', icon: Dumbbell, color: '#ff9800' },
    { id: 'combo', label: 'Combo', icon: Sword, color: '#f44336' },
    { id: 'apoio', label: 'Apoio', icon: Users, color: '#4caf50' },
    { id: 'back_def', label: 'Back Def', icon: Shield, color: '#2196f3' },
    { id: 'kill_ct', label: 'Kill CT', icon: Crosshair, color: '#9c27b0' },
    { id: 'kill_ep', label: 'Kill EP', icon: Skull, color: '#607d8b' },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    setContext(ctx);

    // Carregar a imagem de fundo
    const image = new Image();
    image.src = '/images/campo_batalha.jpg';
    image.onload = () => {
      // Calcular as dimensões mantendo a proporção
      const maxWidth = 1024;
      const maxHeight = 768;
      let newWidth = image.width;
      let newHeight = image.height;
      
      if (newWidth > maxWidth) {
        newHeight = (maxWidth * newHeight) / newWidth;
        newWidth = maxWidth;
      }
      if (newHeight > maxHeight) {
        newWidth = (maxHeight * newWidth) / newHeight;
        newHeight = maxHeight;
      }

      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Limpar o canvas
      ctx.fillStyle = '#1e1e2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Desenhar a imagem
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      
      // Salvar o estado inicial
      const initialState = {
        imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
        icons: []
      };
      setDrawHistory([initialState]);
    };
    
    // Tratar erro de carregamento da imagem
    image.onerror = () => {
      console.error('Erro ao carregar a imagem');
      canvas.width = 1024;
      canvas.height = 768;
      ctx.fillStyle = '#1e1e2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const initialState = {
        imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
        icons: []
      };
      setDrawHistory([initialState]);
    };
  }, []);

  useEffect(() => {
    if (!context) return;
    context.strokeStyle = currentTool === 'eraser' ? '#1e1e2e' : currentColor;
    context.lineWidth = currentTool === 'eraser' ? brushSize * 2 : brushSize;
  }, [currentTool, currentColor, brushSize, context]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context || !canvasRef.current || currentTool === 'icons') return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (currentTool === 'pencil' || currentTool === 'eraser') {
      context.beginPath();
      context.moveTo(x, y);
    } else {
      setStartPos({ x, y });
      // Salvar o estado antes de começar a desenhar forma
      const currentState = {
        imageData: context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height),
        icons: placedIcons
      };
      setDrawHistory([...drawHistory, currentState]);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context || !canvasRef.current || currentTool === 'icons') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'pencil' || currentTool === 'eraser') {
      context.lineTo(x, y);
      context.stroke();
    } else if (startPos) {
      const lastState = drawHistory[drawHistory.length - 1];
      context.putImageData(lastState.imageData, 0, 0);
      renderIcons(lastState.icons);

      context.beginPath();
      if (currentTool === 'square') {
        const width = x - startPos.x;
        const height = y - startPos.y;
        context.rect(startPos.x, startPos.y, width, height);
      } else if (currentTool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2)
        );
        context.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      }
      context.stroke();
    }
  };

  const handleDragStart = (iconType: string) => {
    setCurrentTool('icons');
    setDraggedIcon(iconType);
  };

  const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    if (!draggedIcon || !canvasRef.current || !context) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newIcons = [...placedIcons, { id: `${draggedIcon}-${Date.now()}`, x, y, type: draggedIcon }];
    setPlacedIcons(newIcons);

    // Salvar estado após adicionar ícone
    const currentState = {
      imageData: context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height),
      icons: newIcons
    };
    setDrawHistory([...drawHistory, currentState]);
    setDraggedIcon(null);
  };

  const renderIcons = (icons: Icon[] = placedIcons) => {
    if (!context || !canvasRef.current) return;

    icons.forEach(icon => {
      const iconConfig = strategyIcons.find(i => i.id === icon.type);
      if (iconConfig) {
        context.save();
        context.fillStyle = iconConfig.color;
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2;
        
        // Desenhar um círculo de fundo
        context.beginPath();
        context.arc(icon.x, icon.y, 15, 0, 2 * Math.PI);
        context.fill();
        context.stroke();
        
        // Desenhar o texto do ícone
        context.fillStyle = '#ffffff';
        context.font = '12px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(iconConfig.label, icon.x, icon.y);
        
        context.restore();
      }
    });
  };

  useEffect(() => {
    if (!context || !canvasRef.current) return;
    const lastState = drawHistory[drawHistory.length - 1];
    if (lastState) {
      context.putImageData(lastState.imageData, 0, 0);
      renderIcons(lastState.icons);
    }
  }, [placedIcons]);

  const stopDrawing = () => {
    if (!isDrawing || !context || !canvasRef.current) return;
    setIsDrawing(false);
    context.closePath();
    setStartPos(null);

    if (currentTool === 'pencil' || currentTool === 'eraser') {
      const currentState = {
        imageData: context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height),
        icons: placedIcons
      };
      setDrawHistory([...drawHistory, currentState]);
    }
  };

  const handleUndo = () => {
    if (!context || !canvasRef.current || drawHistory.length <= 1) return;
    const newHistory = drawHistory.slice(0, -1);
    const lastState = newHistory[newHistory.length - 1];
    context.putImageData(lastState.imageData, 0, 0);
    setPlacedIcons(lastState.icons);
    setDrawHistory(newHistory);
  };

  const handleClear = () => {
    if (!context || !canvasRef.current || drawHistory.length === 0) return;
    const initialState = drawHistory[0];
    context.putImageData(initialState.imageData, 0, 0);
    setPlacedIcons([]);
    setDrawHistory([initialState]);
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="flex-1 flex gap-4 p-4">
        {/* Barra lateral de ícones */}
        <div className="flex flex-col gap-2 p-2 bg-gray-800 rounded-lg">
          <div className="text-white text-sm font-medium mb-2">Ícones</div>
          {strategyIcons.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(item.id)}
              className="w-10 h-10 flex items-center justify-center rounded-lg cursor-move hover:bg-gray-700"
              style={{ backgroundColor: item.color }}
              title={item.label}
            >
              <item.icon className="w-6 h-6 text-white" />
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col gap-4">
          {/* Barra de ferramentas */}
          <div className="flex gap-4 mb-2">
            {/* Ferramentas de desenho */}
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentTool('pencil')} 
                title="Lápis"
                className={`p-2 text-white hover:bg-gray-700 rounded-lg ${currentTool === 'pencil' ? 'bg-gray-700' : ''}`}
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentTool('eraser')} 
                title="Borracha"
                className={`p-2 text-white hover:bg-gray-700 rounded-lg ${currentTool === 'eraser' ? 'bg-gray-700' : ''}`}
              >
                <Eraser className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentTool('square')} 
                title="Quadrado"
                className={`p-2 text-white hover:bg-gray-700 rounded-lg ${currentTool === 'square' ? 'bg-gray-700' : ''}`}
              >
                <Square className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentTool('circle')} 
                title="Círculo"
                className={`p-2 text-white hover:bg-gray-700 rounded-lg ${currentTool === 'circle' ? 'bg-gray-700' : ''}`}
              >
                <Circle className="w-5 h-5" />
              </button>
            </div>

            {/* Cores */}
            <div className="flex gap-1 items-center">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setCurrentColor(color)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    currentColor === color ? 'border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Cor ${color}`}
                />
              ))}
            </div>

            {/* Tamanho do pincel */}
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">Tamanho:</span>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-24"
              />
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              <button 
                onClick={handleUndo} 
                title="Desfazer" 
                className="p-2 text-white hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={drawHistory.length <= 1}
              >
                <Undo className="w-5 h-5" />
              </button>
              <button 
                onClick={handleClear} 
                title="Limpar" 
                className="p-2 text-white hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={drawHistory.length <= 1}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Canvas */}
          <div className="flex-1 relative flex justify-center">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="cursor-crosshair border border-gray-700 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarStrategy;
