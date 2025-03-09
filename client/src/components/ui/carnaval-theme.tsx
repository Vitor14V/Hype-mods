import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export function CarnavalTheme() {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Criar elemento de áudio para música de fundo
    const audio = new Audio("/assets/carnaval.mp3");
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;

    // Exibir diálogo de ativação de áudio
    const timer = setTimeout(() => {
      setShowDialog(true);
    }, 1500);

    // Definir confetes animados no CSS
    const style = document.createElement("style");
    style.textContent = `
      @keyframes confetti-fall {
        0% {
          transform: translateY(-100vh) rotate(0);
          opacity: 1;
        }
        75% {
          opacity: 0.8;
        }
        100% {
          transform: translateY(100vh) rotate(360deg);
          opacity: 0;
        }
      }

      .confetti-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 1000;
        overflow: hidden;
      }

      .confetti {
        position: absolute;
        width: 10px;
        height: 20px;
        background-color: var(--confetti-color);
        border-radius: 0;
        animation: confetti-fall var(--fall-duration) linear forwards;
        opacity: 0.8;
      }

      body::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40z' fill='%23F0A202' fill-opacity='0.05'/%3E%3C/svg%3E");
        pointer-events: none;
        z-index: -1;
        opacity: 0.5;
      }
    `;
    document.head.appendChild(style);

    // Adicionar o container de confete ao corpo
    const confettiContainer = document.createElement("div");
    confettiContainer.className = "confetti-container";
    document.body.appendChild(confettiContainer);

    // Gerar confetes
    const colors = [
      "#FF4D6D", // Rosa vibrante
      "#FFCE00", // Amarelo
      "#00B4D8", // Azul turquesa
      "#02C39A", // Verde tropical
      "#F15BB5", // Pink
      "#9B5DE5", // Roxo
      "#00F5D4", // Turquesa brilhante
    ];

    for (let i = 0; i < 100; i++) {
      setTimeout(() => {
        if (!confettiContainer) return;
        
        const confetti = document.createElement("div");
        confetti.className = "confetti";
        
        // Posicionamento aleatório
        const startPositionX = Math.random() * window.innerWidth;
        confetti.style.left = `${startPositionX}px`;
        
        // Tamanho aleatório
        const size = Math.random() * 10 + 5;
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size * 2}px`;
        
        // Cor aleatória
        const color = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.setProperty("--confetti-color", color);
        
        // Duração da queda aleatória
        const duration = Math.random() * 5 + 5;
        confetti.style.setProperty("--fall-duration", `${duration}s`);
        
        // Rotação aleatória
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        confettiContainer.appendChild(confetti);
        
        // Remover após animação
        setTimeout(() => {
          if (confetti.parentNode) {
            confetti.parentNode.removeChild(confetti);
          }
        }, duration * 1000);
      }, Math.random() * 20000); // Espalhados ao longo de 20 segundos
    }

    return () => {
      // Limpar recursos
      clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (confettiContainer.parentNode) {
        confettiContainer.parentNode.removeChild(confettiContainer);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (audioEnabled) {
      audioRef.current.pause();
      toast({
        description: "Música de Carnaval desativada",
      });
    } else {
      audioRef.current.play().catch((error) => {
        console.error("Erro ao reproduzir áudio:", error);
        toast({
          title: "Erro de áudio",
          description: "Não foi possível iniciar a música de Carnaval",
          variant: "destructive",
        });
      });
      toast({
        description: "Música de Carnaval ativada!",
      });
    }
    setAudioEnabled(!audioEnabled);
  };

  const enableAudio = () => {
    if (!audioRef.current) return;
    
    audioRef.current.play().catch((error) => {
      console.error("Erro ao reproduzir áudio:", error);
    });
    setAudioEnabled(true);
    setShowDialog(false);
    toast({
      description: "Música de Carnaval ativada! Bom divertimento!",
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 rounded-full h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={toggleAudio}
        title={audioEnabled ? "Desativar música" : "Ativar música"}
      >
        {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bem-vindo ao Carnaval de Mods!</DialogTitle>
            <DialogDescription>
              Deseja ativar a música temática de Carnaval para uma experiência completa?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Não, obrigado
            </Button>
            <Button onClick={enableAudio}>
              Sim, ativar música
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}