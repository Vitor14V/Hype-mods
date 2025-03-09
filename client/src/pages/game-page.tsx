
import { PuzzleGame } from "@/components/game/puzzle-game";
import { Sidebar } from "@/components/ui/sidebar";

export default function GamePage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-[240px] p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Mini-Game
          </h1>
          <div className="flex justify-center">
            <PuzzleGame />
          </div>
          <div className="mt-12 p-6 bg-card rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Como Jogar</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>O objetivo é ordenar os números de 1 a 8, movendo uma peça por vez.</li>
              <li>Você só pode mover peças para o espaço vazio.</li>
              <li>Uma peça só pode ser movida se estiver adjacente ao espaço vazio.</li>
              <li>O jogo é concluído quando todos os números estão em ordem crescente.</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
