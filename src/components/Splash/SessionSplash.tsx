"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Splash } from "./Splash";

/**
 * Cobre o app enquanto o AuthContext restaura a sessão (Cognito ou demo).
 *
 * Fica no HTML do servidor de propósito: se dependesse da hidratação, a landing
 * já teria pintado e o usuário logado veria a página pública por um instante
 * antes de ser mandado para a home do papel. Quem não tem sessão guardada nem vê
 * o splash — o SessionScript marca `data-session="anon"` no <html> antes do
 * paint e o CSS esconde o overlay.
 *
 * Os filhos continuam montados por baixo (é um overlay, não um portão): a
 * landing segue renderizada no HTML para SEO e nada remonta ao sumir o splash.
 */
export function SessionSplash() {
  const { loading } = useAuth();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (loading) return;
    // Espera o fade antes de desmontar (mesma duração da transição no CSS).
    const timer = setTimeout(() => setDone(true), 260);
    return () => clearTimeout(timer);
  }, [loading]);

  if (done) return null;
  return <Splash boot fadingOut={!loading} />;
}

/**
 * Script inline anti-flash da sessão (mesma ideia do ThemeScript): antes do
 * primeiro paint, marca em <html> se existe sessão guardada — token do Cognito
 * (`CognitoIdentityServiceProvider.<clientId>.LastAuthUser`) ou sessão demo do
 * modo mocks. Sem sessão, o splash nunca aparece; na dúvida (erro ao ler o
 * storage), mantém o splash, que é o comportamento correto para quem está logado.
 */
export function SessionScript() {
  const js = `(function(){try{var f=false;for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(!k)continue;if((k.indexOf('CognitoIdentityServiceProvider.')===0&&k.indexOf('.LastAuthUser')>0)||k==='@aquarela:devSession'){f=true;break;}}document.documentElement.dataset.session=f?'restoring':'anon';}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
