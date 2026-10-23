import React from "react";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Audio, Video } from "@remotion/media";
import { AbsoluteFill, Easing, Freeze, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";

const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext"] });

export const FPS = 30;
const INTRO = 3 * FPS;
const FIM = 2 * FPS;
const FAIXA = 108; // altura da faixa de legenda, abaixo da captura (nada é coberto)
const VELOCIDADE_MAX = 1.0; // sem aceleração: a narração e a ação real mandam no corte (a duração mínima pedida é 15 min)
const FOLGA_FALA = 0.5; // pausa depois de cada fala
const PAUSA_PREVIA = 7.5; // a pré-visualização de cada etapa fica parada na tela para dar tempo de conferir

const COR = { primaria: "#2563EB", texto: "#0F172A", secundario: "#475569", fundo: "#F8FAFC", faixa: "#0F172A" };
const suave = Easing.bezier(0.16, 1, 0.3, 1);

export interface Destaque { t: number; dur: number; rect: { x: number; y: number; w: number; h: number } }
export interface CenaResumo { id: string; etapa: string; inicio: number; fim: number; duracaoAudio: number; fala: string; /** instante da captura em que a pré-visualização está aberta (onde o vídeo para) */ congelar?: number }
export interface Etapa { id: string; titulo: string }
export interface DadosResumo {
  id: string;
  titulo: string;
  subtitulo: string;
  etapas: Etapa[];
  cenas: CenaResumo[];
  destaques: Destaque[];
}

/** Duração da cena no vídeo: acompanha a narração; só encurta (até 1,6x) o que a captura tem de sobra. */
const duracaoSegundos = (c: CenaResumo) => Math.max(c.duracaoAudio + FOLGA_FALA, (c.fim - c.inicio) / VELOCIDADE_MAX);
const velocidade = (c: CenaResumo) => Math.max(1, (c.fim - c.inicio) / duracaoSegundos(c));
const quadros = (c: CenaResumo) => Math.ceil(duracaoSegundos(c) * FPS);
const ehPrevia = (c: CenaResumo) => c.id.endsWith("previa") || c.id === "e7-final";
const quadrosPausa = (c: CenaResumo) => (ehPrevia(c) ? Math.ceil(PAUSA_PREVIA * FPS) : 0);

export const calcularDuracaoResumo = (d: DadosResumo) => INTRO + d.cenas.reduce((s, c) => s + quadros(c) + quadrosPausa(c), 0) + FIM;

const Abertura: React.FC<{ dados: DadosResumo }> = ({ dados }) => {
  const frame = useCurrentFrame();
  const a = (ini: number) => interpolate(frame, [ini, ini + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
  const sai = interpolate(frame, [INTRO - 8, INTRO], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: COR.fundo, fontFamily, alignItems: "center", justifyContent: "center", opacity: sai }}>
      <Img src={staticFile("weave-logo.png")} style={{ height: 70, opacity: a(0) }} />
      <div style={{ marginTop: 44, fontSize: 70, fontWeight: 700, color: COR.texto, opacity: a(8), textAlign: "center", maxWidth: 1500, lineHeight: 1.1 }}>{dados.titulo}</div>
      <div style={{ marginTop: 16, fontSize: 38, fontWeight: 500, color: COR.secundario, opacity: a(16) }}>{dados.subtitulo}</div>
    </AbsoluteFill>
  );
};

const Contorno: React.FC<{ d: Destaque; inicioCena: number; vel: number }> = ({ d, inicioCena, vel }) => {
  const frame = useCurrentFrame();
  const t = (frame / FPS) * vel + inicioCena; // tempo na captura
  if (t < d.t || t > d.t + d.dur) return null;
  const p = interpolate(t, [d.t, d.t + 0.25, d.t + d.dur - 0.3, d.t + d.dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulso = 1 + 0.03 * Math.sin(((t - d.t) * Math.PI * 2) / 0.9);
  const m = 8;
  return (
    <div
      style={{
        position: "absolute",
        left: d.rect.x - m,
        top: d.rect.y - m,
        width: d.rect.w + 2 * m,
        height: d.rect.h + 2 * m,
        border: `4px solid ${COR.primaria}`,
        borderRadius: 12,
        boxShadow: "0 0 0 3px rgba(255,255,255,0.85), 0 0 18px rgba(37,99,235,0.55)",
        opacity: p,
        scale: String(pulso),
      }}
    />
  );
};

const Faixa: React.FC<{ dados: DadosResumo; cena: CenaResumo; texto: string }> = ({ dados, cena, texto }) => {
  const indice = dados.etapas.findIndex((e) => e.id === cena.etapa);
  const etapa = dados.etapas[indice];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: FAIXA, background: COR.faixa, display: "flex", alignItems: "center", gap: 28, padding: "0 36px", fontFamily }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "none" }}>
        <span style={{ background: COR.primaria, color: "#fff", fontWeight: 700, fontSize: 26, borderRadius: 999, minWidth: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>{indice + 1}</span>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 28, whiteSpace: "nowrap" }}>{etapa?.titulo}</span>
      </div>
      <div style={{ flex: 1, color: "#E2E8F0", fontSize: 30, fontWeight: 500, lineHeight: 1.25, textAlign: "center", minHeight: 76, display: "flex", alignItems: "center", justifyContent: "center" }}>{texto}</div>
    </div>
  );
};

/** Frase da fala em exibição (tempo repartido pelo tamanho de cada frase, dentro da duração real do áudio). */
const fraseAtual = (cena: CenaResumo, segundos: number) => {
  const frases = cena.fala.match(/[^.!?]+[.!?]+/g)?.map((f) => f.trim()) ?? [cena.fala];
  const total = frases.reduce((s, f) => s + f.length, 0);
  let acumulado = 0;
  for (const texto of frases) {
    const ini = (acumulado / total) * cena.duracaoAudio;
    acumulado += texto.length;
    if (segundos < (acumulado / total) * cena.duracaoAudio + 0.2) return segundos >= ini ? texto : frases[0];
  }
  return segundos < cena.duracaoAudio + 0.8 ? frases[frases.length - 1] : "";
};

/** Um trecho de uma cena (a cena inteira, ou o pedaço antes/depois da pausa da pré-visualização). */
const Trecho: React.FC<{ dados: DadosResumo; cena: CenaResumo; de: number; ate: number; comAudio: boolean; primeiraDaEtapa: boolean }> = ({ dados, cena, de, ate, comAudio, primeiraDaEtapa }) => {
  const frame = useCurrentFrame();
  const vel = velocidade(cena);
  const texto = fraseAtual(cena, (de - cena.inicio) / vel + frame / FPS);
  const clareia = primeiraDaEtapa ? interpolate(frame, [0, 10], [1, 0], { extrapolateRight: "clamp" }) : 0;
  const lista = dados.destaques.filter((d) => d.t >= de - 0.01 && d.t < ate);
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 - FAIXA, overflow: "hidden" }}>
        <Video src={staticFile("suporte/video.mp4")} muted trimBefore={Math.round(de * FPS)} trimAfter={Math.round(ate * FPS)} playbackRate={vel} style={{ width: 1920, height: 1080 - FAIXA }} />
        {lista.map((d, i) => <Contorno key={i} d={d} inicioCena={de} vel={vel} />)}
        {vel > 1.25 && (
          <div style={{ position: "absolute", right: 20, bottom: 16, padding: "6px 14px", borderRadius: 999, background: "rgba(15,23,42,0.8)", color: "#fff", fontFamily, fontWeight: 600, fontSize: 22 }}>⏩ {vel.toFixed(1)}x</div>
        )}
      </div>
      <Faixa dados={dados} cena={cena} texto={texto} />
      {comAudio && <Audio src={staticFile(`suporte/audio/${cena.id}.wav`)} />}
      {primeiraDaEtapa && <AbsoluteFill style={{ background: "#fff", opacity: clareia }} />}
    </AbsoluteFill>
  );
};

/** Quadro final da pré-visualização, parado, com a legenda da etapa. */
const PausaPrevia: React.FC<{ dados: DadosResumo; cena: CenaResumo }> = ({ dados, cena }) => (
  <AbsoluteFill style={{ background: "#fff" }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 - FAIXA, overflow: "hidden" }}>
      <Freeze frame={0}>
        <Video src={staticFile("suporte/video.mp4")} muted trimBefore={Math.round((cena.congelar ?? cena.fim) * FPS)} trimAfter={Math.round((cena.congelar ?? cena.fim) * FPS) + 2} style={{ width: 1920, height: 1080 - FAIXA }} />
      </Freeze>
    </div>
    <Faixa dados={dados} cena={cena} texto="" />
  </AbsoluteFill>
);

export const ResumoSuporte: React.FC<{ dados: DadosResumo }> = ({ dados }) => {
  let de = INTRO;
  const blocos: React.ReactNode[] = [];
  dados.cenas.forEach((cena, i) => {
    const n = quadros(cena);
    const primeira = i === 0 || dados.cenas[i - 1].etapa !== cena.etapa;
    if (cena.congelar && quadrosPausa(cena) > 0) {
      // a pré-visualização aberta para um instante (pausa) e só depois a cena segue até o fechamento dela
      const a = Math.min(n, Math.max(1, Math.ceil((cena.congelar - cena.inicio) * FPS)));
      const pausa = quadrosPausa(cena);
      blocos.push(
        <Sequence key={`${cena.id}-a`} name={cena.id} from={de} durationInFrames={a}>
          <Trecho dados={dados} cena={cena} de={cena.inicio} ate={cena.congelar} comAudio primeiraDaEtapa={primeira} />
        </Sequence>,
        <Sequence key={`${cena.id}-p`} name={`${cena.id}-pausa`} from={de + a} durationInFrames={pausa}>
          <PausaPrevia dados={dados} cena={cena} />
        </Sequence>,
      );
      if (n - a > 0) {
        blocos.push(
          <Sequence key={`${cena.id}-b`} name={`${cena.id}-fim`} from={de + a + pausa} durationInFrames={n - a}>
            <Trecho dados={dados} cena={cena} de={cena.congelar} ate={cena.fim} comAudio={false} primeiraDaEtapa={false} />
          </Sequence>,
        );
      }
      de += n + pausa;
    } else {
      blocos.push(
        <Sequence key={cena.id} name={cena.id} from={de} durationInFrames={n}>
          <Trecho dados={dados} cena={cena} de={cena.inicio} ate={cena.fim} comAudio primeiraDaEtapa={primeira} />
        </Sequence>,
      );
      de += n;
    }
  });
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      <Sequence name="Abertura" from={0} durationInFrames={INTRO}><Abertura dados={dados} /></Sequence>
      {blocos}
      <Sequence name="Fim" from={de} durationInFrames={FIM}>
        <AbsoluteFill style={{ background: COR.fundo, fontFamily, alignItems: "center", justifyContent: "center" }}>
          <Img src={staticFile("weave-logo.png")} style={{ height: 64 }} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
