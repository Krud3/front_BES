export function HomePage() {
  return (
    <article className="flex flex-col gap-10 max-w-prose">
      <section className="flex flex-col gap-4">
        <h1 className="font-display text-4xl font-normal tracking-tight text-foreground">
          SiLEnSeSS
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          A simulation platform for opinion dynamics research, built for the PROMUEVA
          research group at Universidad del Valle.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-normal text-foreground">Introduction</h2>
        <p className="text-muted-foreground leading-relaxed">
          Opinion dynamics studies how individual beliefs evolve through social interaction.
          SiLEnSeSS lets researchers configure agent networks, choose an update rule, and
          observe how opinion distributions shift over time — all without writing code.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          The platform currently implements two foundational models: the <strong>DeGroot</strong> averaging
          model and the <strong>Spiral of Silence</strong> suppression model. Both run on
          configurable network topologies and expose per-iteration data for analysis.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-normal text-foreground">Examples</h2>
        <p className="text-muted-foreground leading-relaxed">
          The following scenarios illustrate the kinds of questions SiLEnSeSS can help answer.
        </p>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h3 className="font-sans font-semibold text-foreground">Consensus under DeGroot</h3>
            <p className="text-muted-foreground leading-relaxed">
              A 500-agent Barabási–Albert network with uniform influence weights converges to
              a shared opinion within ~300 iterations. Hub nodes dominate early; peripheral
              agents follow after sufficient exposure.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-sans font-semibold text-foreground">Silencing cascade</h3>
            <p className="text-muted-foreground leading-relaxed">
              In a polarized Erdős–Rényi network calibrated with 2022 Colombian election data,
              the minority cluster begins suppressing its opinion at iteration 80, producing a
              cascade that amplifies the majority position far beyond its initial share.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
