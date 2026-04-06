export function WikiPage() {
  return (
    <article>
      <h2>Introduction</h2>
      <p>SiLEnSeSS is a simulation platform for opinion dynamics research developed by the PROMUEVA group at Univalle.</p>

      <h2>Opinion Dynamics</h2>
      <p>Opinion dynamics studies how individual beliefs evolve through social interaction over time.</p>

      <h3>Key Concepts</h3>
      <p>Agents, influence weights, convergence, and polarization are the core primitives of every model in this platform.</p>

      <h3>Why Simulate?</h3>
      <p>Analytical solutions are rarely available for large networks. Simulation lets researchers explore emergent behavior at scale.</p>

      <h2>Models</h2>
      <p>The platform currently supports two foundational opinion dynamics models.</p>

      <h3>DeGroot</h3>
      <p>The DeGroot model updates each agent's opinion as a weighted average of its neighbors' opinions. Under mild connectivity conditions, the network converges to a consensus.</p>

      <h3>Spiral of Silence</h3>
      <p>Agents suppress their opinion when they perceive themselves to be in the minority. This produces self-reinforcing silencing cascades that mirror real-world public discourse dynamics.</p>

      <h2>Network Types</h2>
      <p>Simulations can run on several graph topologies.</p>

      <h3>Erdős–Rényi</h3>
      <p>Random graphs where each pair of nodes is connected with probability p. Useful as a baseline.</p>

      <h3>Barabási–Albert</h3>
      <p>Scale-free networks grown by preferential attachment. Produces hubs similar to real social networks.</p>

      <h2>Glossary</h2>
      <p>Common terms used throughout the platform and its documentation.</p>
    </article>
  );
}
