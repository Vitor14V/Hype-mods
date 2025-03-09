import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { VolumeX, Volume2 } from "lucide-react";

export function CarnavalTheme() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // Efeito para criar o elemento de áudio
  useEffect(() => {
    // URL para uma música de samba/carnaval
    const audioElement = new Audio("https://docs.google.com/uc?export=download&id=1FjovpXCQtCmG3XkkYrHnhch_WHzI2ycO");
    audioElement.loop = true;
    setAudio(audioElement);

    // Limpar ao desmontar
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
      }
    };
  }, []);

  // Função para alternar o áudio
  const toggleAudio = () => {
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      // Iniciamos com volume baixo e aumentamos gradualmente
      audio.volume = 0.3;
      audio.play().catch(err => {
        console.error("Erro ao tocar música:", err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-4">
      <div className="relative p-4 bg-black/80 rounded-full overflow-hidden shadow-lg">
        <img src="/assets/carnaval.svg" alt="Carnaval Brasileiro" className="w-12 h-12" />
        
        {/* Efeito de pulsação em verde e amarelo */}
        <div className={`absolute inset-0 bg-gradient-to-r from-green-500 to-yellow-500 opacity-30 ${isPlaying ? 'animate-pulse' : ''}`} />
      </div>
      
      <div className="bg-black/80 rounded-full p-2 shadow-lg">
        <Button 
          onClick={toggleAudio} 
          variant="ghost" 
          size="icon" 
          className="text-white hover:text-primary hover:bg-black/30 transition-all"
          title={isPlaying ? "Parar música" : "Tocar música de carnaval"}
        >
          {isPlaying ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}