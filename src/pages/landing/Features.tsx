import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { Novatrix } from "uvcanvas";
import screenshotPayroll from "@/assets/images/example1.png";
import screenshotExpenses from "@/assets/images/example2.png";
import screenshotVatReturns from "@/assets/images/example3.png";
import screenshotReporting from "@/assets/images/example4.png";
import { Container } from "@/components/Container";

const features = [
  {
    title: "Create Custom Simulations",
    description:
      "Build simulations from scratch or use existing network data to model specific scenarios.",
    image: screenshotPayroll,
  },
  {
    title: "View Detailed Simulation Results",
    description:
      "Track how opinions change and evolve through multiple iterations, providing valuable insights into social dynamics.",
    image: screenshotExpenses,
  },
  {
    title: "Detailed Analysis",
    description:
      "Access in-depth simulation results, including general, network-wide, and agent-specific insights.",
    image: screenshotVatReturns,
  },
  {
    title: "Integration with TimeScale",
    description:
      "Leverage TimeScale for efficient data storage and analysis of long-term simulations.",
    image: screenshotReporting,
  },
];

const Features: React.FC = () => {
  const [tabOrientation, setTabOrientation] = useState<
    "horizontal" | "vertical"
  >("horizontal");

  useEffect(() => {
    let lgMediaQuery = window.matchMedia("(min-width: 1024px)");

    function onMediaQueryChange({ matches }: { matches: boolean }) {
      setTabOrientation(matches ? "vertical" : "horizontal");
    }

    onMediaQueryChange(lgMediaQuery);
    lgMediaQuery.addEventListener("change", onMediaQueryChange);

    return () => {
      lgMediaQuery.removeEventListener("change", onMediaQueryChange);
    };
  }, []);

  return (
    <section
      id="features"
      className="relative overflow-hidden pb-28 pt-20 sm:py-32"
    >
      {/* Fondo Lumiflex */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          objectFit: "cover",
        }}
      >
        <Novatrix />
      </div>

      {/* Contenido */}
      <Container className="relative bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg shadow-md p-6">
        <div className="max-w-2xl md:mx-auto md:text-center xl:max-w-none">
          <h2 className="font-display text-3xl tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
            Everything you need to simulate and analyze social networks.
          </h2>
          <p className="mt-6 text-lg tracking-tight text-slate-700 dark:text-slate-300">
            Our opinion evolution simulator, SiLEnSeSS, provides all the tools
            you need to create, customize, and analyze social network
            simulations with ease. Whether you're a scientist or part of the
            general public, our intuitive interface lets you focus on
            understanding the data without getting bogged down in the technical
            details.
          </p>
        </div>
        <TabGroup
          className="mt-16 grid grid-cols-1 items-center gap-y-2 pt-10 sm:gap-y-6 md:mt-20 lg:grid-cols-12 lg:pt-0"
          vertical={tabOrientation === "vertical"}
        >
          {({ selectedIndex }: { selectedIndex: number }) => (
            <>
              <div className="-mx-4 flex overflow-x-auto pb-4 sm:mx-0 sm:overflow-visible sm:pb-0 lg:col-span-5">
                <TabList className="relative z-10 flex gap-x-4 whitespace-nowrap px-4 sm:mx-auto sm:px-0 lg:mx-0 lg:block lg:gap-x-0 lg:gap-y-1 lg:whitespace-normal">
                  {features.map((feature, featureIndex) => (
                    <div
                      key={feature.title}
                      className={clsx(
                        "group relative rounded-full px-4 py-1 lg:rounded-l-xl lg:rounded-r-none lg:p-6 transition-colors",
                        selectedIndex === featureIndex
                          ? "bg-white dark:bg-slate-800 lg:ring-2 lg:ring-inset lg:ring-blue-400 dark:lg:ring-blue-400"
                          : "hover:bg-slate-200 dark:hover:bg-slate-700",
                      )}
                    >
                      <h3>
                        <Tab
                          className={clsx(
                            "font-display text-lg focus:outline-none transition-colors",
                            selectedIndex === featureIndex
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
                          )}
                        >
                          <span className="absolute inset-0 rounded-full lg:rounded-l-xl lg:rounded-r-none" />
                          {feature.title}
                        </Tab>
                      </h3>
                      <p
                        className={clsx(
                          "mt-2 hidden text-sm lg:block transition-colors",
                          selectedIndex === featureIndex
                            ? "text-slate-700 dark:text-slate-300"
                            : "text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300",
                        )}
                      >
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </TabList>
              </div>

              <TabPanels className="lg:col-span-7">
                {features.map((feature) => (
                  <TabPanel key={feature.title} unmount={false}>
                    <div className="relative sm:px-6 lg:hidden">
                      <div className="absolute -inset-x-4 bottom-[-4.25rem] top-[-6.5rem] bg-white/80 dark:bg-slate-800/80 ring-1 ring-inset ring-slate-300 dark:ring-slate-600 sm:inset-x-0 sm:rounded-t-xl backdrop-blur-sm" />
                      <p className="relative mx-auto max-w-2xl text-base text-slate-700 dark:text-slate-300 sm:text-center">
                        {feature.description}
                      </p>
                    </div>
                    <div className="mt-10 w-[45rem] overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900 shadow-xl shadow-blue-900/20 dark:shadow-blue-500/10 sm:w-auto lg:mt-0 lg:w-[67.8125rem] ring-1 ring-slate-200 dark:ring-slate-700">
                      <img
                        className="w-full"
                        src={feature.image}
                        alt={feature.title}
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  </TabPanel>
                ))}
              </TabPanels>
            </>
          )}
        </TabGroup>
      </Container>
    </section>
  );
};

export default Features;