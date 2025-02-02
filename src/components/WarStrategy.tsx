import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pencil, Eraser, Square, Circle, Undo, Trash2 } from 'lucide-react';
import { strategyIcons } from '@/data/strategyIcons';

interface Icon {
  type: string;
  x: number;
  y: number;
}

interface DrawState {
  imageData: ImageData;
  icons: Icon[];
}

const WarStrategy = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [currentColor, setCurrentColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(2);
  const [currentTool, setCurrentTool] = useState<'pencil' | 'eraser' | 'square' | 'circle' | 'icons'>('pencil');
  const [drawHistory, setDrawHistory] = useState<DrawState[]>([]);
  const [placedIcons, setPlacedIcons] = useState<Icon[]>([]);
  const [draggedIcon, setDraggedIcon] = useState<string | null>(null);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#ffffff'];

  const renderIcons = useCallback((icons: Icon[] = placedIcons) => {
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
  }, [context, placedIcons]); // Removido strategyIcons das dependências

  const saveToHistory = useCallback(() => {
    if (!context || !canvasRef.current) return;
    
    const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    const newState: DrawState = {
      imageData,
      icons: [...placedIcons]
    };
    
    setDrawHistory(prev => [...prev.slice(0, historyIndex + 1), newState]);
    setHistoryIndex(prev => prev + 1);
  }, [context, canvasRef, placedIcons, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0 || !context || !canvasRef.current) return;
    
    const previousState = drawHistory[historyIndex - 1];
    context.putImageData(previousState.imageData, 0, 0);
    setPlacedIcons(previousState.icons);
    setHistoryIndex(prev => prev - 1);
  }, [context, drawHistory, historyIndex]);

  const clearCanvas = useCallback(() => {
    if (!context || !canvasRef.current) return;
    
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setPlacedIcons([]);
    saveToHistory();
  }, [context, canvasRef, saveToHistory]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Erro ao obter contexto do canvas');
      setIsLoading(false);
      return;
    }

    setContext(ctx);
    setIsLoading(true);
    setError(null);

    // Definir dimensões iniciais
    canvas.width = 1024;
    canvas.height = 768;

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
      
      // Limpar o canvas com fundo branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Desenhar a imagem
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      
      // Salvar o estado inicial
      const initialState: DrawState = {
        imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
        icons: []
      };
      setDrawHistory([initialState]);
      setHistoryIndex(0);
      setIsLoading(false);
    };

    // Tratar erro de carregamento da imagem
    image.onerror = () => {
      setError('Erro ao carregar a imagem de fundo');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const initialState: DrawState = {
        imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
        icons: []
      };
      setDrawHistory([initialState]);
      setHistoryIndex(0);
      setIsLoading(false);
    };
  }, []);

  useEffect(() => {
    if (!context) return;
    context.lineWidth = brushSize;
    context.strokeStyle = currentColor;
  }, [context, brushSize, currentColor]);

  useEffect(() => {
    if (!context || drawHistory.length === 0) return;
    const lastItem = drawHistory[drawHistory.length - 1];
    context.putImageData(lastItem.imageData, 0, 0);
    renderIcons();
  }, [context, drawHistory, renderIcons]);

  useEffect(() => {
    if (historyIndex >= 0 && drawHistory[historyIndex]) {
      context?.putImageData(drawHistory[historyIndex].imageData, 0, 0);
      renderIcons(drawHistory[historyIndex].icons);
    }
  }, [context, historyIndex, drawHistory, renderIcons]);

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
      // Salvar o estado antes de começar a desenhar forma
      saveToHistory();
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
    } else {
      const lastState = drawHistory[drawHistory.length - 1];
      context.putImageData(lastState.imageData, 0, 0);
      renderIcons(lastState.icons);

      context.beginPath();
      if (currentTool === 'square') {
        const width = x - rect.left;
        const height = y - rect.top;
        context.rect(rect.left, rect.top, width, height);
      } else if (currentTool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(x - rect.left, 2) + Math.pow(y - rect.top, 2)
        );
        context.arc(rect.left, rect.top, radius, 0, 2 * Math.PI);
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
    saveToHistory();
  };

  const stopDrawing = () => {
    if (!isDrawing || !context || !canvasRef.current) return;
    setIsDrawing(false);
    context.closePath();

    if (currentTool === 'pencil' || currentTool === 'eraser') {
      saveToHistory();
    }
  };

  return (
    <div className="flex flex-col bg-gray-900">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <div className="text-white">Carregando...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <div className="text-red-500">{error}</div>
        </div>
      )}

      {/* Barra de ferramentas - Fixa no topo */}
      <div className="sticky top-0 z-10 flex gap-4 p-4 bg-gray-800">
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
            onClick={undo} 
            title="Desfazer" 
            className="p-2 text-white hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={historyIndex <= 0}
          >
            <Undo className="w-5 h-5" />
          </button>
          <button 
            onClick={clearCanvas} 
            title="Limpar" 
            className="p-2 text-white hover:bg-gray-700 rounded-lg"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Área do Canvas */}
      <div className="flex gap-4 p-4">
        {/* Barra lateral de ícones */}
        <div className="sticky top-24 flex flex-col gap-2 p-2 bg-gray-800 rounded-lg h-fit">
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

        {/* Canvas */}
        <div className="flex-1">
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
  );
};

export default WarStrategy;
