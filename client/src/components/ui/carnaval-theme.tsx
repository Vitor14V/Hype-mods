import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function CarnavalTheme() {
  const { toast } = useToast();

  useEffect(() => {
    // Definir animação do caminhão de festa
    const style = document.createElement("style");
    style.textContent = `
      @keyframes truck-drive {
        0% {
          transform: translateX(-150%);
        }
        100% {
          transform: translateX(150%);
        }
      }

      .festa-container {
        position: fixed;
        bottom: 20px;
        left: 0;
        width: 100%;
        height: 120px;
        pointer-events: none;
        z-index: 1000;
        overflow: hidden;
      }

      .truck-13 {
        position: absolute;
        width: 200px;
        height: 100px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 400'%3E%3Cstyle%3E.st0%7Bfill:%23FF9E1B;%7D .st1%7Bfill:%23E50000;%7D .st2%7Bfill:%23FFFFFF;%7D .st3%7Bfill:%23333;%7D .st4%7Bfill:%23999;%7D .st5%7Bfill:%236B4513;%7D%3C/style%3E%3Cg id='truck'%3E%3Cpath class='st0' d='M200,250 h400 v-100 h-200 l-50,-50 h-150 z' /%3E%3Cpath class='st1' d='M250,250 h350 v-80 h-190 l-40,-40 h-120 z' /%3E%3Crect class='st2' x='400' y='130' width='150' height='60' rx='5' ry='5' /%3E%3Ctext x='475' y='175' font-family='Arial' font-size='60' font-weight='bold' text-anchor='middle' class='st1'%3E13%3C/text%3E%3Ccircle class='st3' cx='250' cy='250' r='40' /%3E%3Ccircle class='st4' cx='250' cy='250' r='25' /%3E%3Ccircle class='st3' cx='550' cy='250' r='40' /%3E%3Ccircle class='st4' cx='550' cy='250' r='25' /%3E%3Crect class='st5' x='100' y='150' width='100' height='50' /%3E%3Crect class='st4' x='125' y='160' width='60' height='30' /%3E%3C/g%3E%3Cg id='decorations'%3E%3Cpath class='st2' d='M220,100 a80,40 0 1,0 160,0 a80,40 0 1,0 -160,0' /%3E%3Cpath class='st2' d='M400,100 a80,40 0 1,0 160,0 a80,40 0 1,0 -160,0' /%3E%3Cpath class='st2' d='M580,100 a80,40 0 1,0 160,0 a80,40 0 1,0 -160,0' /%3E%3C/g%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-size: contain;
        animation: truck-drive 15s linear infinite;
        bottom: 30px;
      }

      .light-flash {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: yellow;
        box-shadow: 0 0 10px 5px rgba(255, 255, 0, 0.7);
        animation: flash 0.5s alternate infinite;
      }

      @keyframes flash {
        0% { opacity: 0.3; }
        100% { opacity: 1; }
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

    // Adicionar o container e caminhão de festa
    const festaContainer = document.createElement("div");
    festaContainer.className = "festa-container";
    document.body.appendChild(festaContainer);

    // Adicionar o caminhão
    const truck = document.createElement("div");
    truck.className = "truck-13";
    festaContainer.appendChild(truck);

    // Adicionar luzes piscantes ao caminhão
    for (let i = 0; i < 6; i++) {
      const light = document.createElement("div");
      light.className = "light-flash";
      light.style.left = `${i * 30 + 20}px`;
      light.style.top = "20px";
      light.style.animationDelay = `${i * 0.1}s`;
      truck.appendChild(light);
    }

    // Notificação de boas-vindas
    setTimeout(() => {
      toast({
        title: "Bem-vindo à Festa dos Mods!",
        description: "Explore e divirta-se com nossa seleção de mods especiais!",
      });
    }, 1500);

    return () => {
      // Limpar recursos
      if (festaContainer.parentNode) {
        festaContainer.parentNode.removeChild(festaContainer);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [toast]);

  return null;
}