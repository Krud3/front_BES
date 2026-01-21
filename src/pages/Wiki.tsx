import React, { useEffect } from "react";
import Header from "@/pages/landing/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: () => Promise<void>;
    };
  }
}

const Wiki: React.FC = () => {
  useEffect(() => {
    // Trigger MathJax to process the page after component mounts
    if (window.MathJax) {
      window.MathJax.typesetPromise?.();
    }
  }, []);

  const handleTabChange = (_value: string) => {
    // Use setTimeout to ensure the DOM has updated before MathJax processes
    setTimeout(() => {
      if (window.MathJax) {
        window.MathJax.typesetPromise?.();
      }
    }, 0);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8 mt-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <h1 className="font-display text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
            The Theory Behind SiLEnSeSS
          </h1>
          <p className="mt-6 text-lg tracking-tight text-muted-foreground">
            Welcome to the SiLEnSeSS Wiki. This simulator is built upon a
            powerful multi-agent model that extends classic opinion dynamics by
            incorporating a key social theory: the <strong className="text-foreground">Spiral of Silence</strong>.
          </p>
          <p className="mt-4 text-lg tracking-tight text-muted-foreground">
            This page breaks down the foundational logic and equations that
            power your simulations.
          </p>

          <Separator className="my-12" />

          {/* Section 1: The Classic Model */}
          <section id="degroot">
            <h2 className="font-display text-3xl font-medium tracking-tight text-foreground">
              The Starting Point: The Classic DeGroot Model
            </h2>
            <p className="mt-4 text-lg tracking-tight text-muted-foreground">
              Traditional models of opinion formation, like the DeGroot framework,
              are built on a simple, intuitive idea: agents update their
              opinions by taking a <strong className="text-foreground">weighted average</strong> of their neighbors'
              opinions.
            </p>
            <p className="mt-4 text-lg tracking-tight text-muted-foreground">
              The influence network is a graph where each agent <span dangerouslySetInnerHTML={{ __html: "\\(i\\)" }} /> has an
              opinion <span dangerouslySetInnerHTML={{ __html: "\\(B_{i}^{t}\\)" }} /> (a value, e.g., between 0 and 1) at a time <span dangerouslySetInnerHTML={{ __html: "\\(t\\)" }} />
              . The influence <span dangerouslySetInnerHTML={{ __html: "\\(j\\)" }} /> has on <span dangerouslySetInnerHTML={{ __html: "\\(i\\)" }} /> is represented by a
              weight <span dangerouslySetInnerHTML={{ __html: "\\(I_{ji}\\)" }} />.
            </p>
            <Card className="my-6 overflow-x-auto">
              <CardHeader>
                <CardTitle>The Classic DeGroot Update Equation</CardTitle>
                <CardDescription>
                  This equation (Eq. 1 in the paper) shows how agent <span dangerouslySetInnerHTML={{ __html: "\\(i\\)" }} />'s
                  opinion at the next time step (<span dangerouslySetInnerHTML={{ __html: "\\(t+1\\)" }} />) is calculated.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-xl md:text-2xl text-foreground">
                  <span dangerouslySetInnerHTML={{ __html: "$$B_{i}^{t+1} = \\sum_{j \\in N_{i} \\cup \\{i\\}} I_{ji} \\cdot B_{j}^{t}$$" }} />
                </p>
              </CardContent>
            </Card>
            <h3 className="font-display text-2xl font-medium tracking-tight text-foreground mt-8">
              The Key Limitation
            </h3>
            <p className="mt-4 text-lg tracking-tight text-muted-foreground">
              The DeGroot model assumes something that is often not true in the
              real world: <strong className="text-foreground">it assumes all agents express their opinions at
              every time step</strong>.
            </p>
            <p className="mt-4 text-lg tracking-tight text-muted-foreground">
              In reality, people may choose <em>not</em> to express their opinions,
              especially if they feel their view is in the minority. This
              is the core idea of the <strong className="text-foreground">Spiral of Silence</strong> theory, which
              posits that individuals fear social isolation and will remain
              silent rather than voice an opinion they perceive as unpopular.
            </p>
          </section>

          <Separator className="my-12" />

          {/* Section 2: The New Models (SOM and SOM+) */}
          <section id="som-models">
            <h2 className="font-display text-3xl font-medium tracking-tight text-foreground">
              Our Models: Integrating the Spiral of Silence
            </h2>
            <p className="mt-4 text-lg tracking-tight text-muted-foreground">
              To create a more realistic simulation, our models introduce the
              concept of a <strong className="text-foreground">silence state</strong> (<span dangerouslySetInnerHTML={{ __html: "\\(S_{i}^{t}\\)" }} />) for each agent.
              An agent can be either <strong className="text-foreground">speaking</strong> (<span dangerouslySetInnerHTML={{ __html: "\\(S_{i}^{t} = 1\\)" }} />) or <strong className="text-foreground">silent</strong> (<span dangerouslySetInnerHTML={{ __html: "\\(S_{i}^{t} = 0\\)" }} />).
            </p>
            <p className="mt-4 text-lg tracking-tight text-muted-foreground">
              An agent <span dangerouslySetInnerHTML={{ __html: "\\(i\\)" }} /> decides to speak at the next step (<span dangerouslySetInnerHTML={{ __html: "\\(t+1\\)" }} />) only if
              they perceive "enough" support from their neighbors. We
              define this with two parameters:
            </p>
            <ul className="list-disc list-inside mt-4 text-lg text-muted-foreground space-y-2">
              <li>
                <strong className="text-foreground">Tolerance Radius (<span dangerouslySetInnerHTML={{ __html: "\\(\\tau_{i}\\)" }} />):</strong> How "close"
                another opinion needs to be to <span dangerouslySetInnerHTML={{ __html: "\\(B_{i}^{t}\\)" }} /> for agent <span dangerouslySetInnerHTML={{ __html: "\\(i\\)" }} /> to
                consider it supportive.
              </li>
              <li>
                <strong className="text-foreground">Majority Threshold (<span dangerouslySetInnerHTML={{ __html: "\\(\\mathcal{M}_{i}\\)" }} />):</strong> The
                minimum <em>proportion</em> of neighbors that agent <span dangerouslySetInnerHTML={{ __html: "\\(i\\)" }} /> needs to
                perceive as supportive to be willing to speak.
              </li>
            </ul>
            <p className="mt-4 text-lg tracking-tight text-muted-foreground">
              This leads to two new families of models, which you can explore
              below.
            </p>

            {/* Tabs for SOM and SOM+ */}
            <Tabs defaultValue="som" className="w-full mt-8" onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="som">
                  SOM (Memoryless) Model
                </TabsTrigger>
                <TabsTrigger value="som-plus">
                  SOM+ (Memory-based) Model
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: SOM Content */}
              <TabsContent value="som">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <span dangerouslySetInnerHTML={{ __html: "\\(SOM^{-}\\)" }} />: Silence Opinion Memoryless
                    </CardTitle>
                    <CardDescription>
                      In this model, silent agents are simply ignored.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="text-xl font-semibold text-foreground">
                        Core Idea
                      </h4>
                      <p className="text-md text-muted-foreground mt-2">
                        When an agent updates their opinion, they <em>only</em>{" "}
                        average the opinions of their neighbors who are{" "}
                        <strong className="text-foreground">currently speaking</strong>. The opinions of silent
                        neighbors are discarded.
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xl font-semibold text-foreground">
                        Opinion Update (Eq. 2)
                      </h4>
                      <p className="text-center text-lg md:text-xl my-4 text-foreground">
                        <span dangerouslySetInnerHTML={{ __html: "$$B_{i}^{t+1} = B_{i}^{t} + \\sum_{j \\in N_{i}} I_{ji} \\cdot S_{j}^{t} \\cdot (B_{j}^{t} - B_{i}^{t})$$" }} />
                      </p>
                      <p className="text-md text-muted-foreground">
                        Notice the <span dangerouslySetInnerHTML={{ __html: "\\(S_{j}^{t}\\)" }} /> term. If agent <span dangerouslySetInnerHTML={{ __html: "\\(j\\)" }} /> is silent
                        (<span dangerouslySetInnerHTML={{ __html: "\\(S_{j}^{t} = 0\\)" }} />), their entire contribution to the
                        update becomes zero.
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xl font-semibold text-foreground">
                        Silence Update (Eq. 3)
                      </h4>
                      <p className="text-md text-muted-foreground mt-2">
                        An agent <span dangerouslySetInnerHTML={{ __html: "\\(i\\)" }} /> decides to speak (<span dangerouslySetInnerHTML={{ __html: "\\(S_{i}^{t+1} = 1\\)" }} />) if
                        the proportion of their <strong className="text-foreground">non-silent neighbors</strong>
                        (<span dangerouslySetInnerHTML={{ __html: "\\(N_{i}^{t}\\)" }} />) whose opinions are within their
                        tolerance <span dangerouslySetInnerHTML={{ __html: "\\(\\tau_{i}\\)" }} /> meets their majority threshold{" "}
                        <span dangerouslySetInnerHTML={{ __html: "\\(\\mathcal{M}_{i}\\)" }} />.
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xl font-semibold text-foreground">
                        Simulation Takeaway
                      </h4>
                      <p className="text-md text-muted-foreground mt-2">
                        This model shows how "bridge" agents —agents who
                        connect different community clusters— can become
                        perpetually silent, effectively splitting the network
                        and preventing a global consensus.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: SOM+ Content */}
              <TabsContent value="som-plus">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <span dangerouslySetInnerHTML={{ __html: "\\(SOM^{+}\\)" }} />: Silence Opinion Memory-based
                    </CardTitle>
                    <CardDescription>
                      In this model, agents <em>remember</em> the last known opinion
                      of silent agents.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="text-xl font-semibold text-foreground">
                        Core Idea
                      </h4>
                      <p className="text-md text-muted-foreground mt-2">
                        When an agent updates their opinion, they average{" "}
                        <em>all</em> neighbors. But for silent neighbors, they use
                        the <strong className="text-foreground">most recent opinion that neighbor expressed
                        publicly</strong>.
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xl font-semibold text-foreground">
                        Opinion Update (Eq. 5)
                      </h4>
                      <p className="text-center text-lg md:text-xl my-4 text-foreground">
                        <span dangerouslySetInnerHTML={{ __html: "$$B_{i}^{t+1} = B_{i}^{t} + \\sum_{j \\in N_{i}} I_{ji} \\cdot (pubB_{j}^{t} - B_{i}^{t})$$" }} />
                      </p>
                      <p className="text-md text-muted-foreground">
                        Here, <span dangerouslySetInnerHTML={{ __html: "\\(pubB_{j}^{t}\\)" }} /> represents the last <em>public
                        opinion</em> of agent <span dangerouslySetInnerHTML={{ __html: "\\(j\\)" }} />. This opinion is "sticky" and
                        continues to influence others even after <span dangerouslySetInnerHTML={{ __html: "\\(j\\)" }} /> goes
                        silent.
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xl font-semibold text-foreground">
                        Silence Update (Eq. 6)
                      </h4>
                      <p className="text-md text-muted-foreground mt-2">
                        An agent <span dangerouslySetInnerHTML={{ __html: "\\(i\\)" }} /> decides to speak (<span dangerouslySetInnerHTML={{ __html: "\\(S_{i}^{t+1} = 1\\)" }} />) by
                        comparing their <strong className="text-foreground">current private opinion</strong> (<span dangerouslySetInnerHTML={{ __html: "\\(B_{i}^{t}\\)" }} />)
                        to the <strong className="text-foreground">public opinions</strong> (<span dangerouslySetInnerHTML={{ __html: "\\(pubB_{j}^{t}\\)" }} />) of <em>all</em>{" "}
                        their neighbors.
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xl font-semibold text-foreground">
                        Simulation Takeaway
                      </h4>
                      <p className="text-md text-muted-foreground mt-2">
                        This model can lead to a phenomenon called <strong className="text-foreground">"Hidden
                        Consensus"</strong>. Agents' <em>private</em> opinions
                        might all converge, but because their <em>public</em>{" "}
                        opinions are "stuck" in the past, they all perceive
                        disagreement and remain silent, never realizing they
                        actually agree.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>

          <Separator className="my-12" />

          {/* Section 3: Key Variables Table */}
          <section id="variables">
            <h2 className="font-display text-3xl font-medium tracking-tight text-foreground">
              Key Parameters at a Glance
            </h2>
            <p className="mt-4 text-lg tracking-tight text-muted-foreground">
              These are the core variables that define the state and behavior
              of the agents in the simulation.
            </p>
            <Card className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Notation</TableHead>
                    <TableHead>Variable</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono"><span dangerouslySetInnerHTML={{ __html: "\\(B_{i}^{t}\\)" }} /></TableCell>
                    <TableCell>Opinion</TableCell>
                    <TableCell className="text-muted-foreground">
                      The opinion of agent <span dangerouslySetInnerHTML={{ __html: "\\(i\\)" }} /> at time <span dangerouslySetInnerHTML={{ __html: "\\(t\\)" }} />, usually a value
                      in <span dangerouslySetInnerHTML={{ __html: "\\([0, 1]\\)" }} />.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono"><span dangerouslySetInnerHTML={{ __html: "\\(I_{ji}\\)" }} /></TableCell>
                    <TableCell>Influence</TableCell>
                    <TableCell className="text-muted-foreground">
                      The strength of influence agent <span dangerouslySetInnerHTML={{ __html: "\\(j\\)" }} /> has on agent <span dangerouslySetInnerHTML={{ __html: "\\(i\\)" }} />.
                      The total influence on <span dangerouslySetInnerHTML={{ __html: "\\(i\\)" }} /> sums to 1.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono"><span dangerouslySetInnerHTML={{ __html: "\\(S_{i}^{t}\\)" }} /></TableCell>
                    <TableCell>Silence State</TableCell>
                    <TableCell className="text-muted-foreground">
                      The state of agent <span dangerouslySetInnerHTML={{ __html: "\\(i\\)" }} /> at time <span dangerouslySetInnerHTML={{ __html: "\\(t\\)" }} />. <span dangerouslySetInnerHTML={{ __html: "\\(1\\)" }} /> = speaking, <span dangerouslySetInnerHTML={{ __html: "\\(0\\)" }} />
                      = silent.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono"><span dangerouslySetInnerHTML={{ __html: "\\(\\tau_{i}\\)" }} /></TableCell>
                    <TableCell>Tolerance Radius</TableCell>
                    <TableCell className="text-muted-foreground">
                      The "comfort zone" for agent <span dangerouslySetInnerHTML={{ __html: "\\(i\\)" }} />. They feel supported
                      by opinions <span dangerouslySetInnerHTML={{ __html: "\\(B_{j}^{t}\\)" }} /> where <span dangerouslySetInnerHTML={{ __html: "\\(|B_{i}^{t} - B_{j}^{t}| \\le \\tau_{i}\\)" }} />.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono"><span dangerouslySetInnerHTML={{ __html: "\\(\\mathcal{M}_{i}\\)" }} /></TableCell>
                    <TableCell>Majority Threshold</TableCell>
                    <TableCell className="text-muted-foreground">
                      The minimum <em>proportion</em> of neighbors agent <span dangerouslySetInnerHTML={{ __html: "\\(i\\)" }} />
                      requires support from to speak (e.g., <span dangerouslySetInnerHTML={{ __html: "\\(0.5\\)" }} /> for a
                      simple majority).
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono"><span dangerouslySetInnerHTML={{ __html: "\\(pubB_{j}^{t}\\)" }} /></TableCell>
                    <TableCell>Public Opinion</TableCell>
                    <TableCell className="text-muted-foreground">
                      Used in <span dangerouslySetInnerHTML={{ __html: "\\(SOM^{+}\\)" }} /> models. The most recent opinion
                      publicly expressed by agent <span dangerouslySetInnerHTML={{ __html: "\\(j\\)" }} /> (i.e., their opinion
                      from the last time they were <em>speaking</em>).
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </section>

          <Separator className="my-12" />

          {/* Section 4: Conclusion */}
          <section id="conclusion" className="mb-16">
            <h2 className="font-display text-3xl font-medium tracking-tight text-foreground">
              Why This Matters for SiLEnSeSS
            </h2>
            <p className="mt-4 text-lg tracking-tight text-muted-foreground">
              By modeling not just <em>what</em> people think, but <em>whether they say
              it</em>, the SiLEnSeSS simulator allows you to explore far more
              complex and realistic social dynamics.
            </p>
            <p className="mt-4 text-lg tracking-tight text-muted-foreground">
              As you run your experiments, you can now observe phenomena
              predicted by the Spiral of Silence theory, such as:
            </p>
            <ul className="list-disc list-inside mt-4 text-lg text-muted-foreground space-y-2">
              <li>
                <strong className="text-foreground">Vocal Minorities:</strong> Watch how a small,
                highly-connected, and "loud" (high tolerance) group of
                agents can pull the entire network's opinion, even when
                they are numerically in the minority.
              </li>
              <li>
                <strong className="text-foreground">Echo Chambers & Polarization:</strong> See how
                setting low tolerance radii (<span dangerouslySetInnerHTML={{ __html: "\\(\\tau\\)" }} />) can cause agents to
                fall silent, effectively breaking connections and leading to
                polarized, disconnected clusters.
              </li>
              <li>
                <strong className="text-foreground">Public vs. Private Belief:</strong> Use the <span dangerouslySetInnerHTML={{ __html: "\\(SOM^{+}\\)" }} />
                model to see how a network's <em>public</em> discourse can appear
                hotly debated and polarized, even while the agents'
                <em>private</em> beliefs may be converging to a "hidden consensus".
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Wiki;