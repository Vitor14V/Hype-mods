import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Download } from "lucide-react";
import type { Mod } from "@shared/schema";

interface ModCardProps {
  mod: Mod;
}

export function ModCard({ mod }: ModCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <div className="aspect-video relative">
        <img 
          src={mod.imageUrl} 
          alt={mod.title}
          className="object-cover w-full h-full"
        />
      </div>
      <CardHeader>
        <CardTitle className="text-xl font-bold">{mod.title}</CardTitle>
        <CardDescription className="line-clamp-2">{mod.description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          className="w-full"
          onClick={() => window.open(mod.downloadUrl, '_blank')}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
}
