import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pencil, Square, Circle, Undo, Trash2, ArrowUp, Palette } from 'lucide-react';
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
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [currentTool, setCurrentTool] = useState<'pencil' | 'square' | 'circle' | 'arrow' | 'icons'>('pencil');
  const [drawHistory, setDrawHistory] = useState<DrawState[]>([]);
  const [placedIcons, setPlacedIcons] = useState<Icon[]>([]);
  const [draggedIcon, setDraggedIcon] = useState<string | null>(null);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const colors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#ffffff'];

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

    // Limpa o estado dos ícones
    setPlacedIcons([]);

    // Restaura o estado inicial do histórico
    if (drawHistory.length > 0) {
      const initialState = drawHistory[0];
      context.putImageData(initialState.imageData, 0, 0);
      setHistoryIndex(0);
      setDrawHistory([initialState]);
    }
  }, [context, canvasRef, drawHistory]);

  useEffect(() => {
    renderIcons();
  }, [placedIcons, renderIcons]);

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
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    
    context.beginPath();
    context.moveTo(startX, startY);
    context.strokeStyle = currentColor;
    context.lineWidth = brushSize;
    
    setStartPoint({ x: startX, y: startY });
  };

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context || !startPoint || !canvasRef.current) return;

    const currentPoint = {
      x: e.clientX - canvasRef.current.getBoundingClientRect().left,
      y: e.clientY - canvasRef.current.getBoundingClientRect().top
    };

    // Restaurar o último estado antes de desenhar
    if (drawHistory.length > 0) {
      const lastState = drawHistory[historyIndex];
      context.putImageData(lastState.imageData, 0, 0);
    }

    context.strokeStyle = currentColor;
    context.lineWidth = brushSize;

    if (currentTool === 'pencil') {
      context.lineTo(currentPoint.x, currentPoint.y);
      context.stroke();
    } else if (currentTool === 'square') {
      const width = currentPoint.x - startPoint.x;
      const height = currentPoint.y - startPoint.y;
      context.strokeRect(startPoint.x, startPoint.y, width, height);
    } else if (currentTool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(currentPoint.x - startPoint.x, 2) + Math.pow(currentPoint.y - startPoint.y, 2)
      );
      context.beginPath();
      context.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
      context.stroke();
    } else if (currentTool === 'arrow') {
      // Desenhar a seta
      const angle = Math.atan2(currentPoint.y - startPoint.y, currentPoint.x - startPoint.x);
      const headLength = 20; // Tamanho da ponta da seta

      // Linha principal da seta
      context.beginPath();
      context.moveTo(startPoint.x, startPoint.y);
      context.lineTo(currentPoint.x, currentPoint.y);
      context.stroke();

      // Ponta da seta
      context.beginPath();
      context.moveTo(currentPoint.x, currentPoint.y);
      context.lineTo(
        currentPoint.x - headLength * Math.cos(angle - Math.PI / 6),
        currentPoint.y - headLength * Math.sin(angle - Math.PI / 6)
      );
      context.moveTo(currentPoint.x, currentPoint.y);
      context.lineTo(
        currentPoint.x - headLength * Math.cos(angle + Math.PI / 6),
        currentPoint.y - headLength * Math.sin(angle + Math.PI / 6)
      );
      context.stroke();
    }
  }, [isDrawing, context, startPoint, currentColor, brushSize, currentTool, drawHistory, historyIndex]);

  const stopDrawing = () => {
    if (!isDrawing || !context || !canvasRef.current) return;
    setIsDrawing(false);
    context.closePath();
    saveToHistory();
    setStartPoint(null);
  };

  const handleDragStart = (iconType: string) => {
    setDraggedIcon(iconType);
  };

  const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    if (!draggedIcon || !canvasRef.current || !context) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newIcon = { type: draggedIcon, x, y };
    setPlacedIcons(prev => [...prev, newIcon]);
    renderIcons([...placedIcons, newIcon]); // Renderiza imediatamente
    saveToHistory();
    setDraggedIcon(null);
  };

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

      {/* Barra de Ferramentas */}
      <div className="flex gap-2 items-center mb-4">
        <div className="flex gap-2 bg-gray-800 p-2 rounded-lg">
          <button
            onClick={() => setCurrentTool('pencil')}
            title="Lápis"
            className={`p-2 text-white hover:bg-gray-700 rounded-lg ${currentTool === 'pencil' ? 'bg-gray-700' : ''}`}
          >
            <Pencil className="w-5 h-5" />
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
          <button
            onClick={() => setCurrentTool('arrow')}
            title="Seta"
            className={`p-2 text-white hover:bg-gray-700 rounded-lg ${currentTool === 'arrow' ? 'bg-gray-700' : ''}`}
          >
            <ArrowUp className="w-5 h-5 transform rotate-90" />
          </button>

          {/* Seletor de Cores */}
          <div className="relative">
            <button
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              title="Cores"
              className={`p-2 text-white hover:bg-gray-700 rounded-lg ${isColorPickerOpen ? 'bg-gray-700' : ''}`}
              style={{ borderBottom: `3px solid ${currentColor}` }}
            >
              <Palette className="w-5 h-5" />
            </button>

            {/* Menu Dropdown de Cores */}
            {isColorPickerOpen && (
              <div className="absolute top-full mt-2 -left-20 p-2 bg-gray-800 rounded-lg shadow-lg z-50">
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setCurrentColor(color);
                        setIsColorPickerOpen(false);
                      }}
                      className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform
                        ${currentColor === color ? 'border-white scale-110 ring-2 ring-blue-500' : 'border-gray-600'}`}
                      style={{ backgroundColor: color }}
                      title={color === '#000000' ? 'Preto' :
                             color === '#ff0000' ? 'Vermelho' :
                             color === '#00ff00' ? 'Verde' :
                             color === '#0000ff' ? 'Azul' :
                             color === '#ffff00' ? 'Amarelo' :
                             color === '#ff00ff' ? 'Rosa' :
                             'Branco'}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-700 mx-1" /> {/* Separador */}

          <button
            onClick={undo}
            title="Desfazer"
            className="p-2 text-white hover:bg-gray-700 rounded-lg"
            disabled={historyIndex === 0}
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

        {/* Controle de Tamanho */}
        <div className="flex items-center gap-2 bg-gray-800 p-2 rounded-lg">
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
      </div>

      {/* Área do Canvas */}
      <div className="flex gap-4 p-4 h-[calc(100vh-180px)]">
        {/* Barra lateral de ícones */}
        <div className="flex flex-col gap-2 p-2 bg-gray-800 rounded-lg h-fit">
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

        {/* Canvas Container */}
        <div className="flex-1 overflow-auto">
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
