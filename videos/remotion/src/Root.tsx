import { Composition } from "remotion";
import resumo from "./data/resumo.json";
import videos from "./data/index.json";
import { calcularDuracaoResumo, ResumoSuporte, type DadosResumo } from "./ResumoSuporte";
import { calcularDuracao, FPS, PassoVideo, type DadosPasso } from "./PassoVideo";

export const RemotionRoot: React.FC = () => (
  <>
    {(resumo as DadosResumo).cenas.length > 0 && (
      <Composition
        id="suporte-instrumento-de-protesto"
        component={ResumoSuporte}
        width={1920}
        height={1080}
        fps={FPS}
        durationInFrames={calcularDuracaoResumo(resumo as DadosResumo)}
        defaultProps={{ dados: resumo as DadosResumo }}
      />
    )}
    {(videos as DadosPasso[]).map((dados) => (
      <Composition
        key={dados.id}
        id={dados.id}
        component={PassoVideo}
        width={1920}
        height={1080}
        fps={FPS}
        durationInFrames={calcularDuracao(dados)}
        defaultProps={{ dados }}
      />
    ))}
  </>
);
