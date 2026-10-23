import { loadFont } from "@remotion/google-fonts/Inter";
import { Audio, Video } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";

const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext"] });

export const FPS = 30;
const INTRO = 4 * FPS;
const OUTRO = 4 * FPS;

/** Tokens do design-weave.md */
const COR = {
  primaria: "#2563EB",
  primariaSutil: "#EFF6FF",
  texto: "#0F172A",
  textoSecundario: "#475569",
  fundo: "#F8FAFC",
  borda: "#E2E8F0",
};

export interface DadosCena {
  id: string;
  inicio: number;
  fim: number;
  duracaoAudio: number;
  fala: string;
  /** trechos longos e repetitivos passam acelerados (ex.: 4 = quatro vezes mais rápido) */
  rapido?: number;
}

export interface DadosPasso {
  id: string;
  passo: number;
  titulo: string;
  proximo: string;
  duracaoVideo: number;
  cenas: DadosCena[];
}

/** Duração da cena no vídeo final: a captura (÷ velocidade), nunca menor que a narração. */
const duracaoCena = (c: DadosCena) => Math.ceil(Math.max((c.fim - c.inicio) / (c.rapido ?? 1), c.rapido ? c.duracaoAudio + 0.8 : 0) * FPS);
const duracaoCapturas = (d: DadosPasso) => d.cenas.reduce((soma, c) => soma + duracaoCena(c), 0);

export const calcularDuracao = (d: DadosPasso) => INTRO + duracaoCapturas(d) + OUTRO;

const suave = Easing.bezier(0.16, 1, 0.3, 1);

const Abertura: React.FC<{ dados: DadosPasso }> = ({ dados }) => {
  const frame = useCurrentFrame();
  const aparece = (inicio: number) =>
    interpolate(frame, [inicio, inicio + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
  const sobe = (inicio: number) =>
    interpolate(frame, [inicio, inicio + 24], [28, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
  const sai = interpolate(frame, [INTRO - 12, INTRO], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: COR.fundo, fontFamily, alignItems: "center", justifyContent: "center", opacity: sai }}>
      <Img src={staticFile("weave-logo.png")} style={{ height: 84, opacity: aparece(0), translate: `0 ${sobe(0)}px` }} />
      <div style={{ marginTop: 64, fontSize: 30, fontWeight: 600, color: COR.primaria, letterSpacing: 2, textTransform: "uppercase", opacity: aparece(10), translate: `0 ${sobe(10)}px` }}>
        Montando um Instrumento de Protesto
      </div>
      <div style={{ marginTop: 18, fontSize: 84, fontWeight: 700, color: COR.texto, opacity: aparece(18), translate: `0 ${sobe(18)}px`, textAlign: "center", maxWidth: 1500, lineHeight: 1.1 }}>
        Passo {dados.passo}
      </div>
      <div style={{ marginTop: 14, fontSize: 52, fontWeight: 500, color: COR.textoSecundario, opacity: aparece(28), translate: `0 ${sobe(28)}px`, textAlign: "center", maxWidth: 1500 }}>
        {dados.titulo}
      </div>
    </AbsoluteFill>
  );
};

/** Divide a fala em frases e reparte o tempo da narração proporcionalmente ao tamanho de cada uma (tempo local da cena). */
const frasesDaCena = (cena: DadosCena) => {
  const frases = cena.fala.match(/[^.!?]+[.!?]+/g)?.map((f) => f.trim()) ?? [cena.fala];
  const total = frases.reduce((soma, f) => soma + f.length, 0);
  let acumulado = 0;
  return frases.map((texto) => {
    const inicio = (acumulado / total) * cena.duracaoAudio;
    acumulado += texto.length;
    return { texto, inicio, fim: (acumulado / total) * cena.duracaoAudio };
  });
};

const Legenda: React.FC<{ cena: DadosCena }> = ({ cena }) => {
  const frame = useCurrentFrame();
  const segundos = frame / FPS;
  const atual = frasesDaCena(cena).find((f) => segundos >= f.inicio && segundos < f.fim + 0.15);
  if (!atual) return null;
  const opacidade = interpolate(segundos, [atual.inicio, atual.inicio + 0.2, atual.fim - 0.1, atual.fim + 0.1], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 54, fontFamily }}>
      <div
        style={{
          maxWidth: 1500,
          padding: "18px 34px",
          borderRadius: 16,
          background: "rgba(15,23,42,0.86)",
          color: "#fff",
          fontSize: 38,
          fontWeight: 500,
          lineHeight: 1.35,
          textAlign: "center",
          opacity: opacidade,
        }}
      >
        {atual.texto}
      </div>
    </AbsoluteFill>
  );
};

const Acelerado: React.FC<{ velocidade: number }> = ({ velocidade }) => (
  <div
    style={{
      position: "absolute",
      top: 22,
      right: 24,
      padding: "8px 18px",
      borderRadius: 999,
      background: COR.primaria,
      color: "#fff",
      fontFamily,
      fontWeight: 700,
      fontSize: 24,
      boxShadow: "0 4px 14px rgba(15,23,42,0.2)",
    }}
  >
    ⏩ {velocidade}x
  </div>
);

const Selo: React.FC<{ dados: DadosPasso }> = ({ dados }) => (
  <div
    style={{
      position: "absolute",
      top: 22,
      left: 24,
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 20px 10px 12px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.94)",
      border: `1px solid ${COR.borda}`,
      boxShadow: "0 4px 14px rgba(15,23,42,0.14)",
      fontFamily,
    }}
  >
    <span style={{ background: COR.primaria, color: "#fff", fontWeight: 700, fontSize: 22, borderRadius: 999, minWidth: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {dados.passo}
    </span>
    <span style={{ fontSize: 24, fontWeight: 600, color: COR.texto }}>{dados.titulo}</span>
  </div>
);

const Fechamento: React.FC<{ dados: DadosPasso }> = ({ dados }) => {
  const frame = useCurrentFrame();
  const entra = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", easing: suave });
  return (
    <AbsoluteFill style={{ background: COR.fundo, fontFamily, alignItems: "center", justifyContent: "center", opacity: entra }}>
      <div style={{ fontSize: 32, fontWeight: 600, color: COR.primaria, letterSpacing: 2, textTransform: "uppercase" }}>Próximo</div>
      <div style={{ marginTop: 20, fontSize: 64, fontWeight: 700, color: COR.texto, textAlign: "center", maxWidth: 1500 }}>{dados.proximo}</div>
      <Img src={staticFile("weave-logo.png")} style={{ height: 56, marginTop: 70, opacity: 0.9 }} />
    </AbsoluteFill>
  );
};

export const PassoVideo: React.FC<{ dados: DadosPasso }> = ({ dados }) => {
  let inicioCena = INTRO;
  const cenas = dados.cenas.map((cena) => {
    const duracao = duracaoCena(cena);
    const item = { cena, de: inicioCena, duracao };
    inicioCena += duracao;
    return item;
  });
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      <Sequence name="Abertura" from={0} durationInFrames={INTRO}>
        <Abertura dados={dados} />
      </Sequence>
      {cenas.map(({ cena, de, duracao }) => (
        <Sequence key={cena.id} name={cena.id} from={de} durationInFrames={duracao}>
          <Video
            src={staticFile(`${dados.id}/video.mp4`)}
            muted
            trimBefore={Math.round(cena.inicio * FPS)}
            trimAfter={Math.round(cena.fim * FPS)}
            playbackRate={cena.rapido ?? 1}
            style={{ width: 1920, height: 1080 }}
          />
          <Audio src={staticFile(`${dados.id}/audio/${cena.id}.wav`)} />
          <Selo dados={dados} />
          {cena.rapido && <Acelerado velocidade={cena.rapido} />}
          <Legenda cena={cena} />
        </Sequence>
      ))}
      <Sequence name="Próximo passo" from={inicioCena} durationInFrames={OUTRO}>
        <Fechamento dados={dados} />
      </Sequence>
    </AbsoluteFill>
  );
};
