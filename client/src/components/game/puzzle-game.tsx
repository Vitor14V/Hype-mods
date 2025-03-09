
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PuzzlePiece {
  id: number;
  value: number;
  position: number;
}

export function PuzzleGame() {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [gameWon, setGameWon] = useState(false);
  const [moves, setMoves] = useState(0);
  
  // Inicializa o jogo
  const initGame = () => {
    const newPieces = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      value: i + 1,
      position: i
    }));
    
    // Adiciona o espaço vazio
    newPieces.push({ id: 0, value: 0, position: 8 });
    
    // Embaralha o quebra-cabeça
    shufflePieces(newPieces);
    
    setPieces(newPieces);
    setGameWon(false);
    setMoves(0);
  };
  
  // Embaralha as peças
  const shufflePieces = (pieces: PuzzlePiece[]) => {
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i].position, pieces[j].position] = [pieces[j].position, pieces[i].position];
    }
  };
  
  // Verifica se o jogo está completo
  const checkWin = (currentPieces: PuzzlePiece[]) => {
    for (let i = 0; i < currentPieces.length - 1; i++) {
      const piece = currentPieces.find(p => p.position === i);
      if (!piece || piece.value !== i + 1) {
        return false;
      }
    }
    return true;
  };
  
  // Move uma peça se possível
  const movePiece = (piece: PuzzlePiece) => {
    if (gameWon) return;
    
    const emptySpace = pieces.find(p => p.value === 0);
    if (!emptySpace) return;
    
    // Verifica se a peça está adjacente ao espaço vazio
    const piecePos = piece.position;
    const emptyPos = emptySpace.position;
    
    const rowSize = 3; // Tamanho da grade (3x3)
    const pieceRow = Math.floor(piecePos / rowSize);
    const pieceCol = piecePos % rowSize;
    const emptyRow = Math.floor(emptyPos / rowSize);
    const emptyCol = emptyPos % rowSize;
    
    // Movimento válido se estiver na mesma linha ou coluna e adjacente
    const isValid = 
      (pieceRow === emptyRow && Math.abs(pieceCol - emptyCol) === 1) ||
      (pieceCol === emptyCol && Math.abs(pieceRow - emptyRow) === 1);
    
    if (isValid) {
      const newPieces = [...pieces];
      
      // Troca as posições
      const pieceIndex = newPieces.findIndex(p => p.id === piece.id);
      const emptyIndex = newPieces.findIndex(p => p.value === 0);
      
      [newPieces[pieceIndex].position, newPieces[emptyIndex].position] = 
        [newPieces[emptyIndex].position, newPieces[pieceIndex].position];
      
      setPieces(newPieces);
      setMoves(moves + 1);
      
      // Verifica se o jogo foi ganho
      if (checkWin(newPieces)) {
        setGameWon(true);
      }
    }
  };
  
  // Inicializa o jogo quando o componente é montado
  useEffect(() => {
    initGame();
  }, []);
  
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Quebra-Cabeça Deslizante</h2>
        <p className="text-muted-foreground">
          Deslize as peças para ordená-las de 1 a 8
        </p>
        <div className="mt-2">
          <span className="font-medium">Movimentos: {moves}</span>
          {gameWon && (
            <div className="text-green-500 font-bold mt-2">
              Parabéns! Você venceu em {moves} movimentos!
            </div>
          )}
        </div>
      </div>
      
      <Card className="p-4 bg-card w-72 h-72">
        <div className="grid grid-cols-3 gap-2 w-full h-full">
          {Array.from({ length: 9 }).map((_, index) => {
            const piece = pieces.find(p => p.position === index);
            return (
              <div 
                key={index}
                className={`flex items-center justify-center rounded-md cursor-pointer
                  ${piece?.value === 0 ? 'bg-transparent' : 'bg-primary hover:bg-primary/80 transition-colors'}
                  ${gameWon ? 'bg-green-500 hover:bg-green-600' : ''}`}
                onClick={() => piece && piece.value !== 0 && movePiece(piece)}
              >
                {piece && piece.value !== 0 && (
                  <span className="text-xl font-bold text-primary-foreground">
                    {piece.value}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>
      
      <Button 
        className="mt-4" 
        onClick={initGame}
      >
        Reiniciar Jogo
      </Button>
    </div>
  );
}
